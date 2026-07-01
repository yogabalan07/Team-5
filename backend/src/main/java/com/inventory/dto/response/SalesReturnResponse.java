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
public class SalesReturnResponse {
    private Long id;
    private String returnNo;
    private LocalDate returnDate;
    private String invoiceNo;
    private String customerName;
    private BigDecimal totalReturnAmount;
    private String notes;
    private LocalDateTime createdAt;
    private List<SalesReturnItemResponse> items;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SalesReturnItemResponse {
        private Long id;
        private String itemName;
        private String itemCode;
        private BigDecimal quantity;
        private BigDecimal unitPrice;
        private BigDecimal totalAmount;
    }
}