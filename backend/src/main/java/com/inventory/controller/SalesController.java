package com.inventory.controller;

import com.inventory.model.SalesEntry;
import com.inventory.service.SalesService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/sales")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:3001", "http://localhost:3002"})
public class SalesController {

    @Autowired
    private SalesService salesService;

    @GetMapping
    public ResponseEntity<?> getAllSales() {
        try {
            List<SalesEntry> sales = salesService.getAllSales();
            return ResponseEntity.ok(sales);
        } catch (Exception e) {
            System.err.println("❌ Error in getAllSales: " + e.getMessage());
            e.printStackTrace();
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getSalesById(@PathVariable Long id) {
        try {
            SalesEntry sales = salesService.getSalesById(id);
            return ResponseEntity.ok(sales);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
        }
    }

    @GetMapping("/invoice/{invoiceNo}")
    public ResponseEntity<?> getSalesByInvoiceNo(@PathVariable String invoiceNo) {
        try {
            SalesEntry sales = salesService.getSalesByInvoiceNo(invoiceNo);
            return ResponseEntity.ok(sales);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
        }
    }

    @GetMapping("/customer/{customerId}")
    public ResponseEntity<?> getSalesByCustomer(@PathVariable Long customerId) {
        try {
            List<SalesEntry> sales = salesService.getSalesByCustomer(customerId);
            return ResponseEntity.ok(sales);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
        }
    }

    @GetMapping("/date-range")
    public ResponseEntity<?> getSalesByDateRange(
            @RequestParam LocalDate start,
            @RequestParam LocalDate end) {
        try {
            List<SalesEntry> sales = salesService.getSalesByDateRange(start, end);
            return ResponseEntity.ok(sales);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        }
    }

    @PostMapping
    public ResponseEntity<?> createSales(@RequestBody SalesEntry salesEntry) {
        try {
            SalesEntry created = salesService.createSales(salesEntry);
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (RuntimeException e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateSales(@PathVariable Long id, @RequestBody SalesEntry salesEntry) {
        try {
            System.out.println("🔄 Updating sales with ID: " + id);
            SalesEntry updated = salesService.updateSales(id, salesEntry);
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            System.err.println("❌ Error updating sales: " + e.getMessage());
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteSales(@PathVariable Long id) {
        try {
            System.out.println("🗑️ Deleting sales with ID: " + id);
            salesService.deleteSales(id);
            Map<String, String> response = new HashMap<>();
            response.put("message", "Sales deleted successfully");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            System.err.println("❌ Error deleting sales: " + e.getMessage());
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        }
    }
}