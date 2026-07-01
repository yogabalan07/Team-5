package com.inventory.repository;

import com.inventory.model.BillPayment;
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
public interface BillPaymentRepository extends JpaRepository<BillPayment, Long> {
    Optional<BillPayment> findByPaymentNo(String paymentNo);
    
    @Query("SELECT b FROM BillPayment b WHERE b.paymentDate BETWEEN :startDate AND :endDate")
    Page<BillPayment> findByDateRange(@Param("startDate") LocalDate startDate, 
                                      @Param("endDate") LocalDate endDate, 
                                      Pageable pageable);
    
    @Query("SELECT b FROM BillPayment b WHERE b.supplier.id = :supplierId ORDER BY b.paymentDate DESC")
    List<BillPayment> findBySupplierId(@Param("supplierId") Long supplierId);
    
    @Query("SELECT COALESCE(MAX(CAST(SUBSTRING(b.paymentNo, LENGTH(b.paymentNo) - 5) AS integer)), 0) FROM BillPayment b WHERE b.paymentNo LIKE CONCAT(:prefix, '%')")
    Integer getMaxPaymentNumber(@Param("prefix") String prefix);
}