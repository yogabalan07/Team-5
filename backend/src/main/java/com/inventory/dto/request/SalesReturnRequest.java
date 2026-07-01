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
public class SalesReturnRequest {
    private String invoiceNo;
    private LocalDate returnDate;
    private String notes;
    private List<SalesReturnItemRequest> items;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SalesReturnItemRequest {
        private Long invoiceItemId;
        private BigDecimal quantity;
    }
}