package com.inventory.repository;

import com.inventory.model.BillReceipt;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface BillReceiptRepository extends JpaRepository<BillReceipt, Long> {
    Optional<BillReceipt> findByReceiptNo(String receiptNo);
    
    @Query("SELECT b FROM BillReceipt b WHERE b.receiptDate BETWEEN :startDate AND :endDate")
    Page<BillReceipt> findByDateRange(@Param("startDate") LocalDate startDate, 
                                      @Param("endDate") LocalDate endDate, 
                                      Pageable pageable);
    
    @Query("SELECT b FROM BillReceipt b WHERE b.customer.id = :customerId ORDER BY b.receiptDate DESC")
    List<BillReceipt> findByCustomerId(@Param("customerId") Long customerId);
    
    @Query("SELECT COALESCE(MAX(CAST(SUBSTRING(b.receiptNo, LENGTH(b.receiptNo) - 5) AS integer)), 0) FROM BillReceipt b WHERE b.receiptNo LIKE CONCAT(:prefix, '%')")
    Integer getMaxReceiptNumber(@Param("prefix") String prefix);
}