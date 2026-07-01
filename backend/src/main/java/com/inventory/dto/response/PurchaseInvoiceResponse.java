package com.inventory.dto.response;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
@Builder
public class PurchaseInvoiceResponse {
    private Long id;
    private String invoiceNo;
    private LocalDate invoiceDate;
    private LocalDate receivedDate;
    private String supplierName;
    private String supplierPhone;
    private BigDecimal totalAmount;
    private BigDecimal discountAmount;
    private BigDecimal taxAmount;
    private BigDecimal netAmount;
    private BigDecimal paidAmount;
    private BigDecimal balanceAmount;
    private String paymentType;
    private String paymentStatus;  // ⭐ ADD THIS FIELD
    private String referenceNo;
    private String notes;
    private Boolean isReturned;
    private LocalDate createdAt;
    private LocalDate updatedAt;
    private List<PurchaseInvoiceItemResponse> items;

    @Data
    @Builder
    public static class PurchaseInvoiceItemResponse {
        private Long id;
        private String itemName;
        private String itemCode;
        private BigDecimal orderedQuantity;
        private BigDecimal receivedQuantity;
        private BigDecimal unitPrice;
        private BigDecimal discountPercent;
        private BigDecimal taxPercent;
        private BigDecimal totalAmount;
    }
}