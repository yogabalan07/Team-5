package com.inventory.repository;

import com.inventory.enums.TransactionType;
import com.inventory.model.StockTransaction;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface StockTransactionRepository extends JpaRepository<StockTransaction, Long> {
    
    @Query("SELECT s FROM StockTransaction s WHERE s.item.id = :itemId ORDER BY s.createdAt DESC")
    List<StockTransaction> findByItemId(@Param("itemId") Long itemId);
    
    @Query("SELECT s FROM StockTransaction s WHERE s.transactionType = :type AND s.createdAt BETWEEN :startDate AND :endDate")
    Page<StockTransaction> findByTypeAndDateRange(@Param("type") TransactionType type,
                                                   @Param("startDate") LocalDateTime startDate,
                                                   @Param("endDate") LocalDateTime endDate,
                                                   Pageable pageable);
    
    @Query("SELECT s FROM StockTransaction s WHERE s.createdAt BETWEEN :startDate AND :endDate")
    Page<StockTransaction> findByDateRange(@Param("startDate") LocalDateTime startDate,
                                           @Param("endDate") LocalDateTime endDate,
                                           Pageable pageable);
    
    @Query("SELECT s FROM StockTransaction s WHERE s.item.id = :itemId AND s.transactionType = :type")
    List<StockTransaction> findByItemIdAndType(@Param("itemId") Long itemId,
                                                @Param("type") TransactionType type);
}