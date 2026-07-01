package com.inventory.repository;

import com.inventory.model.Item;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface ItemRepository extends JpaRepository<Item, Long> {
    
    // ====== BASIC QUERIES ======
    Optional<Item> findByCode(String code);
    List<Item> findByIsActiveTrue();
    
    // ====== PAGINATED QUERIES WITH SORTING ======
    
    @Query("SELECT i FROM Item i WHERE LOWER(i.name) LIKE LOWER(CONCAT('%', :search, '%')) OR i.code LIKE CONCAT('%', :search, '%') ORDER BY i.createdAt DESC")
    Page<Item> searchItems(@Param("search") String search, Pageable pageable);
    
    @Query("SELECT i FROM Item i ORDER BY i.createdAt DESC")
    Page<Item> findAll(Pageable pageable);
    
    // Include inactive items as well (for admin purposes)
    @Query("SELECT i FROM Item i ORDER BY i.createdAt DESC")
    Page<Item> findAllIncludingInactive(Pageable pageable);
    
    // ====== STOCK RELATED QUERIES ======
    
    @Query("SELECT i FROM Item i WHERE i.currentStock <= i.minStockLevel AND i.isActive = true ORDER BY i.currentStock ASC")
    List<Item> findLowStockItems();
    
    @Query("SELECT i FROM Item i WHERE i.currentStock <= :threshold AND i.isActive = true")
    List<Item> findItemsBelowStock(@Param("threshold") BigDecimal threshold);
    
    // ====== FILTER BY MASTER DATA ======
    
    @Query("SELECT i FROM Item i WHERE i.brand.id IN :brandIds AND i.isActive = true ORDER BY i.createdAt DESC")
    List<Item> findByBrandIds(@Param("brandIds") List<Long> brandIds);
    
    @Query("SELECT i FROM Item i WHERE i.group.id IN :groupIds AND i.isActive = true ORDER BY i.createdAt DESC")
    List<Item> findByGroupIds(@Param("groupIds") List<Long> groupIds);
    
    @Query("SELECT i FROM Item i WHERE i.section.id IN :sectionIds AND i.isActive = true ORDER BY i.createdAt DESC")
    List<Item> findBySectionIds(@Param("sectionIds") List<Long> sectionIds);
    
    @Query("SELECT i FROM Item i WHERE i.unit.id IN :unitIds AND i.isActive = true ORDER BY i.createdAt DESC")
    List<Item> findByUnitIds(@Param("unitIds") List<Long> unitIds);
    
    @Query("SELECT i FROM Item i WHERE i.tax.id IN :taxIds AND i.isActive = true ORDER BY i.createdAt DESC")
    List<Item> findByTaxIds(@Param("taxIds") List<Long> taxIds);
    
    // ====== STATISTICS AND AGGREGATION ======
    
    @Query("SELECT COALESCE(SUM(i.currentStock * i.purchasePrice), 0) FROM Item i WHERE i.isActive = true")
    BigDecimal getTotalStockValue();
    
    @Query("SELECT COALESCE(SUM(i.currentStock), 0) FROM Item i WHERE i.isActive = true")
    BigDecimal getTotalStockQuantity();
    
    @Query("SELECT COUNT(i) FROM Item i WHERE i.currentStock <= i.minStockLevel AND i.isActive = true")
    Long countLowStockItems();
    
    @Query("SELECT COUNT(i) FROM Item i WHERE i.currentStock <= 0 AND i.isActive = true")
    Long countOutOfStockItems();
    
    // ====== TOP LISTS ======
    
    @Query("SELECT i FROM Item i WHERE i.isActive = true ORDER BY i.createdAt DESC")
    List<Item> findTop10ByOrderByCreatedAtDesc();
    
    @Query("SELECT i FROM Item i WHERE i.isActive = true ORDER BY i.sellingPrice DESC")
    List<Item> findTop10ByOrderBySellingPriceDesc();
}