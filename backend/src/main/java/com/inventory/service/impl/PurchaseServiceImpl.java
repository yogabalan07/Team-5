package com.inventory.service.impl;

import com.inventory.dto.request.PurchaseInvoiceRequest;
import com.inventory.dto.request.PurchaseOrderRequest;
import com.inventory.dto.response.PurchaseInvoiceResponse;
import com.inventory.dto.response.PurchaseOrderResponse;
import com.inventory.enums.PaymentType;
import com.inventory.enums.TransactionType;
import com.inventory.exception.BusinessException;
import com.inventory.exception.ResourceNotFoundException;
import com.inventory.model.*;
import com.inventory.repository.*;
import com.inventory.service.PurchaseService;
import com.inventory.util.InvoiceGenerator;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.CollectionUtils;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional
public class PurchaseServiceImpl implements PurchaseService {

    private static final Logger logger = LoggerFactory.getLogger(PurchaseServiceImpl.class);

    @Autowired
    private PurchaseOrderRepository purchaseOrderRepository;

    @Autowired
    private PurchaseInvoiceRepository purchaseInvoiceRepository;

    @Autowired
    private PurchaseInvoiceItemRepository purchaseInvoiceItemRepository;

    @Autowired
    private SupplierRepository supplierRepository;

    @Autowired
    private ItemRepository itemRepository;

    @Autowired
    private StockTransactionRepository stockTransactionRepository;

    @Autowired
    private InvoiceGenerator invoiceGenerator;

    // ==================== VALIDATION METHODS ====================

    private void validateSupplierExists(Long supplierId) {
        if (!supplierRepository.existsById(supplierId)) {
            throw new ResourceNotFoundException("Supplier not found with id: " + supplierId);
        }
    }

    private void validateItemExists(Long itemId) {
        if (!itemRepository.existsById(itemId)) {
            throw new ResourceNotFoundException("Item not found with id: " + itemId);
        }
    }

    private void validatePurchaseOrderItems(List<PurchaseOrderRequest.PurchaseOrderItemRequest> items) {
        if (CollectionUtils.isEmpty(items)) {
            throw new BusinessException("Purchase order must have at least one item");
        }
        for (PurchaseOrderRequest.PurchaseOrderItemRequest item : items) {
            if (item.getQuantity() <= 0) {
                throw new BusinessException("Quantity must be greater than zero for item: " + item.getItemId());
            }
            if (item.getUnitPrice() <= 0) {
                throw new BusinessException("Unit price must be greater than zero for item: " + item.getItemId());
            }
        }
    }

    private void validatePurchaseInvoiceItems(List<PurchaseInvoiceRequest.PurchaseInvoiceItemRequest> items) {
        if (CollectionUtils.isEmpty(items)) {
            throw new BusinessException("Purchase invoice must have at least one item");
        }
        for (PurchaseInvoiceRequest.PurchaseInvoiceItemRequest item : items) {
            if (item.getReceivedQuantity() <= 0) {
                throw new BusinessException("Received quantity must be greater than zero for item: " + item.getItemId());
            }
            if (item.getUnitPrice() <= 0) {
                throw new BusinessException("Unit price must be greater than zero for item: " + item.getItemId());
            }
            if (item.getDiscountPercent() != null && (item.getDiscountPercent() < 0 || item.getDiscountPercent() > 100)) {
                throw new BusinessException("Discount percent must be between 0 and 100 for item: " + item.getItemId());
            }
            if (item.getTaxPercent() != null && (item.getTaxPercent() < 0 || item.getTaxPercent() > 100)) {
                throw new BusinessException("Tax percent must be between 0 and 100 for item: " + item.getItemId());
            }
        }
    }

    // ==================== GET NEXT SEQUENCE NUMBER METHODS ====================

    private int getNextPONumber() {
        try {
            // Try to get max from repository
            Integer maxNumber = purchaseOrderRepository.getMaxPONumber("PO-");
            if (maxNumber != null) {
                return maxNumber + 1;
            }
            
            // Fallback: Get all PO numbers and calculate
            List<String> poNumbers = purchaseOrderRepository.findPONumbersByPrefix("PO-");
            return invoiceGenerator.getNextSequenceNumber(poNumbers, "PO-");
        } catch (Exception e) {
            logger.warn("Error getting max PO number, using fallback: {}", e.getMessage());
            // Fallback: count and use that
            long count = purchaseOrderRepository.count();
            return (int) count + 1;
        }
    }

    private int getNextInvoiceNumber() {
        try {
            // Try to get max from repository
            Integer maxNumber = purchaseInvoiceRepository.getMaxInvoiceNumber("PUR-");
            if (maxNumber != null) {
                return maxNumber + 1;
            }
            
            // Fallback: Get all invoice numbers and calculate
            List<String> invoiceNumbers = purchaseInvoiceRepository.findInvoiceNumbersByPrefix("PUR-");
            return invoiceGenerator.getNextSequenceNumber(invoiceNumbers, "PUR-");
        } catch (Exception e) {
            logger.warn("Error getting max invoice number, using fallback: {}", e.getMessage());
            // Fallback: count and use that
            long count = purchaseInvoiceRepository.count();
            return (int) count + 1;
        }
    }

    // ==================== PURCHASE ORDER METHODS ====================

