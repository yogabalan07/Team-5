package com.inventory.dto.request;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SalesInvoiceRequest {
    private LocalDate invoiceDate;
    private Long customerId;
    private String paymentType;
    private String referenceNo;
    private String notes;
    private List<SalesInvoiceItemRequest> items;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SalesInvoiceItemRequest {
        private Long itemId;
        private BigDecimal quantity;
        private BigDecimal unitPrice;
        private BigDecimal discountPercent;
        private BigDecimal taxPercent;
    }
}