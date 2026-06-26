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

    @PostMapping
    public ResponseEntity<SalesEntry> createSales(@RequestBody SalesEntry salesEntry) {
        return ResponseEntity.ok(salesService.createSales(salesEntry));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSales(@PathVariable Long id) {
        salesService.deleteSales(id);
        return ResponseEntity.ok().build();
    }
}