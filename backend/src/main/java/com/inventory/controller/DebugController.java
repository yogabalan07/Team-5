package com.inventory.controller;

import com.inventory.model.SalesEntry;
import com.inventory.model.SalesItem;
import com.inventory.repository.SalesEntryRepository;
import com.inventory.repository.SalesItemRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/debug")
public class DebugController {

    @Autowired
    private SalesEntryRepository salesEntryRepository;
    
    @Autowired
    private SalesItemRepository salesItemRepository;

    @GetMapping("/sales/{id}/items")
    public List<SalesItem> getSaleItems(@PathVariable Long id) {
        return salesItemRepository.findBySaleId(id);
    }
    
    @GetMapping("/sales/latest")
    public SalesEntry getLatestSale() {
        return salesEntryRepository.findAll().stream()
                .reduce((first, second) -> second)
                .orElse(null);
    }
    
    @GetMapping("/test")
    public Map<String, String> test() {
        Map<String, String> response = new HashMap<>();
        response.put("status", "OK");
        response.put("message", "Debug endpoint working");
        return response;
    }
}