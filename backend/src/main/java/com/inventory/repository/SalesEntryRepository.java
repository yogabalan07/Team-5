package com.inventory.repository;

import com.inventory.model.SalesEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SalesEntryRepository extends JpaRepository<SalesEntry, Long> {
}