    @Override
    public PurchaseOrderResponse createPurchaseOrder(PurchaseOrderRequest request) {
        logger.info("Creating purchase order for supplier ID: {}", request.getSupplierId());
        
        validateSupplierExists(request.getSupplierId());
        validatePurchaseOrderItems(request.getItems());
        
        Supplier supplier = supplierRepository.findById(request.getSupplierId()).get();

        PurchaseOrder po = new PurchaseOrder();
        
        // Generate PO number
        int nextNumber = getNextPONumber();
        String poNumber = invoiceGenerator.generatePONumber(nextNumber);
        po.setPoNumber(poNumber);
        po.setPoDate(request.getPoDate() != null ? request.getPoDate() : LocalDate.now());
        po.setSupplier(supplier);
        po.setExpectedDeliveryDate(request.getExpectedDeliveryDate());
        po.setNotes(request.getNotes());
        po.setIsConverted(false);

        List<PurchaseOrderItem> items = new ArrayList<>();
        BigDecimal totalAmount = BigDecimal.ZERO;

        for (PurchaseOrderRequest.PurchaseOrderItemRequest itemReq : request.getItems()) {
            Item item = itemRepository.findById(itemReq.getItemId())
                .orElseThrow(() -> new ResourceNotFoundException("Item not found: " + itemReq.getItemId()));

            PurchaseOrderItem poItem = new PurchaseOrderItem();
            poItem.setPurchaseOrder(po);
            poItem.setItem(item);
            poItem.setQuantity(BigDecimal.valueOf(itemReq.getQuantity()));
            poItem.setUnitPrice(BigDecimal.valueOf(itemReq.getUnitPrice()));
            
            BigDecimal lineTotal = poItem.getUnitPrice().multiply(poItem.getQuantity());
            poItem.setTotalAmount(lineTotal);
            
            items.add(poItem);
            totalAmount = totalAmount.add(lineTotal);
        }

        po.setTotalAmount(totalAmount);
        po.setItems(items);
        
        PurchaseOrder saved = purchaseOrderRepository.save(po);
        logger.info("Purchase Order created successfully: {} | Total: ₹{}", saved.getPoNumber(), saved.getTotalAmount());
        return convertToResponse(saved);
    }

    @Override
    public PurchaseOrderResponse getPurchaseOrderById(Long id) {
        logger.info("Fetching purchase order by ID: {}", id);
        PurchaseOrder po = purchaseOrderRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Purchase Order not found with id: " + id));
        return convertToResponse(po);
    }

    @Override
    public PurchaseOrderResponse getPurchaseOrderByPoNumber(String poNumber) {
        logger.info("Fetching purchase order by PO number: {}", poNumber);
        PurchaseOrder po = purchaseOrderRepository.findByPoNumber(poNumber)
            .orElseThrow(() -> new ResourceNotFoundException("Purchase Order not found: " + poNumber));
        return convertToResponse(po);
    }

    @Override
    public Page<PurchaseOrderResponse> getAllPurchaseOrders(Pageable pageable) {
        logger.info("Fetching all purchase orders with pagination");
        return purchaseOrderRepository.findAll(pageable)
            .map(this::convertToResponse);
    }

    @Override
    public Page<PurchaseOrderResponse> getPurchaseOrdersBySupplier(Long supplierId, Pageable pageable) {
        logger.info("Fetching purchase orders for supplier ID: {}", supplierId);
        validateSupplierExists(supplierId);
        
        Page<PurchaseOrder> orders = purchaseOrderRepository.findBySupplierId(supplierId, pageable);
        return orders.map(this::convertToResponse);
    }

    @Override
    public Page<PurchaseOrderResponse> getPurchaseOrdersByDateRange(String startDate, String endDate, Pageable pageable) {
        LocalDate start = LocalDate.parse(startDate, DateTimeFormatter.ISO_LOCAL_DATE);
        LocalDate end = LocalDate.parse(endDate, DateTimeFormatter.ISO_LOCAL_DATE);
        return getPurchaseOrdersByDateRange(start, end, pageable);
    }

    @Override
    public Page<PurchaseOrderResponse> getPurchaseOrdersByDateRange(LocalDate startDate, LocalDate endDate, Pageable pageable) {
        logger.info("Fetching purchase orders between {} and {}", startDate, endDate);
        if (startDate.isAfter(endDate)) {
            throw new BusinessException("Start date cannot be after end date");
        }
        Page<PurchaseOrder> orders = purchaseOrderRepository.findByPoDateBetween(startDate, endDate, pageable);
        return orders.map(this::convertToResponse);
    }

    @Override
    public Page<PurchaseOrderResponse> searchPurchaseOrders(String keyword, Pageable pageable) {
        logger.info("Searching purchase orders with keyword: {}", keyword);
        Page<PurchaseOrder> orders = purchaseOrderRepository.search(keyword, pageable);
        return orders.map(this::convertToResponse);
    }

    @Override
    public Page<PurchaseOrderResponse> getPurchaseOrdersByStatus(String status, Pageable pageable) {
        logger.info("Fetching purchase orders with status: {}", status);
        if ("PENDING".equalsIgnoreCase(status)) {
            return getPendingPurchaseOrders(pageable);
        } else if ("CONVERTED".equalsIgnoreCase(status)) {
            return getConvertedPurchaseOrders(pageable);
        } else {
            return Page.empty(pageable);
        }
    }

