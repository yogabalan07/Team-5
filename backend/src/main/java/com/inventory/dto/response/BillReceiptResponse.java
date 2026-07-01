package com.inventory.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BillReceiptResponse {
    private Long id;
    private String receiptNo;
    private LocalDate receiptDate;
    private String customerName;
    private String invoiceNo;
    private BigDecimal totalAmount;
    private BigDecimal adjustAmount;
    private BigDecimal balanceAmount;
    private String paymentMode;
    private String referenceNo;
    private String notes;
    private String createdBy;
    private LocalDateTime createdAt;
}