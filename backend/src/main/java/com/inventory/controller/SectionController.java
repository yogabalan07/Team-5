package com.inventory.controller;

import com.inventory.model.ItemSection;
import com.inventory.repository.ItemSectionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/items/sections")
public class SectionController {

    @Autowired
    private ItemSectionRepository itemSectionRepository;

    @GetMapping
    public ResponseEntity<List<ItemSection>> getAllSections() {
        return ResponseEntity.ok(itemSectionRepository.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ItemSection> getSectionById(@PathVariable Long id) {
        return itemSectionRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<ItemSection> createSection(@RequestBody ItemSection section) {
        return ResponseEntity.ok(itemSectionRepository.save(section));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ItemSection> updateSection(@PathVariable Long id, @RequestBody ItemSection section) {
        return itemSectionRepository.findById(id)
                .map(existing -> {
                    existing.setName(section.getName());
                    existing.setDescription(section.getDescription());
                    existing.setIsActive(section.getIsActive());
                    return ResponseEntity.ok(itemSectionRepository.save(existing));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteSection(@PathVariable Long id) {
        return itemSectionRepository.findById(id)
                .map(section -> {
                    itemSectionRepository.delete(section);
                    return ResponseEntity.ok().build();
                })
                .orElse(ResponseEntity.notFound().build());
    }
}