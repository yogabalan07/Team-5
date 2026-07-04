package com.inventory.controller;

import com.inventory.dto.request.SalesInvoiceRequest;
import com.inventory.dto.response.SalesInvoiceResponse;
import com.inventory.exception.ResourceNotFoundException;
import com.inventory.service.SalesService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/sales")
@CrossOrigin(origins = "*")
public class SalesController {

    private static final Logger logger = LoggerFactory.getLogger(SalesController.class);

    @Autowired
    private SalesService salesService;

    @PostMapping("/invoice")
    @PreAuthorize("hasAnyRole('ADMIN', 'BILLING_CLERK')")
    public ResponseEntity<?> createSalesInvoice(@Valid @RequestBody SalesInvoiceRequest request) {
        try {
            logger.info("📝 Creating sales invoice");
            SalesInvoiceResponse response = salesService.createSalesInvoice(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (Exception e) {
            logger.error("❌ Error creating sales invoice: {}", e.getMessage(), e);
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    @GetMapping("/invoice/no/{invoiceNo}")
    public ResponseEntity<?> getSalesInvoiceByInvoiceNo(@PathVariable String invoiceNo) {
        try {
            logger.info("📄 Fetching invoice with invoice number: {}", invoiceNo);
            SalesInvoiceResponse response = salesService.getSalesInvoiceByInvoiceNo(invoiceNo);
            return ResponseEntity.ok(response);
        } catch (ResourceNotFoundException e) {
            logger.warn("⚠️ Invoice not found: {}", e.getMessage());
            Map<String, Object> error = new HashMap<>();
            error.put("error", "Invoice not found");
            error.put("invoiceNo", invoiceNo);
            error.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
        } catch (Exception e) {
            logger.error("❌ Error fetching invoice {}: {}", invoiceNo, e.getMessage(), e);
            Map<String, Object> error = new HashMap<>();
            error.put("error", "Internal server error");
            error.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    @GetMapping("/invoice/id/{id}")
    public ResponseEntity<?> getSalesInvoiceById(@PathVariable Long id) {
        try {
            logger.info("📄 API call - Fetching invoice with ID: {}", id);
            SalesInvoiceResponse response = salesService.getSalesInvoiceById(id);
            return ResponseEntity.ok(response);
            
        } catch (ResourceNotFoundException e) {
            logger.warn("⚠️ Invoice not found: {}", e.getMessage());
            Map<String, Object> error = new HashMap<>();
            error.put("error", "Invoice not found");
            error.put("id", id);
            error.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
            
        } catch (Exception e) {
            logger.error("❌ Error fetching invoice {}: {}", id, e.getMessage(), e);
            Map<String, Object> error = new HashMap<>();
            error.put("error", "Internal server error");
            error.put("id", id);
            error.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    @GetMapping("/invoice")
    public ResponseEntity<?> getSalesInvoiceByQuery(
            @RequestParam(required = false) String invoiceNo,
            @RequestParam(required = false) Long id) {
        try {
            if (invoiceNo != null) {
                return getSalesInvoiceByInvoiceNo(invoiceNo);
            } else if (id != null) {
                return getSalesInvoiceById(id);
            } else {
                Map<String, String> error = new HashMap<>();
                error.put("error", "Either invoiceNo or id must be provided");
                return ResponseEntity.badRequest().body(error);
            }
        } catch (Exception e) {
            logger.error("❌ Error fetching invoice: {}", e.getMessage(), e);
            Map<String, Object> error = new HashMap<>();
            error.put("error", "Internal server error");
            error.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    @GetMapping("/invoices")
    public ResponseEntity<?> getAllSalesInvoices(Pageable pageable) {
        try {
            logger.info("📄 Fetching all sales invoices with pagination");
            Page<SalesInvoiceResponse> response = salesService.getAllSalesInvoices(pageable);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("❌ Error fetching sales invoices: {}", e.getMessage(), e);
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    @GetMapping("/invoices/date-range")
    public ResponseEntity<?> getSalesInvoicesByDateRange(
            @RequestParam String startDate,
            @RequestParam String endDate,
            Pageable pageable) {
        try {
            logger.info("📄 Fetching sales invoices by date range: {} to {}", startDate, endDate);
            Page<SalesInvoiceResponse> response = salesService.getSalesInvoicesByDateRange(startDate, endDate, pageable);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("❌ Error fetching sales invoices by date range: {}", e.getMessage(), e);
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    @GetMapping("/invoices/customer/{customerId}")
    public ResponseEntity<?> getSalesInvoicesByCustomer(
            @PathVariable Long customerId,
            Pageable pageable) {
        try {
            logger.info("📄 Fetching sales invoices for customer: {}", customerId);
            Page<SalesInvoiceResponse> response = salesService.getSalesInvoicesByCustomer(customerId, pageable);
            return ResponseEntity.ok(response);
        } catch (ResourceNotFoundException e) {
            logger.warn("⚠️ Customer not found: {}", e.getMessage());
            Map<String, Object> error = new HashMap<>();
            error.put("error", "Customer not found");
            error.put("customerId", customerId);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
        } catch (Exception e) {
            logger.error("❌ Error fetching sales invoices for customer {}: {}", customerId, e.getMessage(), e);
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    @PutMapping("/invoice/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'BILLING_CLERK')")
    public ResponseEntity<?> updateSalesInvoice(
            @PathVariable Long id,
            @Valid @RequestBody SalesInvoiceRequest request) {
        try {
            logger.info("📝 Updating sales invoice with ID: {}", id);
            SalesInvoiceResponse response = salesService.updateSalesInvoice(id, request);
            return ResponseEntity.ok(response);
        } catch (ResourceNotFoundException e) {
            logger.warn("⚠️ Invoice not found: {}", e.getMessage());
            Map<String, Object> error = new HashMap<>();
            error.put("error", "Invoice not found");
            error.put("id", id);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
        } catch (Exception e) {
            logger.error("❌ Error updating sales invoice {}: {}", id, e.getMessage(), e);
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    @DeleteMapping("/invoice/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteSalesInvoice(@PathVariable Long id) {
        try {
            logger.info("🗑️ Deleting sales invoice with ID: {}", id);
            salesService.deleteSalesInvoice(id);
            Map<String, String> response = new HashMap<>();
            response.put("message", "Sales invoice deleted successfully");
            response.put("id", id.toString());
            return ResponseEntity.ok(response);
        } catch (ResourceNotFoundException e) {
            logger.warn("⚠️ Invoice not found: {}", e.getMessage());
            Map<String, Object> error = new HashMap<>();
            error.put("error", "Invoice not found");
            error.put("id", id);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
        } catch (Exception e) {
            logger.error("❌ Error deleting sales invoice {}: {}", id, e.getMessage(), e);
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }
}
