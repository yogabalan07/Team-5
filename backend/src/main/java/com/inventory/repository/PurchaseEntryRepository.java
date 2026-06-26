package com.inventory.repository;

import com.inventory.model.PurchaseEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface PurchaseEntryRepository extends JpaRepository<PurchaseEntry, Long> {
    Optional<PurchaseEntry> findByPurchaseInvoiceNo(String purchaseInvoiceNo);
    List<PurchaseEntry> findBySupplierId(Long supplierId);
    List<PurchaseEntry> findByPurchaseDateBetween(LocalDate start, LocalDate end);
    List<PurchaseEntry> findByPurchaseDate(LocalDate purchaseDate);
}