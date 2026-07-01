package com.inventory.repository;

import com.inventory.model.PurchaseOrder;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface PurchaseOrderRepository extends JpaRepository<PurchaseOrder, Long> {

    Optional<PurchaseOrder> findByPoNumber(String poNumber);

    Page<PurchaseOrder> findBySupplierId(Long supplierId, Pageable pageable);

    Page<PurchaseOrder> findByPoDateBetween(LocalDate startDate, LocalDate endDate, Pageable pageable);

    List<PurchaseOrder> findByPoDateBetween(LocalDate startDate, LocalDate endDate);

    /**
     * Get the next sequence number for purchase orders
     * This extracts the last 6 digits (XXXXXX) and finds the max
     */
    @Query("SELECT MAX(CAST(SUBSTRING(p.poNumber, LENGTH(p.poNumber) - 5) AS integer)) FROM PurchaseOrder p WHERE p.poNumber LIKE CONCAT(:prefix, '%')")
    Integer getMaxPONumber(@Param("prefix") String prefix);

    /**
     * Alternative: Get all PO numbers with prefix and find max sequence
     */
    @Query("SELECT p.poNumber FROM PurchaseOrder p WHERE p.poNumber LIKE CONCAT(:prefix, '%')")
    List<String> findPONumbersByPrefix(@Param("prefix") String prefix);

    Page<PurchaseOrder> findByIsConvertedTrue(Pageable pageable);
    
    Page<PurchaseOrder> findByIsConvertedFalse(Pageable pageable);
    
    long countByIsConvertedTrue();
    
    long countByIsConvertedFalse();

    @Query("SELECT COALESCE(SUM(p.totalAmount), 0) FROM PurchaseOrder p")
    BigDecimal sumTotalAmount();

    @Query("SELECT p FROM PurchaseOrder p ORDER BY p.createdAt DESC")
    Page<PurchaseOrder> findAllByOrderByCreatedAtDesc(Pageable pageable);

    @Query("SELECT p FROM PurchaseOrder p WHERE LOWER(p.poNumber) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(p.supplier.name) LIKE LOWER(CONCAT('%', :keyword, '%'))")
    Page<PurchaseOrder> search(@Param("keyword") String keyword, Pageable pageable);
}