    @Override
    public Page<PurchaseOrderResponse> getPendingPurchaseOrders(Pageable pageable) {
        logger.info("Fetching pending purchase orders");
        Page<PurchaseOrder> orders = purchaseOrderRepository.findByIsConvertedFalse(pageable);
        return orders.map(this::convertToResponse);
    }

    @Override
    public Page<PurchaseOrderResponse> getConvertedPurchaseOrders(Pageable pageable) {
        logger.info("Fetching converted purchase orders");
        Page<PurchaseOrder> orders = purchaseOrderRepository.findByIsConvertedTrue(pageable);
        return orders.map(this::convertToResponse);
    }

    @Override
    public long getPendingPurchaseOrderCount() {
        logger.info("Counting pending purchase orders");
        return purchaseOrderRepository.countByIsConvertedFalse();
    }

    @Override
    public long getPurchaseOrderCount() {
        logger.info("Counting total purchase orders");
        return purchaseOrderRepository.count();
    }

    @Override
    public List<PurchaseOrderResponse> getRecentPurchaseOrders(int limit) {
        logger.info("Fetching {} most recent purchase orders", limit);
        Pageable pageable = Pageable.ofSize(limit);
        Page<PurchaseOrder> orders = purchaseOrderRepository.findAllByOrderByCreatedAtDesc(pageable);
        return orders.getContent().stream()
            .map(this::convertToResponse)
            .collect(Collectors.toList());
    }

