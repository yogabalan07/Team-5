package com.inventory.repository;

import com.inventory.model.SalesInvoice;
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
public interface SalesInvoiceRepository extends JpaRepository<SalesInvoice, Long> {
    Optional<SalesInvoice> findByInvoiceNo(String invoiceNo);
    
    @Query("SELECT s FROM SalesInvoice s WHERE s.invoiceDate BETWEEN :startDate AND :endDate")
    Page<SalesInvoice> findByDateRange(@Param("startDate") LocalDate startDate, 
                                       @Param("endDate") LocalDate endDate, 
                                       Pageable pageable);
    
    @Query("SELECT s FROM SalesInvoice s WHERE s.customer.id = :customerId AND s.invoiceDate BETWEEN :startDate AND :endDate")
    Page<SalesInvoice> findByCustomerAndDateRange(@Param("customerId") Long customerId,
                                                   @Param("startDate") LocalDate startDate,
                                                   @Param("endDate") LocalDate endDate,
                                                   Pageable pageable);
    
    @Query("SELECT s FROM SalesInvoice s WHERE s.customer.id = :customerId")
    List<SalesInvoice> findByCustomerId(@Param("customerId") Long customerId);
    
    @Query("SELECT s FROM SalesInvoice s WHERE s.customer.id IN :customerIds AND s.invoiceDate BETWEEN :startDate AND :endDate")
    Page<SalesInvoice> findByCustomerIdsAndDateRange(@Param("customerIds") List<Long> customerIds,
                                                      @Param("startDate") LocalDate startDate,
                                                      @Param("endDate") LocalDate endDate,
                                                      Pageable pageable);
    
    // FIXED: Extract the last 6 digits from the invoice number
    @Query("SELECT COALESCE(MAX(CAST(SUBSTRING(s.invoiceNo, LENGTH(s.invoiceNo) - 5) AS integer)), 0) FROM SalesInvoice s WHERE s.invoiceNo LIKE CONCAT(:prefix, '%')")
    Integer getMaxInvoiceNumber(@Param("prefix") String prefix);
    
    @Query("SELECT COALESCE(SUM(s.netAmount), 0) FROM SalesInvoice s WHERE s.invoiceDate = :date")
    BigDecimal getTotalSalesByDate(@Param("date") LocalDate date);
    
    @Query("SELECT COALESCE(SUM(s.netAmount), 0) FROM SalesInvoice s WHERE s.invoiceDate BETWEEN :startDate AND :endDate")
    BigDecimal getTotalSalesByDateRange(@Param("startDate") LocalDate startDate, 
                                         @Param("endDate") LocalDate endDate);
}