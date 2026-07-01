package com.inventory.service;

import com.inventory.dto.request.ReportFilterRequest;
import com.inventory.dto.response.ReportResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;

import java.util.Map;

public interface ReportService {
    // Sales Reports
    Page<ReportResponse> getSalesBillsReport(ReportFilterRequest filter, Pageable pageable);
    Page<ReportResponse> getSalesBillDetailsReport(ReportFilterRequest filter, Pageable pageable);
    
    // Purchase Reports
    Page<ReportResponse> getPurchaseBillsReport(ReportFilterRequest filter, Pageable pageable);
    Page<ReportResponse> getPurchaseBillDetailsReport(ReportFilterRequest filter, Pageable pageable);
    
    // Receipts & Payments
    Page<ReportResponse> getCustomerReceiptsReport(ReportFilterRequest filter, Pageable pageable);
    Page<ReportResponse> getSupplierPaymentsReport(ReportFilterRequest filter, Pageable pageable);
    
    // Stock Reports
    Page<ReportResponse> getStockReport(ReportFilterRequest filter, Pageable pageable);
    Map<String, Object> getStockSummary();
    Map<String, Object> getSalesSummary();
    
    // Export
    ResponseEntity<?> exportReportToExcel(ReportFilterRequest filter);
    ResponseEntity<?> exportReportToPDF(ReportFilterRequest filter);
}