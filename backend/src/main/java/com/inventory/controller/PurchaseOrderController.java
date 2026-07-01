package com.inventory.controller;

import com.inventory.dto.request.PurchaseOrderRequest;
import com.inventory.dto.response.PurchaseOrderResponse;
import com.inventory.service.PurchaseService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/purchase-orders")
@CrossOrigin(origins = "*")
public class PurchaseOrderController {

    @Autowired
    private PurchaseService purchaseService;

    // ==================== CREATE ====================

    /**
     * Create a new purchase order
     * POST /purchase-orders
     */
    @PostMapping
    public ResponseEntity<?> createPurchaseOrder(@Valid @RequestBody PurchaseOrderRequest request) {
        try {
            PurchaseOrderResponse response = purchaseService.createPurchaseOrder(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            error.put("timestamp", LocalDate.now().toString());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        }
    }

    // ==================== READ (GET) ====================

    /**
     * Get all purchase orders with pagination
     * GET /purchase-orders
     */
    @GetMapping
    public ResponseEntity<Page<PurchaseOrderResponse>> getAllPurchaseOrders(
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        try {
            Page<PurchaseOrderResponse> responses = purchaseService.getAllPurchaseOrders(pageable);
            return ResponseEntity.ok(responses);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Get purchase order by ID
     * GET /purchase-orders/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<?> getPurchaseOrderById(@PathVariable Long id) {
        try {
            PurchaseOrderResponse response = purchaseService.getPurchaseOrderById(id);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Purchase order not found with ID: " + id);
            error.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
        }
    }

    /**
     * Get purchase order by PO number
     * GET /purchase-orders/number/{poNumber}
     */
    @GetMapping("/number/{poNumber}")
    public ResponseEntity<?> getPurchaseOrderByPoNumber(@PathVariable String poNumber) {
        try {
            PurchaseOrderResponse response = purchaseService.getPurchaseOrderByPoNumber(poNumber);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Purchase order not found with number: " + poNumber);
            error.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
        }
    }

    /**
     * Get purchase orders by supplier
     * GET /purchase-orders/supplier/{supplierId}
     */
    @GetMapping("/supplier/{supplierId}")
    public ResponseEntity<Page<PurchaseOrderResponse>> getPurchaseOrdersBySupplier(
            @PathVariable Long supplierId,
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        try {
            Page<PurchaseOrderResponse> responses = purchaseService.getPurchaseOrdersBySupplier(supplierId, pageable);
            return ResponseEntity.ok(responses);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Get purchase orders by date range
     * GET /purchase-orders/date-range?startDate=2024-01-01&endDate=2024-12-31
     */
    @GetMapping("/date-range")
    public ResponseEntity<Page<PurchaseOrderResponse>> getPurchaseOrdersByDateRange(
            @RequestParam String startDate,
            @RequestParam String endDate,
            @PageableDefault(size = 10, sort = "poDate", direction = Sort.Direction.DESC) Pageable pageable) {
        try {
            Page<PurchaseOrderResponse> responses = purchaseService.getPurchaseOrdersByDateRange(startDate, endDate, pageable);
            return ResponseEntity.ok(responses);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }

    /**
     * Search purchase orders by keyword
     * GET /purchase-orders/search?keyword=PO-001
     */
    @GetMapping("/search")
    public ResponseEntity<Page<PurchaseOrderResponse>> searchPurchaseOrders(
            @RequestParam String keyword,
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        try {
            Page<PurchaseOrderResponse> responses = purchaseService.searchPurchaseOrders(keyword, pageable);
            return ResponseEntity.ok(responses);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Get purchase orders by status
     * GET /purchase-orders/status/{status}
     */
    @GetMapping("/status/{status}")
    public ResponseEntity<Page<PurchaseOrderResponse>> getPurchaseOrdersByStatus(
            @PathVariable String status,
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        try {
            Page<PurchaseOrderResponse> responses = purchaseService.getPurchaseOrdersByStatus(status, pageable);
            return ResponseEntity.ok(responses);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Get pending purchase orders (not yet converted)
     * GET /purchase-orders/pending
     */
    @GetMapping("/pending")
    public ResponseEntity<Page<PurchaseOrderResponse>> getPendingPurchaseOrders(
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        try {
            Page<PurchaseOrderResponse> responses = purchaseService.getPendingPurchaseOrders(pageable);
            return ResponseEntity.ok(responses);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Get converted purchase orders (already converted to invoice)
     * GET /purchase-orders/converted
     */
    @GetMapping("/converted")
    public ResponseEntity<Page<PurchaseOrderResponse>> getConvertedPurchaseOrders(
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        try {
            Page<PurchaseOrderResponse> responses = purchaseService.getConvertedPurchaseOrders(pageable);
            return ResponseEntity.ok(responses);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Get purchase order count
     * GET /purchase-orders/count
     */
    @GetMapping("/count")
    public ResponseEntity<Map<String, Long>> getPurchaseOrderCount() {
        try {
            long pendingCount = purchaseService.getPendingPurchaseOrderCount();
            long totalCount = purchaseService.getPurchaseOrderCount();
            
            Map<String, Long> response = new HashMap<>();
            response.put("total", totalCount);
            response.put("pending", pendingCount);
            response.put("converted", totalCount - pendingCount);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Get recent purchase orders (limited)
     * GET /purchase-orders/recent?limit=5
     */
    @GetMapping("/recent")
    public ResponseEntity<List<PurchaseOrderResponse>> getRecentPurchaseOrders(
            @RequestParam(defaultValue = "5") int limit) {
        try {
            List<PurchaseOrderResponse> responses = purchaseService.getRecentPurchaseOrders(limit);
            return ResponseEntity.ok(responses);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Get purchase order summary for dashboard
     * GET /purchase-orders/summary
     */
    @GetMapping("/summary")
    public ResponseEntity<?> getPurchaseOrderSummary() {
        try {
            Map<String, Object> summary = purchaseService.getPurchaseOrderSummary();
            return ResponseEntity.ok(summary);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    /**
     * Get monthly purchase order statistics
     * GET /purchase-orders/statistics/monthly?year=2024
     */
    @GetMapping("/statistics/monthly")
    public ResponseEntity<?> getMonthlyStatistics(@RequestParam(defaultValue = "0") int year) {
        try {
            Map<String, Object> statistics = purchaseService.getMonthlyPurchaseOrderStatistics(year);
            return ResponseEntity.ok(statistics);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    // ==================== UPDATE ====================

    /**
     * Update purchase order
     * PUT /purchase-orders/{id}
     */
    @PutMapping("/{id}")
    public ResponseEntity<?> updatePurchaseOrder(
            @PathVariable Long id,
            @Valid @RequestBody PurchaseOrderRequest request) {
        try {
            PurchaseOrderResponse response = purchaseService.updatePurchaseOrder(id, request);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            error.put("timestamp", LocalDate.now().toString());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        }
    }

    // ==================== CONVERT TO INVOICE ====================

    /**
     * Convert purchase order to invoice
     * POST /purchase-orders/{id}/convert
     */
    @PostMapping("/{id}/convert")
    public ResponseEntity<?> convertPurchaseOrderToInvoice(@PathVariable Long id) {
        try {
            PurchaseOrderResponse response = purchaseService.convertPurchaseOrderToInvoice(id);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            error.put("timestamp", LocalDate.now().toString());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        }
    }

    // ==================== DELETE ====================

    /**
     * Delete purchase order (only if not converted)
     * DELETE /purchase-orders/{id}
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deletePurchaseOrder(@PathVariable Long id) {
        try {
            purchaseService.deletePurchaseOrder(id);
            Map<String, String> response = new HashMap<>();
            response.put("message", "Purchase order deleted successfully");
            response.put("id", id.toString());
            response.put("timestamp", LocalDate.now().toString());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        }
    }

    // ==================== BULK OPERATIONS ====================

    /**
     * Delete multiple purchase orders
     * DELETE /purchase-orders/bulk
     */
    @DeleteMapping("/bulk")
    public ResponseEntity<?> deleteMultiplePurchaseOrders(@RequestBody List<Long> ids) {
        try {
            purchaseService.deleteMultiplePurchaseOrders(ids);
            Map<String, String> response = new HashMap<>();
            response.put("message", "Purchase orders deleted successfully");
            response.put("count", String.valueOf(ids.size()));
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        }
    }

    // ==================== EXPORT ====================

    /**
     * Export purchase orders to CSV
     * GET /purchase-orders/export/csv
     */
    @GetMapping("/export/csv")
    public ResponseEntity<?> exportPurchaseOrdersToCSV(
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate) {
        try {
            LocalDate start = startDate != null ? LocalDate.parse(startDate, DateTimeFormatter.ISO_LOCAL_DATE) : null;
            LocalDate end = endDate != null ? LocalDate.parse(endDate, DateTimeFormatter.ISO_LOCAL_DATE) : null;
            byte[] csvData = purchaseService.exportPurchaseOrdersToCSV(start, end);
            return ResponseEntity.ok()
                    .header("Content-Type", "text/csv")
                    .header("Content-Disposition", "attachment; filename=purchase_orders_" + LocalDate.now() + ".csv")
                    .body(csvData);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }
}