package com.inventory.repository;

import com.inventory.model.SalesReturn;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SalesReturnRepository extends JpaRepository<SalesReturn, Long> {
    Optional<SalesReturn> findByReturnNo(String returnNo);
    
    @Query("SELECT sr FROM SalesReturn sr WHERE sr.invoice.id = :invoiceId")
    List<SalesReturn> findByInvoiceId(@Param("invoiceId") Long invoiceId);
    
    @Query("SELECT sr FROM SalesReturn sr WHERE sr.customer.id = :customerId")
    List<SalesReturn> findByCustomerId(@Param("customerId") Long customerId);
    
    // FIXED: Extract the last 6 digits from the return number
    @Query("SELECT COALESCE(MAX(CAST(SUBSTRING(sr.returnNo, LENGTH(sr.returnNo) - 5) AS integer)), 0) FROM SalesReturn sr WHERE sr.returnNo LIKE CONCAT(:prefix, '%')")
    Integer getMaxReturnNumber(@Param("prefix") String prefix);
}