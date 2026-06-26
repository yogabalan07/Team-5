package com.inventory.repository;

import com.inventory.model.SalesEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface SalesEntryRepository extends JpaRepository<SalesEntry, Long> {
    Optional<SalesEntry> findByInvoiceNo(String invoiceNo);
    List<SalesEntry> findByCustomerId(Long customerId);
    List<SalesEntry> findByInvoiceDateBetween(LocalDate start, LocalDate end);
    List<SalesEntry> findByInvoiceDate(LocalDate invoiceDate);
}