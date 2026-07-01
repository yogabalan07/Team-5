package com.inventory.controller;

import com.inventory.dto.request.ReportFilterRequest;
import com.inventory.dto.response.ReportResponse;
import com.inventory.service.ReportService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/reports")
@CrossOrigin(origins = "*")
public class ReportController {

    @Autowired
    private ReportService reportService;

    // ==================== SALES REPORTS ====================

    /**
     * Get Sales Bills Report
     * POST /api/reports/sales-bills
     * Filters: startDate, endDate, customerIds (single/multiple/none)
     */
    @PostMapping("/sales-bills")
    public ResponseEntity<Page<ReportResponse>> getSalesBillsReport(
            @RequestBody ReportFilterRequest filter,
            Pageable pageable) {
        try {
            return ResponseEntity.ok(reportService.getSalesBillsReport(filter, pageable));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Get Sales Bill Details Report
     * POST /api/reports/sales-bill-details
     * Filters: startDate, endDate, customerIds, itemIds, brandIds, groupIds
     */
    @PostMapping("/sales-bill-details")
    public ResponseEntity<Page<ReportResponse>> getSalesBillDetailsReport(
            @RequestBody ReportFilterRequest filter,
            Pageable pageable) {
        try {
            return ResponseEntity.ok(reportService.getSalesBillDetailsReport(filter, pageable));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // ==================== PURCHASE REPORTS ====================

    /**
     * Get Purchase Bills Report
     * POST /api/reports/purchase-bills
     * Filters: startDate, endDate, supplierIds (single/multiple/none)
     */
    @PostMapping("/purchase-bills")
    public ResponseEntity<Page<ReportResponse>> getPurchaseBillsReport(
            @RequestBody ReportFilterRequest filter,
            Pageable pageable) {
        try {
            return ResponseEntity.ok(reportService.getPurchaseBillsReport(filter, pageable));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Get Purchase Bill Details Report
     * POST /api/reports/purchase-bill-details
     * Filters: startDate, endDate, supplierIds, itemIds, brandIds, groupIds
     */
    @PostMapping("/purchase-bill-details")
    public ResponseEntity<Page<ReportResponse>> getPurchaseBillDetailsReport(
            @RequestBody ReportFilterRequest filter,
            Pageable pageable) {
        try {
            return ResponseEntity.ok(reportService.getPurchaseBillDetailsReport(filter, pageable));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // ==================== RECEIPTS & PAYMENTS ====================

    /**
     * Get Customer Receipts Report
     * POST /api/reports/customer-receipts
     * Filters: startDate, endDate
     */
    @PostMapping("/customer-receipts")
    public ResponseEntity<Page<ReportResponse>> getCustomerReceiptsReport(
            @RequestBody ReportFilterRequest filter,
            Pageable pageable) {
        try {
            return ResponseEntity.ok(reportService.getCustomerReceiptsReport(filter, pageable));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Get Supplier Payments Report
     * POST /api/reports/supplier-payments
     * Filters: startDate, endDate
     */
    @PostMapping("/supplier-payments")
    public ResponseEntity<Page<ReportResponse>> getSupplierPaymentsReport(
            @RequestBody ReportFilterRequest filter,
            Pageable pageable) {
        try {
            return ResponseEntity.ok(reportService.getSupplierPaymentsReport(filter, pageable));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // ==================== STOCK REPORTS ====================

    /**
     * Get Stock Report
     * POST /api/reports/stock
     * Filters: startDate, endDate, itemIds, brandIds, groupIds
     * Returns: Opening Stock, Purchases, Sales, Closing Stock
     */
    @PostMapping("/stock")
    public ResponseEntity<Page<ReportResponse>> getStockReport(
            @RequestBody ReportFilterRequest filter,
            Pageable pageable) {
        try {
            return ResponseEntity.ok(reportService.getStockReport(filter, pageable));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Get Stock Summary
     * GET /api/reports/stock/summary
     */
    @GetMapping("/stock/summary")
    public ResponseEntity<?> getStockSummary() {
        try {
            return ResponseEntity.ok(reportService.getStockSummary());
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    // ==================== SALES SUMMARY ====================

    /**
     * Get Sales Summary
     * GET /api/reports/sales-summary
     */
    @GetMapping("/sales-summary")
    public ResponseEntity<?> getSalesSummary() {
        try {
            return ResponseEntity.ok(reportService.getSalesSummary());
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    // ==================== EXPORT REPORTS ====================

    /**
     * Export Report to Excel
     * POST /api/reports/export/excel
     * Returns Excel file as byte array
     */
    @PostMapping(value = "/export/excel")
    public ResponseEntity<?> exportReportToExcel(@RequestBody ReportFilterRequest filter) {
        try {
            return reportService.exportReportToExcel(filter);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Failed to export Excel: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    /**
     * Export Report to PDF
     * POST /api/reports/export/pdf
     * Returns PDF file as byte array
     */
    @PostMapping(value = "/export/pdf")
    public ResponseEntity<?> exportReportToPDF(@RequestBody ReportFilterRequest filter) {
        try {
            return reportService.exportReportToPDF(filter);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Failed to export PDF: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    // ==================== HEALTH CHECK ====================

    /**
     * Health check endpoint
     * GET /api/reports/health
     */
    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> healthCheck() {
        Map<String, String> response = new HashMap<>();
        response.put("status", "OK");
        response.put("timestamp", LocalDate.now().format(DateTimeFormatter.ISO_LOCAL_DATE));
        return ResponseEntity.ok(response);
    }
}