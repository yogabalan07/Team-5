package com.inventory.controller;

import com.inventory.model.SalesEntry;
import com.inventory.service.SalesService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/sales")
@CrossOrigin(origins = "http://localhost:3000")
public class SalesController {

    @Autowired
    private SalesService salesService;

    @GetMapping
    public ResponseEntity<List<SalesEntry>> getAllSales() {
        return ResponseEntity.ok(salesService.getAllSales());
    }

    @GetMapping("/{id}")
    public ResponseEntity<SalesEntry> getSalesById(@PathVariable Long id) {
        return ResponseEntity.ok(salesService.getSalesById(id));
    }

    @GetMapping("/invoice/{invoiceNo}")
    public ResponseEntity<SalesEntry> getSalesByInvoiceNo(@PathVariable String invoiceNo) {
        return ResponseEntity.ok(salesService.getSalesByInvoiceNo(invoiceNo));
    }

    @GetMapping("/customer/{customerId}")
    public ResponseEntity<List<SalesEntry>> getSalesByCustomer(@PathVariable Long customerId) {
        return ResponseEntity.ok(salesService.getSalesByCustomer(customerId));
    }

    @GetMapping("/salesperson/{salesPerson}")
    public ResponseEntity<List<SalesEntry>> getSalesBySalesPerson(@PathVariable String salesPerson) {
        return ResponseEntity.ok(salesService.getSalesBySalesPerson(salesPerson));
    }

    @PostMapping
    public ResponseEntity<SalesEntry> createSales(@RequestBody SalesEntry salesEntry) {
        return ResponseEntity.ok(salesService.createSales(salesEntry));
    }

    @PutMapping("/{id}")
    public ResponseEntity<SalesEntry> updateSales(@PathVariable Long id, @RequestBody SalesEntry salesEntry) {
        return ResponseEntity.ok(salesService.updateSales(id, salesEntry));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSales(@PathVariable Long id) {
        salesService.deleteSales(id);
        return ResponseEntity.ok().build();
    }
}