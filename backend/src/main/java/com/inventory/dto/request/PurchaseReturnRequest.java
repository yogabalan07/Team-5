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
public class PurchaseReturnRequest {
    private String invoiceNo;
    private LocalDate returnDate;
    private String notes;
    private List<PurchaseReturnItemRequest> items;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PurchaseReturnItemRequest {
        private Long itemId;
        private BigDecimal quantity;
        private BigDecimal unitPrice;
    }
}