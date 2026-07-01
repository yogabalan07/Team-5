package com.inventory.repository;

import com.inventory.model.ItemGroup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ItemGroupRepository extends JpaRepository<ItemGroup, Long> {
    Optional<ItemGroup> findByName(String name);
    List<ItemGroup> findByIsActiveTrue();
}