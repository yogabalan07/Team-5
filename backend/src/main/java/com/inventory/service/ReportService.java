package com.inventory.service;

import com.inventory.model.Item;
import com.inventory.repository.ItemRepository;
import com.inventory.repository.PurchaseEntryRepository;
import com.inventory.repository.SalesEntryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.sql.Date;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
public class ReportService {

    @Autowired
    private ItemRepository itemRepository;

    @Autowired
    private PurchaseEntryRepository purchaseEntryRepository;

    @Autowired
    private SalesEntryRepository salesEntryRepository;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    // Get stock movement report using direct SQL query
    public List<Map<String, Object>> getStockMovementReport(String startDate, String endDate) {
        String sql = 
            "SELECT " +
            "    i.id, " +
            "    i.item_code, " +
            "    i.item_name, " +
            "    i.category, " +
            "    i.unit, " +
            "    i.price AS rate_avg_cost, " +
            "    i.stock_qty AS closing_stock, " +
            "    i.stock_qty * i.price AS stock_value_cost, " +
            "    i.stock_qty * i.price * 1.5 AS stock_value_sale, " +
            "    i.reorder_level, " +
            "    i.status, " +
            "    COALESCE((SELECT SUM(pi.quantity) FROM purchase_items pi " +
            "              INNER JOIN purchases p ON pi.purchase_id = p.id " +
            "              WHERE pi.item_id = i.id " +
            "              AND p.purchase_date BETWEEN ?::date AND ?::date), 0) AS purchases, " +
            "    COALESCE((SELECT SUM(si.quantity) FROM sale_items si " +
            "              INNER JOIN sales s ON si.sale_id = s.id " +
            "              WHERE si.item_id = i.id " +
            "              AND s.invoice_date BETWEEN ?::date AND ?::date), 0) AS sales, " +
            "    (i.stock_qty + COALESCE((SELECT SUM(si.quantity) FROM sale_items si " +
            "              INNER JOIN sales s ON si.sale_id = s.id " +
            "              WHERE si.item_id = i.id " +
            "              AND s.invoice_date BETWEEN ?::date AND ?::date), 0) - " +
            "     COALESCE((SELECT SUM(pi.quantity) FROM purchase_items pi " +
            "              INNER JOIN purchases p ON pi.purchase_id = p.id " +
            "              WHERE pi.item_id = i.id " +
            "              AND p.purchase_date BETWEEN ?::date AND ?::date), 0)) AS opening_stock " +
            "FROM items i " +
            "WHERE i.stock_qty IS NOT NULL " +
            "ORDER BY i.item_code";
        
        return jdbcTemplate.queryForList(sql, 
            startDate, endDate,  // for purchases
            startDate, endDate,  // for sales
            startDate, endDate,  // for opening stock sales
            startDate, endDate   // for opening stock purchases
        );
    }

    // Get sales summary with date and customer filters
    public List<Map<String, Object>> getSalesSummaryWithFilters(String startDate, String endDate, String customerName) {
        StringBuilder sql = new StringBuilder("SELECT * FROM vw_sales_summary_filtered WHERE 1=1");
        List<Object> params = new ArrayList<>();
        
        if (startDate != null && !startDate.isEmpty()) {
            sql.append(" AND invoice_date >= ?::date");
            params.add(startDate);
        }
        
        if (endDate != null && !endDate.isEmpty()) {
            sql.append(" AND invoice_date <= ?::date");
            params.add(endDate);
        }
        
        if (customerName != null && !customerName.isEmpty() && !customerName.equals("All Customers")) {
            sql.append(" AND customer_name = ?");
            params.add(customerName);
        }
        
        sql.append(" ORDER BY invoice_date DESC");
        
        return jdbcTemplate.queryForList(sql.toString(), params.toArray());
    }

    public List<Map<String, Object>> getSalesSummaryView() {
        String sql = "SELECT * FROM vw_sales_summary_filtered ORDER BY invoice_date DESC";
        return jdbcTemplate.queryForList(sql);
    }

    public List<Map<String, Object>> getStockReportView() {
        String sql = "SELECT * FROM vw_stock_report ORDER BY s_no";
        return jdbcTemplate.queryForList(sql);
    }

    public List<Item> getStockReport() {
        return itemRepository.findAll();
    }

