package com.inventory.service;

import com.inventory.model.Supplier;
import com.inventory.repository.SupplierRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class SupplierService {
    @Autowired
    private SupplierRepository supplierRepository;

    public List<Supplier> getAllSuppliers() {
        return supplierRepository.findAll();
    }

    public Supplier getSupplierById(Long id) {
        return supplierRepository.findById(id).orElseThrow(() -> new RuntimeException("Supplier not found"));
    }

    @Transactional
    public Supplier createSupplier(Supplier supplier) {
        // Validate required fields
        if (supplier.getSupplierId() == null || supplier.getSupplierId().isEmpty()) {
            throw new RuntimeException("Supplier ID is required");
        }
        if (supplier.getSupplierName() == null || supplier.getSupplierName().isEmpty()) {
            throw new RuntimeException("Supplier Name is required");
        }
        if (supplier.getPhone() == null || supplier.getPhone().isEmpty()) {
            throw new RuntimeException("Phone is required");
        }
        
        // Check if supplier ID already exists
        if (supplierRepository.findBySupplierId(supplier.getSupplierId()).isPresent()) {
            throw new RuntimeException("Supplier ID already exists: " + supplier.getSupplierId());
        }
        
        // Set default status if not provided
        if (supplier.getStatus() == null || supplier.getStatus().isEmpty()) {
            supplier.setStatus("Active");
        }
        
        return supplierRepository.save(supplier);
    }

    @Transactional
    public Supplier updateSupplier(Long id, Supplier supplier) {
        Supplier existingSupplier = getSupplierById(id);
        existingSupplier.setSupplierId(supplier.getSupplierId());
        existingSupplier.setSupplierName(supplier.getSupplierName());
        existingSupplier.setContactPerson(supplier.getContactPerson());
        existingSupplier.setPhone(supplier.getPhone());
        existingSupplier.setEmail(supplier.getEmail());
        existingSupplier.setAddress(supplier.getAddress());
        existingSupplier.setStatus(supplier.getStatus());
        return supplierRepository.save(existingSupplier);
    }

    @Transactional
    public void deleteSupplier(Long id) {
        supplierRepository.deleteById(id);
    }

    public Supplier getSupplierBySupplierId(String supplierId) {
        return supplierRepository.findBySupplierId(supplierId)
                .orElseThrow(() -> new RuntimeException("Supplier not found with ID: " + supplierId));
    }

    public List<Supplier> searchSuppliers(String query) {
        return supplierRepository.findBySupplierNameContainingIgnoreCase(query);
    }
}