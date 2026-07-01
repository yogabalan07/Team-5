package com.inventory.dto.request;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PurchaseInvoiceRequest {
    private LocalDate invoiceDate;
    private LocalDate receivedDate;
    private Long poId;
    private Long supplierId;
    private String paymentType;
    private String referenceNo;
    private String notes;
    private List<PurchaseInvoiceItemRequest> items;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PurchaseInvoiceItemRequest {
        private Long itemId;
        private Long poItemId;
        private Double orderedQuantity;
        private Double receivedQuantity;
        private Double unitPrice;
        private Double discountPercent;
        private Double taxPercent;
    }
}