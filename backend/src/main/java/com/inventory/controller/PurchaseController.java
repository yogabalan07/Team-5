package com.inventory.controller;

import com.inventory.model.PurchaseEntry;
import com.inventory.service.PurchaseService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/purchases")
@CrossOrigin(origins = "http://localhost:3000")
public class PurchaseController {

    @Autowired
    private PurchaseService purchaseService;

    @GetMapping
    public ResponseEntity<?> getAllPurchases() {
        try {
            List<PurchaseEntry> purchases = purchaseService.getAllPurchases();
            return ResponseEntity.ok(purchases);
        } catch (Exception e) {
            System.err.println("❌ Error in getAllPurchases: " + e.getMessage());
            e.printStackTrace();
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getPurchaseById(@PathVariable Long id) {
        try {
            PurchaseEntry purchase = purchaseService.getPurchaseById(id);
            return ResponseEntity.ok(purchase);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
        }
    }

    @GetMapping("/invoice/{invoiceNo}")
    public ResponseEntity<?> getPurchaseByInvoiceNo(@PathVariable String invoiceNo) {
        try {
            PurchaseEntry purchase = purchaseService.getPurchaseByInvoiceNo(invoiceNo);
            return ResponseEntity.ok(purchase);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
        }
    }

    @GetMapping("/supplier/{supplierId}")
    public ResponseEntity<?> getPurchasesBySupplier(@PathVariable Long supplierId) {
        try {
            List<PurchaseEntry> purchases = purchaseService.getPurchasesBySupplier(supplierId);
            return ResponseEntity.ok(purchases);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
        }
    }

    @GetMapping("/date-range")
    public ResponseEntity<?> getPurchasesByDateRange(
            @RequestParam LocalDate start,
            @RequestParam LocalDate end) {
        try {
            List<PurchaseEntry> purchases = purchaseService.getPurchasesByDateRange(start, end);
            return ResponseEntity.ok(purchases);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        }
    }

    @PostMapping
    public ResponseEntity<?> createPurchase(@RequestBody PurchaseEntry purchaseEntry) {
        try {
            System.out.println("=========================================");
            System.out.println("📥 Received purchase request:");
            System.out.println("   Invoice No: " + purchaseEntry.getPurchaseInvoiceNo());
            System.out.println("   Supplier ID: " + purchaseEntry.getSupplierId());
            System.out.println("   Items: " + (purchaseEntry.getItems() != null ? purchaseEntry.getItems().size() : 0));
            System.out.println("   Subtotal: " + purchaseEntry.getSubtotal());
            System.out.println("   Total: " + purchaseEntry.getTotalAmount());
            System.out.println("=========================================");
            
            PurchaseEntry created = purchaseService.createPurchase(purchaseEntry);
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (Exception e) {
            System.err.println("❌ Error creating purchase: " + e.getMessage());
            e.printStackTrace();
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updatePurchase(@PathVariable Long id, @RequestBody PurchaseEntry purchaseEntry) {
        try {
            System.out.println("🔄 Updating purchase with ID: " + id);
            PurchaseEntry updated = purchaseService.updatePurchase(id, purchaseEntry);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            System.err.println("❌ Error updating purchase: " + e.getMessage());
            e.printStackTrace();
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deletePurchase(@PathVariable Long id) {
        try {
            System.out.println("🗑️ Deleting purchase with ID: " + id);
            purchaseService.deletePurchase(id);
            Map<String, String> response = new HashMap<>();
            response.put("message", "Purchase deleted successfully");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            System.err.println("❌ Error deleting purchase: " + e.getMessage());
            e.printStackTrace();
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        }
    }
}