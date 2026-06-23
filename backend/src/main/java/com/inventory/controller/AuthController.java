package com.inventory.controller;

import com.inventory.dto.ApiResponse;
import com.inventory.dto.LoginRequest;
import com.inventory.dto.LoginResponse;
import com.inventory.exception.AuthenticationException;
import com.inventory.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

// REST Controller for authentication endpoints including login.
@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"})
public class AuthController {

    @Autowired
    private AuthService authService;

    /**
     * Login endpoint - validates user credentials and returns JWT token.
     * 
     * @param request LoginRequest containing username, password, and role
     * @return LoginResponse with JWT token if credentials are valid
     */
    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        try {
            LoginResponse response = authService.login(request);
            return ResponseEntity.ok(response);
        } catch (AuthenticationException e) {
            LoginResponse errorResponse = new LoginResponse(e.getMessage());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(errorResponse);
        }
    }

    /**
     * Health check endpoint for verifying API connectivity.
     */
    @GetMapping("/health")
    public ResponseEntity<ApiResponse> health() {
        return ResponseEntity.ok(new ApiResponse(true, "API is healthy"));
    }
}
