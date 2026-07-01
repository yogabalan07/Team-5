package com.inventory.service;

import com.inventory.dto.request.SupplierRequest;
import com.inventory.dto.response.SupplierResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface SupplierService {
    SupplierResponse createSupplier(SupplierRequest request);
    SupplierResponse updateSupplier(Long id, SupplierRequest request);
    void deleteSupplier(Long id);
    SupplierResponse getSupplierById(Long id);
    SupplierResponse getSupplierByPhone(String phone);
    Page<SupplierResponse> getAllSuppliers(Pageable pageable);
    Page<SupplierResponse> searchSuppliers(String search, Pageable pageable);
    List<SupplierResponse> getRecentSuppliers();
}