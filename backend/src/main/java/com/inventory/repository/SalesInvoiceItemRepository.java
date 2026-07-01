package com.inventory.repository;

import com.inventory.model.SalesInvoiceItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface SalesInvoiceItemRepository extends JpaRepository<SalesInvoiceItem, Long> {
    
    List<SalesInvoiceItem> findByInvoiceId(Long invoiceId);
    
    List<SalesInvoiceItem> findByItemId(Long itemId);
    
    @Query("SELECT s FROM SalesInvoiceItem s WHERE s.invoice.invoiceDate BETWEEN :startDate AND :endDate")
    List<SalesInvoiceItem> findByDateRange(@Param("startDate") LocalDate startDate, 
                                            @Param("endDate") LocalDate endDate);
    
    @Query("SELECT s FROM SalesInvoiceItem s WHERE " +
           "(:customerIds IS NULL OR s.invoice.customer.id IN :customerIds) AND " +
           "(:brandIds IS NULL OR s.item.brand.id IN :brandIds) AND " +
           "(:groupIds IS NULL OR s.item.group.id IN :groupIds) AND " +
           "(:itemIds IS NULL OR s.item.id IN :itemIds) AND " +
           "(s.invoice.invoiceDate BETWEEN :startDate AND :endDate)")
    List<SalesInvoiceItem> findByFilters(@Param("customerIds") List<Long> customerIds,
                                          @Param("brandIds") List<Long> brandIds,
                                          @Param("groupIds") List<Long> groupIds,
                                          @Param("itemIds") List<Long> itemIds,
                                          @Param("startDate") LocalDate startDate,
                                          @Param("endDate") LocalDate endDate);
    
    @Query("SELECT s FROM SalesInvoiceItem s WHERE s.invoice.customer.id = :customerId")
    List<SalesInvoiceItem> findByCustomerId(@Param("customerId") Long customerId);
    
    @Query("SELECT s FROM SalesInvoiceItem s WHERE s.item.brand.id = :brandId")
    List<SalesInvoiceItem> findByBrandId(@Param("brandId") Long brandId);
    
    @Query("SELECT s FROM SalesInvoiceItem s WHERE s.item.group.id = :groupId")
    List<SalesInvoiceItem> findByGroupId(@Param("groupId") Long groupId);
    
    @Query("SELECT COALESCE(SUM(s.totalAmount), 0) FROM SalesInvoiceItem s WHERE s.invoice.invoiceDate BETWEEN :startDate AND :endDate")
    BigDecimal getTotalSalesAmountByDateRange(@Param("startDate") LocalDate startDate, 
                                               @Param("endDate") LocalDate endDate);
    
    @Query("SELECT COALESCE(SUM(s.quantity), 0) FROM SalesInvoiceItem s WHERE s.item.id = :itemId")
    BigDecimal getTotalSoldQuantityByItem(@Param("itemId") Long itemId);
}