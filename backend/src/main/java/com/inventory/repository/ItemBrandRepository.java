package com.inventory.repository;

import com.inventory.model.ItemBrand;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ItemBrandRepository extends JpaRepository<ItemBrand, Long> {
    Optional<ItemBrand> findByName(String name);
    
    @Query("SELECT b FROM ItemBrand b ORDER BY b.createdAt DESC")
    List<ItemBrand> findAll();
    
    List<ItemBrand> findByIsActiveTrue();
}