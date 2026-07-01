package com.inventory.enums;

public enum TransactionType {
    PURCHASE("Purchase"),
    SALE("Sale"),
    SALES("Sales"),  // ⭐ ADD THIS - used in SalesServiceImpl
    PURCHASE_RETURN("Purchase Return"),
    SALE_RETURN("Sale Return"),
    ADJUSTMENT_IN("Adjustment In"),
    ADJUSTMENT_OUT("Adjustment Out"),
    ADJUSTMENT("Adjustment"),  // ⭐ ADD THIS - used in ItemServiceImpl and StockServiceImpl
    TRANSFER_IN("Transfer In"),
    TRANSFER_OUT("Transfer Out"),
    RETURN_OUT("Return Out"),
    RETURN_IN("Return In"),
    OPENING_STOCK("Opening Stock"),
    CLOSING_STOCK("Closing Stock"),
    DAMAGE("Damage"),
    EXPIRED("Expired"),
    OTHERS("Others");

    private final String displayName;

    TransactionType(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}