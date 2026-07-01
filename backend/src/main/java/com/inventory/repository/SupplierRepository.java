package com.inventory.repository;

import com.inventory.model.Supplier;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SupplierRepository extends JpaRepository<Supplier, Long> {
    Optional<Supplier> findByPhone(String phone);
    
    @Query("SELECT s FROM Supplier s WHERE LOWER(s.name) LIKE LOWER(CONCAT('%', :search, '%')) ORDER BY s.createdAt DESC")
    Page<Supplier> searchSuppliers(@Param("search") String search, Pageable pageable);
    
    @Query("SELECT s FROM Supplier s ORDER BY s.createdAt DESC")
    Page<Supplier> findAll(Pageable pageable);
    
    @Query("SELECT s FROM Supplier s ORDER BY s.createdAt DESC")
    List<Supplier> findTop10ByOrderByCreatedAtDesc();
    
    List<Supplier> findByIsActiveTrue();
}