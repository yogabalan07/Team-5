package com.inventory.service.impl;

import com.inventory.dto.request.ReportFilterRequest;
import com.inventory.dto.response.ReportResponse;
import com.inventory.model.*;
import com.inventory.repository.*;
import com.inventory.service.ReportService;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ReportServiceImpl implements ReportService {

    private static final Logger logger = LoggerFactory.getLogger(ReportServiceImpl.class);

    @Autowired
    private SalesInvoiceRepository salesInvoiceRepository;

    @Autowired
    private PurchaseInvoiceRepository purchaseInvoiceRepository;

    @Autowired
    private SalesInvoiceItemRepository salesInvoiceItemRepository;

    @Autowired
    private PurchaseInvoiceItemRepository purchaseInvoiceItemRepository;

    @Autowired
    private BillReceiptRepository billReceiptRepository;

    @Autowired
    private BillPaymentRepository billPaymentRepository;

    @Autowired
    private ItemRepository itemRepository;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private SupplierRepository supplierRepository;

    @Autowired
    private ItemBrandRepository itemBrandRepository;

    @Autowired
    private ItemGroupRepository itemGroupRepository;

    private String getBrandName(Item item) {
        if (item == null) {
            return null;
        }
        try {
            if (item.getBrand() != null) {
                return item.getBrand().getName();
            }
        } catch (Exception e) {
            logger.debug("Could not get brand directly, trying from repository");
        }
        
        try {
            if (item.getId() != null) {
                Item fullItem = itemRepository.findById(item.getId()).orElse(null);
                if (fullItem != null && fullItem.getBrand() != null) {
                    return fullItem.getBrand().getName();
                }
            }
        } catch (Exception e) {
            logger.error("Error fetching brand for item {}: {}", item.getId(), e.getMessage());
        }
        return null;
    }

    private String getGroupName(Item item) {
        if (item == null) {
            return null;
        }
        try {
            if (item.getGroup() != null) {
                return item.getGroup().getName();
            }
        } catch (Exception e) {
            logger.debug("Could not get group directly, trying from repository");
        }
        
        try {
            if (item.getId() != null) {
                Item fullItem = itemRepository.findById(item.getId()).orElse(null);
                if (fullItem != null && fullItem.getGroup() != null) {
                    return fullItem.getGroup().getName();
                }
            }
        } catch (Exception e) {
            logger.error("Error fetching group for item {}: {}", item.getId(), e.getMessage());
        }
        return null;
    }

    // ==================== 1. SALES BILLS REPORT ====================

    @Override
    public Page<ReportResponse> getSalesBillsReport(ReportFilterRequest filter, Pageable pageable) {
        logger.info("=== GETTING SALES BILLS REPORT ===");
        logger.info("Filter: startDate={}, endDate={}, customerIds={}", 
            filter.getStartDate(), filter.getEndDate(), filter.getCustomerIds());
        
        List<SalesInvoice> invoices = new ArrayList<>();
        
        try {
            List<SalesInvoice> allInvoices = salesInvoiceRepository.findAll();
            logger.info("Total sales invoices found: {}", allInvoices.size());
            
            if (allInvoices.isEmpty()) {
                return new PageImpl<>(new ArrayList<>(), pageable, 0);
            }
            
            // Apply date filters
            List<SalesInvoice> filteredInvoices = allInvoices;
            
            if (filter.getStartDate() != null) {
                filteredInvoices = filteredInvoices.stream()
                    .filter(inv -> inv.getInvoiceDate() != null && 
                        !inv.getInvoiceDate().isBefore(filter.getStartDate()))
                    .collect(Collectors.toList());
                logger.info("After start date filter: {}", filteredInvoices.size());
            }
            
            if (filter.getEndDate() != null) {
                filteredInvoices = filteredInvoices.stream()
                    .filter(inv -> inv.getInvoiceDate() != null && 
                        !inv.getInvoiceDate().isAfter(filter.getEndDate()))
                    .collect(Collectors.toList());
                logger.info("After end date filter: {}", filteredInvoices.size());
            }
            
            // Apply customer filter
            if (filter.getCustomerIds() != null && !filter.getCustomerIds().isEmpty()) {
                filteredInvoices = filteredInvoices.stream()
                    .filter(inv -> inv.getCustomer() != null && 
                        filter.getCustomerIds().contains(inv.getCustomer().getId()))
                    .collect(Collectors.toList());
                logger.info("After customer filter: {}", filteredInvoices.size());
            }
            
            invoices = filteredInvoices;
            
        } catch (Exception e) {
            logger.error("Error fetching sales bills report: {}", e.getMessage(), e);
            invoices = new ArrayList<>();
        }

        List<ReportResponse> responses = invoices.stream()
            .map(this::convertSalesInvoiceToReport)
            .filter(Objects::nonNull)
            .collect(Collectors.toList());
        
        logger.info("Sales report generated with {} items", responses.size());

        return getPaginatedResponse(responses, pageable);
    }

    // ==================== 2. SALES BILL DETAILS REPORT ====================

    @Override
    public Page<ReportResponse> getSalesBillDetailsReport(ReportFilterRequest filter, Pageable pageable) {
        List<SalesInvoiceItem> items = new ArrayList<>();
        
        try {
            if (filter.getStartDate() != null && filter.getEndDate() != null) {
                items = salesInvoiceItemRepository.findByFilters(
                    filter.getCustomerIds(),
                    filter.getBrandIds(),
                    filter.getGroupIds(),
                    filter.getItemIds(),
                    filter.getStartDate(),
                    filter.getEndDate()
                );
            } else {
                items = salesInvoiceItemRepository.findAll();
            }
        } catch (Exception e) {
            logger.error("Error fetching sales bill details report: {}", e.getMessage());
            items = salesInvoiceItemRepository.findAll();
        }

        List<ReportResponse> responses = items.stream()
            .map(this::convertSalesItemToReport)
            .filter(Objects::nonNull)
            .collect(Collectors.toList());

        return getPaginatedResponse(responses, pageable);
    }

    // ==================== 3. PURCHASE BILLS REPORT ====================

    @Override
    public Page<ReportResponse> getPurchaseBillsReport(ReportFilterRequest filter, Pageable pageable) {
        logger.info("=== GETTING PURCHASE BILLS REPORT ===");
        logger.info("Filter: startDate={}, endDate={}, supplierIds={}", 
            filter.getStartDate(), filter.getEndDate(), filter.getSupplierIds());
        
        List<PurchaseInvoice> invoices = new ArrayList<>();
        
        try {
            List<PurchaseInvoice> allInvoices = purchaseInvoiceRepository.findAll();
            logger.info("Total purchase invoices found: {}", allInvoices.size());
            
            if (allInvoices.isEmpty()) {
                return new PageImpl<>(new ArrayList<>(), pageable, 0);
            }
            
            // Apply date filters
            List<PurchaseInvoice> filteredInvoices = allInvoices;
            
            if (filter.getStartDate() != null) {
                filteredInvoices = filteredInvoices.stream()
                    .filter(inv -> inv.getInvoiceDate() != null && 
                        !inv.getInvoiceDate().isBefore(filter.getStartDate()))
                    .collect(Collectors.toList());
                logger.info("After start date filter: {}", filteredInvoices.size());
            }
            
            if (filter.getEndDate() != null) {
                filteredInvoices = filteredInvoices.stream()
                    .filter(inv -> inv.getInvoiceDate() != null && 
                        !inv.getInvoiceDate().isAfter(filter.getEndDate()))
                    .collect(Collectors.toList());
                logger.info("After end date filter: {}", filteredInvoices.size());
            }
            
            // Apply supplier filter
            if (filter.getSupplierIds() != null && !filter.getSupplierIds().isEmpty()) {
                filteredInvoices = filteredInvoices.stream()
                    .filter(inv -> inv.getSupplier() != null && 
                        filter.getSupplierIds().contains(inv.getSupplier().getId()))
                    .collect(Collectors.toList());
                logger.info("After supplier filter: {}", filteredInvoices.size());
            }
            
            invoices = filteredInvoices;
            
        } catch (Exception e) {
            logger.error("Error fetching purchase bills report: {}", e.getMessage(), e);
            invoices = new ArrayList<>();
        }

        List<ReportResponse> responses = invoices.stream()
            .map(this::convertPurchaseInvoiceToReport)
            .filter(Objects::nonNull)
            .collect(Collectors.toList());
        
        logger.info("Purchase report generated with {} items", responses.size());

        return getPaginatedResponse(responses, pageable);
    }

    // ==================== 4. PURCHASE BILL DETAILS REPORT ====================

    @Override
    public Page<ReportResponse> getPurchaseBillDetailsReport(ReportFilterRequest filter, Pageable pageable) {
        List<PurchaseInvoiceItem> items = new ArrayList<>();
        
        try {
            if (filter.getStartDate() != null && filter.getEndDate() != null) {
                items = purchaseInvoiceItemRepository.findByFilters(
                    filter.getSupplierIds(),
                    filter.getBrandIds(),
                    filter.getGroupIds(),
                    filter.getItemIds(),
                    filter.getStartDate(),
                    filter.getEndDate()
                );
            } else {
                items = purchaseInvoiceItemRepository.findAll();
            }
        } catch (Exception e) {
            logger.error("Error fetching purchase bill details report: {}", e.getMessage());
            items = purchaseInvoiceItemRepository.findAll();
        }

        List<ReportResponse> responses = items.stream()
            .map(this::convertPurchaseItemToReport)
            .filter(Objects::nonNull)
            .collect(Collectors.toList());

        return getPaginatedResponse(responses, pageable);
    }

    // ==================== 5. CUSTOMER RECEIPTS REPORT ====================

    @Override
    public Page<ReportResponse> getCustomerReceiptsReport(ReportFilterRequest filter, Pageable pageable) {
        List<BillReceipt> receipts = new ArrayList<>();
        
        try {
            List<BillReceipt> allReceipts = billReceiptRepository.findAll();
            
            // Apply date filters
            List<BillReceipt> filteredReceipts = allReceipts;
            
            if (filter.getStartDate() != null) {
                filteredReceipts = filteredReceipts.stream()
                    .filter(r -> r.getReceiptDate() != null && 
                        !r.getReceiptDate().isBefore(filter.getStartDate()))
                    .collect(Collectors.toList());
            }
            
            if (filter.getEndDate() != null) {
                filteredReceipts = filteredReceipts.stream()
                    .filter(r -> r.getReceiptDate() != null && 
                        !r.getReceiptDate().isAfter(filter.getEndDate()))
                    .collect(Collectors.toList());
            }
            
            receipts = filteredReceipts;
            
        } catch (Exception e) {
            logger.error("Error fetching customer receipts: {}", e.getMessage());
            receipts = billReceiptRepository.findAll();
        }

        List<ReportResponse> responses = receipts.stream()
            .map(this::convertReceiptToReport)
            .filter(Objects::nonNull)
            .collect(Collectors.toList());

        return getPaginatedResponse(responses, pageable);
    }

    // ==================== 6. SUPPLIER PAYMENTS REPORT ====================

    @Override
    public Page<ReportResponse> getSupplierPaymentsReport(ReportFilterRequest filter, Pageable pageable) {
        List<BillPayment> payments = new ArrayList<>();
        
        try {
            List<BillPayment> allPayments = billPaymentRepository.findAll();
            
            // Apply date filters
            List<BillPayment> filteredPayments = allPayments;
            
            if (filter.getStartDate() != null) {
                filteredPayments = filteredPayments.stream()
                    .filter(p -> p.getPaymentDate() != null && 
                        !p.getPaymentDate().isBefore(filter.getStartDate()))
                    .collect(Collectors.toList());
            }
            
            if (filter.getEndDate() != null) {
                filteredPayments = filteredPayments.stream()
                    .filter(p -> p.getPaymentDate() != null && 
                        !p.getPaymentDate().isAfter(filter.getEndDate()))
                    .collect(Collectors.toList());
            }
            
            payments = filteredPayments;
            
        } catch (Exception e) {
            logger.error("Error fetching supplier payments: {}", e.getMessage());
            payments = billPaymentRepository.findAll();
        }

        List<ReportResponse> responses = payments.stream()
            .map(this::convertPaymentToReport)
            .filter(Objects::nonNull)
            .collect(Collectors.toList());

        return getPaginatedResponse(responses, pageable);
    }

    // ==================== 7. STOCK REPORT ====================

    @Override
    public Page<ReportResponse> getStockReport(ReportFilterRequest filter, Pageable pageable) {
        logger.info("=== GETTING STOCK REPORT ===");
        logger.info("Filter: startDate={}, endDate={}", filter.getStartDate(), filter.getEndDate());
        
        try {
            List<Item> allItems = itemRepository.findAll();
            logger.info("Total items found in database: {}", allItems.size());
            
            if (allItems.isEmpty()) {
                return new PageImpl<>(new ArrayList<>(), pageable, 0);
            }

            // Apply filters
            List<Item> filteredItems = allItems;
            
            if (filter.getBrandIds() != null && !filter.getBrandIds().isEmpty()) {
                filteredItems = filteredItems.stream()
                    .filter(item -> item.getBrand() != null && 
                        filter.getBrandIds().contains(item.getBrand().getId()))
                    .collect(Collectors.toList());
                logger.info("After brand filter: {}", filteredItems.size());
            }
            
            if (filter.getGroupIds() != null && !filter.getGroupIds().isEmpty()) {
                filteredItems = filteredItems.stream()
                    .filter(item -> item.getGroup() != null && 
                        filter.getGroupIds().contains(item.getGroup().getId()))
                    .collect(Collectors.toList());
                logger.info("After group filter: {}", filteredItems.size());
            }
            
            if (filter.getItemIds() != null && !filter.getItemIds().isEmpty()) {
                filteredItems = filteredItems.stream()
                    .filter(item -> filter.getItemIds().contains(item.getId()))
                    .collect(Collectors.toList());
                logger.info("After item filter: {}", filteredItems.size());
            }

            List<ReportResponse> responses = new ArrayList<>();
            for (Item item : filteredItems) {
                ReportResponse response = calculateStockReportFromTransactions(item, filter.getStartDate(), filter.getEndDate());
                if (response != null) {
                    responses.add(response);
                }
            }
            
            logger.info("Stock report generated with {} items", responses.size());

            int start = (int) pageable.getOffset();
            int end = Math.min((start + pageable.getPageSize()), responses.size());
            
            if (start > responses.size() || start < 0) {
                return new PageImpl<>(new ArrayList<>(), pageable, responses.size());
            }

            return new PageImpl<>(responses.subList(start, end), pageable, responses.size());
            
        } catch (Exception e) {
            logger.error("Error in getStockReport: {}", e.getMessage(), e);
            return new PageImpl<>(new ArrayList<>(), pageable, 0);
        }
    }

    // ==================== 8. STOCK SUMMARY ====================

    @Override
    public Map<String, Object> getStockSummary() {
        Map<String, Object> summary = new HashMap<>();
        
        try {
            List<Item> allItems = itemRepository.findAll();
            
            summary.put("totalItems", allItems.size());
            
            BigDecimal totalStock = allItems.stream()
                .map(Item::getCurrentStock)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
            summary.put("totalStock", totalStock);
            
            long lowStockItems = allItems.stream()
                .filter(item -> item.getCurrentStock() != null && 
                    item.getMinStockLevel() != null && 
                    item.getCurrentStock().compareTo(item.getMinStockLevel()) < 0)
                .count();
            summary.put("lowStockItems", lowStockItems);
            
            long outOfStockItems = allItems.stream()
                .filter(item -> item.getCurrentStock() != null && 
                    item.getCurrentStock().compareTo(BigDecimal.ZERO) == 0)
                .count();
            summary.put("outOfStock", outOfStockItems);
            
            BigDecimal totalValue = allItems.stream()
                .filter(item -> item.getCurrentStock() != null && item.getSellingPrice() != null)
                .map(item -> item.getCurrentStock().multiply(item.getSellingPrice()))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
            summary.put("totalStockValue", totalValue);
            
            summary.put("timestamp", LocalDate.now().toString());
            summary.put("status", "success");
            
        } catch (Exception e) {
            logger.error("Error getting stock summary: {}", e.getMessage());
            summary.put("status", "error");
            summary.put("message", e.getMessage());
        }
        
        return summary;
    }

    // ==================== 9. SALES SUMMARY ====================

    @Override
    public Map<String, Object> getSalesSummary() {
        Map<String, Object> summary = new HashMap<>();
        
        try {
            LocalDate today = LocalDate.now();
            LocalDate startOfMonth = today.withDayOfMonth(1);
            LocalDate startOfYear = today.withDayOfYear(1);
            
            List<SalesInvoice> allInvoices = salesInvoiceRepository.findAll();
            
            BigDecimal todaySales = allInvoices.stream()
                .filter(inv -> inv.getInvoiceDate() != null && inv.getInvoiceDate().equals(today))
                .map(SalesInvoice::getNetAmount)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
            summary.put("todaySales", todaySales);
            summary.put("todayOrders", allInvoices.stream()
                .filter(inv -> inv.getInvoiceDate() != null && inv.getInvoiceDate().equals(today))
                .count());
            
            BigDecimal monthSales = allInvoices.stream()
                .filter(inv -> inv.getInvoiceDate() != null && 
                    !inv.getInvoiceDate().isBefore(startOfMonth) && 
                    !inv.getInvoiceDate().isAfter(today))
                .map(SalesInvoice::getNetAmount)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
            summary.put("monthSales", monthSales);
            summary.put("monthOrders", allInvoices.stream()
                .filter(inv -> inv.getInvoiceDate() != null && 
                    !inv.getInvoiceDate().isBefore(startOfMonth) && 
                    !inv.getInvoiceDate().isAfter(today))
                .count());
            
            BigDecimal yearSales = allInvoices.stream()
                .filter(inv -> inv.getInvoiceDate() != null && 
                    !inv.getInvoiceDate().isBefore(startOfYear) && 
                    !inv.getInvoiceDate().isAfter(today))
                .map(SalesInvoice::getNetAmount)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
            summary.put("yearSales", yearSales);
            
            summary.put("timestamp", today.toString());
            summary.put("status", "success");
            
        } catch (Exception e) {
            logger.error("Error getting sales summary: {}", e.getMessage());
            summary.put("status", "error");
            summary.put("message", e.getMessage());
        }
        
        return summary;
    }

    // ==================== 10. EXPORT METHODS ====================

    @Override
    public ResponseEntity<?> exportReportToExcel(ReportFilterRequest filter) {
        try {
            logger.info("=== EXPORTING TO EXCEL ===");
            logger.info("Filter: startDate={}, endDate={}, reportType={}", 
                filter.getStartDate(), filter.getEndDate(), filter.getReportType());
            
            byte[] excelData = generateExcelReport(filter);
            
            if (excelData == null || excelData.length == 0) {
                Map<String, String> error = new HashMap<>();
                error.put("error", "No data available for export");
                return ResponseEntity.status(HttpStatus.NO_CONTENT).body(error);
            }
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);
            headers.set(HttpHeaders.CONTENT_DISPOSITION, 
                "attachment; filename=report-" + LocalDate.now().format(DateTimeFormatter.ISO_LOCAL_DATE) + ".xlsx");
            headers.setContentLength(excelData.length);
            
            logger.info("Excel export successful, size: {} bytes", excelData.length);
            return new ResponseEntity<>(excelData, headers, HttpStatus.OK);
        } catch (Exception e) {
            logger.error("Error generating Excel: {}", e.getMessage(), e);
            Map<String, String> error = new HashMap<>();
            error.put("error", "Failed to generate Excel: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    @Override
    public ResponseEntity<?> exportReportToPDF(ReportFilterRequest filter) {
        try {
            byte[] pdfData = generatePDFReport(filter);
            
            if (pdfData == null || pdfData.length == 0) {
                Map<String, String> error = new HashMap<>();
                error.put("error", "No data available for export");
                return ResponseEntity.status(HttpStatus.NO_CONTENT).body(error);
            }
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.set(HttpHeaders.CONTENT_DISPOSITION, 
                "attachment; filename=report-" + LocalDate.now().format(DateTimeFormatter.ISO_LOCAL_DATE) + ".pdf");
            
            return new ResponseEntity<>(pdfData, headers, HttpStatus.OK);
        } catch (Exception e) {
            logger.error("Error generating PDF: {}", e.getMessage(), e);
            Map<String, String> error = new HashMap<>();
            error.put("error", "Failed to generate PDF: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    // ==================== EXCEL GENERATION ====================

    private byte[] generateExcelReport(ReportFilterRequest filter) throws Exception {
        logger.info("=== GENERATING EXCEL REPORT ===");
        logger.info("Filter: startDate={}, endDate={}, reportType={}", 
            filter.getStartDate(), filter.getEndDate(), filter.getReportType());
        
        try (Workbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("Report");
            
            CellStyle headerStyle = createHeaderStyle(workbook);
            CellStyle dateStyle = createDateStyle(workbook);
            CellStyle currencyStyle = createCurrencyStyle(workbook);
            
            String reportType = filter.getReportType() != null ? filter.getReportType().toUpperCase() : "SALES";
            logger.info("Report type: {}", reportType);
            
            List<ReportResponse> data = new ArrayList<>();
            
            try {
                switch (reportType) {
                    case "SALES":
                        logger.info("Fetching sales data for export...");
                        List<SalesInvoice> salesInvoices = salesInvoiceRepository.findAll();
                        logger.info("Total sales invoices found: {}", salesInvoices.size());
                        
                        // Apply date filter
                        if (filter.getStartDate() != null) {
                            salesInvoices = salesInvoices.stream()
                                .filter(inv -> inv.getInvoiceDate() != null && 
                                    !inv.getInvoiceDate().isBefore(filter.getStartDate()))
                                .collect(Collectors.toList());
                            logger.info("After start date filter: {}", salesInvoices.size());
                        }
                        
                        if (filter.getEndDate() != null) {
                            salesInvoices = salesInvoices.stream()
                                .filter(inv -> inv.getInvoiceDate() != null && 
                                    !inv.getInvoiceDate().isAfter(filter.getEndDate()))
                                .collect(Collectors.toList());
                            logger.info("After end date filter: {}", salesInvoices.size());
                        }
                        
                        // Apply customer filter
                        if (filter.getCustomerIds() != null && !filter.getCustomerIds().isEmpty()) {
                            salesInvoices = salesInvoices.stream()
                                .filter(inv -> inv.getCustomer() != null && 
                                    filter.getCustomerIds().contains(inv.getCustomer().getId()))
                                .collect(Collectors.toList());
                            logger.info("After customer filter: {}", salesInvoices.size());
                        }
                        
                        for (SalesInvoice inv : salesInvoices) {
                            ReportResponse response = convertSalesInvoiceToReport(inv);
                            if (response != null) {
                                data.add(response);
                            }
                        }
                        logger.info("Sales data size: {}", data.size());
                        break;
                        
                    case "PURCHASE":
                        logger.info("Fetching purchase data for export...");
                        List<PurchaseInvoice> purchaseInvoices = purchaseInvoiceRepository.findAll();
                        logger.info("Total purchase invoices found: {}", purchaseInvoices.size());
                        
                        // Apply date filter
                        if (filter.getStartDate() != null) {
                            purchaseInvoices = purchaseInvoices.stream()
                                .filter(inv -> inv.getInvoiceDate() != null && 
                                    !inv.getInvoiceDate().isBefore(filter.getStartDate()))
                                .collect(Collectors.toList());
                            logger.info("After start date filter: {}", purchaseInvoices.size());
                        }
                        
                        if (filter.getEndDate() != null) {
                            purchaseInvoices = purchaseInvoices.stream()
                                .filter(inv -> inv.getInvoiceDate() != null && 
                                    !inv.getInvoiceDate().isAfter(filter.getEndDate()))
                                .collect(Collectors.toList());
                            logger.info("After end date filter: {}", purchaseInvoices.size());
                        }
                        
                        // Apply supplier filter
                        if (filter.getSupplierIds() != null && !filter.getSupplierIds().isEmpty()) {
                            purchaseInvoices = purchaseInvoices.stream()
                                .filter(inv -> inv.getSupplier() != null && 
                                    filter.getSupplierIds().contains(inv.getSupplier().getId()))
                                .collect(Collectors.toList());
                            logger.info("After supplier filter: {}", purchaseInvoices.size());
                        }
                        
                        for (PurchaseInvoice inv : purchaseInvoices) {
                            ReportResponse response = convertPurchaseInvoiceToReport(inv);
                            if (response != null) {
                                data.add(response);
                            }
                        }
                        logger.info("Purchase data size: {}", data.size());
                        break;
                        
                    case "STOCK":
                        logger.info("Fetching stock data for export...");
                        List<Item> allItems = itemRepository.findAll();
                        logger.info("Total items found in database: {}", allItems.size());
                        
                        // Apply brand and group filters
                        List<Item> filteredItems = allItems;
                        
                        if (filter.getBrandIds() != null && !filter.getBrandIds().isEmpty()) {
                            filteredItems = filteredItems.stream()
                                .filter(item -> item.getBrand() != null && 
                                    filter.getBrandIds().contains(item.getBrand().getId()))
                                .collect(Collectors.toList());
                            logger.info("After brand filter: {}", filteredItems.size());
                        }
                        
                        if (filter.getGroupIds() != null && !filter.getGroupIds().isEmpty()) {
                            filteredItems = filteredItems.stream()
                                .filter(item -> item.getGroup() != null && 
                                    filter.getGroupIds().contains(item.getGroup().getId()))
                                .collect(Collectors.toList());
                            logger.info("After group filter: {}", filteredItems.size());
                        }
                        
                        if (filter.getItemIds() != null && !filter.getItemIds().isEmpty()) {
                            filteredItems = filteredItems.stream()
                                .filter(item -> filter.getItemIds().contains(item.getId()))
                                .collect(Collectors.toList());
                            logger.info("After item filter: {}", filteredItems.size());
                        }
                        
                        for (Item item : filteredItems) {
                            ReportResponse response = calculateStockReportFromTransactions(item, filter.getStartDate(), filter.getEndDate());
                            if (response != null) {
                                data.add(response);
                            }
                        }
                        logger.info("Stock data size for export: {}", data.size());
                        break;
                        
                    case "RECEIPTS":
                        logger.info("Fetching receipts data for export...");
                        List<BillReceipt> receipts = billReceiptRepository.findAll();
                        
                        // Apply date filter
                        if (filter.getStartDate() != null) {
                            receipts = receipts.stream()
                                .filter(r -> r.getReceiptDate() != null && 
                                    !r.getReceiptDate().isBefore(filter.getStartDate()))
                                .collect(Collectors.toList());
                        }
                        
                        if (filter.getEndDate() != null) {
                            receipts = receipts.stream()
                                .filter(r -> r.getReceiptDate() != null && 
                                    !r.getReceiptDate().isAfter(filter.getEndDate()))
                                .collect(Collectors.toList());
                        }
                        
                        for (BillReceipt receipt : receipts) {
                            ReportResponse response = convertReceiptToReport(receipt);
                            if (response != null) {
                                data.add(response);
                            }
                        }
                        logger.info("Receipts data size: {}", data.size());
                        break;
                        
                    case "PAYMENTS":
                        logger.info("Fetching payments data for export...");
                        List<BillPayment> payments = billPaymentRepository.findAll();
                        
                        // Apply date filter
                        if (filter.getStartDate() != null) {
                            payments = payments.stream()
                                .filter(p -> p.getPaymentDate() != null && 
                                    !p.getPaymentDate().isBefore(filter.getStartDate()))
                                .collect(Collectors.toList());
                        }
                        
                        if (filter.getEndDate() != null) {
                            payments = payments.stream()
                                .filter(p -> p.getPaymentDate() != null && 
                                    !p.getPaymentDate().isAfter(filter.getEndDate()))
                                .collect(Collectors.toList());
                        }
                        
                        for (BillPayment payment : payments) {
                            ReportResponse response = convertPaymentToReport(payment);
                            if (response != null) {
                                data.add(response);
                            }
                        }
                        logger.info("Payments data size: {}", data.size());
                        break;
                        
                    default:
                        logger.info("Fetching default data for export...");
                        List<SalesInvoice> defaultInvoices = salesInvoiceRepository.findAll();
                        for (SalesInvoice inv : defaultInvoices) {
                            ReportResponse response = convertSalesInvoiceToReport(inv);
                            if (response != null) {
                                data.add(response);
                            }
                        }
                        logger.info("Default data size: {}", data.size());
                }
            } catch (Exception e) {
                logger.error("Error fetching data for export: {}", e.getMessage(), e);
                data = new ArrayList<>();
            }
            
            logger.info("Final data size: {}", data.size());
            
            if (data.isEmpty()) {
                logger.warn("No data available for export");
                Row emptyRow = sheet.createRow(0);
                Cell emptyCell = emptyRow.createCell(0);
                emptyCell.setCellValue("No data available for the selected filters");
                emptyCell.setCellStyle(headerStyle);
                
                Row filterRow = sheet.createRow(1);
                filterRow.createCell(0).setCellValue("Filters Applied:");
                Row startDateRow = sheet.createRow(2);
                startDateRow.createCell(0).setCellValue("Start Date: " + (filter.getStartDate() != null ? filter.getStartDate() : "Not Set"));
                Row endDateRow = sheet.createRow(3);
                endDateRow.createCell(0).setCellValue("End Date: " + (filter.getEndDate() != null ? filter.getEndDate() : "Not Set"));
                Row typeRow = sheet.createRow(4);
                typeRow.createCell(0).setCellValue("Report Type: " + reportType);
                
                ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
                workbook.write(outputStream);
                return outputStream.toByteArray();
            }
            
            String[] headers = getHeaders(reportType);
            Row headerRow = sheet.createRow(0);
            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }
            
            int rowNum = 1;
            for (ReportResponse item : data) {
                Row row = sheet.createRow(rowNum++);
                fillRowData(row, item, reportType, dateStyle, currencyStyle);
            }
            
            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
                if (sheet.getColumnWidth(i) < 3000) {
                    sheet.setColumnWidth(i, 3000);
                }
            }
            
            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            workbook.write(outputStream);
            byte[] result = outputStream.toByteArray();
            logger.info("Excel generated successfully, size: {} bytes", result.length);
            return result;
        }
    }

    private CellStyle createHeaderStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        Font font = workbook.createFont();
        font.setBold(true);
        font.setColor(IndexedColors.WHITE.getIndex());
        style.setFont(font);
        style.setFillForegroundColor(IndexedColors.DARK_BLUE.getIndex());
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        style.setAlignment(HorizontalAlignment.CENTER);
        style.setVerticalAlignment(VerticalAlignment.CENTER);
        style.setBorderBottom(BorderStyle.THIN);
        style.setBorderTop(BorderStyle.THIN);
        style.setBorderLeft(BorderStyle.THIN);
        style.setBorderRight(BorderStyle.THIN);
        return style;
    }

    private CellStyle createDateStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        CreationHelper createHelper = workbook.getCreationHelper();
        style.setDataFormat(createHelper.createDataFormat().getFormat("dd-MMM-yyyy"));
        style.setBorderBottom(BorderStyle.THIN);
        style.setBorderTop(BorderStyle.THIN);
        style.setBorderLeft(BorderStyle.THIN);
        style.setBorderRight(BorderStyle.THIN);
        return style;
    }

    private CellStyle createCurrencyStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        CreationHelper createHelper = workbook.getCreationHelper();
        style.setDataFormat(createHelper.createDataFormat().getFormat("#,##0.00"));
        style.setBorderBottom(BorderStyle.THIN);
        style.setBorderTop(BorderStyle.THIN);
        style.setBorderLeft(BorderStyle.THIN);
        style.setBorderRight(BorderStyle.THIN);
        return style;
    }

    private String[] getHeaders(String reportType) {
        switch (reportType) {
            case "SALES":
                return new String[]{"Invoice No", "Date", "Customer", "Amount", "Discount", "Tax", "Net Amount", "Payment Type"};
            case "PURCHASE":
                return new String[]{"Invoice No", "Date", "Supplier", "Amount", "Discount", "Tax", "Net Amount", "Payment Type"};
            case "STOCK":
                return new String[]{"Item Code", "Item Name", "Brand", "Group", "Opening Stock", "Purchases", "Sales", "Closing Stock"};
            case "RECEIPTS":
                return new String[]{"Receipt No", "Date", "Customer", "Invoice No", "Amount", "Payment Mode"};
            case "PAYMENTS":
                return new String[]{"Payment No", "Date", "Supplier", "Invoice No", "Amount", "Payment Mode"};
            default:
                return new String[]{"Invoice No", "Date", "Customer/Supplier", "Item", "Quantity", "Rate", "Total"};
        }
    }

    private void fillRowData(Row row, ReportResponse item, String reportType, 
                             CellStyle dateStyle, CellStyle currencyStyle) {
        int col = 0;
        
        switch (reportType) {
            case "SALES":
                row.createCell(col++).setCellValue(item.getInvoiceNo() != null ? item.getInvoiceNo() : "");
                Cell dateCell = row.createCell(col++);
                if (item.getInvoiceDate() != null) {
                    dateCell.setCellValue(item.getInvoiceDate());
                    dateCell.setCellStyle(dateStyle);
                }
                row.createCell(col++).setCellValue(item.getCustomerName() != null ? item.getCustomerName() : "");
                
                Cell amountCell = row.createCell(col++);
                amountCell.setCellValue(item.getTotalAmount() != null ? item.getTotalAmount().doubleValue() : 0);
                amountCell.setCellStyle(currencyStyle);
                
                Cell discountCell = row.createCell(col++);
                discountCell.setCellValue(item.getDiscountAmount().doubleValue());
                discountCell.setCellStyle(currencyStyle);
                
                Cell taxCell = row.createCell(col++);
                taxCell.setCellValue(item.getTaxAmount().doubleValue());
                taxCell.setCellStyle(currencyStyle);
                
                Cell netCell = row.createCell(col++);
                netCell.setCellValue(item.getNetAmount() != null ? item.getNetAmount().doubleValue() : 0);
                netCell.setCellStyle(currencyStyle);
                
                row.createCell(col++).setCellValue(item.getPaymentType() != null ? item.getPaymentType() : "");
                break;
                
            case "PURCHASE":
                row.createCell(col++).setCellValue(item.getInvoiceNo() != null ? item.getInvoiceNo() : "");
                Cell pDateCell = row.createCell(col++);
                if (item.getInvoiceDate() != null) {
                    pDateCell.setCellValue(item.getInvoiceDate());
                    pDateCell.setCellStyle(dateStyle);
                }
                row.createCell(col++).setCellValue(item.getSupplierName() != null ? item.getSupplierName() : "");
                
                Cell pAmountCell = row.createCell(col++);
                pAmountCell.setCellValue(item.getTotalAmount() != null ? item.getTotalAmount().doubleValue() : 0);
                pAmountCell.setCellStyle(currencyStyle);
                
                Cell pDiscountCell = row.createCell(col++);
                pDiscountCell.setCellValue(item.getDiscountAmount().doubleValue());
                pDiscountCell.setCellStyle(currencyStyle);
                
                Cell pTaxCell = row.createCell(col++);
                pTaxCell.setCellValue(item.getTaxAmount().doubleValue());
                pTaxCell.setCellStyle(currencyStyle);
                
                Cell pNetCell = row.createCell(col++);
                pNetCell.setCellValue(item.getNetAmount() != null ? item.getNetAmount().doubleValue() : 0);
                pNetCell.setCellStyle(currencyStyle);
                
                row.createCell(col++).setCellValue(item.getPaymentType() != null ? item.getPaymentType() : "");
                break;
                
            case "STOCK":
                row.createCell(col++).setCellValue(item.getItemCode() != null ? item.getItemCode() : "");
                row.createCell(col++).setCellValue(item.getItemName() != null ? item.getItemName() : "");
                row.createCell(col++).setCellValue(item.getBrandName() != null ? item.getBrandName() : "");
                row.createCell(col++).setCellValue(item.getGroupName() != null ? item.getGroupName() : "");
                
                Cell openingCell = row.createCell(col++);
                openingCell.setCellValue(item.getOpeningStock().doubleValue());
                openingCell.setCellStyle(currencyStyle);
                
                Cell purchasesCell = row.createCell(col++);
                purchasesCell.setCellValue(item.getPurchases().doubleValue());
                purchasesCell.setCellStyle(currencyStyle);
                
                Cell salesCell = row.createCell(col++);
                salesCell.setCellValue(item.getSales().doubleValue());
                salesCell.setCellStyle(currencyStyle);
                
                Cell closingCell = row.createCell(col++);
                closingCell.setCellValue(item.getClosingStock().doubleValue());
                closingCell.setCellStyle(currencyStyle);
                break;
                
            case "RECEIPTS":
                row.createCell(col++).setCellValue(item.getInvoiceNo() != null ? item.getInvoiceNo() : "");
                Cell rDateCell = row.createCell(col++);
                if (item.getInvoiceDate() != null) {
                    rDateCell.setCellValue(item.getInvoiceDate());
                    rDateCell.setCellStyle(dateStyle);
                }
                row.createCell(col++).setCellValue(item.getCustomerName() != null ? item.getCustomerName() : "");
                row.createCell(col++).setCellValue(item.getInvoiceNo() != null ? item.getInvoiceNo() : "");
                
                Cell rAmountCell = row.createCell(col++);
                rAmountCell.setCellValue(item.getTotalAmount() != null ? item.getTotalAmount().doubleValue() : 0);
                rAmountCell.setCellStyle(currencyStyle);
                
                row.createCell(col++).setCellValue(item.getPaymentType() != null ? item.getPaymentType() : "");
                break;
                
            case "PAYMENTS":
                row.createCell(col++).setCellValue(item.getInvoiceNo() != null ? item.getInvoiceNo() : "");
                Cell pyDateCell = row.createCell(col++);
                if (item.getInvoiceDate() != null) {
                    pyDateCell.setCellValue(item.getInvoiceDate());
                    pyDateCell.setCellStyle(dateStyle);
                }
                row.createCell(col++).setCellValue(item.getSupplierName() != null ? item.getSupplierName() : "");
                row.createCell(col++).setCellValue(item.getInvoiceNo() != null ? item.getInvoiceNo() : "");
                
                Cell pyAmountCell = row.createCell(col++);
                pyAmountCell.setCellValue(item.getTotalAmount() != null ? item.getTotalAmount().doubleValue() : 0);
                pyAmountCell.setCellStyle(currencyStyle);
                
                row.createCell(col++).setCellValue(item.getPaymentType() != null ? item.getPaymentType() : "");
                break;
                
            default:
                row.createCell(col++).setCellValue(item.getInvoiceNo() != null ? item.getInvoiceNo() : "");
                Cell dCell = row.createCell(col++);
                if (item.getInvoiceDate() != null) {
                    dCell.setCellValue(item.getInvoiceDate());
                    dCell.setCellStyle(dateStyle);
                }
                row.createCell(col++).setCellValue(item.getCustomerName() != null ? item.getCustomerName() : 
                    (item.getSupplierName() != null ? item.getSupplierName() : ""));
                row.createCell(col++).setCellValue(item.getItemName() != null ? item.getItemName() : "");
                row.createCell(col++).setCellValue(item.getQuantity() != null ? item.getQuantity().doubleValue() : 0);
                
                Cell rateCell = row.createCell(col++);
                rateCell.setCellValue(item.getUnitPrice() != null ? item.getUnitPrice().doubleValue() : 0);
                rateCell.setCellStyle(currencyStyle);
                
                Cell totalCell = row.createCell(col++);
                totalCell.setCellValue(item.getTotalAmount() != null ? item.getTotalAmount().doubleValue() : 0);
                totalCell.setCellStyle(currencyStyle);
        }
    }

    // ==================== PDF GENERATION ====================

    private byte[] generatePDFReport(ReportFilterRequest filter) throws Exception {
        logger.warn("PDF generation not yet implemented");
        return new byte[0];
    }

    // ==================== STOCK CALCULATION METHODS ====================

    private ReportResponse calculateStockReportFromTransactions(Item item, LocalDate startDate, LocalDate endDate) {
        try {
            Map<String, Object> additionalFields = new HashMap<>();
            
            String brandName = getBrandName(item);
            String groupName = getGroupName(item);
            
            BigDecimal currentStock = item.getCurrentStock() != null ? item.getCurrentStock() : BigDecimal.ZERO;
            BigDecimal openingStockValue = item.getOpeningStock() != null ? item.getOpeningStock() : BigDecimal.ZERO;
            
            BigDecimal openingStock = currentStock;
            BigDecimal purchases = BigDecimal.ZERO;
            BigDecimal sales = BigDecimal.ZERO;
            BigDecimal closingStock = currentStock;
            
            if (startDate != null && endDate != null) {
                try {
                    // Calculate purchases between dates
                    List<PurchaseInvoiceItem> purchaseItems = purchaseInvoiceItemRepository.findByFilters(
                        null, null, null,
                        Collections.singletonList(item.getId()),
                        startDate, endDate
                    );
                    purchases = purchaseItems.stream()
                        .map(PurchaseInvoiceItem::getReceivedQuantity)
                        .filter(Objects::nonNull)
                        .reduce(BigDecimal.ZERO, BigDecimal::add);
                    
                    // Calculate sales between dates
                    List<SalesInvoiceItem> salesItems = salesInvoiceItemRepository.findByFilters(
                        null, null, null,
                        Collections.singletonList(item.getId()),
                        startDate, endDate
                    );
                    sales = salesItems.stream()
                        .map(SalesInvoiceItem::getQuantity)
                        .filter(Objects::nonNull)
                        .reduce(BigDecimal.ZERO, BigDecimal::add);
                    
                    // Calculate opening stock (stock before start date)
                    List<PurchaseInvoiceItem> purchaseBeforeItems = purchaseInvoiceItemRepository.findByFilters(
                        null, null, null,
                        Collections.singletonList(item.getId()),
                        null, startDate.minusDays(1)
                    );
                    BigDecimal purchasesBefore = purchaseBeforeItems.stream()
                        .map(PurchaseInvoiceItem::getReceivedQuantity)
                        .filter(Objects::nonNull)
                        .reduce(BigDecimal.ZERO, BigDecimal::add);
                    
                    List<SalesInvoiceItem> salesBeforeItems = salesInvoiceItemRepository.findByFilters(
                        null, null, null,
                        Collections.singletonList(item.getId()),
                        null, startDate.minusDays(1)
                    );
                    BigDecimal salesBefore = salesBeforeItems.stream()
                        .map(SalesInvoiceItem::getQuantity)
                        .filter(Objects::nonNull)
                        .reduce(BigDecimal.ZERO, BigDecimal::add);
                    
                    openingStock = openingStockValue.add(purchasesBefore).subtract(salesBefore);
                    closingStock = openingStock.add(purchases).subtract(sales);
                    
                    if (closingStock.compareTo(BigDecimal.ZERO) < 0) {
                        closingStock = currentStock;
                        openingStock = currentStock;
                        purchases = BigDecimal.ZERO;
                        sales = BigDecimal.ZERO;
                    }
                } catch (Exception e) {
                    logger.warn("Error calculating stock from transactions, using current stock: {}", e.getMessage());
                    closingStock = currentStock;
                    openingStock = currentStock;
                    purchases = BigDecimal.ZERO;
                    sales = BigDecimal.ZERO;
                }
            }
            
            additionalFields.put("openingStock", openingStock);
            additionalFields.put("purchases", purchases);
            additionalFields.put("sales", sales);
            additionalFields.put("closingStock", closingStock);
            additionalFields.put("currentStock", currentStock);
            additionalFields.put("minStockLevel", item.getMinStockLevel() != null ? item.getMinStockLevel() : BigDecimal.ZERO);
            additionalFields.put("maxStockLevel", item.getMaxStockLevel() != null ? item.getMaxStockLevel() : BigDecimal.ZERO);
            additionalFields.put("reorderLevel", item.getReorderLevel() != null ? item.getReorderLevel() : BigDecimal.ZERO);
            additionalFields.put("brand", brandName);
            additionalFields.put("group", groupName);
            
            return buildStockResponse(item, closingStock, additionalFields);
            
        } catch (Exception e) {
            logger.error("Error calculating stock for item {}: {}", item.getId(), e.getMessage(), e);
            return null;
        }
    }

    private ReportResponse buildStockResponse(Item item, BigDecimal closingStock, Map<String, Object> additionalFields) {
        BigDecimal stockValue = BigDecimal.ZERO;
        if (closingStock != null && item.getSellingPrice() != null) {
            stockValue = closingStock.multiply(item.getSellingPrice());
        }

        String brandName = getBrandName(item);
        String groupName = getGroupName(item);

        return ReportResponse.builder()
            .id(item.getId())
            .itemName(item.getName())
            .itemCode(item.getCode())
            .brandName(brandName)
            .groupName(groupName)
            .quantity(closingStock)
            .unitPrice(item.getSellingPrice() != null ? item.getSellingPrice() : BigDecimal.ZERO)
            .totalAmount(stockValue)
            .additionalFields(additionalFields)
            .build();
    }

    // ==================== CONVERSION METHODS ====================

    private ReportResponse convertSalesInvoiceToReport(SalesInvoice invoice) {
        Map<String, Object> additionalFields = new HashMap<>();
        additionalFields.put("customerPhone", invoice.getCustomer() != null ? invoice.getCustomer().getPhone() : null);
        additionalFields.put("customerEmail", invoice.getCustomer() != null ? invoice.getCustomer().getEmail() : null);
        additionalFields.put("discountAmount", invoice.getDiscountAmount());
        additionalFields.put("taxAmount", invoice.getTaxAmount());
        additionalFields.put("paidAmount", invoice.getPaidAmount());
        additionalFields.put("balanceAmount", invoice.getBalanceAmount());
        additionalFields.put("noOfItems", invoice.getItems() != null ? invoice.getItems().size() : 0);

        return ReportResponse.builder()
            .id(invoice.getId())
            .invoiceNo(invoice.getInvoiceNo())
            .invoiceDate(invoice.getInvoiceDate())
            .customerName(invoice.getCustomer() != null ? invoice.getCustomer().getName() : null)
            .totalAmount(invoice.getTotalAmount())
            .netAmount(invoice.getNetAmount())
            .paymentType(invoice.getPaymentType() != null ? invoice.getPaymentType().toString() : null)
            .additionalFields(additionalFields)
            .build();
    }

    private ReportResponse convertSalesItemToReport(SalesInvoiceItem item) {
        Map<String, Object> additionalFields = new HashMap<>();
        additionalFields.put("discountPercent", item.getDiscountPercent());
        additionalFields.put("taxPercent", item.getTaxPercent());
        
        if (item.getInvoice() != null) {
            if (item.getInvoice().getCustomer() != null) {
                additionalFields.put("customerPhone", item.getInvoice().getCustomer().getPhone());
            }
            additionalFields.put("invoiceDate", item.getInvoice().getInvoiceDate());
        }

        String brandName = getBrandName(item.getItem());
        String groupName = getGroupName(item.getItem());

        return ReportResponse.builder()
            .id(item.getId())
            .invoiceNo(item.getInvoice() != null ? item.getInvoice().getInvoiceNo() : null)
            .invoiceDate(item.getInvoice() != null ? item.getInvoice().getInvoiceDate() : null)
            .customerName(item.getInvoice() != null && item.getInvoice().getCustomer() != null ? 
                item.getInvoice().getCustomer().getName() : null)
            .itemName(item.getItem() != null ? item.getItem().getName() : null)
            .itemCode(item.getItem() != null ? item.getItem().getCode() : null)
            .brandName(brandName)
            .groupName(groupName)
            .quantity(item.getQuantity())
            .unitPrice(item.getUnitPrice())
            .totalAmount(item.getTotalAmount())
            .additionalFields(additionalFields)
            .build();
    }

    private ReportResponse convertPurchaseInvoiceToReport(PurchaseInvoice invoice) {
        Map<String, Object> additionalFields = new HashMap<>();
        additionalFields.put("supplierPhone", invoice.getSupplier() != null ? invoice.getSupplier().getPhone() : null);
        additionalFields.put("supplierEmail", invoice.getSupplier() != null ? invoice.getSupplier().getEmail() : null);
        additionalFields.put("receivedDate", invoice.getReceivedDate());
        additionalFields.put("discountAmount", invoice.getDiscountAmount());
        additionalFields.put("taxAmount", invoice.getTaxAmount());
        additionalFields.put("paidAmount", invoice.getPaidAmount());
        additionalFields.put("balanceAmount", invoice.getBalanceAmount());

        return ReportResponse.builder()
            .id(invoice.getId())
            .invoiceNo(invoice.getInvoiceNo())
            .invoiceDate(invoice.getInvoiceDate())
            .supplierName(invoice.getSupplier() != null ? invoice.getSupplier().getName() : null)
            .totalAmount(invoice.getTotalAmount())
            .netAmount(invoice.getNetAmount())
            .paymentType(invoice.getPaymentType() != null ? invoice.getPaymentType().toString() : null)
            .additionalFields(additionalFields)
            .build();
    }

    private ReportResponse convertPurchaseItemToReport(PurchaseInvoiceItem item) {
        Map<String, Object> additionalFields = new HashMap<>();
        additionalFields.put("orderedQuantity", item.getOrderedQuantity());
        additionalFields.put("discountPercent", item.getDiscountPercent());
        additionalFields.put("taxPercent", item.getTaxPercent());
        
        if (item.getPurchaseInvoice() != null) {
            if (item.getPurchaseInvoice().getSupplier() != null) {
                additionalFields.put("supplierPhone", item.getPurchaseInvoice().getSupplier().getPhone());
            }
            additionalFields.put("invoiceDate", item.getPurchaseInvoice().getInvoiceDate());
        }

        String brandName = getBrandName(item.getItem());
        String groupName = getGroupName(item.getItem());

        return ReportResponse.builder()
            .id(item.getId())
            .invoiceNo(item.getPurchaseInvoice() != null ? item.getPurchaseInvoice().getInvoiceNo() : null)
            .invoiceDate(item.getPurchaseInvoice() != null ? item.getPurchaseInvoice().getInvoiceDate() : null)
            .supplierName(item.getPurchaseInvoice() != null && item.getPurchaseInvoice().getSupplier() != null ? 
                item.getPurchaseInvoice().getSupplier().getName() : null)
            .itemName(item.getItem() != null ? item.getItem().getName() : null)
            .itemCode(item.getItem() != null ? item.getItem().getCode() : null)
            .brandName(brandName)
            .groupName(groupName)
            .quantity(item.getReceivedQuantity())
            .unitPrice(item.getUnitPrice())
            .totalAmount(item.getTotalAmount())
            .additionalFields(additionalFields)
            .build();
    }

    private ReportResponse convertReceiptToReport(BillReceipt receipt) {
        Map<String, Object> additionalFields = new HashMap<>();
        additionalFields.put("customerPhone", receipt.getCustomer() != null ? receipt.getCustomer().getPhone() : null);
        additionalFields.put("receiptNo", receipt.getReceiptNo());
        additionalFields.put("adjustAmount", receipt.getAdjustAmount());
        additionalFields.put("balanceAmount", receipt.getBalanceAmount());
        additionalFields.put("paymentMode", receipt.getPaymentMode() != null ? receipt.getPaymentMode().toString() : null);
        additionalFields.put("referenceNo", receipt.getReferenceNo());

        return ReportResponse.builder()
            .id(receipt.getId())
            .invoiceNo(receipt.getSalesInvoice() != null ? receipt.getSalesInvoice().getInvoiceNo() : null)
            .invoiceDate(receipt.getReceiptDate())
            .customerName(receipt.getCustomer() != null ? receipt.getCustomer().getName() : null)
            .totalAmount(receipt.getTotalAmount())
            .additionalFields(additionalFields)
            .build();
    }

    private ReportResponse convertPaymentToReport(BillPayment payment) {
        Map<String, Object> additionalFields = new HashMap<>();
        additionalFields.put("supplierPhone", payment.getSupplier() != null ? payment.getSupplier().getPhone() : null);
        additionalFields.put("paymentNo", payment.getPaymentNo());
        additionalFields.put("adjustAmount", payment.getAdjustAmount());
        additionalFields.put("balanceAmount", payment.getBalanceAmount());
        additionalFields.put("paymentMode", payment.getPaymentMode() != null ? payment.getPaymentMode().toString() : null);
        additionalFields.put("referenceNo", payment.getReferenceNo());

        return ReportResponse.builder()
            .id(payment.getId())
            .invoiceNo(payment.getPurchaseInvoice() != null ? payment.getPurchaseInvoice().getInvoiceNo() : null)
            .invoiceDate(payment.getPaymentDate())
            .supplierName(payment.getSupplier() != null ? payment.getSupplier().getName() : null)
            .totalAmount(payment.getTotalAmount())
            .additionalFields(additionalFields)
            .build();
    }

    private Page<ReportResponse> getPaginatedResponse(List<ReportResponse> responses, Pageable pageable) {
        int start = (int) pageable.getOffset();
        int end = Math.min((start + pageable.getPageSize()), responses.size());
        
        if (start > responses.size() || start < 0) {
            return new PageImpl<>(new ArrayList<>(), pageable, responses.size());
        }

        return new PageImpl<>(responses.subList(start, end), pageable, responses.size());
    }
}