package com.inventory.controller;

import com.inventory.service.ReportService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reports")
@CrossOrigin(origins = "http://localhost:3000")
public class ReportController {

    @Autowired
    private ReportService reportService;

    @GetMapping("/stock-movement")
    public ResponseEntity<List<Map<String, Object>>> getStockMovementReport(
            @RequestParam String startDate,
            @RequestParam String endDate) {
        return ResponseEntity.ok(reportService.getStockMovementReport(startDate, endDate));
    }

    @GetMapping("/sales-summary-view")
    public ResponseEntity<List<Map<String, Object>>> getSalesSummaryView(
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @RequestParam(required = false) String customerName) {
        return ResponseEntity.ok(reportService.getSalesSummaryWithFilters(startDate, endDate, customerName));
    }

    @GetMapping("/stock-view")
    public ResponseEntity<List<Map<String, Object>>> getStockReportView() {
        return ResponseEntity.ok(reportService.getStockReportView());
    }

    @GetMapping("/stock")
    public ResponseEntity<List<com.inventory.model.Item>> getStockReport() {
        return ResponseEntity.ok(reportService.getStockReport());
    }

    @GetMapping("/summary")
    public ResponseEntity<Map<String, Object>> getDashboardSummary() {
        return ResponseEntity.ok(reportService.getDashboardSummary());
    }

    @GetMapping("/sales")
    public ResponseEntity<Map<String, Object>> getSalesReport(
            @RequestParam LocalDate start,
            @RequestParam LocalDate end) {
        return ResponseEntity.ok(reportService.getSalesReport(start, end));
    }

    @GetMapping("/purchases")
    public ResponseEntity<Map<String, Object>> getPurchaseReport(
            @RequestParam LocalDate start,
            @RequestParam LocalDate end) {
        return ResponseEntity.ok(reportService.getPurchaseReport(start, end));
    }
}