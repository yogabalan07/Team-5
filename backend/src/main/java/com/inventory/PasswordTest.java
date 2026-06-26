package com.inventory;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

public class PasswordTest {
    public static void main(String[] args) {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        
        // Test admin password
        String adminPassword = "admin123";
        String adminHash = encoder.encode(adminPassword);
        System.out.println("Admin Password: " + adminPassword);
        System.out.println("Admin Hash: " + adminHash);
        System.out.println("Matches: " + encoder.matches(adminPassword, adminHash));
        
        // Test manager password
        String managerPassword = "manager123";
        String managerHash = encoder.encode(managerPassword);
        System.out.println("\nManager Password: " + managerPassword);
        System.out.println("Manager Hash: " + managerHash);
        System.out.println("Matches: " + encoder.matches(managerPassword, managerHash));
        
        // Test testuser password
        String testPassword = "test123";
        String testHash = encoder.encode(testPassword);
        System.out.println("\nTest Password: " + testPassword);
        System.out.println("Test Hash: " + testHash);
        System.out.println("Matches: " + encoder.matches(testPassword, testHash));
    }
}