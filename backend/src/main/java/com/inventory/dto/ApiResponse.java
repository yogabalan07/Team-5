package com.inventory.dto;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

// Generic API response DTO for consistent response format across all endpoints.
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ApiResponse {

    private boolean success;

    private String message;

    private Object data;

    public ApiResponse(boolean success, String message) {
        this.success = success;
        this.message = message;
    }
}
