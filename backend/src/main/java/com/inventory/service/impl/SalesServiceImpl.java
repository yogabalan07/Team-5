package com.inventory.service.impl;

import com.inventory.dto.request.SalesInvoiceRequest;
import com.inventory.dto.response.SalesInvoiceResponse;
import com.inventory.enums.PaymentType;
import com.inventory.enums.TransactionType;
import com.inventory.exception.BusinessException;
import com.inventory.exception.ResourceNotFoundException;
import com.inventory.model.*;
import com.inventory.repository.*;
import com.inventory.service.SalesService;
import com.inventory.util.InvoiceGenerator;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class SalesServiceImpl implements SalesService {

    private static final Logger logger = LoggerFactory.getLogger(SalesServiceImpl.class);

    @Autowired
    private SalesInvoiceRepository salesInvoiceRepository;

    @Autowired
    private SalesInvoiceItemRepository salesInvoiceItemRepository;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private ItemRepository itemRepository;

    @Autowired
    private StockTransactionRepository stockTransactionRepository;

    @Autowired
    private InvoiceGenerator invoiceGenerator;

    @Override
    public SalesInvoiceResponse createSalesInvoice(SalesInvoiceRequest request) {
        // Validate customer
        Customer customer = customerRepository.findById(request.getCustomerId())
            .orElseThrow(() -> new ResourceNotFoundException("Customer not found with id: " + request.getCustomerId()));

        // Check customer credit limit if credit sale
        if ("CREDIT".equalsIgnoreCase(request.getPaymentType())) {
            BigDecimal totalAmount = calculateTotalAmount(request);
            if (customer.getCreditLimit().compareTo(BigDecimal.ZERO) > 0) {
                BigDecimal newBalance = customer.getCreditBalance().add(totalAmount);
                if (newBalance.compareTo(customer.getCreditLimit()) > 0) {
                    throw new BusinessException("Customer credit limit exceeded. Current balance: " + 
                        customer.getCreditBalance() + ", Limit: " + customer.getCreditLimit());
                }
            }
        }

        // Create invoice
        SalesInvoice invoice = new SalesInvoice();
        
        // Generate invoice number
        int maxNumber = salesInvoiceRepository.getMaxInvoiceNumber("INV-");
        String invoiceNo = invoiceGenerator.generateSalesInvoiceNumber(maxNumber + 1);
        invoice.setInvoiceNo(invoiceNo);
        invoice.setInvoiceDate(request.getInvoiceDate() != null ? request.getInvoiceDate() : LocalDate.now());
        invoice.setCustomer(customer);
        
        // Set payment type and payment mode
        PaymentType paymentType = PaymentType.valueOf(request.getPaymentType().toUpperCase());
        invoice.setPaymentType(paymentType);
        invoice.setPaymentMode(request.getPaymentType().toUpperCase());
        
        invoice.setReferenceNo(request.getReferenceNo());
        invoice.setNotes(request.getNotes());
        invoice.setIsReturned(false);

        // Process items
        List<SalesInvoiceItem> items = new ArrayList<>();
        BigDecimal totalAmount = BigDecimal.ZERO;
        BigDecimal totalTax = BigDecimal.ZERO;
        BigDecimal totalDiscount = BigDecimal.ZERO;

        for (SalesInvoiceRequest.SalesInvoiceItemRequest itemReq : request.getItems()) {
            Item item = itemRepository.findById(itemReq.getItemId())
                .orElseThrow(() -> new ResourceNotFoundException("Item not found: " + itemReq.getItemId()));

            // Check stock availability
            if (item.getCurrentStock().compareTo(itemReq.getQuantity()) < 0) {
                throw new BusinessException("Insufficient stock for item: " + item.getName() + 
                    ". Available: " + item.getCurrentStock() + ", Requested: " + itemReq.getQuantity());
            }

            SalesInvoiceItem invoiceItem = new SalesInvoiceItem();
            invoiceItem.setInvoice(invoice);
            invoiceItem.setItem(item);
            invoiceItem.setQuantity(itemReq.getQuantity());
            invoiceItem.setUnitPrice(itemReq.getUnitPrice());
            invoiceItem.setDiscountPercent(itemReq.getDiscountPercent() != null ? itemReq.getDiscountPercent() : BigDecimal.ZERO);
            
            BigDecimal taxPercent = itemReq.getTaxPercent();
            if (taxPercent == null && item.getTax() != null) {
                taxPercent = item.getTax().getTaxPercentage();
            }
            if (taxPercent == null) {
                taxPercent = BigDecimal.ZERO;
            }
            invoiceItem.setTaxPercent(taxPercent);

            // Calculate amounts
            BigDecimal lineTotal = itemReq.getUnitPrice().multiply(itemReq.getQuantity());
            BigDecimal discountAmount = lineTotal.multiply(invoiceItem.getDiscountPercent())
                .divide(new BigDecimal(100), 2, RoundingMode.HALF_UP);
            BigDecimal afterDiscount = lineTotal.subtract(discountAmount);
            BigDecimal taxAmount = afterDiscount.multiply(taxPercent)
                .divide(new BigDecimal(100), 2, RoundingMode.HALF_UP);
            BigDecimal lineNetTotal = afterDiscount.add(taxAmount);

            invoiceItem.setTotalAmount(lineNetTotal);
            
            items.add(invoiceItem);
            totalAmount = totalAmount.add(lineTotal);
            totalTax = totalTax.add(taxAmount);
            totalDiscount = totalDiscount.add(discountAmount);

            // Update stock
            BigDecimal previousStock = item.getCurrentStock();
            BigDecimal newStock = previousStock.subtract(itemReq.getQuantity());
            item.setCurrentStock(newStock);
            itemRepository.save(item);

            // Create stock transaction
            StockTransaction stockTransaction = new StockTransaction();
            stockTransaction.setItem(item);
            stockTransaction.setTransactionType(TransactionType.SALES);
            stockTransaction.setReferenceNo(invoiceNo);
            stockTransaction.setReferenceId(invoice.getId());
            stockTransaction.setQuantity(itemReq.getQuantity().negate());
            stockTransaction.setPreviousStock(previousStock);
            stockTransaction.setNewStock(newStock);
            stockTransaction.setUnitPrice(itemReq.getUnitPrice());
            stockTransactionRepository.save(stockTransaction);
        }

        // Calculate totals
        BigDecimal netAmount = totalAmount.subtract(totalDiscount).add(totalTax);
        
        invoice.setTotalAmount(totalAmount);
        invoice.setDiscountAmount(totalDiscount);
        invoice.setTaxAmount(totalTax);
        invoice.setNetAmount(netAmount);
        
        // Handle payment
        if (invoice.getPaymentType() == PaymentType.CASH) {
            invoice.setPaidAmount(netAmount);
            invoice.setBalanceAmount(BigDecimal.ZERO);
        } else {
            invoice.setPaidAmount(BigDecimal.ZERO);
            invoice.setBalanceAmount(netAmount);
            // Update customer credit balance
            customer.setCreditBalance(customer.getCreditBalance().add(netAmount));
            customerRepository.save(customer);
        }

        invoice.setItems(items);
        SalesInvoice saved = salesInvoiceRepository.save(invoice);
        
        // Save invoice items
        for (SalesInvoiceItem item : items) {
            item.setInvoice(saved);
            salesInvoiceItemRepository.save(item);
        }
        
        return convertToResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public SalesInvoiceResponse getSalesInvoiceByInvoiceNo(String invoiceNo) {
        try {
            logger.info("📄 Fetching invoice with invoice number: {}", invoiceNo);
            SalesInvoice invoice = salesInvoiceRepository.findByInvoiceNo(invoiceNo)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice not found: " + invoiceNo));
            
            initializeInvoiceDataSafely(invoice);
            return convertToResponse(invoice);
        } catch (Exception e) {
            logger.error("❌ Error fetching invoice by invoiceNo {}: {}", invoiceNo, e.getMessage(), e);
            throw e;
        }
    }

    @Override
    @Transactional(readOnly = true)
    public SalesInvoiceResponse getSalesInvoiceById(Long id) {
        try {
            logger.info("📄 Fetching sales invoice with ID: {}", id);
            
            SalesInvoice invoice = salesInvoiceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice not found with id: " + id));
            
            initializeInvoiceDataSafely(invoice);
            return convertToResponse(invoice);
            
        } catch (ResourceNotFoundException e) {
            logger.warn("⚠️ Invoice not found with ID: {}", id);
            throw e;
        } catch (Exception e) {
            logger.error("❌ Error fetching invoice {}: {}", id, e.getMessage(), e);
            throw new RuntimeException("Failed to fetch invoice: " + e.getMessage());
        }
    }

    /**
     * Safely initialize lazy-loaded collections
     */
    private void initializeInvoiceDataSafely(SalesInvoice invoice) {
        if (invoice == null) return;
        
        try {
            // Safely initialize customer
            if (invoice.getCustomer() != null) {
                Customer customer = invoice.getCustomer();
                customer.getId();
                customer.getName();
                customer.getPhone();
                logger.debug("✅ Customer initialized: {}", customer.getName());
            }
        } catch (Exception e) {
            logger.warn("⚠️ Could not initialize customer: {}", e.getMessage());
        }
        
        try {
            // Safely initialize items
            if (invoice.getItems() != null) {
                invoice.getItems().size();
                for (SalesInvoiceItem item : invoice.getItems()) {
                    if (item.getItem() != null) {
                        item.getItem().getId();
                        item.getItem().getName();
                    }
                }
                logger.debug("✅ Items initialized: {} items", invoice.getItems().size());
            }
        } catch (Exception e) {
            logger.warn("⚠️ Could not initialize items: {}", e.getMessage());
        }
    }

    @Override
    public Page<SalesInvoiceResponse> getAllSalesInvoices(Pageable pageable) {
        return salesInvoiceRepository.findAll(pageable)
            .map(this::convertToResponse);
    }

    @Override
    public Page<SalesInvoiceResponse> getSalesInvoicesByDateRange(String startDate, String endDate, Pageable pageable) {
        LocalDate start = LocalDate.parse(startDate, DateTimeFormatter.ISO_LOCAL_DATE);
        LocalDate end = LocalDate.parse(endDate, DateTimeFormatter.ISO_LOCAL_DATE);
        return salesInvoiceRepository.findByDateRange(start, end, pageable)
            .map(this::convertToResponse);
    }

    @Override
    public Page<SalesInvoiceResponse> getSalesInvoicesByCustomer(Long customerId, Pageable pageable) {
        if (!customerRepository.existsById(customerId)) {
            throw new ResourceNotFoundException("Customer not found with id: " + customerId);
        }
        
        List<SalesInvoice> allInvoices = salesInvoiceRepository.findByCustomerId(customerId);
        
        int start = (int) pageable.getOffset();
        int end = Math.min((start + pageable.getPageSize()), allInvoices.size());
        List<SalesInvoice> pagedInvoices = allInvoices.subList(start, end);
        
        List<SalesInvoiceResponse> responses = pagedInvoices.stream()
            .map(this::convertToResponse)
            .collect(Collectors.toList());
        
        return new PageImpl<>(responses, pageable, allInvoices.size());
    }

    @Override
    public SalesInvoiceResponse updateSalesInvoice(Long id, SalesInvoiceRequest request) {
        SalesInvoice invoice = salesInvoiceRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Invoice not found with id: " + id));
        
        if (invoice.getIsReturned()) {
            throw new BusinessException("Cannot update a returned invoice");
        }

        invoice.setInvoiceDate(request.getInvoiceDate() != null ? request.getInvoiceDate() : invoice.getInvoiceDate());
        invoice.setNotes(request.getNotes());
        invoice.setReferenceNo(request.getReferenceNo());

        if (request.getPaymentType() != null) {
            PaymentType oldPaymentType = invoice.getPaymentType();
            PaymentType newPaymentType = PaymentType.valueOf(request.getPaymentType().toUpperCase());
            
            if (oldPaymentType != newPaymentType) {
                invoice.setPaymentMode(request.getPaymentType().toUpperCase());
                
                if (newPaymentType == PaymentType.CASH) {
                    invoice.setPaidAmount(invoice.getNetAmount());
                    invoice.setBalanceAmount(BigDecimal.ZERO);
                    
                    Customer customer = invoice.getCustomer();
                    customer.setCreditBalance(customer.getCreditBalance().subtract(invoice.getNetAmount()));
                    customerRepository.save(customer);
                } else if (newPaymentType == PaymentType.CREDIT) {
                    invoice.setPaidAmount(BigDecimal.ZERO);
                    invoice.setBalanceAmount(invoice.getNetAmount());
                    
                    Customer customer = invoice.getCustomer();
                    customer.setCreditBalance(customer.getCreditBalance().add(invoice.getNetAmount()));
                    customerRepository.save(customer);
                }
                invoice.setPaymentType(newPaymentType);
            }
        }

        SalesInvoice updated = salesInvoiceRepository.save(invoice);
        return convertToResponse(updated);
    }

    @Override
    @Transactional
    public void deleteSalesInvoice(Long id) {
        try {
            logger.info("🗑️ Attempting to delete sales invoice with ID: {}", id);
            
            SalesInvoice invoice = salesInvoiceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Sales invoice not found with id: " + id));
            
            if (invoice.getIsReturned()) {
                throw new BusinessException("Cannot delete a returned invoice");
            }

            // Reverse stock updates
            for (SalesInvoiceItem item : invoice.getItems()) {
                Item inventoryItem = item.getItem();
                BigDecimal oldStock = inventoryItem.getCurrentStock();
                BigDecimal newStock = oldStock.add(item.getQuantity());
                inventoryItem.setCurrentStock(newStock);
                itemRepository.save(inventoryItem);
                
                StockTransaction stockTransaction = new StockTransaction();
                stockTransaction.setItem(inventoryItem);
                stockTransaction.setTransactionType(TransactionType.RETURN_IN);
                stockTransaction.setReferenceNo("DEL-" + invoice.getInvoiceNo());
                stockTransaction.setQuantity(item.getQuantity());
                stockTransaction.setPreviousStock(oldStock);
                stockTransaction.setNewStock(newStock);
                stockTransaction.setUnitPrice(item.getUnitPrice());
                stockTransactionRepository.save(stockTransaction);
                
                logger.debug("📦 Stock restored for item: {} | Previous: {} | Restored: {} | New: {}", 
                    inventoryItem.getName(), oldStock, item.getQuantity(), newStock);
            }

            // Reverse credit balance if credit sale
            if (invoice.getPaymentType() == PaymentType.CREDIT) {
                Customer customer = invoice.getCustomer();
                BigDecimal oldBalance = customer.getCreditBalance();
                BigDecimal newBalance = oldBalance.subtract(invoice.getNetAmount());
                customer.setCreditBalance(newBalance);
                customerRepository.save(customer);
                logger.debug("💳 Credit balance updated for customer: {} | Old: {} | New: {}", 
                    customer.getName(), oldBalance, newBalance);
            }

            salesInvoiceItemRepository.deleteAll(invoice.getItems());
            salesInvoiceRepository.delete(invoice);
            logger.info("✅ Sales invoice deleted: {} - {}", id, invoice.getInvoiceNo());
            
        } catch (Exception e) {
            logger.error("❌ Error deleting sales invoice: {}", e.getMessage(), e);
            throw new BusinessException("Cannot delete invoice: " + e.getMessage());
        }
    }

    private BigDecimal calculateTotalAmount(SalesInvoiceRequest request) {
        BigDecimal total = BigDecimal.ZERO;
        for (SalesInvoiceRequest.SalesInvoiceItemRequest item : request.getItems()) {
            total = total.add(item.getUnitPrice().multiply(item.getQuantity()));
        }
        return total;
    }

    /**
     * Safely convert invoice to response with null handling
     */
    private SalesInvoiceResponse convertToResponse(SalesInvoice invoice) {
        try {
            logger.debug("🔄 Converting invoice {} to response", invoice.getId());
            
            List<SalesInvoiceResponse.SalesInvoiceItemResponse> itemResponses = new ArrayList<>();
            if (invoice.getItems() != null && !invoice.getItems().isEmpty()) {
                for (SalesInvoiceItem item : invoice.getItems()) {
                    try {
                        String itemName = "Unknown Item";
                        String itemCode = null;
                        Long itemId = null;
                        
                        if (item.getItem() != null) {
                            try {
                                itemId = item.getItem().getId();
                                itemName = item.getItem().getName() != null ? 
                                    item.getItem().getName() : "Unknown Item";
                                itemCode = item.getItem().getCode();
                            } catch (Exception e) {
                                logger.warn("⚠️ Could not get item details: {}", e.getMessage());
                            }
                        }
                        
                        itemResponses.add(
                            SalesInvoiceResponse.SalesInvoiceItemResponse.builder()
                                .id(item.getId())
                                .itemId(itemId)
                                .itemName(itemName)
                                .itemCode(itemCode)
                                .quantity(item.getQuantity() != null ? item.getQuantity() : BigDecimal.ZERO)
                                .unitPrice(item.getUnitPrice() != null ? item.getUnitPrice() : BigDecimal.ZERO)
                                .discountPercent(item.getDiscountPercent() != null ? item.getDiscountPercent() : BigDecimal.ZERO)
                                .taxPercent(item.getTaxPercent() != null ? item.getTaxPercent() : BigDecimal.ZERO)
                                .totalAmount(item.getTotalAmount() != null ? item.getTotalAmount() : BigDecimal.ZERO)
                                .build()
                        );
                    } catch (Exception e) {
                        logger.warn("⚠️ Could not convert invoice item: {}", e.getMessage());
                    }
                }
            }

            // Safely get customer details
            String customerName = "Unknown Customer";
            String customerPhone = null;
            Long customerId = null;
            
            try {
                if (invoice.getCustomer() != null) {
                    Customer customer = invoice.getCustomer();
                    customerId = customer.getId();
                    customerName = customer.getName() != null ? customer.getName() : "Unknown Customer";
                    customerPhone = customer.getPhone();
                }
            } catch (Exception e) {
                logger.warn("⚠️ Could not get customer details: {}", e.getMessage());
            }

            return SalesInvoiceResponse.builder()
                .id(invoice.getId())
                .invoiceNo(invoice.getInvoiceNo() != null ? invoice.getInvoiceNo() : "Unknown")
                .invoiceDate(invoice.getInvoiceDate() != null ? invoice.getInvoiceDate() : LocalDate.now())
                .customerId(customerId)
                .customerName(customerName)
                .customerPhone(customerPhone)
                .totalAmount(invoice.getTotalAmount() != null ? invoice.getTotalAmount() : BigDecimal.ZERO)
                .discountAmount(invoice.getDiscountAmount() != null ? invoice.getDiscountAmount() : BigDecimal.ZERO)
                .taxAmount(invoice.getTaxAmount() != null ? invoice.getTaxAmount() : BigDecimal.ZERO)
                .netAmount(invoice.getNetAmount() != null ? invoice.getNetAmount() : BigDecimal.ZERO)
                .paidAmount(invoice.getPaidAmount() != null ? invoice.getPaidAmount() : BigDecimal.ZERO)
                .balanceAmount(invoice.getBalanceAmount() != null ? invoice.getBalanceAmount() : BigDecimal.ZERO)
                .paymentType(invoice.getPaymentType() != null ? invoice.getPaymentType().toString() : null)
                .paymentMode(invoice.getPaymentMode())
                .referenceNo(invoice.getReferenceNo())
                .notes(invoice.getNotes())
                .isReturned(invoice.getIsReturned() != null ? invoice.getIsReturned() : false)
                .createdBy(invoice.getCreatedBy() != null ? invoice.getCreatedBy().getUsername() : null)
                .createdAt(invoice.getCreatedAt() != null ? invoice.getCreatedAt() : LocalDateTime.now())
                .items(itemResponses)
                .build();
                
        } catch (Exception e) {
            logger.error("❌ Error converting invoice to response: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to convert invoice data: " + e.getMessage());
        }
    }
}
