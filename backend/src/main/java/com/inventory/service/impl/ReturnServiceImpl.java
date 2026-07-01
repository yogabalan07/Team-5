package com.inventory.service.impl;

import com.inventory.dto.request.PurchaseReturnRequest;
import com.inventory.dto.request.SalesReturnRequest;
import com.inventory.dto.response.PurchaseReturnResponse;
import com.inventory.dto.response.SalesReturnResponse;
import com.inventory.enums.TransactionType;
import com.inventory.exception.BusinessException;
import com.inventory.exception.ResourceNotFoundException;
import com.inventory.model.*;
import com.inventory.repository.*;
import com.inventory.service.ReturnService;
import com.inventory.util.InvoiceGenerator;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class ReturnServiceImpl implements ReturnService {

    @Autowired
    private SalesReturnRepository salesReturnRepository;

    @Autowired
    private SalesInvoiceRepository salesInvoiceRepository;

    @Autowired
    private SalesInvoiceItemRepository salesInvoiceItemRepository;

    @Autowired
    private PurchaseReturnRepository purchaseReturnRepository;

    @Autowired
    private PurchaseInvoiceRepository purchaseInvoiceRepository;

    @Autowired
    private PurchaseInvoiceItemRepository purchaseInvoiceItemRepository;

    @Autowired
    private ItemRepository itemRepository;

    @Autowired
    private StockTransactionRepository stockTransactionRepository;

    @Autowired
    private InvoiceGenerator invoiceGenerator;

    // ==================== SALES RETURN METHODS ====================

    @Override
    public SalesReturnResponse createSalesReturn(SalesReturnRequest request) {
        // Get the original invoice
        SalesInvoice invoice = salesInvoiceRepository.findByInvoiceNo(request.getInvoiceNo())
            .orElseThrow(() -> new ResourceNotFoundException("Invoice not found: " + request.getInvoiceNo()));

        if (invoice.getIsReturned()) {
            throw new BusinessException("This invoice has already been returned");
        }

        // Create sales return
        SalesReturn salesReturn = new SalesReturn();
        
        // Generate return number from database
        String returnNo = generateSalesReturnNumber();
        salesReturn.setReturnNo(returnNo);
        salesReturn.setInvoice(invoice);
        salesReturn.setCustomer(invoice.getCustomer());
        salesReturn.setReturnDate(request.getReturnDate() != null ? request.getReturnDate() : LocalDate.now());
        salesReturn.setNotes(request.getNotes());

        List<SalesReturnItem> returnItems = new ArrayList<>();
        BigDecimal totalReturnAmount = BigDecimal.ZERO;

        // Process each return item
        for (SalesReturnRequest.SalesReturnItemRequest itemReq : request.getItems()) {
            // Find the original invoice item
            SalesInvoiceItem invoiceItem = salesInvoiceItemRepository.findById(itemReq.getInvoiceItemId())
                .orElseThrow(() -> new ResourceNotFoundException("Invoice item not found"));

            Item item = invoiceItem.getItem();

            // Check if return quantity is valid
            if (itemReq.getQuantity().compareTo(invoiceItem.getQuantity()) > 0) {
                throw new BusinessException("Return quantity cannot exceed original quantity for item: " + item.getName());
            }

            // Create return item
            SalesReturnItem returnItem = new SalesReturnItem();
            returnItem.setSalesReturn(salesReturn);
            returnItem.setItem(item);
            returnItem.setQuantity(itemReq.getQuantity());
            returnItem.setUnitPrice(invoiceItem.getUnitPrice());
            
            BigDecimal itemTotal = itemReq.getQuantity().multiply(invoiceItem.getUnitPrice());
            returnItem.setTotalAmount(itemTotal);
            returnItems.add(returnItem);
            totalReturnAmount = totalReturnAmount.add(itemTotal);

            // Update stock - add back to inventory
            BigDecimal oldStock = item.getCurrentStock();
            BigDecimal newStock = oldStock.add(itemReq.getQuantity());
            item.setCurrentStock(newStock);
            itemRepository.save(item);

            // Record stock transaction
            StockTransaction stockTransaction = new StockTransaction();
            stockTransaction.setItem(item);
            stockTransaction.setTransactionType(TransactionType.RETURN_IN);
            stockTransaction.setReferenceNo(returnNo);
            stockTransaction.setQuantity(itemReq.getQuantity());
            stockTransaction.setPreviousStock(oldStock);
            stockTransaction.setNewStock(newStock);
            stockTransaction.setUnitPrice(invoiceItem.getUnitPrice());
            stockTransactionRepository.save(stockTransaction);
        }

        salesReturn.setTotalReturnAmount(totalReturnAmount);
        salesReturn.setItems(returnItems);

        // Update invoice
        invoice.setIsReturned(true);
        salesInvoiceRepository.save(invoice);

        SalesReturn saved = salesReturnRepository.save(salesReturn);
        return convertToResponse(saved);
    }

    private String generateSalesReturnNumber() {
        String todayPrefix = "RET-" + LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        Integer maxNumber = salesReturnRepository.getMaxReturnNumber(todayPrefix);
        
        if (maxNumber == null) {
            maxNumber = 0;
        }
        
        int nextNumber = maxNumber + 1;
        return todayPrefix + "-" + String.format("%06d", nextNumber);
    }

    @Override
    public SalesReturnResponse getSalesReturnByReturnNo(String returnNo) {
        SalesReturn salesReturn = salesReturnRepository.findByReturnNo(returnNo)
            .orElseThrow(() -> new ResourceNotFoundException("Return not found: " + returnNo));
        return convertToResponse(salesReturn);
    }

    @Override
    public List<SalesReturnResponse> getSalesReturnsByInvoice(String invoiceNo) {
        SalesInvoice invoice = salesInvoiceRepository.findByInvoiceNo(invoiceNo)
            .orElseThrow(() -> new ResourceNotFoundException("Invoice not found: " + invoiceNo));
        
        return salesReturnRepository.findByInvoiceId(invoice.getId())
            .stream()
            .map(this::convertToResponse)
            .collect(Collectors.toList());
    }

    // ==================== PURCHASE RETURN METHODS ====================

    @Override
    public PurchaseReturnResponse createPurchaseReturn(PurchaseReturnRequest request) {
        // Get the original invoice
        PurchaseInvoice invoice = purchaseInvoiceRepository.findByInvoiceNo(request.getInvoiceNo())
            .orElseThrow(() -> new ResourceNotFoundException("Purchase Invoice not found: " + request.getInvoiceNo()));

        if (invoice.getIsReturned()) {
            throw new BusinessException("This purchase invoice has already been returned");
        }

        // Create purchase return
        PurchaseReturn purchaseReturn = new PurchaseReturn();
        
        // Generate return number from database
        String returnNo = generatePurchaseReturnNumber();
        purchaseReturn.setReturnNo(returnNo);
        purchaseReturn.setPurchaseInvoice(invoice);
        purchaseReturn.setSupplier(invoice.getSupplier());
        purchaseReturn.setReturnDate(request.getReturnDate() != null ? request.getReturnDate() : LocalDate.now());
        purchaseReturn.setNotes(request.getNotes());

        List<PurchaseReturnItem> returnItems = new ArrayList<>();
        BigDecimal totalReturnAmount = BigDecimal.ZERO;

        for (PurchaseReturnRequest.PurchaseReturnItemRequest itemReq : request.getItems()) {
            Item item = itemRepository.findById(itemReq.getItemId())
                .orElseThrow(() -> new ResourceNotFoundException("Item not found: " + itemReq.getItemId()));

            // Check if return quantity is valid
            PurchaseInvoiceItem purchaseItem = purchaseInvoiceItemRepository
                .findByPurchaseInvoiceIdAndItemId(invoice.getId(), item.getId())
                .stream()
                .findFirst()
                .orElse(null);

            if (purchaseItem != null && itemReq.getQuantity().compareTo(purchaseItem.getReceivedQuantity()) > 0) {
                throw new BusinessException("Return quantity cannot exceed purchased quantity for item: " + item.getName());
            }

            PurchaseReturnItem returnItem = new PurchaseReturnItem();
            returnItem.setPurchaseReturn(purchaseReturn);
            returnItem.setItem(item);
            returnItem.setQuantity(itemReq.getQuantity());
            returnItem.setUnitPrice(itemReq.getUnitPrice());
            
            BigDecimal itemTotal = itemReq.getQuantity().multiply(itemReq.getUnitPrice());
            returnItem.setTotalAmount(itemTotal);
            returnItems.add(returnItem);
            totalReturnAmount = totalReturnAmount.add(itemTotal);

            // Update stock - remove from inventory
            BigDecimal oldStock = item.getCurrentStock();
            BigDecimal newStock = oldStock.subtract(itemReq.getQuantity());
            item.setCurrentStock(newStock);
            itemRepository.save(item);

            // Record stock transaction
            StockTransaction stockTransaction = new StockTransaction();
            stockTransaction.setItem(item);
            stockTransaction.setTransactionType(TransactionType.RETURN_OUT);
            stockTransaction.setReferenceNo(returnNo);
            stockTransaction.setQuantity(itemReq.getQuantity().negate());
            stockTransaction.setPreviousStock(oldStock);
            stockTransaction.setNewStock(newStock);
            stockTransaction.setUnitPrice(itemReq.getUnitPrice());
            stockTransactionRepository.save(stockTransaction);
        }

        purchaseReturn.setTotalReturnAmount(totalReturnAmount);
        purchaseReturn.setItems(returnItems);

        // Update invoice
        invoice.setIsReturned(true);
        purchaseInvoiceRepository.save(invoice);

        PurchaseReturn saved = purchaseReturnRepository.save(purchaseReturn);
        return convertToResponse(saved);
    }

    private String generatePurchaseReturnNumber() {
        String todayPrefix = "PUR-RET-" + LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        Integer maxNumber = purchaseReturnRepository.getMaxReturnNumber(todayPrefix);
        
        if (maxNumber == null) {
            maxNumber = 0;
        }
        
        int nextNumber = maxNumber + 1;
        return todayPrefix + "-" + String.format("%06d", nextNumber);
    }

    @Override
    public PurchaseReturnResponse getPurchaseReturnByReturnNo(String returnNo) {
        PurchaseReturn purchaseReturn = purchaseReturnRepository.findByReturnNo(returnNo)
            .orElseThrow(() -> new ResourceNotFoundException("Return not found: " + returnNo));
        return convertToResponse(purchaseReturn);
    }

    @Override
    public List<PurchaseReturnResponse> getPurchaseReturnsByInvoice(String invoiceNo) {
        PurchaseInvoice invoice = purchaseInvoiceRepository.findByInvoiceNo(invoiceNo)
            .orElseThrow(() -> new ResourceNotFoundException("Invoice not found: " + invoiceNo));
        
        return purchaseReturnRepository.findByInvoiceId(invoice.getId())
            .stream()
            .map(this::convertToResponse)
            .collect(Collectors.toList());
    }

    // ==================== CONVERSION METHODS ====================

    private SalesReturnResponse convertToResponse(SalesReturn salesReturn) {
        List<SalesReturnResponse.SalesReturnItemResponse> itemResponses = new ArrayList<>();
        if (salesReturn.getItems() != null) {
            for (SalesReturnItem item : salesReturn.getItems()) {
                itemResponses.add(
                    SalesReturnResponse.SalesReturnItemResponse.builder()
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

        return SalesReturnResponse.builder()
            .id(salesReturn.getId())
            .returnNo(salesReturn.getReturnNo())
            .returnDate(salesReturn.getReturnDate())
            .invoiceNo(salesReturn.getInvoice().getInvoiceNo())
            .customerName(salesReturn.getCustomer().getName())
            .totalReturnAmount(salesReturn.getTotalReturnAmount())
            .notes(salesReturn.getNotes())
            .createdAt(salesReturn.getCreatedAt())
            .items(itemResponses)
            .build();
    }

    private PurchaseReturnResponse convertToResponse(PurchaseReturn purchaseReturn) {
        List<PurchaseReturnResponse.PurchaseReturnItemResponse> itemResponses = new ArrayList<>();
        if (purchaseReturn.getItems() != null) {
            for (PurchaseReturnItem item : purchaseReturn.getItems()) {
                itemResponses.add(
                    PurchaseReturnResponse.PurchaseReturnItemResponse.builder()
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

        return PurchaseReturnResponse.builder()
            .id(purchaseReturn.getId())
            .returnNo(purchaseReturn.getReturnNo())
            .returnDate(purchaseReturn.getReturnDate())
            .invoiceNo(purchaseReturn.getPurchaseInvoice().getInvoiceNo())
            .supplierName(purchaseReturn.getSupplier().getName())
            .totalReturnAmount(purchaseReturn.getTotalReturnAmount())
            .notes(purchaseReturn.getNotes())
            .createdAt(purchaseReturn.getCreatedAt())
            .items(itemResponses)
            .build();
    }
}