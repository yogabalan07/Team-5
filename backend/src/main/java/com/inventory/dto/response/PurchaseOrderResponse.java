package com.inventory.dto.response;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
@Builder
public class PurchaseOrderResponse {
    private Long id;
    private String poNumber;
    private LocalDate poDate;
    private String supplierName;
    private String supplierPhone;
    private LocalDate expectedDeliveryDate;
    private BigDecimal totalAmount;
    private Boolean isConverted;
    private String notes;
    private LocalDate createdAt;  // ⭐ CHANGE from LocalDateTime to LocalDate
    private LocalDate updatedAt;  // ⭐ CHANGE from LocalDateTime to LocalDate
    private List<PurchaseOrderItemResponse> items;

    @Data
    @Builder
    public static class PurchaseOrderItemResponse {
        private Long id;
        private String itemName;
        private String itemCode;
        private BigDecimal quantity;
        private BigDecimal unitPrice;
        private BigDecimal totalAmount;
    }
}