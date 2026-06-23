package com.inventory.dto;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

// DTO for login response containing success status, message, token, username, and role.
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class LoginResponse {

    private boolean success;

    private String message;

    private String token;

    private String username;

    private String role;

    private Long userId;

    // Constructor for success response
    public LoginResponse(String token, String username, String role, Long userId) {
        this.success = true;
        this.message = "Login successful";
        this.token = token;
        this.username = username;
        this.role = role;
        this.userId = userId;
    }

    // Constructor for error response
    public LoginResponse(String message) {
        this.success = false;
        this.message = message;
    }
}
