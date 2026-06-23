package com.inventory.model;

// Enumeration for user roles as stored in the Clever Cloud users table.
public enum UserRole {
    ADMIN("Admin"),
    MANAGER("Manager"),
    USER("User");

    private final String databaseValue;

    UserRole(String databaseValue) {
        this.databaseValue = databaseValue;
    }

    public String getDatabaseValue() {
        return databaseValue;
    }

    public String getAuthorityValue() {
        return name();
    }

    public static UserRole fromDatabaseValue(String value) {
        if (value == null || value.isBlank()) {
            return USER;
        }

        String normalized = value.trim();
        if ("STAFF".equalsIgnoreCase(normalized)) {
            return USER;
        }

        for (UserRole role : values()) {
            if (role.databaseValue.equalsIgnoreCase(normalized) || role.name().equalsIgnoreCase(normalized)) {
                return role;
            }
        }

        throw new IllegalArgumentException("Unsupported user role: " + value);
    }
}
