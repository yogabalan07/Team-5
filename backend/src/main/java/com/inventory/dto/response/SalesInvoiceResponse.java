package com.inventory.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SalesInvoiceResponse {
    private Long id;
    private String invoiceNo;
    private LocalDate invoiceDate;
    private Long customerId;
    private String customerName;
    private String customerPhone;
    private BigDecimal totalAmount;
    private BigDecimal discountAmount;
    private BigDecimal taxAmount;
    private BigDecimal netAmount;
    private BigDecimal paidAmount;
    private BigDecimal balanceAmount;
    private String paymentType;
    private String paymentMode; // ⭐ ADD THIS FIELD
    private String referenceNo;
    private String notes;
    private Boolean isReturned;
    private String createdBy;
    private LocalDateTime createdAt;
    private List<SalesInvoiceItemResponse> items;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SalesInvoiceItemResponse {
        private Long id;
        private Long itemId;
        private String itemName;
        private String itemCode;
        private BigDecimal quantity;
        private BigDecimal unitPrice;
        private BigDecimal discountPercent;
        private BigDecimal taxPercent;
        private BigDecimal totalAmount;
    }
}