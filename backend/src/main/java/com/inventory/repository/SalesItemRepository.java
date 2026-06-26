package com.inventory.repository;

import com.inventory.model.SalesItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Repository
public interface SalesItemRepository extends JpaRepository<SalesItem, Long> {
    List<SalesItem> findBySaleId(Long saleId);
    List<SalesItem> findByItemId(Long itemId);
    
    @Transactional
    void deleteBySaleId(Long saleId);
}