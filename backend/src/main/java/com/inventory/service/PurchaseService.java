package com.inventory.service;

import com.inventory.dto.request.PurchaseInvoiceRequest;
import com.inventory.dto.request.PurchaseOrderRequest;
import com.inventory.dto.response.PurchaseInvoiceResponse;
import com.inventory.dto.response.PurchaseOrderResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

public interface PurchaseService {

    // ==================== PURCHASE ORDER METHODS ====================

    PurchaseOrderResponse createPurchaseOrder(PurchaseOrderRequest request);

    PurchaseOrderResponse getPurchaseOrderById(Long id);

    PurchaseOrderResponse getPurchaseOrderByPoNumber(String poNumber);

    Page<PurchaseOrderResponse> getAllPurchaseOrders(Pageable pageable);

    Page<PurchaseOrderResponse> getPurchaseOrdersBySupplier(Long supplierId, Pageable pageable);

    Page<PurchaseOrderResponse> getPurchaseOrdersByDateRange(String startDate, String endDate, Pageable pageable);

    Page<PurchaseOrderResponse> getPurchaseOrdersByDateRange(LocalDate startDate, LocalDate endDate, Pageable pageable);

    Page<PurchaseOrderResponse> searchPurchaseOrders(String keyword, Pageable pageable);

    Page<PurchaseOrderResponse> getPurchaseOrdersByStatus(String status, Pageable pageable);

    Page<PurchaseOrderResponse> getPendingPurchaseOrders(Pageable pageable);

    Page<PurchaseOrderResponse> getConvertedPurchaseOrders(Pageable pageable);

    long getPendingPurchaseOrderCount();

    long getPurchaseOrderCount();

    List<PurchaseOrderResponse> getRecentPurchaseOrders(int limit);

    PurchaseOrderResponse updatePurchaseOrder(Long id, PurchaseOrderRequest request);

    PurchaseOrderResponse convertPurchaseOrderToInvoice(Long poId);

    void deletePurchaseOrder(Long id);

    void deleteMultiplePurchaseOrders(List<Long> ids);

    byte[] exportPurchaseOrdersToCSV(LocalDate startDate, LocalDate endDate);

    Map<String, Object> getPurchaseOrderSummary();

    Map<String, Object> getMonthlyPurchaseOrderStatistics(int year);

    // ==================== PURCHASE INVOICE METHODS ====================

    PurchaseInvoiceResponse createPurchaseInvoice(PurchaseInvoiceRequest request);

    PurchaseInvoiceResponse getPurchaseInvoiceById(Long id);

    PurchaseInvoiceResponse getPurchaseInvoiceByInvoiceNo(String invoiceNo);

    Page<PurchaseInvoiceResponse> getAllPurchaseInvoices(Pageable pageable);

    Page<PurchaseInvoiceResponse> getPurchaseInvoicesByDateRange(String startDate, String endDate, String dateType, Pageable pageable);

    Page<PurchaseInvoiceResponse> getPurchaseInvoicesBySupplier(Long supplierId, Pageable pageable);

    Page<PurchaseInvoiceResponse> getPurchaseInvoicesByPaymentStatus(String paymentStatus, Pageable pageable);

    Page<PurchaseInvoiceResponse> searchPurchaseInvoices(String keyword, Pageable pageable);

    PurchaseInvoiceResponse updatePurchaseInvoice(Long id, PurchaseInvoiceRequest request);

    void deletePurchaseInvoice(Long id);

    PurchaseInvoiceResponse makePayment(Long invoiceId, BigDecimal amount);

    BigDecimal getTotalPurchasesBySupplier(Long supplierId);

    Map<String, Object> getPurchaseInvoiceSummary();
}