package com.inventory.repository;

import com.inventory.model.Unit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UnitRepository extends JpaRepository<Unit, Long> {
    Optional<Unit> findByName(String name);
    Optional<Unit> findByShortName(String shortName);
    List<Unit> findByIsActiveTrue();
}