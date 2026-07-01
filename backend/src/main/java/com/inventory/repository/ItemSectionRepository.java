package com.inventory.repository;

import com.inventory.model.ItemSection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ItemSectionRepository extends JpaRepository<ItemSection, Long> {
    Optional<ItemSection> findByName(String name);
    List<ItemSection> findByIsActiveTrue();
}