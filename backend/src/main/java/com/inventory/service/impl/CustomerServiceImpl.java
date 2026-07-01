package com.inventory.service.impl;

import com.inventory.dto.request.CustomerRequest;
import com.inventory.dto.response.CustomerResponse;
import com.inventory.exception.BusinessException;
import com.inventory.exception.ResourceNotFoundException;
import com.inventory.model.Customer;
import com.inventory.repository.CustomerRepository;
import com.inventory.service.CustomerService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class CustomerServiceImpl implements CustomerService {

    @Autowired
    private CustomerRepository customerRepository;

    @Override
    public CustomerResponse createCustomer(CustomerRequest request) {
        if (customerRepository.findByPhone(request.getPhone()).isPresent()) {
            throw new BusinessException("Customer already exists with phone: " + request.getPhone());
        }

        Customer customer = new Customer();
        customer.setName(request.getName());
        customer.setPhone(request.getPhone());
        customer.setEmail(request.getEmail());
        customer.setAddress(request.getAddress());
        customer.setArea(request.getArea());
        customer.setGstNo(request.getGstNo());
        customer.setOpeningBalance(request.getOpeningBalance() != null ? request.getOpeningBalance() : BigDecimal.ZERO);
        customer.setCreditLimit(request.getCreditLimit() != null ? request.getCreditLimit() : BigDecimal.ZERO);
        customer.setCreditBalance(customer.getOpeningBalance());
        customer.setIsActive(true);

        Customer saved = customerRepository.save(customer);
        return convertToResponse(saved);
    }

    @Override
    public CustomerResponse updateCustomer(Long id, CustomerRequest request) {
        Customer customer = customerRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Customer not found with id: " + id));

        customer.setName(request.getName());
        customer.setPhone(request.getPhone());
        customer.setEmail(request.getEmail());
        customer.setAddress(request.getAddress());
        customer.setArea(request.getArea());
        customer.setGstNo(request.getGstNo());
        customer.setCreditLimit(request.getCreditLimit() != null ? request.getCreditLimit() : BigDecimal.ZERO);

        Customer updated = customerRepository.save(customer);
        return convertToResponse(updated);
    }

    @Override
    @Transactional
    public void deleteCustomer(Long id) {
        System.out.println("🗑️ Attempting to permanently delete customer with ID: " + id);
        
        Customer customer = customerRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Customer not found with id: " + id));
        
        // HARD DELETE - Completely remove from database
        customerRepository.delete(customer);
        System.out.println("✅ Customer permanently deleted from database: " + id + " - " + customer.getName());
    }

    @Override
    public CustomerResponse getCustomerById(Long id) {
        Customer customer = customerRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Customer not found with id: " + id));
        return convertToResponse(customer);
    }

    @Override
    public CustomerResponse getCustomerByPhone(String phone) {
        Customer customer = customerRepository.findByPhone(phone)
            .orElseThrow(() -> new ResourceNotFoundException("Customer not found with phone: " + phone));
        return convertToResponse(customer);
    }

    @Override
    public Page<CustomerResponse> getAllCustomers(Pageable pageable) {
        return customerRepository.findAll(pageable)
            .map(this::convertToResponse);
    }

    @Override
    public Page<CustomerResponse> searchCustomers(String search, Pageable pageable) {
        return customerRepository.searchCustomers(search, pageable)
            .map(this::convertToResponse);
    }

    @Override
    public List<CustomerResponse> getRecentCustomers() {
        return customerRepository.findTop10ByOrderByCreatedAtDesc()
            .stream()
            .map(this::convertToResponse)
            .collect(Collectors.toList());
    }

    private CustomerResponse convertToResponse(Customer customer) {
        return CustomerResponse.builder()
            .id(customer.getId())
            .name(customer.getName())
            .phone(customer.getPhone())
            .email(customer.getEmail())
            .address(customer.getAddress())
            .area(customer.getArea())
            .gstNo(customer.getGstNo())
            .openingBalance(customer.getOpeningBalance())
            .creditLimit(customer.getCreditLimit())
            .creditBalance(customer.getCreditBalance())
            .isActive(customer.getIsActive())
            .createdAt(customer.getCreatedAt())
            .updatedAt(customer.getUpdatedAt())
            .build();
    }
}