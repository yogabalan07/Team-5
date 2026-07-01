package com.inventory.service;

import com.inventory.dto.request.SalesInvoiceRequest;
import com.inventory.dto.response.SalesInvoiceResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface SalesService {
    SalesInvoiceResponse createSalesInvoice(SalesInvoiceRequest request);
    SalesInvoiceResponse getSalesInvoiceByInvoiceNo(String invoiceNo);
    SalesInvoiceResponse getSalesInvoiceById(Long id);
    Page<SalesInvoiceResponse> getAllSalesInvoices(Pageable pageable);
    Page<SalesInvoiceResponse> getSalesInvoicesByDateRange(String startDate, String endDate, Pageable pageable);
    Page<SalesInvoiceResponse> getSalesInvoicesByCustomer(Long customerId, Pageable pageable);
    SalesInvoiceResponse updateSalesInvoice(Long id, SalesInvoiceRequest request);
    void deleteSalesInvoice(Long id);
}