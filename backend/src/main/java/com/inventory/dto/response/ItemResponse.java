package com.inventory.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ItemResponse {
    private Long id;
    private String code;
    private String name;
    private String description;
    private String brandName;
    private String groupName;
    private String sectionName;
    private String unitName;
    private String taxName;
    private BigDecimal purchasePrice;
    private BigDecimal sellingPrice;
    private BigDecimal gstRate;
    private String hsnCode;
    private BigDecimal openingStock;
    private BigDecimal currentStock;
    private BigDecimal minStockLevel;
    private BigDecimal maxStockLevel;
    private BigDecimal reorderLevel;
    private Boolean isActive;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}