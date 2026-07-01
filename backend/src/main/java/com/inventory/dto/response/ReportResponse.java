package com.inventory.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReportResponse {
    private Long id;
    private String invoiceNo;
    private LocalDate invoiceDate;
    private String customerName;
    private String supplierName;
    private String itemName;
    private String itemCode;
    private String brandName;
    private String groupName;
    private BigDecimal quantity;
    private BigDecimal unitPrice;
    private BigDecimal totalAmount;
    private BigDecimal netAmount;
    private String paymentType;
    private Map<String, Object> additionalFields;

    /**
     * Get discount amount from additionalFields
     */
    public BigDecimal getDiscountAmount() {
        if (additionalFields != null && additionalFields.get("discountAmount") != null) {
            Object value = additionalFields.get("discountAmount");
            if (value instanceof BigDecimal) {
                return (BigDecimal) value;
            } else if (value instanceof Number) {
                return BigDecimal.valueOf(((Number) value).doubleValue());
            }
        }
        return BigDecimal.ZERO;
    }

    /**
     * Get tax amount from additionalFields
     */
    public BigDecimal getTaxAmount() {
        if (additionalFields != null && additionalFields.get("taxAmount") != null) {
            Object value = additionalFields.get("taxAmount");
            if (value instanceof BigDecimal) {
                return (BigDecimal) value;
            } else if (value instanceof Number) {
                return BigDecimal.valueOf(((Number) value).doubleValue());
            }
        }
        return BigDecimal.ZERO;
    }

    /**
     * Get opening stock from additionalFields
     */
    public BigDecimal getOpeningStock() {
        if (additionalFields != null && additionalFields.get("openingStock") != null) {
            Object value = additionalFields.get("openingStock");
            if (value instanceof BigDecimal) {
                return (BigDecimal) value;
            } else if (value instanceof Number) {
                return BigDecimal.valueOf(((Number) value).doubleValue());
            }
        }
        return BigDecimal.ZERO;
    }

    /**
     * Get purchases from additionalFields
     */
    public BigDecimal getPurchases() {
        if (additionalFields != null && additionalFields.get("purchases") != null) {
            Object value = additionalFields.get("purchases");
            if (value instanceof BigDecimal) {
                return (BigDecimal) value;
            } else if (value instanceof Number) {
                return BigDecimal.valueOf(((Number) value).doubleValue());
            }
        }
        return BigDecimal.ZERO;
    }

    /**
     * Get sales from additionalFields
     */
    public BigDecimal getSales() {
        if (additionalFields != null && additionalFields.get("sales") != null) {
            Object value = additionalFields.get("sales");
            if (value instanceof BigDecimal) {
                return (BigDecimal) value;
            } else if (value instanceof Number) {
                return BigDecimal.valueOf(((Number) value).doubleValue());
            }
        }
        return BigDecimal.ZERO;
    }

    /**
     * Get closing stock from additionalFields
     */
    public BigDecimal getClosingStock() {
        if (additionalFields != null && additionalFields.get("closingStock") != null) {
            Object value = additionalFields.get("closingStock");
            if (value instanceof BigDecimal) {
                return (BigDecimal) value;
            } else if (value instanceof Number) {
                return BigDecimal.valueOf(((Number) value).doubleValue());
            }
        }
        return BigDecimal.ZERO;
    }
}