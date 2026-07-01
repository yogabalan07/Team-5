package com.inventory.controller;

import com.inventory.dto.request.PurchaseInvoiceRequest;
import com.inventory.dto.request.PurchaseOrderRequest;
import com.inventory.dto.response.PurchaseInvoiceResponse;
import com.inventory.dto.response.PurchaseOrderResponse;
import com.inventory.service.PurchaseService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/purchases")
@CrossOrigin(origins = "*")
public class PurchaseController {

    @Autowired
    private PurchaseService purchaseService;

    // ==================== PURCHASE ORDER ENDPOINTS ====================

    /**
     * Create a new purchase order
     * POST /purchases/order
     */
    @PostMapping("/order")
    public ResponseEntity<PurchaseOrderResponse> createPurchaseOrder(@Valid @RequestBody PurchaseOrderRequest request) {
        try {
            return ResponseEntity.ok(purchaseService.createPurchaseOrder(request));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    /**
     * Get purchase order by PO number
     * GET /purchases/order/{poNumber}
     */
    @GetMapping("/order/{poNumber}")
    public ResponseEntity<PurchaseOrderResponse> getPurchaseOrderByPoNumber(@PathVariable String poNumber) {
        try {
            return ResponseEntity.ok(purchaseService.getPurchaseOrderByPoNumber(poNumber));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(null);
        }
    }

    /**
     * Get purchase order by ID
     * GET /purchases/order/{id}
     */
    @GetMapping("/order/{id}")
    public ResponseEntity<PurchaseOrderResponse> getPurchaseOrderById(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(purchaseService.getPurchaseOrderById(id));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(null);
        }
    }

    /**
     * Update purchase order
     * PUT /purchases/order/{id}
     */
    @PutMapping("/order/{id}")
    public ResponseEntity<PurchaseOrderResponse> updatePurchaseOrder(
            @PathVariable Long id,
            @Valid @RequestBody PurchaseOrderRequest request) {
        try {
            return ResponseEntity.ok(purchaseService.updatePurchaseOrder(id, request));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    /**
     * Get all purchase orders with pagination
     * GET /purchases/orders
     */
    @GetMapping("/orders")
    public ResponseEntity<Page<PurchaseOrderResponse>> getAllPurchaseOrders(Pageable pageable) {
        try {
            return ResponseEntity.ok(purchaseService.getAllPurchaseOrders(pageable));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    /**
     * Get purchase orders by supplier
     * GET /purchases/orders/supplier/{supplierId}
     */
    @GetMapping("/orders/supplier/{supplierId}")
    public ResponseEntity<Page<PurchaseOrderResponse>> getPurchaseOrdersBySupplier(
            @PathVariable Long supplierId,
            Pageable pageable) {
        try {
            return ResponseEntity.ok(purchaseService.getPurchaseOrdersBySupplier(supplierId, pageable));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    /**
     * Get purchase orders by date range
     * GET /purchases/orders/date-range?startDate=2024-01-01&endDate=2024-12-31
     */
    @GetMapping("/orders/date-range")
    public ResponseEntity<Page<PurchaseOrderResponse>> getPurchaseOrdersByDateRange(
            @RequestParam String startDate,
            @RequestParam String endDate,
            Pageable pageable) {
        try {
            return ResponseEntity.ok(purchaseService.getPurchaseOrdersByDateRange(startDate, endDate, pageable));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    /**
     * Search purchase orders
     * GET /purchases/orders/search?search=PO-001
     */
    @GetMapping("/orders/search")
    public ResponseEntity<Page<PurchaseOrderResponse>> searchPurchaseOrders(
            @RequestParam String search,
            Pageable pageable) {
        try {
            return ResponseEntity.ok(purchaseService.searchPurchaseOrders(search, pageable));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    /**
     * Convert purchase order to invoice
     * PUT /purchases/order/{id}/convert
     */
    @PutMapping("/order/{id}/convert")
    public ResponseEntity<PurchaseOrderResponse> convertPurchaseOrderToInvoice(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(purchaseService.convertPurchaseOrderToInvoice(id));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    /**
     * Delete purchase order
     * DELETE /purchases/order/{id}
     */
    @DeleteMapping("/order/{id}")
    public ResponseEntity<?> deletePurchaseOrder(@PathVariable Long id) {
        try {
            purchaseService.deletePurchaseOrder(id);
            Map<String, String> response = new HashMap<>();
            response.put("message", "Purchase order deleted successfully");
            response.put("id", id.toString());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    // ==================== PURCHASE INVOICE ENDPOINTS ====================

    /**
     * Create a new purchase invoice
     * POST /purchases/invoice
     */
    @PostMapping("/invoice")
    public ResponseEntity<PurchaseInvoiceResponse> createPurchaseInvoice(@Valid @RequestBody PurchaseInvoiceRequest request) {
        try {
            return ResponseEntity.ok(purchaseService.createPurchaseInvoice(request));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    /**
     * Get purchase invoice by invoice number
     * GET /purchases/invoice/{invoiceNo}
     */
    @GetMapping("/invoice/{invoiceNo}")
    public ResponseEntity<PurchaseInvoiceResponse> getPurchaseInvoiceByInvoiceNo(@PathVariable String invoiceNo) {
        try {
            return ResponseEntity.ok(purchaseService.getPurchaseInvoiceByInvoiceNo(invoiceNo));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(null);
        }
    }

    /**
     * Get purchase invoice by ID
     * GET /purchases/invoice/{id}
     */
    @GetMapping("/invoice/{id}")
    public ResponseEntity<PurchaseInvoiceResponse> getPurchaseInvoiceById(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(purchaseService.getPurchaseInvoiceById(id));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(null);
        }
    }

    /**
     * Update purchase invoice
     * PUT /purchases/invoice/{id}
     */
    @PutMapping("/invoice/{id}")
    public ResponseEntity<PurchaseInvoiceResponse> updatePurchaseInvoice(
            @PathVariable Long id,
            @Valid @RequestBody PurchaseInvoiceRequest request) {
        try {
            return ResponseEntity.ok(purchaseService.updatePurchaseInvoice(id, request));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    /**
     * Get all purchase invoices with pagination
     * GET /purchases/invoices
     */
    @GetMapping("/invoices")
    public ResponseEntity<Page<PurchaseInvoiceResponse>> getAllPurchaseInvoices(Pageable pageable) {
        try {
            return ResponseEntity.ok(purchaseService.getAllPurchaseInvoices(pageable));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    /**
     * Get purchase invoices by date range
     * GET /purchases/invoices/date-range?startDate=2024-01-01&endDate=2024-12-31&dateType=INVOICE_DATE
     */
    @GetMapping("/invoices/date-range")
    public ResponseEntity<Page<PurchaseInvoiceResponse>> getPurchaseInvoicesByDateRange(
            @RequestParam String startDate,
            @RequestParam String endDate,
            @RequestParam(required = false, defaultValue = "INVOICE_DATE") String dateType,
            Pageable pageable) {
        try {
            return ResponseEntity.ok(purchaseService.getPurchaseInvoicesByDateRange(startDate, endDate, dateType, pageable));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    /**
     * Get purchase invoices by supplier
     * GET /purchases/invoices/supplier/{supplierId}
     */
    @GetMapping("/invoices/supplier/{supplierId}")
    public ResponseEntity<Page<PurchaseInvoiceResponse>> getPurchaseInvoicesBySupplier(
            @PathVariable Long supplierId,
            Pageable pageable) {
        try {
            return ResponseEntity.ok(purchaseService.getPurchaseInvoicesBySupplier(supplierId, pageable));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    /**
     * Search purchase invoices
     * GET /purchases/invoices/search?search=PUR-001
     */
    @GetMapping("/invoices/search")
    public ResponseEntity<Page<PurchaseInvoiceResponse>> searchPurchaseInvoices(
            @RequestParam String search,
            Pageable pageable) {
        try {
            return ResponseEntity.ok(purchaseService.searchPurchaseInvoices(search, pageable));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    /**
     * Delete purchase invoice
     * DELETE /purchases/invoice/{id}
     */
    @DeleteMapping("/invoice/{id}")
    public ResponseEntity<?> deletePurchaseInvoice(@PathVariable Long id) {
        try {
            purchaseService.deletePurchaseInvoice(id);
            Map<String, String> response = new HashMap<>();
            response.put("message", "Purchase invoice deleted successfully");
            response.put("id", id.toString());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }
}