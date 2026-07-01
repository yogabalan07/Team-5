package com.inventory.service;

import com.inventory.dto.request.CustomerRequest;
import com.inventory.dto.response.CustomerResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface CustomerService {
    CustomerResponse createCustomer(CustomerRequest request);
    CustomerResponse updateCustomer(Long id, CustomerRequest request);
    void deleteCustomer(Long id);
    CustomerResponse getCustomerById(Long id);
    CustomerResponse getCustomerByPhone(String phone);
    Page<CustomerResponse> getAllCustomers(Pageable pageable);
    Page<CustomerResponse> searchCustomers(String search, Pageable pageable);
    List<CustomerResponse> getRecentCustomers();
}