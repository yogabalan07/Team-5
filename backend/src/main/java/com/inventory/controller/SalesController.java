package com.inventory.controller;

import com.inventory.dto.request.SalesInvoiceRequest;
import com.inventory.dto.response.SalesInvoiceResponse;
import com.inventory.service.SalesService;
import jakarta.validation.Valid;
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

    @Autowired
    private SalesService salesService;

    @PostMapping("/invoice")
    @PreAuthorize("hasAnyRole('ADMIN', 'BILLING_CLERK')")
    public ResponseEntity<SalesInvoiceResponse> createSalesInvoice(@Valid @RequestBody SalesInvoiceRequest request) {
        try {
            return ResponseEntity.ok(salesService.createSalesInvoice(request));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    // FIX: Use different paths for different methods
    @GetMapping("/invoice/no/{invoiceNo}")
    public ResponseEntity<SalesInvoiceResponse> getSalesInvoiceByInvoiceNo(@PathVariable String invoiceNo) {
        try {
            return ResponseEntity.ok(salesService.getSalesInvoiceByInvoiceNo(invoiceNo));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(null);
        }
    }

    @GetMapping("/invoice/id/{id}")
    public ResponseEntity<SalesInvoiceResponse> getSalesInvoiceById(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(salesService.getSalesInvoiceById(id));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(null);
        }
    }

    // Alternative: Keep both but use path variable with different names
    // GET /sales/invoice?invoiceNo=INV-001
    @GetMapping("/invoice")
    public ResponseEntity<SalesInvoiceResponse> getSalesInvoiceByQuery(
            @RequestParam(required = false) String invoiceNo,
            @RequestParam(required = false) Long id) {
        try {
            if (invoiceNo != null) {
                return ResponseEntity.ok(salesService.getSalesInvoiceByInvoiceNo(invoiceNo));
            } else if (id != null) {
                return ResponseEntity.ok(salesService.getSalesInvoiceById(id));
            } else {
                return ResponseEntity.badRequest().build();
            }
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(null);
        }
    }

    @GetMapping("/invoices")
    public ResponseEntity<Page<SalesInvoiceResponse>> getAllSalesInvoices(Pageable pageable) {
        try {
            return ResponseEntity.ok(salesService.getAllSalesInvoices(pageable));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    @GetMapping("/invoices/date-range")
    public ResponseEntity<Page<SalesInvoiceResponse>> getSalesInvoicesByDateRange(
            @RequestParam String startDate,
            @RequestParam String endDate,
            Pageable pageable) {
        try {
            return ResponseEntity.ok(salesService.getSalesInvoicesByDateRange(startDate, endDate, pageable));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    @GetMapping("/invoices/customer/{customerId}")
    public ResponseEntity<Page<SalesInvoiceResponse>> getSalesInvoicesByCustomer(
            @PathVariable Long customerId,
            Pageable pageable) {
        try {
            return ResponseEntity.ok(salesService.getSalesInvoicesByCustomer(customerId, pageable));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    @PutMapping("/invoice/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'BILLING_CLERK')")
    public ResponseEntity<SalesInvoiceResponse> updateSalesInvoice(
            @PathVariable Long id,
            @Valid @RequestBody SalesInvoiceRequest request) {
        try {
            return ResponseEntity.ok(salesService.updateSalesInvoice(id, request));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    @DeleteMapping("/invoice/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteSalesInvoice(@PathVariable Long id) {
        try {
            salesService.deleteSalesInvoice(id);
            Map<String, String> response = new HashMap<>();
            response.put("message", "Sales invoice deleted successfully");
            response.put("id", id.toString());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }
}