package com.inventory.enums;

public enum PaymentType {
    CASH("Cash"),
    CREDIT("Credit"),
    CHEQUE("Cheque"),
    BANK_TRANSFER("Bank Transfer"),
    CARD("Card"),
    UPI("UPI");

    private final String displayName;

    PaymentType(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }

    public static PaymentType fromDisplayName(String displayName) {
        for (PaymentType type : PaymentType.values()) {
            if (type.getDisplayName().equalsIgnoreCase(displayName)) {
                return type;
            }
        }
        return null;
    }
}