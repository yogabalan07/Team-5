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
    
    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        System.out.println("🔍 Loading user: " + username);
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with username: " + username));
        System.out.println("✅ Found user: " + user.getUsername());
        return user;
    }

    public User createUser(User user) {
        // Check if username already exists
        if (userRepository.existsByUsername(user.getUsername())) {
            throw new RuntimeException("Username already exists: " + user.getUsername());
        }
        user.setPassword(passwordEncoder.encode(user.getPassword()));
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
            if (!userRepository.existsByUsername("admin")) {
                User admin = new User();
                admin.setUsername("admin");
                admin.setPassword(passwordEncoder.encode("admin123"));
                admin.setFullName("Administrator");
                admin.setEmail("admin@inventory.com");
                admin.setRole("Admin");
                admin.setStatus("Active");
                userRepository.save(admin);
                System.out.println("✅ Admin user created: admin / admin123");
            } else {
                System.out.println("✅ Admin user already exists");
            }
            
            if (!userRepository.existsByUsername("manager")) {
                User manager = new User();
                manager.setUsername("manager");
                manager.setPassword(passwordEncoder.encode("manager123"));
                manager.setFullName("Manager");
                manager.setEmail("manager@inventory.com");
                manager.setRole("Manager");
                manager.setStatus("Active");
                userRepository.save(manager);
                System.out.println("✅ Manager user created: manager / manager123");
            } else {
                System.out.println("✅ Manager user already exists");
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