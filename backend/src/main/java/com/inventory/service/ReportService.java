package com.inventory.service;

import com.inventory.model.Item;
import com.inventory.model.PurchaseEntry;
import com.inventory.model.SalesEntry;
import com.inventory.repository.ItemRepository;
import com.inventory.repository.PurchaseEntryRepository;
import com.inventory.repository.SalesEntryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ReportService {

    @Autowired
    private ItemRepository itemRepository;

    @Autowired
    private SalesEntryRepository salesEntryRepository;

    @Autowired
    private PurchaseEntryRepository purchaseEntryRepository;

    public Map<String, Object> getStockReport() {
        Map<String, Object> report = new HashMap<>();
        List<Item> items = itemRepository.findAll();
        
        long totalItems = items.size();
        long lowStockItems = items.stream()
            .filter(item -> "Low Stock".equals(item.getStatus()))
            .count();
        long outOfStockItems = items.stream()
            .filter(item -> "Out of Stock".equals(item.getStatus()))
            .count();
        
        BigDecimal totalStockValue = items.stream()
            .map(item -> item.getPrice().multiply(new BigDecimal(item.getStockQty())))
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        report.put("items", items);
        report.put("totalItems", totalItems);
        report.put("lowStockItems", lowStockItems);
        report.put("outOfStockItems", outOfStockItems);
        report.put("totalStockValue", totalStockValue);
        report.put("reportDate", LocalDateTime.now());
        
        return report;
    }

    public Map<String, Object> getDashboardSummary() {
        Map<String, Object> summary = new HashMap<>();
        
        long totalItems = itemRepository.count();
        long lowStockItems = itemRepository.findAll().stream()
            .filter(item -> "Low Stock".equals(item.getStatus()))
            .count();
        long outOfStockItems = itemRepository.findAll().stream()
            .filter(item -> "Out of Stock".equals(item.getStatus()))
            .count();
        
        LocalDate today = LocalDate.now();
        List<SalesEntry> todaySales = salesEntryRepository.findAll().stream()
            .filter(sale -> sale.getInvoiceDate().equals(today))
            .collect(Collectors.toList());
        
        BigDecimal todayTotalSales = todaySales.stream()
            .map(SalesEntry::getTotalAmount)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        List<PurchaseEntry> todayPurchases = purchaseEntryRepository.findAll().stream()
            .filter(purchase -> purchase.getPurchaseDate().equals(today))
            .collect(Collectors.toList());
        
        BigDecimal todayTotalPurchases = todayPurchases.stream()
            .map(PurchaseEntry::getTotalAmount)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        summary.put("totalItems", totalItems);
        summary.put("lowStockItems", lowStockItems);
        summary.put("outOfStockItems", outOfStockItems);
        summary.put("todayTotalSales", todayTotalSales);
        summary.put("todayTotalPurchases", todayTotalPurchases);
        summary.put("reportDate", LocalDateTime.now());
        
        return summary;
    }

    public Map<String, Object> getSalesReport(LocalDate startDate, LocalDate endDate) {
        Map<String, Object> report = new HashMap<>();
        List<SalesEntry> sales = salesEntryRepository.findAll().stream()
            .filter(sale -> !sale.getInvoiceDate().isBefore(startDate) && !sale.getInvoiceDate().isAfter(endDate))
            .collect(Collectors.toList());
        
        BigDecimal totalSales = sales.stream()
            .map(SalesEntry::getTotalAmount)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        report.put("sales", sales);
        report.put("totalSales", totalSales);
        report.put("totalTransactions", sales.size());
        report.put("startDate", startDate);
        report.put("endDate", endDate);
        report.put("reportDate", LocalDateTime.now());
        
        return report;
    }

    public Map<String, Object> getPurchaseReport(LocalDate startDate, LocalDate endDate) {
        Map<String, Object> report = new HashMap<>();
        List<PurchaseEntry> purchases = purchaseEntryRepository.findAll().stream()
            .filter(purchase -> !purchase.getPurchaseDate().isBefore(startDate) && 
                               !purchase.getPurchaseDate().isAfter(endDate))
            .collect(Collectors.toList());
        
        BigDecimal totalPurchases = purchases.stream()
            .map(PurchaseEntry::getTotalAmount)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        report.put("purchases", purchases);
        report.put("totalPurchases", totalPurchases);
        report.put("totalTransactions", purchases.size());
        report.put("startDate", startDate);
        report.put("endDate", endDate);
        report.put("reportDate", LocalDateTime.now());
        
        return report;
    }
}