    public Map<String, Object> getDashboardSummary() {
        Map<String, Object> summary = new HashMap<>();
        
        long totalItems = itemRepository.count();
        long lowStockItems = 0;
        long outOfStockItems = 0;
        
        List<Item> allItems = itemRepository.findAll();
        for (Item item : allItems) {
            if (item.getStatus() != null) {
                if ("Low Stock".equals(item.getStatus())) {
                    lowStockItems++;
                } else if ("Out of Stock".equals(item.getStatus())) {
                    outOfStockItems++;
                }
            } else {
                if (item.getStockQty() == 0) {
                    outOfStockItems++;
                } else if (item.getStockQty() <= (item.getReorderLevel() != null ? item.getReorderLevel() : 5)) {
                    lowStockItems++;
                }
            }
        }
        
        LocalDate today = LocalDate.now();
        java.sql.Date sqlDate = java.sql.Date.valueOf(today);
        
        // Using java.sql.Date for PostgreSQL compatibility
        String salesSql = "SELECT COALESCE(SUM(total_amount), 0) FROM sales WHERE invoice_date = ?";
        BigDecimal todaySales = jdbcTemplate.queryForObject(salesSql, BigDecimal.class, sqlDate);
        
        String purchaseSql = "SELECT COALESCE(SUM(total_amount), 0) FROM purchases WHERE purchase_date = ?";
        BigDecimal todayPurchases = jdbcTemplate.queryForObject(purchaseSql, BigDecimal.class, sqlDate);
        
        String customerSql = "SELECT COUNT(*) FROM customers";
        Long totalCustomers = jdbcTemplate.queryForObject(customerSql, Long.class);
        
        String supplierSql = "SELECT COUNT(*) FROM suppliers";
        Long totalSuppliers = jdbcTemplate.queryForObject(supplierSql, Long.class);
        
        summary.put("totalItems", totalItems);
        summary.put("lowStockItems", lowStockItems);
        summary.put("outOfStockItems", outOfStockItems);
        summary.put("todayTotalSales", todaySales != null ? todaySales : BigDecimal.ZERO);
        summary.put("todayTotalPurchases", todayPurchases != null ? todayPurchases : BigDecimal.ZERO);
        summary.put("totalCustomers", totalCustomers != null ? totalCustomers : 0);
        summary.put("totalSuppliers", totalSuppliers != null ? totalSuppliers : 0);
        summary.put("reportDate", LocalDateTime.now());
        
        return summary;
    }

    public Map<String, Object> getSalesReport(LocalDate startDate, LocalDate endDate) {
        Map<String, Object> report = new HashMap<>();
        
        // Use java.sql.Date for PostgreSQL compatibility
        java.sql.Date sqlStartDate = java.sql.Date.valueOf(startDate);
        java.sql.Date sqlEndDate = java.sql.Date.valueOf(endDate);
        
        String sql = "SELECT * FROM vw_sales_summary_filtered WHERE invoice_date BETWEEN ? AND ?";
        List<Map<String, Object>> sales = jdbcTemplate.queryForList(sql, sqlStartDate, sqlEndDate);
        
        BigDecimal totalSales = sales.stream()
            .map(s -> new BigDecimal(s.get("total_amount").toString()))
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        report.put("sales", sales);
        report.put("totalSales", totalSales);
        report.put("startDate", startDate);
        report.put("endDate", endDate);
        report.put("reportDate", LocalDateTime.now());
        
        return report;
    }

    public Map<String, Object> getPurchaseReport(LocalDate startDate, LocalDate endDate) {
        Map<String, Object> report = new HashMap<>();
        
        // Use java.sql.Date for PostgreSQL compatibility
        java.sql.Date sqlStartDate = java.sql.Date.valueOf(startDate);
        java.sql.Date sqlEndDate = java.sql.Date.valueOf(endDate);
        
        String sql = "SELECT * FROM purchases WHERE purchase_date BETWEEN ? AND ?";
        List<Map<String, Object>> purchases = jdbcTemplate.queryForList(sql, sqlStartDate, sqlEndDate);
        
        BigDecimal totalPurchases = purchases.stream()
            .map(p -> new BigDecimal(p.get("total_amount").toString()))
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        report.put("purchases", purchases);
        report.put("totalPurchases", totalPurchases);
        report.put("startDate", startDate);
        report.put("endDate", endDate);
        report.put("reportDate", LocalDateTime.now());
        
        return report;
    }
}