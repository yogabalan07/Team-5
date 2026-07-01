package com.inventory.dto.request;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ItemRequest {
    private String code;
    private String name;
    private String description;
    private Long brandId;
    private Long groupId;
    private Long sectionId;
    private Long unitId;
    private Long taxId;
    private BigDecimal purchasePrice;
    private BigDecimal sellingPrice;
    private BigDecimal gstRate;
    private String hsnCode;
    private BigDecimal openingStock;
    private BigDecimal currentStock;
    private BigDecimal minStockLevel;
    private BigDecimal maxStockLevel;
    private BigDecimal reorderLevel;
}