package com.inventory.service;

import com.inventory.dto.request.BillReceiptRequest;
import com.inventory.dto.request.BillPaymentRequest;
import com.inventory.dto.response.BillReceiptResponse;
import com.inventory.dto.response.BillPaymentResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Map;

public interface AccountService {
    // Bill Receipt methods
    BillReceiptResponse createBillReceipt(BillReceiptRequest request);
    BillReceiptResponse getBillReceiptByReceiptNo(String receiptNo);
    Page<BillReceiptResponse> getAllBillReceipts(Pageable pageable);
    Page<BillReceiptResponse> getBillReceiptsByDateRange(String startDate, String endDate, Pageable pageable);
    List<BillReceiptResponse> getBillReceiptsByCustomer(Long customerId);

    // Bill Payment methods
    BillPaymentResponse createBillPayment(BillPaymentRequest request);
    BillPaymentResponse getBillPaymentByPaymentNo(String paymentNo);
    Page<BillPaymentResponse> getAllBillPayments(Pageable pageable);
    Page<BillPaymentResponse> getBillPaymentsByDateRange(String startDate, String endDate, Pageable pageable);
    List<BillPaymentResponse> getBillPaymentsBySupplier(Long supplierId);

    // Ledger methods
    List<Map<String, Object>> getCustomerLedger(Long customerId);
    List<Map<String, Object>> getSupplierLedger(Long supplierId);
}