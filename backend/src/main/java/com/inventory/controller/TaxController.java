package com.inventory.controller;

import com.inventory.model.TaxMaster;
import com.inventory.repository.TaxMasterRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/items/taxes")
public class TaxController {

    @Autowired
    private TaxMasterRepository taxMasterRepository;

    @GetMapping
    public ResponseEntity<List<TaxMaster>> getAllTaxes() {
        return ResponseEntity.ok(taxMasterRepository.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<TaxMaster> getTaxById(@PathVariable Long id) {
        return taxMasterRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<TaxMaster> createTax(@RequestBody TaxMaster tax) {
        return ResponseEntity.ok(taxMasterRepository.save(tax));
    }

    @PutMapping("/{id}")
    public ResponseEntity<TaxMaster> updateTax(@PathVariable Long id, @RequestBody TaxMaster tax) {
        return taxMasterRepository.findById(id)
                .map(existing -> {
                    existing.setName(tax.getName());
                    existing.setTaxPercentage(tax.getTaxPercentage());
                    existing.setIsActive(tax.getIsActive());
                    return ResponseEntity.ok(taxMasterRepository.save(existing));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteTax(@PathVariable Long id) {
        return taxMasterRepository.findById(id)
                .map(tax -> {
                    taxMasterRepository.delete(tax);
                    return ResponseEntity.ok().build();
                })
                .orElse(ResponseEntity.notFound().build());
    }
}