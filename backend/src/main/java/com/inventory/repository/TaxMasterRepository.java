package com.inventory.repository;

import com.inventory.model.TaxMaster;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TaxMasterRepository extends JpaRepository<TaxMaster, Long> {
    Optional<TaxMaster> findByName(String name);
    List<TaxMaster> findByIsActiveTrue();
}