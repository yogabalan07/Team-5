package com.inventory.service;

import com.inventory.model.SalesEntry;
import com.inventory.model.SalesItem;
import com.inventory.model.Item;
import com.inventory.repository.SalesEntryRepository;
import com.inventory.repository.SalesItemRepository;
import com.inventory.repository.ItemRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class SalesService {
    
    @Autowired
    private SalesEntryRepository salesEntryRepository;
    
    @Autowired
    private SalesItemRepository salesItemRepository;
    
    @Autowired
    private ItemRepository itemRepository;

    /**
     * Get all sales entries
     */
    public List<SalesEntry> getAllSales() {
        return salesEntryRepository.findAll();
    }

    /**
     * Get sales entry by ID
     */
    public SalesEntry getSalesById(Long id) {
        return salesEntryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Sales not found with id: " + id));
    }

    /**
     * Get sales entry by invoice number
     */
    public SalesEntry getSalesByInvoiceNo(String invoiceNo) {
        return salesEntryRepository.findByInvoiceNo(invoiceNo)
                .orElseThrow(() -> new RuntimeException("Sales not found with invoice: " + invoiceNo));
    }

    /**
     * Get sales by customer ID
     */
    public List<SalesEntry> getSalesByCustomer(Long customerId) {
        return salesEntryRepository.findByCustomerId(customerId);
    }

    /**
     * Get sales by sales person
     */
    public List<SalesEntry> getSalesBySalesPerson(String salesPerson) {
        return salesEntryRepository.findBySalesPerson(salesPerson);
    }

    /**
     * Create a new sales entry
     */
    @Transactional
    public SalesEntry createSales(SalesEntry salesEntry) {
        try {
            System.out.println("📝 Creating sales: " + salesEntry.getInvoiceNo());
            
            // Validate stock before processing
            if (salesEntry.getItems() != null && !salesEntry.getItems().isEmpty()) {
                for (SalesItem item : salesEntry.getItems()) {
                    Item inventoryItem = null;
                    
                    if (item.getItemId() != null) {
                        inventoryItem = itemRepository.findById(item.getItemId()).orElse(null);
                    } else if (item.getItemCode() != null) {
                        List<Item> items = itemRepository.findAll();
                        for (Item i : items) {
                            if (i.getItemCode().equals(item.getItemCode())) {
                                inventoryItem = i;
                                break;
                            }
                        }
                    }
                    
                    if (inventoryItem == null) {
                        throw new RuntimeException("Item not found: " + item.getItemCode());
                    }
                    
                    if (inventoryItem.getStockQty() < item.getQuantity()) {
                        throw new RuntimeException("Insufficient stock for item: " + inventoryItem.getItemName() + 
                            ". Available: " + inventoryItem.getStockQty() + ", Requested: " + item.getQuantity());
                    }
                }
            }
            
            // Calculate totals from items
            calculateSalesTotals(salesEntry);
            
            // Save sales entry first
            SalesEntry savedSales = salesEntryRepository.save(salesEntry);
            System.out.println("✅ Sales saved: " + savedSales.getId());
            
            // Process each item
            if (salesEntry.getItems() != null && !salesEntry.getItems().isEmpty()) {
                for (SalesItem item : salesEntry.getItems()) {
                    item.setSaleId(savedSales.getId());
                    
                    // Find and update item stock
                    Item inventoryItem = null;
                    
                    if (item.getItemId() != null) {
                        inventoryItem = itemRepository.findById(item.getItemId()).orElse(null);
                    } else if (item.getItemCode() != null) {
                        List<Item> items = itemRepository.findAll();
                        for (Item i : items) {
                            if (i.getItemCode().equals(item.getItemCode())) {
                                inventoryItem = i;
                                break;
                            }
                        }
                    }
                    
                    if (inventoryItem != null) {
                        // Decrease stock quantity
                        int newStock = inventoryItem.getStockQty() - item.getQuantity();
                        inventoryItem.setStockQty(newStock);
                        itemRepository.save(inventoryItem);
                        item.setItemId(inventoryItem.getId());
                        System.out.println("📦 Updated stock for: " + inventoryItem.getItemName() + 
                            " (New Stock: " + newStock + ")");
                    }
                    
                    // Save sales item
                    salesItemRepository.save(item);
                }
                System.out.println("✅ All sales items saved");
            }
            
            // Fetch the complete sales with items
            return getSalesById(savedSales.getId());
            
        } catch (Exception e) {
            System.err.println("❌ Error creating sales: " + e.getMessage());
            throw new RuntimeException("Failed to create sales: " + e.getMessage());
        }
    }

    /**
     * Update an existing sales entry
     */
    @Transactional
    public SalesEntry updateSales(Long id, SalesEntry salesEntry) {
        try {
            System.out.println("📝 Updating sales: " + id);
            
            SalesEntry existingSales = getSalesById(id);
            
            // Update basic fields
            existingSales.setCustomerId(salesEntry.getCustomerId());
            existingSales.setInvoiceDate(salesEntry.getInvoiceDate());
            existingSales.setPaymentType(salesEntry.getPaymentType());
            existingSales.setDiscount(salesEntry.getDiscount());
            existingSales.setTaxRate(salesEntry.getTaxRate());
            existingSales.setAmountPaid(salesEntry.getAmountPaid());
            existingSales.setSalesPerson(salesEntry.getSalesPerson());
            existingSales.setNotes(salesEntry.getNotes());
            existingSales.setUpdatedAt(LocalDateTime.now());
            
            // Calculate totals
            calculateSalesTotals(existingSales);
            
            // Delete old items and restore stock
            if (existingSales.getItems() != null && !existingSales.getItems().isEmpty()) {
                // Restore stock for old items
                for (SalesItem oldItem : existingSales.getItems()) {
                    if (oldItem.getItemId() != null) {
                        Item inventoryItem = itemRepository.findById(oldItem.getItemId()).orElse(null);
                        if (inventoryItem != null) {
                            int newStock = inventoryItem.getStockQty() + oldItem.getQuantity();
                            inventoryItem.setStockQty(newStock);
                            itemRepository.save(inventoryItem);
                        }
                    }
                }
                // Delete old items
                salesItemRepository.deleteBySaleId(id);
            }
            
            // Validate stock for new items
            if (salesEntry.getItems() != null && !salesEntry.getItems().isEmpty()) {
                for (SalesItem item : salesEntry.getItems()) {
                    Item inventoryItem = null;
                    
                    if (item.getItemId() != null) {
                        inventoryItem = itemRepository.findById(item.getItemId()).orElse(null);
                    } else if (item.getItemCode() != null) {
                        List<Item> items = itemRepository.findAll();
                        for (Item i : items) {
                            if (i.getItemCode().equals(item.getItemCode())) {
                                inventoryItem = i;
                                break;
                            }
                        }
                    }
                    
                    if (inventoryItem == null) {
                        throw new RuntimeException("Item not found: " + item.getItemCode());
                    }
                    
                    if (inventoryItem.getStockQty() < item.getQuantity()) {
                        throw new RuntimeException("Insufficient stock for item: " + inventoryItem.getItemName() + 
                            ". Available: " + inventoryItem.getStockQty() + ", Requested: " + item.getQuantity());
                    }
                }
            }
            
            // Add new items
            if (salesEntry.getItems() != null && !salesEntry.getItems().isEmpty()) {
                for (SalesItem item : salesEntry.getItems()) {
                    item.setSaleId(id);
                    
                    // Update stock for new items
                    Item inventoryItem = null;
                    
                    if (item.getItemId() != null) {
                        inventoryItem = itemRepository.findById(item.getItemId()).orElse(null);
                    } else if (item.getItemCode() != null) {
                        List<Item> items = itemRepository.findAll();
                        for (Item i : items) {
                            if (i.getItemCode().equals(item.getItemCode())) {
                                inventoryItem = i;
                                break;
                            }
                        }
                    }
                    
                    if (inventoryItem != null) {
                        int newStock = inventoryItem.getStockQty() - item.getQuantity();
                        inventoryItem.setStockQty(newStock);
                        itemRepository.save(inventoryItem);
                        item.setItemId(inventoryItem.getId());
                    }
                    
                    salesItemRepository.save(item);
                }
            }
            
            SalesEntry updatedSales = salesEntryRepository.save(existingSales);
            System.out.println("✅ Sales updated: " + updatedSales.getId());
            return getSalesById(updatedSales.getId());
            
        } catch (Exception e) {
            System.err.println("❌ Error updating sales: " + e.getMessage());
            throw new RuntimeException("Failed to update sales: " + e.getMessage());
        }
    }

    /**
     * Delete a sales entry
     */
    @Transactional
    public void deleteSales(Long id) {
        try {
            System.out.println("🗑️ Deleting sales: " + id);
            
            SalesEntry sales = getSalesById(id);
            
            // Restore stock for all items
            if (sales.getItems() != null && !sales.getItems().isEmpty()) {
                for (SalesItem item : sales.getItems()) {
                    if (item.getItemId() != null) {
                        Item inventoryItem = itemRepository.findById(item.getItemId()).orElse(null);
                        if (inventoryItem != null) {
                            int newStock = inventoryItem.getStockQty() + item.getQuantity();
                            inventoryItem.setStockQty(newStock);
                            itemRepository.save(inventoryItem);
                            System.out.println("📦 Restored stock for: " + inventoryItem.getItemName() + 
                                " (New Stock: " + newStock + ")");
                        }
                    }
                }
            }
            
            // Delete items first (cascade)
            salesItemRepository.deleteBySaleId(id);
            
            // Delete sales
            salesEntryRepository.deleteById(id);
            System.out.println("✅ Sales deleted: " + id);
            
        } catch (Exception e) {
            System.err.println("❌ Error deleting sales: " + e.getMessage());
            throw new RuntimeException("Failed to delete sales: " + e.getMessage());
        }
    }

    /**
     * Calculate totals for sales entry
     */
    private void calculateSalesTotals(SalesEntry sales) {
        if (sales.getItems() != null && !sales.getItems().isEmpty()) {
            // Calculate subtotal from items
            BigDecimal subtotal = sales.getItems().stream()
                .map(item -> item.getAmount() != null ? item.getAmount() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
            sales.setSubTotal(subtotal);
            
            // Calculate tax amount
            BigDecimal taxRate = sales.getTaxRate() != null ? sales.getTaxRate() : BigDecimal.ZERO;
            BigDecimal taxAmount = subtotal.multiply(taxRate).divide(new BigDecimal("100"), 2, java.math.RoundingMode.HALF_UP);
            sales.setTaxAmount(taxAmount);
            
            // Calculate total amount
            BigDecimal discount = sales.getDiscount() != null ? sales.getDiscount() : BigDecimal.ZERO;
            BigDecimal totalAmount = subtotal.add(taxAmount).subtract(discount);
            sales.setTotalAmount(totalAmount);
            
            // Calculate balance
            BigDecimal amountPaid = sales.getAmountPaid() != null ? sales.getAmountPaid() : BigDecimal.ZERO;
            BigDecimal balance = totalAmount.subtract(amountPaid);
            sales.setBalance(balance);
        }
    }
}