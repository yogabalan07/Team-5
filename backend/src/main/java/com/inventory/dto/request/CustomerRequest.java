package com.inventory.dto.request;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CustomerRequest {
    private String name;
    private String phone;
    private String email;
    private String address;
    private String area;
    private String gstNo;
    private BigDecimal openingBalance;
    private BigDecimal creditLimit;
}