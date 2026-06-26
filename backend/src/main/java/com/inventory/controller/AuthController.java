package com.inventory.controller;

import com.inventory.dto.AuthRequest;
import com.inventory.dto.AuthResponse;
import com.inventory.model.User;
import com.inventory.service.UserService;
import com.inventory.util.JwtUtil;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*", allowedHeaders = "*")
public class AuthController {
    private final AuthenticationManager authenticationManager;
    private final UserDetailsService userDetailsService;
    private final JwtUtil jwtUtil;
    private final UserService userService;

    public AuthController(AuthenticationManager authenticationManager, 
                         UserDetailsService userDetailsService,
                         JwtUtil jwtUtil,
                         UserService userService) {
        this.authenticationManager = authenticationManager;
        this.userDetailsService = userDetailsService;
        this.jwtUtil = jwtUtil;
        this.userService = userService;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody AuthRequest request) {
        try {
            System.out.println("🔐 Login attempt: " + request.getUsername());
            authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword())
            );
            final UserDetails userDetails = userDetailsService.loadUserByUsername(request.getUsername());
            final String token = jwtUtil.generateToken(userDetails);
            System.out.println("✅ Login successful for: " + request.getUsername());
            return ResponseEntity.ok(new AuthResponse(token, userDetails.getUsername()));
        } catch (Exception e) {
            System.out.println("❌ Login failed for: " + request.getUsername() + " - " + e.getMessage());
            Map<String, String> error = new HashMap<>();
            error.put("error", "Invalid username or password");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
        }
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody User user) {
        try {
            System.out.println("📝 Registering user: " + user.getUsername());
            User created = userService.createUser(user);
            System.out.println("✅ User registered: " + created.getUsername());
            return ResponseEntity.ok(created);
        } catch (Exception e) {
            System.out.println("❌ Registration failed: " + e.getMessage());
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        }
    }
}