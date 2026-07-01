package com.inventory.repository;

import com.inventory.model.PurchaseReturn;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PurchaseReturnRepository extends JpaRepository<PurchaseReturn, Long> {
    Optional<PurchaseReturn> findByReturnNo(String returnNo);
    
    @Query("SELECT pr FROM PurchaseReturn pr WHERE pr.purchaseInvoice.id = :invoiceId")
    List<PurchaseReturn> findByInvoiceId(@Param("invoiceId") Long invoiceId);
    
    @Query("SELECT pr FROM PurchaseReturn pr WHERE pr.supplier.id = :supplierId")
    List<PurchaseReturn> findBySupplierId(@Param("supplierId") Long supplierId);
    
    // FIXED: Extract the last 6 digits from the return number
    @Query("SELECT COALESCE(MAX(CAST(SUBSTRING(pr.returnNo, LENGTH(pr.returnNo) - 5) AS integer)), 0) FROM PurchaseReturn pr WHERE pr.returnNo LIKE CONCAT(:prefix, '%')")
    Integer getMaxReturnNumber(@Param("prefix") String prefix);
}