package com.inventory.dto.request;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BillPaymentRequest {
    private LocalDate paymentDate;
    private Long supplierId;
    private Long invoiceId;
    private BigDecimal totalAmount;
    private BigDecimal adjustAmount;
    private BigDecimal balanceAmount;
    private String paymentMode;
    private String referenceNo;
    private String notes;
}