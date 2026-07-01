package com.inventory.controller;

import com.inventory.dto.request.BillReceiptRequest;
import com.inventory.dto.request.BillPaymentRequest;
import com.inventory.dto.response.BillReceiptResponse;
import com.inventory.dto.response.BillPaymentResponse;
import com.inventory.service.AccountService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/accounts")
public class AccountController {

    @Autowired
    private AccountService accountService;

    // Bill Receipt endpoints
    @PostMapping("/receipt")
    @PreAuthorize("hasAnyRole('ADMIN', 'ACCOUNTS')")
    public ResponseEntity<BillReceiptResponse> createBillReceipt(@Valid @RequestBody BillReceiptRequest request) {
        return ResponseEntity.ok(accountService.createBillReceipt(request));
    }

    @GetMapping("/receipt/{receiptNo}")
    public ResponseEntity<BillReceiptResponse> getBillReceiptByReceiptNo(@PathVariable String receiptNo) {
        return ResponseEntity.ok(accountService.getBillReceiptByReceiptNo(receiptNo));
    }

    @GetMapping("/receipts")
    public ResponseEntity<Page<BillReceiptResponse>> getAllBillReceipts(Pageable pageable) {
        return ResponseEntity.ok(accountService.getAllBillReceipts(pageable));
    }

    @GetMapping("/receipts/date-range")
    public ResponseEntity<Page<BillReceiptResponse>> getBillReceiptsByDateRange(
            @RequestParam String startDate,
            @RequestParam String endDate,
            Pageable pageable) {
        return ResponseEntity.ok(accountService.getBillReceiptsByDateRange(startDate, endDate, pageable));
    }

    @GetMapping("/receipts/customer/{customerId}")
    public ResponseEntity<List<BillReceiptResponse>> getBillReceiptsByCustomer(@PathVariable Long customerId) {
        return ResponseEntity.ok(accountService.getBillReceiptsByCustomer(customerId));
    }

    // Bill Payment endpoints
    @PostMapping("/payment")
    @PreAuthorize("hasAnyRole('ADMIN', 'ACCOUNTS')")
    public ResponseEntity<BillPaymentResponse> createBillPayment(@Valid @RequestBody BillPaymentRequest request) {
        return ResponseEntity.ok(accountService.createBillPayment(request));
    }

    @GetMapping("/payment/{paymentNo}")
    public ResponseEntity<BillPaymentResponse> getBillPaymentByPaymentNo(@PathVariable String paymentNo) {
        return ResponseEntity.ok(accountService.getBillPaymentByPaymentNo(paymentNo));
    }

    @GetMapping("/payments")
    public ResponseEntity<Page<BillPaymentResponse>> getAllBillPayments(Pageable pageable) {
        return ResponseEntity.ok(accountService.getAllBillPayments(pageable));
    }

    @GetMapping("/payments/date-range")
    public ResponseEntity<Page<BillPaymentResponse>> getBillPaymentsByDateRange(
            @RequestParam String startDate,
            @RequestParam String endDate,
            Pageable pageable) {
        return ResponseEntity.ok(accountService.getBillPaymentsByDateRange(startDate, endDate, pageable));
    }

    @GetMapping("/payments/supplier/{supplierId}")
    public ResponseEntity<List<BillPaymentResponse>> getBillPaymentsBySupplier(@PathVariable Long supplierId) {
        return ResponseEntity.ok(accountService.getBillPaymentsBySupplier(supplierId));
    }

    @GetMapping("/customer-ledger/{customerId}")
    public ResponseEntity<?> getCustomerLedger(@PathVariable Long customerId) {
        return ResponseEntity.ok(accountService.getCustomerLedger(customerId));
    }

    @GetMapping("/supplier-ledger/{supplierId}")
    public ResponseEntity<?> getSupplierLedger(@PathVariable Long supplierId) {
        return ResponseEntity.ok(accountService.getSupplierLedger(supplierId));
    }
}