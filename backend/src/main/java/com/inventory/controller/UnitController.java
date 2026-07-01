package com.inventory.controller;

import com.inventory.model.Unit;
import com.inventory.repository.UnitRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/items/units")
public class UnitController {

    @Autowired
    private UnitRepository unitRepository;

    @GetMapping
    public ResponseEntity<?> getAllUnits() {
        try {
            List<Unit> units = unitRepository.findAll();
            return ResponseEntity.ok(units);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Error: " + e.getMessage());
        }
    }

    @PostMapping
    public ResponseEntity<?> createUnit(@RequestBody Unit unit) {
        try {
            Unit saved = unitRepository.save(unit);
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Error: " + e.getMessage());
        }
    }
}