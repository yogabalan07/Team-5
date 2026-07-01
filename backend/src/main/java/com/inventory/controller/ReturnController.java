package com.inventory.controller;

import com.inventory.dto.request.PurchaseReturnRequest;
import com.inventory.dto.request.SalesReturnRequest;
import com.inventory.dto.response.PurchaseReturnResponse;
import com.inventory.dto.response.SalesReturnResponse;
import com.inventory.service.ReturnService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/returns")
public class ReturnController {

    @Autowired
    private ReturnService returnService;

    @PostMapping("/sales")
    @PreAuthorize("hasAnyRole('ADMIN', 'BILLING_CLERK')")
    public ResponseEntity<SalesReturnResponse> createSalesReturn(@Valid @RequestBody SalesReturnRequest request) {
        return ResponseEntity.ok(returnService.createSalesReturn(request));
    }

    @PostMapping("/purchase")
    @PreAuthorize("hasAnyRole('ADMIN', 'PURCHASE_MANAGER')")
    public ResponseEntity<PurchaseReturnResponse> createPurchaseReturn(@Valid @RequestBody PurchaseReturnRequest request) {
        return ResponseEntity.ok(returnService.createPurchaseReturn(request));
    }

    @GetMapping("/sales/{returnNo}")
    public ResponseEntity<SalesReturnResponse> getSalesReturnByReturnNo(@PathVariable String returnNo) {
        return ResponseEntity.ok(returnService.getSalesReturnByReturnNo(returnNo));
    }

    @GetMapping("/purchase/{returnNo}")
    public ResponseEntity<PurchaseReturnResponse> getPurchaseReturnByReturnNo(@PathVariable String returnNo) {
        return ResponseEntity.ok(returnService.getPurchaseReturnByReturnNo(returnNo));
    }

    @GetMapping("/sales/invoice/{invoiceNo}")
    public ResponseEntity<List<SalesReturnResponse>> getSalesReturnsByInvoice(@PathVariable String invoiceNo) {
        return ResponseEntity.ok(returnService.getSalesReturnsByInvoice(invoiceNo));
    }

    @GetMapping("/purchase/invoice/{invoiceNo}")
    public ResponseEntity<List<PurchaseReturnResponse>> getPurchaseReturnsByInvoice(@PathVariable String invoiceNo) {
        return ResponseEntity.ok(returnService.getPurchaseReturnsByInvoice(invoiceNo));
    }
}