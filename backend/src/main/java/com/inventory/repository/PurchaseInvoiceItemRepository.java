package com.inventory.repository;

import com.inventory.model.PurchaseInvoiceItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface PurchaseInvoiceItemRepository extends JpaRepository<PurchaseInvoiceItem, Long> {
    
    /**
     * Find all purchase invoice items by invoice ID
     */
    List<PurchaseInvoiceItem> findByPurchaseInvoiceId(Long invoiceId);
    
    /**
     * Find all purchase invoice items by item ID
     */
    List<PurchaseInvoiceItem> findByItemId(Long itemId);
    
    /**
     * Find purchase invoice items by invoice ID and item ID
     */
    @Query("SELECT p FROM PurchaseInvoiceItem p WHERE p.purchaseInvoice.id = :invoiceId AND p.item.id = :itemId")
    List<PurchaseInvoiceItem> findByPurchaseInvoiceIdAndItemId(@Param("invoiceId") Long invoiceId, 
                                                                @Param("itemId") Long itemId);
    
    /**
     * Find purchase invoice items by date range
     */
    @Query("SELECT p FROM PurchaseInvoiceItem p WHERE p.purchaseInvoice.invoiceDate BETWEEN :startDate AND :endDate")
    List<PurchaseInvoiceItem> findByDateRange(@Param("startDate") LocalDate startDate, 
                                               @Param("endDate") LocalDate endDate);
    
    /**
     * Find purchase invoice items by received date range
     */
    @Query("SELECT p FROM PurchaseInvoiceItem p WHERE p.purchaseInvoice.receivedDate BETWEEN :startDate AND :endDate")
    List<PurchaseInvoiceItem> findByReceivedDateRange(@Param("startDate") LocalDate startDate, 
                                                       @Param("endDate") LocalDate endDate);
    
    /**
     * Find purchase invoice items with multiple filters
     */
    @Query("SELECT p FROM PurchaseInvoiceItem p WHERE " +
           "(:supplierIds IS NULL OR p.purchaseInvoice.supplier.id IN :supplierIds) AND " +
           "(:brandIds IS NULL OR p.item.brand.id IN :brandIds) AND " +
           "(:groupIds IS NULL OR p.item.group.id IN :groupIds) AND " +
           "(:itemIds IS NULL OR p.item.id IN :itemIds) AND " +
           "(p.purchaseInvoice.invoiceDate BETWEEN :startDate AND :endDate)")
    List<PurchaseInvoiceItem> findByFilters(@Param("supplierIds") List<Long> supplierIds,
                                             @Param("brandIds") List<Long> brandIds,
                                             @Param("groupIds") List<Long> groupIds,
                                             @Param("itemIds") List<Long> itemIds,
                                             @Param("startDate") LocalDate startDate,
                                             @Param("endDate") LocalDate endDate);
    
    /**
     * Find purchase invoice items by supplier ID
     */
    @Query("SELECT p FROM PurchaseInvoiceItem p WHERE p.purchaseInvoice.supplier.id = :supplierId")
    List<PurchaseInvoiceItem> findBySupplierId(@Param("supplierId") Long supplierId);
    
    /**
     * Find purchase invoice items by brand ID
     */
    @Query("SELECT p FROM PurchaseInvoiceItem p WHERE p.item.brand.id = :brandId")
    List<PurchaseInvoiceItem> findByBrandId(@Param("brandId") Long brandId);
    
    /**
     * Find purchase invoice items by group ID
     */
    @Query("SELECT p FROM PurchaseInvoiceItem p WHERE p.item.group.id = :groupId")
    List<PurchaseInvoiceItem> findByGroupId(@Param("groupId") Long groupId);
    
    /**
     * Calculate total purchase amount by date range
     */
    @Query("SELECT COALESCE(SUM(p.totalAmount), 0) FROM PurchaseInvoiceItem p WHERE p.purchaseInvoice.invoiceDate BETWEEN :startDate AND :endDate")
    BigDecimal getTotalPurchaseAmountByDateRange(@Param("startDate") LocalDate startDate, 
                                                  @Param("endDate") LocalDate endDate);
    
    /**
     * Calculate total purchase quantity by item ID
     */
    @Query("SELECT COALESCE(SUM(p.receivedQuantity), 0) FROM PurchaseInvoiceItem p WHERE p.item.id = :itemId")
    BigDecimal getTotalPurchasedQuantityByItem(@Param("itemId") Long itemId);
    
    /**
     * Find purchase invoice items by PO item ID
     */
    @Query("SELECT p FROM PurchaseInvoiceItem p WHERE p.purchaseOrderItem.id = :poItemId")
    List<PurchaseInvoiceItem> findByPurchaseOrderItemId(@Param("poItemId") Long poItemId);
}