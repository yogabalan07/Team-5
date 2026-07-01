package com.inventory.dto.request;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PurchaseOrderRequest {
    private LocalDate poDate;
    private Long supplierId;
    private LocalDate expectedDeliveryDate;
    private String notes;
    private List<PurchaseOrderItemRequest> items;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PurchaseOrderItemRequest {
        private Long itemId;
        private Double quantity;
        private Double unitPrice;
    }
}