    @Override
    public PurchaseOrderResponse updatePurchaseOrder(Long id, PurchaseOrderRequest request) {
        logger.info("Updating purchase order with ID: {}", id);
        
        PurchaseOrder po = purchaseOrderRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Purchase order not found with id: " + id));
        
        if (po.getIsConverted()) {
            throw new BusinessException("Cannot update a converted purchase order");
        }
        
        validateSupplierExists(request.getSupplierId());
        validatePurchaseOrderItems(request.getItems());
        
        Supplier supplier = supplierRepository.findById(request.getSupplierId()).get();
        
        po.setSupplier(supplier);
        if (request.getPoDate() != null) {
            po.setPoDate(request.getPoDate());
        }
        po.setExpectedDeliveryDate(request.getExpectedDeliveryDate());
        po.setNotes(request.getNotes());
        
        po.getItems().clear();
        
        List<PurchaseOrderItem> items = new ArrayList<>();
        BigDecimal totalAmount = BigDecimal.ZERO;
        
        for (PurchaseOrderRequest.PurchaseOrderItemRequest itemReq : request.getItems()) {
            Item item = itemRepository.findById(itemReq.getItemId())
                .orElseThrow(() -> new ResourceNotFoundException("Item not found: " + itemReq.getItemId()));
            
            PurchaseOrderItem poItem = new PurchaseOrderItem();
            poItem.setPurchaseOrder(po);
            poItem.setItem(item);
            poItem.setQuantity(BigDecimal.valueOf(itemReq.getQuantity()));
            poItem.setUnitPrice(BigDecimal.valueOf(itemReq.getUnitPrice()));
            
            BigDecimal lineTotal = poItem.getUnitPrice().multiply(poItem.getQuantity());
            poItem.setTotalAmount(lineTotal);
            
            items.add(poItem);
            totalAmount = totalAmount.add(lineTotal);
        }
        
        po.setItems(items);
        po.setTotalAmount(totalAmount);
        
        PurchaseOrder updated = purchaseOrderRepository.save(po);
        logger.info("Purchase Order updated successfully: {}", updated.getPoNumber());
        return convertToResponse(updated);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public PurchaseOrderResponse convertPurchaseOrderToInvoice(Long poId) {
        logger.info("Converting purchase order to invoice, PO ID: {}", poId);
        
        PurchaseOrder po = purchaseOrderRepository.findById(poId)
            .orElseThrow(() -> new ResourceNotFoundException("Purchase Order not found with id: " + poId));

        if (po.getIsConverted()) {
            throw new BusinessException("Purchase Order already converted to invoice");
        }

        PurchaseInvoice invoice = new PurchaseInvoice();
        invoice.setPurchaseOrder(po);
        invoice.setSupplier(po.getSupplier());
        invoice.setInvoiceDate(LocalDate.now());
        invoice.setReceivedDate(LocalDate.now());
        invoice.setNotes(po.getNotes());
        invoice.setPaymentType(PaymentType.CREDIT);
        
        // Generate invoice number
        int nextNumber = getNextInvoiceNumber();
        invoice.setInvoiceNo(invoiceGenerator.generatePurchaseInvoiceNumber(nextNumber));
        
        List<PurchaseInvoiceItem> invoiceItems = new ArrayList<>();
        BigDecimal totalAmount = BigDecimal.ZERO;
        
        for (PurchaseOrderItem poItem : po.getItems()) {
            PurchaseInvoiceItem invItem = new PurchaseInvoiceItem();
            invItem.setPurchaseInvoice(invoice);
            invItem.setItem(poItem.getItem());
            invItem.setPurchaseOrderItem(poItem);
            invItem.setOrderedQuantity(poItem.getQuantity());
            invItem.setReceivedQuantity(poItem.getQuantity());
            invItem.setUnitPrice(poItem.getUnitPrice());
            invItem.setDiscountPercent(BigDecimal.ZERO);
            invItem.setTaxPercent(BigDecimal.ZERO);
            invItem.setTotalAmount(poItem.getTotalAmount());
            
            invoiceItems.add(invItem);
            totalAmount = totalAmount.add(poItem.getTotalAmount());
            
            updateItemStock(poItem.getItem(), poItem.getQuantity(), invoice.getInvoiceNo(), poItem.getUnitPrice());
        }
        
        invoice.setItems(invoiceItems);
        invoice.setTotalAmount(totalAmount);
        invoice.setDiscountAmount(BigDecimal.ZERO);
        invoice.setTaxAmount(BigDecimal.ZERO);
        invoice.setNetAmount(totalAmount);
        invoice.setPaidAmount(BigDecimal.ZERO);
        invoice.setBalanceAmount(totalAmount);
        invoice.setIsReturned(false);
        
        purchaseInvoiceRepository.save(invoice);
        
        po.setIsConverted(true);
        purchaseOrderRepository.save(po);
        
        logger.info("Purchase Order converted to Invoice successfully: {}", invoice.getInvoiceNo());
        return convertToResponse(po);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void deletePurchaseOrder(Long id) {
        logger.info("Deleting purchase order with ID: {}", id);
        
        PurchaseOrder po = purchaseOrderRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Purchase order not found with id: " + id));
        
        if (po.getIsConverted()) {
            throw new BusinessException("Cannot delete a converted purchase order");
        }
        
        purchaseOrderRepository.delete(po);
        logger.info("Purchase Order deleted successfully: {}", id);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void deleteMultiplePurchaseOrders(List<Long> ids) {
        logger.info("Deleting multiple purchase orders: {}", ids);
        for (Long id : ids) {
            deletePurchaseOrder(id);
        }
    }

    @Override
    public byte[] exportPurchaseOrdersToCSV(LocalDate startDate, LocalDate endDate) {
        logger.info("Exporting purchase orders to CSV from {} to {}", startDate, endDate);
        List<PurchaseOrder> orders;
        if (startDate != null && endDate != null) {
            orders = purchaseOrderRepository.findByPoDateBetween(startDate, endDate);
        } else {
            orders = purchaseOrderRepository.findAll();
        }
        
        StringBuilder csv = new StringBuilder();
        csv.append("PO Number,PO Date,Supplier,Total Amount,Status,Created At\n");
        for (PurchaseOrder po : orders) {
            csv.append(po.getPoNumber()).append(",")
               .append(po.getPoDate()).append(",")
               .append(po.getSupplier().getName()).append(",")
               .append(po.getTotalAmount()).append(",")
               .append(po.getIsConverted() ? "CONVERTED" : "PENDING").append(",")
               .append(po.getCreatedAt()).append("\n");
        }
        return csv.toString().getBytes();
    }

    @Override
    public Map<String, Object> getPurchaseOrderSummary() {
        logger.info("Getting purchase order summary");
        Map<String, Object> summary = new HashMap<>();
        summary.put("totalOrders", purchaseOrderRepository.count());
        summary.put("pendingOrders", purchaseOrderRepository.countByIsConvertedFalse());
        summary.put("convertedOrders", purchaseOrderRepository.countByIsConvertedTrue());
        
        BigDecimal totalAmount = purchaseOrderRepository.sumTotalAmount();
        summary.put("totalAmount", totalAmount != null ? totalAmount : BigDecimal.ZERO);
        
        return summary;
    }

    @Override
    public Map<String, Object> getMonthlyPurchaseOrderStatistics(int year) {
        logger.info("Getting monthly purchase order statistics for year: {}", year);
        if (year == 0) {
            year = LocalDate.now().getYear();
        }
        Map<String, Object> statistics = new HashMap<>();
        Map<Integer, Integer> monthlyCounts = new HashMap<>();
        Map<Integer, BigDecimal> monthlyAmounts = new HashMap<>();
        
        for (int month = 1; month <= 12; month++) {
            LocalDate start = LocalDate.of(year, month, 1);
            LocalDate end = start.withDayOfMonth(start.lengthOfMonth());
            List<PurchaseOrder> orders = purchaseOrderRepository.findByPoDateBetween(start, end);
            monthlyCounts.put(month, orders.size());
            BigDecimal monthTotal = orders.stream()
                .map(PurchaseOrder::getTotalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
            monthlyAmounts.put(month, monthTotal);
        }
        
        statistics.put("year", year);
        statistics.put("monthlyCounts", monthlyCounts);
        statistics.put("monthlyAmounts", monthlyAmounts);
        return statistics;
    }

    // ==================== PURCHASE INVOICE METHODS ====================

    @Override
    public PurchaseInvoiceResponse createPurchaseInvoice(PurchaseInvoiceRequest request) {
        logger.info("Creating purchase invoice for supplier ID: {}", request.getSupplierId());
        
        validateSupplierExists(request.getSupplierId());
        validatePurchaseInvoiceItems(request.getItems());
        
        Supplier supplier = supplierRepository.findById(request.getSupplierId()).get();

        PurchaseInvoice invoice = new PurchaseInvoice();
        
        // Generate invoice number
        int nextNumber = getNextInvoiceNumber();
        invoice.setInvoiceNo(invoiceGenerator.generatePurchaseInvoiceNumber(nextNumber));
        invoice.setInvoiceDate(request.getInvoiceDate() != null ? request.getInvoiceDate() : LocalDate.now());
        invoice.setReceivedDate(request.getReceivedDate() != null ? request.getReceivedDate() : LocalDate.now());
        invoice.setSupplier(supplier);
        invoice.setPaymentType(PaymentType.valueOf(request.getPaymentType()));
        invoice.setReferenceNo(request.getReferenceNo());
        invoice.setNotes(request.getNotes());
        invoice.setIsReturned(false);

        if (request.getPoId() != null) {
            PurchaseOrder po = purchaseOrderRepository.findById(request.getPoId())
                .orElseThrow(() -> new ResourceNotFoundException("Purchase Order not found with id: " + request.getPoId()));
            invoice.setPurchaseOrder(po);
            po.setIsConverted(true);
            purchaseOrderRepository.save(po);
        }

        List<PurchaseInvoiceItem> items = new ArrayList<>();
        BigDecimal totalAmount = BigDecimal.ZERO;
        BigDecimal totalTax = BigDecimal.ZERO;
        BigDecimal totalDiscount = BigDecimal.ZERO;

        for (PurchaseInvoiceRequest.PurchaseInvoiceItemRequest itemReq : request.getItems()) {
            Item item = itemRepository.findById(itemReq.getItemId())
                .orElseThrow(() -> new ResourceNotFoundException("Item not found: " + itemReq.getItemId()));

            PurchaseInvoiceItem invItem = new PurchaseInvoiceItem();
            invItem.setPurchaseInvoice(invoice);
            invItem.setItem(item);
            invItem.setReceivedQuantity(BigDecimal.valueOf(itemReq.getReceivedQuantity()));
            invItem.setUnitPrice(BigDecimal.valueOf(itemReq.getUnitPrice()));
            invItem.setDiscountPercent(itemReq.getDiscountPercent() != null ? 
                BigDecimal.valueOf(itemReq.getDiscountPercent()) : BigDecimal.ZERO);
            invItem.setTaxPercent(itemReq.getTaxPercent() != null ? 
                BigDecimal.valueOf(itemReq.getTaxPercent()) : BigDecimal.ZERO);

            BigDecimal lineTotal = invItem.getUnitPrice().multiply(invItem.getReceivedQuantity());
            BigDecimal discountAmount = lineTotal.multiply(invItem.getDiscountPercent())
                .divide(new BigDecimal(100), 2, RoundingMode.HALF_UP);
            BigDecimal afterDiscount = lineTotal.subtract(discountAmount);
            BigDecimal taxAmount = afterDiscount.multiply(invItem.getTaxPercent())
                .divide(new BigDecimal(100), 2, RoundingMode.HALF_UP);
            BigDecimal lineNetTotal = afterDiscount.add(taxAmount);

            invItem.setTotalAmount(lineNetTotal);
            items.add(invItem);
            totalAmount = totalAmount.add(lineTotal);
            totalTax = totalTax.add(taxAmount);
            totalDiscount = totalDiscount.add(discountAmount);

            updateItemStock(item, invItem.getReceivedQuantity(), invoice.getInvoiceNo(), invItem.getUnitPrice());
        }

        BigDecimal netAmount = totalAmount.subtract(totalDiscount).add(totalTax);
        
        invoice.setTotalAmount(totalAmount);
        invoice.setDiscountAmount(totalDiscount);
        invoice.setTaxAmount(totalTax);
        invoice.setNetAmount(netAmount);
        
        if (invoice.getPaymentType() == PaymentType.CASH) {
            invoice.setPaidAmount(netAmount);
            invoice.setBalanceAmount(BigDecimal.ZERO);
        } else {
            invoice.setPaidAmount(BigDecimal.ZERO);
            invoice.setBalanceAmount(netAmount);
            supplier.setCreditBalance(supplier.getCreditBalance().add(netAmount));
            supplierRepository.save(supplier);
        }

        invoice.setItems(items);
        PurchaseInvoice saved = purchaseInvoiceRepository.save(invoice);
        
        for (PurchaseInvoiceItem item : items) {
            item.setPurchaseInvoice(saved);
            purchaseInvoiceItemRepository.save(item);
        }
        
        logger.info("Purchase Invoice created successfully: {} | Total: ₹{}", saved.getInvoiceNo(), saved.getNetAmount());
        return convertToResponse(saved);
    }

    @Override
    public PurchaseInvoiceResponse getPurchaseInvoiceById(Long id) {
        logger.info("Fetching purchase invoice by ID: {}", id);
        PurchaseInvoice invoice = purchaseInvoiceRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Purchase Invoice not found with id: " + id));
        return convertToResponse(invoice);
    }

    @Override
    public PurchaseInvoiceResponse getPurchaseInvoiceByInvoiceNo(String invoiceNo) {
        logger.info("Fetching purchase invoice by invoice number: {}", invoiceNo);
        PurchaseInvoice invoice = purchaseInvoiceRepository.findByInvoiceNo(invoiceNo)
            .orElseThrow(() -> new ResourceNotFoundException("Purchase Invoice not found: " + invoiceNo));
        return convertToResponse(invoice);
    }

    @Override
    public Page<PurchaseInvoiceResponse> getAllPurchaseInvoices(Pageable pageable) {
        logger.info("Fetching all purchase invoices with pagination");
        return purchaseInvoiceRepository.findAll(pageable)
            .map(this::convertToResponse);
    }

    @Override
    public Page<PurchaseInvoiceResponse> getPurchaseInvoicesByDateRange(
            String startDate, String endDate, String dateType, Pageable pageable) {
        logger.info("Fetching purchase invoices by date range: {} to {}, type: {}", startDate, endDate, dateType);
        
        LocalDate start = LocalDate.parse(startDate, DateTimeFormatter.ISO_LOCAL_DATE);
        LocalDate end = LocalDate.parse(endDate, DateTimeFormatter.ISO_LOCAL_DATE);
        
        if (start.isAfter(end)) {
            throw new BusinessException("Start date cannot be after end date");
        }
        
        if ("RECEIVED_DATE".equalsIgnoreCase(dateType)) {
            return purchaseInvoiceRepository.findByReceivedDateRange(start, end, pageable)
                .map(this::convertToResponse);
        } else {
            return purchaseInvoiceRepository.findByInvoiceDateRange(start, end, pageable)
                .map(this::convertToResponse);
        }
    }

    @Override
    public Page<PurchaseInvoiceResponse> getPurchaseInvoicesBySupplier(Long supplierId, Pageable pageable) {
        logger.info("Fetching purchase invoices for supplier ID: {}", supplierId);
        validateSupplierExists(supplierId);
        
        Page<PurchaseInvoice> invoices = purchaseInvoiceRepository.findBySupplierId(supplierId, pageable);
        return invoices.map(this::convertToResponse);
    }

    @Override
    public Page<PurchaseInvoiceResponse> getPurchaseInvoicesByPaymentStatus(String paymentStatus, Pageable pageable) {
        logger.info("Fetching purchase invoices by payment status: {}", paymentStatus);
        
        Page<PurchaseInvoice> invoices;
        if ("PAID".equalsIgnoreCase(paymentStatus)) {
            invoices = purchaseInvoiceRepository.findByBalanceAmount(BigDecimal.ZERO, pageable);
        } else if ("UNPAID".equalsIgnoreCase(paymentStatus)) {
            invoices = purchaseInvoiceRepository.findByBalanceAmountGreaterThan(BigDecimal.ZERO, pageable);
        } else if ("PARTIAL".equalsIgnoreCase(paymentStatus)) {
            invoices = purchaseInvoiceRepository.findByPartialPayment(pageable);
        } else {
            throw new BusinessException("Invalid payment status: " + paymentStatus + ". Valid values: PAID, UNPAID, PARTIAL");
        }
        
        return invoices.map(this::convertToResponse);
    }

    @Override
    public Page<PurchaseInvoiceResponse> searchPurchaseInvoices(String keyword, Pageable pageable) {
        logger.info("Searching purchase invoices with keyword: {}", keyword);
        Page<PurchaseInvoice> invoices = purchaseInvoiceRepository.search(keyword, pageable);
        return invoices.map(this::convertToResponse);
    }

    @Override
    @Transactional
    public PurchaseInvoiceResponse makePayment(Long invoiceId, BigDecimal amount) {
        logger.info("Making payment on invoice ID: {}, Amount: {}", invoiceId, amount);
        
        PurchaseInvoice invoice = purchaseInvoiceRepository.findById(invoiceId)
            .orElseThrow(() -> new ResourceNotFoundException("Invoice not found with id: " + invoiceId));
        
        if (invoice.getIsReturned()) {
            throw new BusinessException("Cannot make payment on a returned invoice");
        }
        
        if (amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessException("Payment amount must be greater than zero");
        }
        
        if (amount.compareTo(invoice.getBalanceAmount()) > 0) {
            throw new BusinessException("Payment amount exceeds balance amount: " + invoice.getBalanceAmount());
        }
        
        invoice.setPaidAmount(invoice.getPaidAmount().add(amount));
        invoice.setBalanceAmount(invoice.getBalanceAmount().subtract(amount));
        
        Supplier supplier = invoice.getSupplier();
        supplier.setCreditBalance(supplier.getCreditBalance().subtract(amount));
        supplierRepository.save(supplier);
        
        PurchaseInvoice updated = purchaseInvoiceRepository.save(invoice);
        logger.info("Payment made successfully on invoice: {}", updated.getInvoiceNo());
        return convertToResponse(updated);
    }

    @Override
    public PurchaseInvoiceResponse updatePurchaseInvoice(Long id, PurchaseInvoiceRequest request) {
        logger.info("Updating purchase invoice with ID: {}", id);
        
        PurchaseInvoice invoice = purchaseInvoiceRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Purchase invoice not found with id: " + id));
        
        if (invoice.getIsReturned()) {
            throw new BusinessException("Cannot update a returned purchase invoice");
        }

        if (request.getInvoiceDate() != null) {
            invoice.setInvoiceDate(request.getInvoiceDate());
        }
        if (request.getReceivedDate() != null) {
            invoice.setReceivedDate(request.getReceivedDate());
        }
        if (request.getNotes() != null) {
            invoice.setNotes(request.getNotes());
        }
        if (request.getReferenceNo() != null) {
            invoice.setReferenceNo(request.getReferenceNo());
        }
        
        if (request.getPaymentType() != null) {
            PaymentType oldPaymentType = invoice.getPaymentType();
            PaymentType newPaymentType = PaymentType.valueOf(request.getPaymentType());
            
            if (oldPaymentType != newPaymentType) {
                updatePaymentType(invoice, oldPaymentType, newPaymentType);
                invoice.setPaymentType(newPaymentType);
            }
        }

        PurchaseInvoice updated = purchaseInvoiceRepository.save(invoice);
        logger.info("Purchase Invoice updated successfully: {}", updated.getInvoiceNo());
        return convertToResponse(updated);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void deletePurchaseInvoice(Long id) {
        logger.info("Deleting purchase invoice with ID: {}", id);
        
        PurchaseInvoice invoice = purchaseInvoiceRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Purchase invoice not found with id: " + id));
        
        if (invoice.getIsReturned()) {
            throw new BusinessException("Cannot delete a returned purchase invoice");
        }
        
        for (PurchaseInvoiceItem item : invoice.getItems()) {
            Item inventoryItem = item.getItem();
            BigDecimal oldStock = inventoryItem.getCurrentStock();
            BigDecimal newStock = oldStock.subtract(item.getReceivedQuantity());
            inventoryItem.setCurrentStock(newStock);
            itemRepository.save(inventoryItem);
            
            StockTransaction stockTransaction = new StockTransaction();
            stockTransaction.setItem(inventoryItem);
            stockTransaction.setTransactionType(TransactionType.RETURN_OUT);
            stockTransaction.setReferenceNo("DEL-" + invoice.getInvoiceNo());
            stockTransaction.setQuantity(item.getReceivedQuantity().negate());
            stockTransaction.setPreviousStock(oldStock);
            stockTransaction.setNewStock(newStock);
            stockTransaction.setUnitPrice(item.getUnitPrice());
            stockTransactionRepository.save(stockTransaction);
            
            logger.debug("Stock reversed for item: {} | Old: {} | Removed: {} | New: {}", 
                inventoryItem.getName(), oldStock, item.getReceivedQuantity(), newStock);
        }
        
        if (invoice.getPaymentType() == PaymentType.CREDIT) {
            Supplier supplier = invoice.getSupplier();
            BigDecimal oldBalance = supplier.getCreditBalance();
            BigDecimal newBalance = oldBalance.subtract(invoice.getNetAmount());
            supplier.setCreditBalance(newBalance);
            supplierRepository.save(supplier);
            logger.debug("Supplier credit balance updated: {} | Old: {} | New: {}", 
                supplier.getName(), oldBalance, newBalance);
        }
        
        purchaseInvoiceItemRepository.deleteAll(invoice.getItems());
        purchaseInvoiceRepository.delete(invoice);
        logger.info("Purchase Invoice deleted successfully: {} - {}", id, invoice.getInvoiceNo());
    }

    @Override
    public BigDecimal getTotalPurchasesBySupplier(Long supplierId) {
        logger.info("Calculating total purchases for supplier ID: {}", supplierId);
        validateSupplierExists(supplierId);
        BigDecimal total = purchaseInvoiceRepository.sumNetAmountBySupplier(supplierId);
        return total != null ? total : BigDecimal.ZERO;
    }

    @Override
    public Map<String, Object> getPurchaseInvoiceSummary() {
        logger.info("Getting purchase invoice summary");
        Map<String, Object> summary = new HashMap<>();
        summary.put("totalInvoices", purchaseInvoiceRepository.count());
        summary.put("totalAmount", purchaseInvoiceRepository.sumNetAmount());
        summary.put("totalPaid", purchaseInvoiceRepository.sumPaidAmount());
        summary.put("totalBalance", purchaseInvoiceRepository.sumBalanceAmount());
        
        long paidCount = purchaseInvoiceRepository.countByBalanceAmount(BigDecimal.ZERO);
        long unpaidCount = purchaseInvoiceRepository.countByBalanceAmountGreaterThan(BigDecimal.ZERO);
        summary.put("paidCount", paidCount);
        summary.put("unpaidCount", unpaidCount);
        
        return summary;
    }

    // ==================== PRIVATE HELPER METHODS ====================

    private void updateItemStock(Item item, BigDecimal quantity, String referenceNo, BigDecimal unitPrice) {
        BigDecimal oldStock = item.getCurrentStock() != null ? item.getCurrentStock() : BigDecimal.ZERO;
        BigDecimal newStock = oldStock.add(quantity);
        item.setCurrentStock(newStock);
        itemRepository.save(item);
        
        StockTransaction stockTransaction = new StockTransaction();
        stockTransaction.setItem(item);
        stockTransaction.setTransactionType(TransactionType.PURCHASE);
        stockTransaction.setReferenceNo(referenceNo);
        stockTransaction.setQuantity(quantity);
        stockTransaction.setPreviousStock(oldStock);
        stockTransaction.setNewStock(newStock);
        stockTransaction.setUnitPrice(unitPrice);
        stockTransactionRepository.save(stockTransaction);
        
        logger.debug("Stock updated for item: {} | Old: {} | Added: {} | New: {}", 
            item.getName(), oldStock, quantity, newStock);
    }

    private void updatePaymentType(PurchaseInvoice invoice, PaymentType oldType, PaymentType newType) {
        Supplier supplier = invoice.getSupplier();
        
        if (oldType == PaymentType.CASH && newType == PaymentType.CREDIT) {
            invoice.setPaidAmount(BigDecimal.ZERO);
            invoice.setBalanceAmount(invoice.getNetAmount());
            supplier.setCreditBalance(supplier.getCreditBalance().add(invoice.getNetAmount()));
            supplierRepository.save(supplier);
        } else if (oldType == PaymentType.CREDIT && newType == PaymentType.CASH) {
            invoice.setPaidAmount(invoice.getNetAmount());
            invoice.setBalanceAmount(BigDecimal.ZERO);
            supplier.setCreditBalance(supplier.getCreditBalance().subtract(invoice.getNetAmount()));
            supplierRepository.save(supplier);
        }
    }

    private String determinePaymentStatus(PurchaseInvoice invoice) {
        if (invoice.getBalanceAmount() == null || invoice.getNetAmount() == null) {
            return "UNPAID";
        }
        
        if (invoice.getBalanceAmount().compareTo(BigDecimal.ZERO) == 0) {
            return "PAID";
        } else if (invoice.getPaidAmount().compareTo(BigDecimal.ZERO) > 0 && 
                   invoice.getBalanceAmount().compareTo(BigDecimal.ZERO) > 0) {
            return "PARTIAL";
        } else {
            return "UNPAID";
        }
    }

    // ==================== CONVERSION METHODS ====================

    private PurchaseOrderResponse convertToResponse(PurchaseOrder po) {
        List<PurchaseOrderResponse.PurchaseOrderItemResponse> itemResponses = new ArrayList<>();
        if (po.getItems() != null) {
            for (PurchaseOrderItem item : po.getItems()) {
                itemResponses.add(
                    PurchaseOrderResponse.PurchaseOrderItemResponse.builder()
                        .id(item.getId())
                        .itemName(item.getItem().getName())
                        .itemCode(item.getItem().getCode())
                        .quantity(item.getQuantity())
                        .unitPrice(item.getUnitPrice())
                        .totalAmount(item.getTotalAmount())
                        .build()
                );
            }
        }

        PurchaseOrderResponse.PurchaseOrderResponseBuilder builder = PurchaseOrderResponse.builder()
            .id(po.getId())
            .poNumber(po.getPoNumber())
            .poDate(po.getPoDate())
            .supplierName(po.getSupplier().getName())
            .supplierPhone(po.getSupplier().getPhone())
            .expectedDeliveryDate(po.getExpectedDeliveryDate())
            .totalAmount(po.getTotalAmount())
            .isConverted(po.getIsConverted())
            .notes(po.getNotes())
            .items(itemResponses);

        if (po.getCreatedAt() != null) {
            builder.createdAt(po.getCreatedAt().toLocalDate());
        }
        if (po.getUpdatedAt() != null) {
            builder.updatedAt(po.getUpdatedAt().toLocalDate());
        }

        return builder.build();
    }

    private PurchaseInvoiceResponse convertToResponse(PurchaseInvoice invoice) {
        List<PurchaseInvoiceResponse.PurchaseInvoiceItemResponse> itemResponses = new ArrayList<>();
        if (invoice.getItems() != null) {
            for (PurchaseInvoiceItem item : invoice.getItems()) {
                itemResponses.add(
                    PurchaseInvoiceResponse.PurchaseInvoiceItemResponse.builder()
                        .id(item.getId())
                        .itemName(item.getItem().getName())
                        .itemCode(item.getItem().getCode())
                        .orderedQuantity(item.getOrderedQuantity())
                        .receivedQuantity(item.getReceivedQuantity())
                        .unitPrice(item.getUnitPrice())
                        .discountPercent(item.getDiscountPercent())
                        .taxPercent(item.getTaxPercent())
                        .totalAmount(item.getTotalAmount())
                        .build()
                );
            }
        }

        String paymentStatus = determinePaymentStatus(invoice);

        PurchaseInvoiceResponse.PurchaseInvoiceResponseBuilder builder = PurchaseInvoiceResponse.builder()
            .id(invoice.getId())
            .invoiceNo(invoice.getInvoiceNo())
            .invoiceDate(invoice.getInvoiceDate())
            .receivedDate(invoice.getReceivedDate())
            .supplierName(invoice.getSupplier().getName())
            .supplierPhone(invoice.getSupplier().getPhone())
            .totalAmount(invoice.getTotalAmount())
            .discountAmount(invoice.getDiscountAmount())
            .taxAmount(invoice.getTaxAmount())
            .netAmount(invoice.getNetAmount())
            .paidAmount(invoice.getPaidAmount())
            .balanceAmount(invoice.getBalanceAmount())
            .paymentType(invoice.getPaymentType() != null ? invoice.getPaymentType().toString() : null)
            .paymentStatus(paymentStatus)
            .referenceNo(invoice.getReferenceNo())
            .notes(invoice.getNotes())
            .isReturned(invoice.getIsReturned())
            .items(itemResponses);

        if (invoice.getCreatedAt() != null) {
            builder.createdAt(invoice.getCreatedAt().toLocalDate());
        }
        if (invoice.getUpdatedAt() != null) {
            builder.updatedAt(invoice.getUpdatedAt().toLocalDate());
        }

        return builder.build();
    }
}