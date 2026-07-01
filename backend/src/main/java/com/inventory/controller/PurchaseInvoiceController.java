package com.inventory.controller;

import com.inventory.dto.request.PurchaseInvoiceRequest;
import com.inventory.dto.response.PurchaseInvoiceResponse;
import com.inventory.service.PurchaseService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/purchase-invoices")
@CrossOrigin(origins = "*")
public class PurchaseInvoiceController {

    @Autowired
    private PurchaseService purchaseService;

    // ==================== CREATE ====================

    /**
     * Create a new purchase invoice
     * POST /purchase-invoices
     */
    @PostMapping
    public ResponseEntity<?> createPurchaseInvoice(@Valid @RequestBody PurchaseInvoiceRequest request) {
        try {
            PurchaseInvoiceResponse response = purchaseService.createPurchaseInvoice(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            error.put("timestamp", LocalDate.now().toString());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        }
    }

    // ==================== READ (GET) ====================

    /**
     * Get all purchase invoices with pagination
     * GET /purchase-invoices
     */
    @GetMapping
    public ResponseEntity<Page<PurchaseInvoiceResponse>> getAllPurchaseInvoices(
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        try {
            Page<PurchaseInvoiceResponse> responses = purchaseService.getAllPurchaseInvoices(pageable);
            return ResponseEntity.ok(responses);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Get purchase invoice by ID
     * GET /purchase-invoices/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<?> getPurchaseInvoiceById(@PathVariable Long id) {
        try {
            PurchaseInvoiceResponse response = purchaseService.getPurchaseInvoiceById(id);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Purchase invoice not found with ID: " + id);
            error.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
        }
    }

    /**
     * Get purchase invoice by invoice number
     * GET /purchase-invoices/number/{invoiceNo}
     */
    @GetMapping("/number/{invoiceNo}")
    public ResponseEntity<?> getPurchaseInvoiceByInvoiceNo(@PathVariable String invoiceNo) {
        try {
            PurchaseInvoiceResponse response = purchaseService.getPurchaseInvoiceByInvoiceNo(invoiceNo);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Purchase invoice not found with number: " + invoiceNo);
            error.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
        }
    }

    /**
     * Get purchase invoices by supplier
     * GET /purchase-invoices/supplier/{supplierId}
     */
    @GetMapping("/supplier/{supplierId}")
    public ResponseEntity<Page<PurchaseInvoiceResponse>> getPurchaseInvoicesBySupplier(
            @PathVariable Long supplierId,
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        try {
            Page<PurchaseInvoiceResponse> responses = purchaseService.getPurchaseInvoicesBySupplier(supplierId, pageable);
            return ResponseEntity.ok(responses);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Get purchase invoices by date range
     * GET /purchase-invoices/date-range?startDate=2024-01-01&endDate=2024-12-31&dateType=INVOICE_DATE
     */
    @GetMapping("/date-range")
    public ResponseEntity<Page<PurchaseInvoiceResponse>> getPurchaseInvoicesByDateRange(
            @RequestParam String startDate,
            @RequestParam String endDate,
            @RequestParam(required = false, defaultValue = "INVOICE_DATE") String dateType,
            @PageableDefault(size = 10, sort = "invoiceDate", direction = Sort.Direction.DESC) Pageable pageable) {
        try {
            Page<PurchaseInvoiceResponse> responses = purchaseService.getPurchaseInvoicesByDateRange(
                    startDate, endDate, dateType, pageable);
            return ResponseEntity.ok(responses);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }

    /**
     * Get purchase invoices by payment status
     * GET /purchase-invoices/payment-status/{status}
     * Status: PAID, UNPAID, PARTIAL
     */
    @GetMapping("/payment-status/{status}")
    public ResponseEntity<Page<PurchaseInvoiceResponse>> getPurchaseInvoicesByPaymentStatus(
            @PathVariable String status,
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        try {
            Page<PurchaseInvoiceResponse> responses = purchaseService.getPurchaseInvoicesByPaymentStatus(status, pageable);
            return ResponseEntity.ok(responses);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Search purchase invoices by keyword
     * GET /purchase-invoices/search?keyword=PUR-001
     */
    @GetMapping("/search")
    public ResponseEntity<Page<PurchaseInvoiceResponse>> searchPurchaseInvoices(
            @RequestParam String keyword,
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        try {
            Page<PurchaseInvoiceResponse> responses = purchaseService.searchPurchaseInvoices(keyword, pageable);
            return ResponseEntity.ok(responses);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Get purchase invoice summary for dashboard
     * GET /purchase-invoices/summary
     */
    @GetMapping("/summary")
    public ResponseEntity<?> getPurchaseInvoiceSummary() {
        try {
            Map<String, Object> summary = purchaseService.getPurchaseInvoiceSummary();
            return ResponseEntity.ok(summary);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    // ==================== UPDATE ====================

    /**
     * Update purchase invoice
     * PUT /purchase-invoices/{id}
     */
    @PutMapping("/{id}")
    public ResponseEntity<?> updatePurchaseInvoice(
            @PathVariable Long id,
            @Valid @RequestBody PurchaseInvoiceRequest request) {
        try {
            PurchaseInvoiceResponse response = purchaseService.updatePurchaseInvoice(id, request);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            error.put("timestamp", LocalDate.now().toString());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        }
    }

    // ==================== PAYMENT ====================

    /**
     * Make payment on invoice
     * POST /purchase-invoices/{id}/payment?amount=5000
     */
    @PostMapping("/{id}/payment")
    public ResponseEntity<?> makePayment(
            @PathVariable Long id,
            @RequestParam BigDecimal amount) {
        try {
            PurchaseInvoiceResponse response = purchaseService.makePayment(id, amount);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            error.put("timestamp", LocalDate.now().toString());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        }
    }

    // ==================== DELETE ====================

    /**
     * Delete purchase invoice
     * DELETE /purchase-invoices/{id}
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deletePurchaseInvoice(@PathVariable Long id) {
        try {
            purchaseService.deletePurchaseInvoice(id);
            Map<String, String> response = new HashMap<>();
            response.put("message", "Purchase invoice deleted successfully");
            response.put("id", id.toString());
            response.put("timestamp", LocalDate.now().toString());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        }
    }
}