package com.inventory.repository;

import com.inventory.model.Customer;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CustomerRepository extends JpaRepository<Customer, Long> {
    Optional<Customer> findByPhone(String phone);
    
    @Query("SELECT c FROM Customer c WHERE LOWER(c.name) LIKE LOWER(CONCAT('%', :search, '%')) OR c.phone LIKE CONCAT('%', :search, '%') ORDER BY c.createdAt DESC")
    Page<Customer> searchCustomers(@Param("search") String search, Pageable pageable);
    
    @Query("SELECT c FROM Customer c ORDER BY c.createdAt DESC")
    Page<Customer> findAll(Pageable pageable);
    
    @Query("SELECT c FROM Customer c ORDER BY c.createdAt DESC")
    List<Customer> findTop10ByOrderByCreatedAtDesc();
    
    List<Customer> findByIsActiveTrue();
}