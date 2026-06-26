package com.inventory.service;

import com.inventory.model.User;
import com.inventory.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import jakarta.annotation.PostConstruct;

@Service
public class UserService implements UserDetailsService {
    
    @Autowired
    private UserRepository userRepository;
    
    private final PasswordEncoder passwordEncoder;

    public UserService(PasswordEncoder passwordEncoder) {
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        System.out.println("🔍 loadUserByUsername called for: " + username);
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> {
                    System.out.println("❌ User not found: " + username);
                    return new UsernameNotFoundException("User not found with username: " + username);
                });
        System.out.println("✅ Found user: " + user.getUsername());
        System.out.println("   Password hash: " + user.getPassword());
        System.out.println("   Role: " + user.getRole());
        System.out.println("   Enabled: " + user.isEnabled());
        return user;
    }

    public User createUser(User user) {
        if (userRepository.existsByUsername(user.getUsername())) {
            throw new RuntimeException("Username already exists: " + user.getUsername());
        }
        String encodedPassword = passwordEncoder.encode(user.getPassword());
        System.out.println("📝 Encoding password for: " + user.getUsername());
        user.setPassword(encodedPassword);
        if (user.getRole() == null || user.getRole().isEmpty()) {
            user.setRole("User");
        }
        if (user.getStatus() == null || user.getStatus().isEmpty()) {
            user.setStatus("Active");
        }
        User saved = userRepository.save(user);
        System.out.println("✅ User saved: " + saved.getUsername());
        return saved;
    }

    @PostConstruct
    public void initDefaultUsers() {
        System.out.println("=========================================");
        System.out.println("🔄 Initializing default users...");
        System.out.println("=========================================");
        
        try {
            // Delete existing admin and manager to recreate with proper encoding
            if (userRepository.existsByUsername("admin")) {
                User admin = userRepository.findByUsername("admin").get();
                System.out.println("🔄 Recreating admin user...");
                userRepository.delete(admin);
            }
            
            if (userRepository.existsByUsername("manager")) {
                User manager = userRepository.findByUsername("manager").get();
                System.out.println("🔄 Recreating manager user...");
                userRepository.delete(manager);
            }
            
            // Create admin with proper encoding
            User admin = new User();
            admin.setUsername("admin");
            admin.setPassword(passwordEncoder.encode("admin123"));
            admin.setFullName("Administrator");
            admin.setEmail("admin@inventory.com");
            admin.setRole("Admin");
            admin.setStatus("Active");
            userRepository.save(admin);
            System.out.println("✅ Admin user created: admin / admin123");
            
            // Create manager with proper encoding
            User manager = new User();
            manager.setUsername("manager");
            manager.setPassword(passwordEncoder.encode("manager123"));
            manager.setFullName("Manager");
            manager.setEmail("manager@inventory.com");
            manager.setRole("Manager");
            manager.setStatus("Active");
            userRepository.save(manager);
            System.out.println("✅ Manager user created: manager / manager123");
            
            // Check if testuser exists, if not create it
            if (!userRepository.existsByUsername("testuser")) {
                User testuser = new User();
                testuser.setUsername("testuser");
                testuser.setPassword(passwordEncoder.encode("test123"));
                testuser.setFullName("Test User");
                testuser.setEmail("test@example.com");
                testuser.setRole("User");
                testuser.setStatus("Active");
                userRepository.save(testuser);
                System.out.println("✅ Test user created: testuser / test123");
            } else {
                System.out.println("✅ Test user already exists");
            }
            
            System.out.println("=========================================");
            System.out.println("✅ Default users initialization complete!");
            System.out.println("=========================================");
            
        } catch (Exception e) {
            System.err.println("❌ Error creating default users: " + e.getMessage());
            e.printStackTrace();
        }
    }
}