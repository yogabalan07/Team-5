package com.inventory.enums;

public enum PaymentStatus {
    PAID("Paid"),
    UNPAID("Unpaid"),
    PARTIAL("Partially Paid"),
    OVERDUE("Overdue"),
    CANCELLED("Cancelled");

    private final String displayName;

    PaymentStatus(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }

    public static PaymentStatus fromDisplayName(String displayName) {
        for (PaymentStatus status : PaymentStatus.values()) {
            if (status.getDisplayName().equalsIgnoreCase(displayName)) {
                return status;
            }
        }
        return null;
    }

    public static PaymentStatus determinePaymentStatus(java.math.BigDecimal paidAmount, java.math.BigDecimal netAmount) {
        if (paidAmount == null || netAmount == null) {
            return UNPAID;
        }
        
        int comparison = paidAmount.compareTo(netAmount);
        if (comparison == 0) {
            return PAID;
        } else if (paidAmount.compareTo(java.math.BigDecimal.ZERO) > 0 && comparison < 0) {
            return PARTIAL;
        } else {
            return UNPAID;
        }
    }
}