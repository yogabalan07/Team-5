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
public class StockTransactionResponse {
    private Long id;
    private String itemName;
    private String itemCode;
    private LocalDateTime transactionDate;
    private String transactionType;
    private String referenceNo;
    private BigDecimal quantity;
    private BigDecimal previousStock;
    private BigDecimal newStock;
    private BigDecimal unitPrice;
    private LocalDateTime createdAt;
}