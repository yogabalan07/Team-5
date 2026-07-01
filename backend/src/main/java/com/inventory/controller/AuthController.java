package com.inventory.controller;

import com.inventory.dto.request.AuthRequest;
import com.inventory.dto.response.AuthResponse;
import com.inventory.model.Role;
import com.inventory.model.User;
import com.inventory.repository.RoleRepository;
import com.inventory.repository.UserRepository;
import com.inventory.service.AuthService;
import com.inventory.util.JwtUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private static final Logger logger = LoggerFactory.getLogger(AuthController.class);

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private AuthService authService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    // ==================== TEST ENDPOINTS ====================

    @GetMapping("/test")
    public ResponseEntity<?> testEndpoint() {
        try {
            logger.info("🔍 Test endpoint called");
            
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Auth controller is working!");
            response.put("timestamp", System.currentTimeMillis());
            response.put("status", "UP");
            response.put("beans", Map.of(
                "authenticationManager", authenticationManager != null,
                "jwtUtil", jwtUtil != null,
                "authService", authService != null,
                "userRepository", userRepository != null,
                "roleRepository", roleRepository != null,
                "passwordEncoder", passwordEncoder != null
            ));
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("❌ Test endpoint error: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/test-db")
    public ResponseEntity<?> testDatabase() {
        try {
            logger.info("🧪 Testing database connection...");
            
            if (userRepository == null) {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "UserRepository is null - Bean not injected"));
            }
            
            long userCount = userRepository.count();
            long roleCount = roleRepository.count();
            
            Map<String, Object> response = new HashMap<>();
            response.put("userCount", userCount);
            response.put("roleCount", roleCount);
            response.put("connection", "OK");
            response.put("success", true);
            
            logger.info("✅ Database test completed. Users: {}, Roles: {}", userCount, roleCount);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("❌ Database test error: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/test-bcrypt")
    public ResponseEntity<?> testBcrypt() {
        try {
            logger.info("🧪 Testing BCrypt...");
            
            if (passwordEncoder == null) {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "PasswordEncoder is null"));
            }
            
            String raw = "admin123";
            String encoded = passwordEncoder.encode(raw);
            boolean matches = passwordEncoder.matches(raw, encoded);
            
            Map<String, Object> response = new HashMap<>();
            response.put("raw", raw);
            response.put("encoded", encoded);
            response.put("matches", matches);
            response.put("success", true);
            
            logger.info("✅ BCrypt test completed. Matches: {}", matches);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("❌ BCrypt test error: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", e.getMessage()));
        }
    }

    // ==================== USER MANAGEMENT ====================

    @GetMapping("/check-user")
    public ResponseEntity<?> checkUser() {
        try {
            logger.info("🔍 Checking if admin user exists...");
            
            if (authService == null) {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "AuthService is null - Bean not injected"));
            }
            
            User user = authService.getUserByUsername("admin");
            
            Map<String, Object> response = new HashMap<>();
            response.put("exists", true);
            response.put("username", user.getUsername());
            response.put("email", user.getEmail());
            response.put("fullName", user.getFullName());
            response.put("hasRoles", !user.getRoles().isEmpty());
            response.put("roleCount", user.getRoles().size());
            response.put("isActive", user.getIsActive());
            
            logger.info("✅ Admin user found: {}", user.getUsername());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("❌ Check user error: {}", e.getMessage(), e);
            
            Map<String, Object> response = new HashMap<>();
            response.put("exists", false);
            response.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
        }
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword() {
        try {
            logger.info("🔑 Resetting admin password...");
            
            if (authService == null || userRepository == null || passwordEncoder == null) {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Required beans are null"));
            }
            
            User user = authService.getUserByUsername("admin");
            
            String encodedPassword = passwordEncoder.encode("admin123");
            user.setPassword(encodedPassword);
            userRepository.save(user);
            
            logger.info("✅ Password reset successful for admin");
            
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Password reset successfully");
            response.put("username", user.getUsername());
            response.put("success", true);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("❌ Reset password error: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", e.getMessage()));
        }
    }

    // ==================== DATABASE INITIALIZATION ====================

    @GetMapping("/init")
    public ResponseEntity<?> initializeDatabase() {
        try {
            logger.info("🔧 Initializing database with default roles and admin user...");
            
            Map<String, Object> result = new HashMap<>();
            result.put("rolesCreated", new HashMap<String, Boolean>());
            result.put("adminCreated", false);
            
            // Create ADMIN role if it doesn't exist
            if (!roleRepository.findByName("ADMIN").isPresent()) {
                Role adminRole = new Role();
                adminRole.setName("ADMIN");
                adminRole.setDescription("Full system access - all permissions");
                roleRepository.save(adminRole);
                logger.info("✅ ADMIN role created");
                ((Map<String, Boolean>) result.get("rolesCreated")).put("ADMIN", true);
            } else {
                logger.info("✅ ADMIN role already exists");
                ((Map<String, Boolean>) result.get("rolesCreated")).put("ADMIN", false);
            }
            
            // Create USER role if it doesn't exist
            if (!roleRepository.findByName("USER").isPresent()) {
                Role userRole = new Role();
                userRole.setName("USER");
                userRole.setDescription("Standard user access");
                roleRepository.save(userRole);
                logger.info("✅ USER role created");
                ((Map<String, Boolean>) result.get("rolesCreated")).put("USER", true);
            } else {
                logger.info("✅ USER role already exists");
                ((Map<String, Boolean>) result.get("rolesCreated")).put("USER", false);
            }
            
            // Create admin user if it doesn't exist
            if (!userRepository.findByUsername("admin").isPresent()) {
                User admin = new User();
                admin.setUsername("admin");
                admin.setPassword(passwordEncoder.encode("admin123"));
                admin.setEmail("admin@inventory.com");
                admin.setFullName("System Administrator");
                admin.setIsActive(true);
                
                Role adminRole = roleRepository.findByName("ADMIN")
                    .orElseThrow(() -> new RuntimeException("ADMIN role not found"));
                Set<Role> roles = new HashSet<>();
                roles.add(adminRole);
                admin.setRoles(roles);
                
                userRepository.save(admin);
                logger.info("✅ Admin user created");
                result.put("adminCreated", true);
            } else {
                logger.info("✅ Admin user already exists");
                result.put("adminCreated", false);
            }
            
            result.put("message", "Database initialized successfully");
            result.put("success", true);
            
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            logger.error("❌ Database initialization failed: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/setup")
    public ResponseEntity<?> setupDatabase() {
        try {
            logger.info("🔧 Setting up database with default roles and admin user...");
            
            Map<String, Object> result = new HashMap<>();
            result.put("rolesCreated", new HashMap<String, Boolean>());
            result.put("adminCreated", false);
            
            // Create ADMIN role
            Role adminRole = roleRepository.findByName("ADMIN")
                .orElseGet(() -> {
                    Role r = new Role();
                    r.setName("ADMIN");
                    r.setDescription("Full system access - all permissions");
                    Role saved = roleRepository.save(r);
                    logger.info("✅ ADMIN role created");
                    ((Map<String, Boolean>) result.get("rolesCreated")).put("ADMIN", true);
                    return saved;
                });
            
            // Create USER role
            Role userRole = roleRepository.findByName("USER")
                .orElseGet(() -> {
                    Role r = new Role();
                    r.setName("USER");
                    r.setDescription("Standard user access");
                    Role saved = roleRepository.save(r);
                    logger.info("✅ USER role created");
                    ((Map<String, Boolean>) result.get("rolesCreated")).put("USER", true);
                    return saved;
                });
            
            // Create admin user
            if (!userRepository.findByUsername("admin").isPresent()) {
                User admin = new User();
                admin.setUsername("admin");
                admin.setPassword(passwordEncoder.encode("admin123"));
                admin.setEmail("admin@inventory.com");
                admin.setFullName("System Administrator");
                admin.setIsActive(true);
                
                Set<Role> roles = new HashSet<>();
                roles.add(adminRole);
                admin.setRoles(roles);
                
                userRepository.save(admin);
                logger.info("✅ Admin user created");
                result.put("adminCreated", true);
            } else {
                logger.info("✅ Admin user already exists");
                result.put("adminCreated", false);
            }
            
            result.put("message", "Database setup complete!");
            result.put("credentials", "admin / admin123");
            result.put("success", true);
            
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            logger.error("❌ Setup failed: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", e.getMessage()));
        }
    }

    // ==================== AUTHENTICATION ====================

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody AuthRequest authRequest) {
        try {
            logger.info("📝 Registration attempt for user: {}", authRequest.getUsername());
            
            if (authService == null || userRepository == null) {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Required beans are null"));
            }
            
            if (userRepository.existsByUsername(authRequest.getUsername())) {
                return ResponseEntity.badRequest().body(Map.of(
                    "error", "Username already exists",
                    "success", false
                ));
            }
            
            if (userRepository.existsByEmail(authRequest.getUsername() + "@email.com")) {
                return ResponseEntity.badRequest().body(Map.of(
                    "error", "Email already exists",
                    "success", false
                ));
            }
            
            User user = authService.registerUser(
                authRequest.getUsername(), 
                authRequest.getPassword(), 
                authRequest.getUsername() + "@email.com"
            );
            
            logger.info("✅ Registration successful for user: {}", authRequest.getUsername());
            
            return ResponseEntity.ok(Map.of(
                "message", "User registered successfully",
                "username", user.getUsername(),
                "email", user.getEmail(),
                "success", true
            ));
            
        } catch (Exception e) {
            logger.error("❌ Registration error: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Registration failed: " + e.getMessage()));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody AuthRequest authRequest) {
        try {
            logger.info("🔐 Login attempt for user: {}", authRequest.getUsername());
            
            if (authenticationManager == null || jwtUtil == null || authService == null) {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Required beans are null - Check Spring configuration"));
            }
            
            // Authenticate the user
            Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                    authRequest.getUsername(),
                    authRequest.getPassword()
                )
            );

            UserDetails userDetails = (UserDetails) authentication.getPrincipal();
            
            // Generate JWT token
            String token = jwtUtil.generateToken(userDetails);
            
            // Get user details
            User user = authService.getUserByUsername(authRequest.getUsername());
            
            // Get user role
            String role = user.getRoles().stream()
                .findFirst()
                .map(r -> r.getName())
                .orElse("USER");

            logger.info("✅ Login successful for user: {}", authRequest.getUsername());

            // Create response
            AuthResponse response = new AuthResponse(
                token,
                user.getUsername(),
                user.getFullName(),
                user.getEmail(),
                role,
                user.getId(),
                "Login successful",
                true
            );

            return ResponseEntity.ok(response);
            
        } catch (BadCredentialsException e) {
            logger.warn("❌ Invalid credentials for user: {}", authRequest.getUsername());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of(
                    "error", "Invalid username or password",
                    "success", false
                ));
            
        } catch (Exception e) {
            logger.error("❌ Login error: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of(
                    "error", "Login failed: " + e.getMessage(),
                    "type", e.getClass().getSimpleName(),
                    "success", false
                ));
        }
    }
}