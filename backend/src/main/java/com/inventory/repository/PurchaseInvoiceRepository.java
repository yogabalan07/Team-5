package com.inventory.repository;

import com.inventory.model.PurchaseInvoice;
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
public interface PurchaseInvoiceRepository extends JpaRepository<PurchaseInvoice, Long> {

    Optional<PurchaseInvoice> findByInvoiceNo(String invoiceNo);

    Page<PurchaseInvoice> findBySupplierId(Long supplierId, Pageable pageable);

    /**
     * Get the next sequence number for purchase invoices
     * This extracts the last 6 digits (XXXXXX) and finds the max
     */
    @Query("SELECT MAX(CAST(SUBSTRING(i.invoiceNo, LENGTH(i.invoiceNo) - 5) AS integer)) FROM PurchaseInvoice i WHERE i.invoiceNo LIKE CONCAT(:prefix, '%')")
    Integer getMaxInvoiceNumber(@Param("prefix") String prefix);

    /**
     * Alternative: Get all invoice numbers with prefix and find max sequence
     */
    @Query("SELECT i.invoiceNo FROM PurchaseInvoice i WHERE i.invoiceNo LIKE CONCAT(:prefix, '%')")
    List<String> findInvoiceNumbersByPrefix(@Param("prefix") String prefix);

    @Query("SELECT i FROM PurchaseInvoice i WHERE i.invoiceDate BETWEEN :start AND :end")
    Page<PurchaseInvoice> findByInvoiceDateRange(@Param("start") LocalDate start, @Param("end") LocalDate end, Pageable pageable);

    @Query("SELECT i FROM PurchaseInvoice i WHERE i.receivedDate BETWEEN :start AND :end")
    Page<PurchaseInvoice> findByReceivedDateRange(@Param("start") LocalDate start, @Param("end") LocalDate end, Pageable pageable);

    Page<PurchaseInvoice> findByBalanceAmount(BigDecimal balanceAmount, Pageable pageable);

    Page<PurchaseInvoice> findByBalanceAmountGreaterThan(BigDecimal balanceAmount, Pageable pageable);

    @Query("SELECT i FROM PurchaseInvoice i WHERE i.paidAmount > 0 AND i.balanceAmount > 0")
    Page<PurchaseInvoice> findByPartialPayment(Pageable pageable);

    @Query("SELECT i FROM PurchaseInvoice i WHERE LOWER(i.invoiceNo) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(i.supplier.name) LIKE LOWER(CONCAT('%', :keyword, '%'))")
    Page<PurchaseInvoice> search(@Param("keyword") String keyword, Pageable pageable);

    @Query("SELECT COALESCE(SUM(i.netAmount), 0) FROM PurchaseInvoice i WHERE i.supplier.id = :supplierId")
    BigDecimal sumNetAmountBySupplier(@Param("supplierId") Long supplierId);

    @Query("SELECT COALESCE(SUM(i.netAmount), 0) FROM PurchaseInvoice i")
    BigDecimal sumNetAmount();

    @Query("SELECT COALESCE(SUM(i.paidAmount), 0) FROM PurchaseInvoice i")
    BigDecimal sumPaidAmount();

    @Query("SELECT COALESCE(SUM(i.balanceAmount), 0) FROM PurchaseInvoice i")
    BigDecimal sumBalanceAmount();

    long countByBalanceAmount(BigDecimal balanceAmount);

    long countByBalanceAmountGreaterThan(BigDecimal balanceAmount);

    @Query("SELECT i FROM PurchaseInvoice i WHERE i.invoiceDate BETWEEN :start AND :end")
    List<PurchaseInvoice> findByInvoiceDateBetween(@Param("start") LocalDate start, @Param("end") LocalDate end);
}