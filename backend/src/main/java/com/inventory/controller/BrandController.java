package com.inventory.controller;

import com.inventory.model.ItemBrand;
import com.inventory.repository.ItemBrandRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/items/brands")
@CrossOrigin(origins = "*")
public class BrandController {

    @Autowired
    private ItemBrandRepository itemBrandRepository;

    @GetMapping
    public ResponseEntity<List<ItemBrand>> getAllBrands() {
        return ResponseEntity.ok(itemBrandRepository.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ItemBrand> getBrandById(@PathVariable Long id) {
        return itemBrandRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<ItemBrand> createBrand(@RequestBody ItemBrand brand) {
        brand.setIsActive(true);
        return ResponseEntity.ok(itemBrandRepository.save(brand));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ItemBrand> updateBrand(@PathVariable Long id, @RequestBody ItemBrand brand) {
        return itemBrandRepository.findById(id)
                .map(existing -> {
                    existing.setName(brand.getName());
                    existing.setDescription(brand.getDescription());
                    existing.setIsActive(brand.getIsActive());
                    return ResponseEntity.ok(itemBrandRepository.save(existing));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteBrand(@PathVariable Long id) {
        return itemBrandRepository.findById(id)
                .map(brand -> {
                    itemBrandRepository.delete(brand);
                    return ResponseEntity.ok().build();
                })
                .orElse(ResponseEntity.notFound().build());
    }
}