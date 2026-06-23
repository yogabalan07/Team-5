package com.inventory.service;

import com.inventory.dto.LoginRequest;
import com.inventory.dto.LoginResponse;
import com.inventory.exception.AuthenticationException;
import com.inventory.model.User;
import com.inventory.model.UserRole;
import com.inventory.repository.UserRepository;
import com.inventory.security.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import java.util.Optional;

// Service for handling authentication operations including login and user initialization.
@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private PasswordEncoder passwordEncoder;

    /**
     * Authenticate user and generate JWT token.
     */
    public LoginResponse login(LoginRequest request) {
        String username = request.getUsername().trim();
        Optional<User> userOptional = userRepository.findByUsername(username);

        if (userOptional.isEmpty()) {
            throw new AuthenticationException("Invalid username or password");
        }

        User user = userOptional.get();

        if (!isPasswordValid(request.getPassword(), user)) {
            throw new AuthenticationException("Invalid username or password");
        }

        if (user.getStatus() != null && "Inactive".equalsIgnoreCase(user.getStatus())) {
            throw new AuthenticationException("Your account is inactive. Please contact an administrator.");
        }

        String role = user.getRole().getAuthorityValue();
        String token = jwtUtil.generateToken(user.getUsername(), role, user.getId());

        return new LoginResponse(token, user.getUsername(), user.getRole().getDatabaseValue(), user.getId());
    }

    private boolean isPasswordValid(String rawPassword, User user) {
        String storedPassword = user.getPassword();
        if (storedPassword == null) {
            return false;
        }

        if (storedPassword.startsWith("$2a$") || storedPassword.startsWith("$2b$") || storedPassword.startsWith("$2y$")) {
            return passwordEncoder.matches(rawPassword, storedPassword);
        }

        boolean matchesLegacyPlainText = storedPassword.equals(rawPassword);
        if (matchesLegacyPlainText) {
            user.setPassword(passwordEncoder.encode(rawPassword));
            userRepository.save(user);
        }

        return matchesLegacyPlainText;
    }

    /**
     * Create initial admin user if it doesn't exist.
     */
    public void initializeAdminIfNotExists() {
        if (!userRepository.existsByUsername("admin")) {
            User admin = new User();
            admin.setUsername("admin");
            admin.setPassword(passwordEncoder.encode("admin123"));
            admin.setRole(UserRole.ADMIN);
            admin.setFullName("System Administrator");
            admin.setEmail("admin@example.com");
            admin.setStatus("Active");
            userRepository.save(admin);
        }
    }
}
