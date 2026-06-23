package com.inventory.model;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = true)
public class UserRoleConverter implements AttributeConverter<UserRole, String> {

    @Override
    public String convertToDatabaseColumn(UserRole role) {
        return role == null ? UserRole.USER.getDatabaseValue() : role.getDatabaseValue();
    }

    @Override
    public UserRole convertToEntityAttribute(String value) {
        return UserRole.fromDatabaseValue(value);
    }
}
