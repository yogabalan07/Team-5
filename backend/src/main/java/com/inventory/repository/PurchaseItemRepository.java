package com.inventory.repository;

import com.inventory.model.PurchaseItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Repository
public interface PurchaseItemRepository extends JpaRepository<PurchaseItem, Long> {
    List<PurchaseItem> findByPurchaseId(Long purchaseId);
    List<PurchaseItem> findByItemId(Long itemId);
    
    @Transactional
    void deleteByPurchaseId(Long purchaseId);
}