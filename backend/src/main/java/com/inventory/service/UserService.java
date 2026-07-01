package com.inventory.service;

import com.inventory.dto.request.UserRequest;
import com.inventory.dto.response.UserResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Map;

public interface UserService {
    Page<UserResponse> getAllUsers(Pageable pageable);
    UserResponse getUserById(Long id);
    UserResponse createUser(UserRequest request);
    UserResponse updateUser(Long id, UserRequest request);
    void deleteUser(Long id);
    UserResponse toggleUserStatus(Long id);
    void resetPassword(Long id);
    List<Map<String, Object>> getRoles();
}