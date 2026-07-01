package com.inventory.service;

import com.inventory.model.User;

public interface AuthService {
    User registerUser(String username, String password, String email);
    User getUserByUsername(String username);
}