package com.inventory.dto.request;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ReportFilterRequest {
    // Date filters
    private LocalDate startDate;
    private LocalDate endDate;
    
    // Entity filters (single or multiple)
    private List<Long> customerIds;
    private List<Long> supplierIds;
    private List<Long> itemIds;
    private List<Long> brandIds;
    private List<Long> groupIds;
    
    // Additional filters
    private String dateType; // "INVOICE_DATE" or "RECEIVED_DATE"
    private String reportType; // "SALES", "PURCHASE", "STOCK", "RECEIPTS", "PAYMENTS"
    
    // Pagination
    private int page = 0;
    private int size = 20;
}