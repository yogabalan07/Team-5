package com.inventory.controller;

import com.inventory.model.ItemGroup;
import com.inventory.repository.ItemGroupRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/items/groups")
public class GroupController {

    @Autowired
    private ItemGroupRepository itemGroupRepository;

    @GetMapping
    public ResponseEntity<List<ItemGroup>> getAllGroups() {
        return ResponseEntity.ok(itemGroupRepository.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ItemGroup> getGroupById(@PathVariable Long id) {
        return itemGroupRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<ItemGroup> createGroup(@RequestBody ItemGroup group) {
        return ResponseEntity.ok(itemGroupRepository.save(group));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ItemGroup> updateGroup(@PathVariable Long id, @RequestBody ItemGroup group) {
        return itemGroupRepository.findById(id)
                .map(existing -> {
                    existing.setName(group.getName());
                    existing.setDescription(group.getDescription());
                    existing.setIsActive(group.getIsActive());
                    return ResponseEntity.ok(itemGroupRepository.save(existing));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteGroup(@PathVariable Long id) {
        return itemGroupRepository.findById(id)
                .map(group -> {
                    itemGroupRepository.delete(group);
                    return ResponseEntity.ok().build();
                })
                .orElse(ResponseEntity.notFound().build());
    }
}