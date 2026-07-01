package com.inventory.service.impl;

import com.inventory.dto.request.SupplierRequest;
import com.inventory.dto.response.SupplierResponse;
import com.inventory.exception.BusinessException;
import com.inventory.exception.ResourceNotFoundException;
import com.inventory.model.Supplier;
import com.inventory.repository.SupplierRepository;
import com.inventory.service.SupplierService;
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
public class SupplierServiceImpl implements SupplierService {

    @Autowired
    private SupplierRepository supplierRepository;

    @Override
    public SupplierResponse createSupplier(SupplierRequest request) {
        if (supplierRepository.findByPhone(request.getPhone()).isPresent()) {
            throw new BusinessException("Supplier already exists with phone: " + request.getPhone());
        }

        Supplier supplier = new Supplier();
        supplier.setName(request.getName());
        supplier.setPhone(request.getPhone());
        supplier.setEmail(request.getEmail());
        supplier.setAddress(request.getAddress());
        supplier.setGstNo(request.getGstNo());
        supplier.setCreditBalance(BigDecimal.ZERO);
        supplier.setIsActive(true);

        Supplier saved = supplierRepository.save(supplier);
        return convertToResponse(saved);
    }

    @Override
    public SupplierResponse updateSupplier(Long id, SupplierRequest request) {
        Supplier supplier = supplierRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Supplier not found with id: " + id));

        supplier.setName(request.getName());
        supplier.setPhone(request.getPhone());
        supplier.setEmail(request.getEmail());
        supplier.setAddress(request.getAddress());
        supplier.setGstNo(request.getGstNo());

        Supplier updated = supplierRepository.save(supplier);
        return convertToResponse(updated);
    }

    @Override
    @Transactional
    public void deleteSupplier(Long id) {
        System.out.println("🗑️ Attempting to permanently delete supplier with ID: " + id);
        
        Supplier supplier = supplierRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Supplier not found with id: " + id));
        
        // HARD DELETE - Completely remove from database
        supplierRepository.delete(supplier);
        System.out.println("✅ Supplier permanently deleted from database: " + id + " - " + supplier.getName());
    }

    @Override
    public SupplierResponse getSupplierById(Long id) {
        Supplier supplier = supplierRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Supplier not found with id: " + id));
        return convertToResponse(supplier);
    }

    @Override
    public SupplierResponse getSupplierByPhone(String phone) {
        Supplier supplier = supplierRepository.findByPhone(phone)
            .orElseThrow(() -> new ResourceNotFoundException("Supplier not found with phone: " + phone));
        return convertToResponse(supplier);
    }

    @Override
    public Page<SupplierResponse> getAllSuppliers(Pageable pageable) {
        return supplierRepository.findAll(pageable)
            .map(this::convertToResponse);
    }

    @Override
    public Page<SupplierResponse> searchSuppliers(String search, Pageable pageable) {
        return supplierRepository.searchSuppliers(search, pageable)
            .map(this::convertToResponse);
    }

    @Override
    public List<SupplierResponse> getRecentSuppliers() {
        return supplierRepository.findTop10ByOrderByCreatedAtDesc()
            .stream()
            .map(this::convertToResponse)
            .collect(Collectors.toList());
    }

    private SupplierResponse convertToResponse(Supplier supplier) {
        return SupplierResponse.builder()
            .id(supplier.getId())
            .name(supplier.getName())
            .phone(supplier.getPhone())
            .email(supplier.getEmail())
            .address(supplier.getAddress())
            .gstNo(supplier.getGstNo())
            .creditBalance(supplier.getCreditBalance())
            .isActive(supplier.getIsActive())
            .createdAt(supplier.getCreatedAt())
            .updatedAt(supplier.getUpdatedAt())
            .build();
    }
}