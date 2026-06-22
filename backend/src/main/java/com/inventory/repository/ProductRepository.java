package com.inventory.repository;

import com.inventory.model.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

// Placeholder repository interface for future product database operations.
@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {
}
