package com.inventory.service;

import com.inventory.model.PurchaseEntry;
import com.inventory.model.PurchaseItem;
import com.inventory.model.Item;
import com.inventory.repository.PurchaseEntryRepository;
import com.inventory.repository.PurchaseItemRepository;
import com.inventory.repository.ItemRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

@Service
public class PurchaseService {
    
    @Autowired
    private PurchaseEntryRepository purchaseEntryRepository;
    
    @Autowired
    private PurchaseItemRepository purchaseItemRepository;
    
    @Autowired
    private ItemRepository itemRepository;

    private String generateInvoiceNumber() {
        LocalDate today = LocalDate.now();
        String dateStr = today.format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        String prefix = "PUR-" + dateStr + "-";
        List<PurchaseEntry> todayPurchases = purchaseEntryRepository.findByPurchaseDate(today);
        
        int maxNumber = 0;
        for (PurchaseEntry purchase : todayPurchases) {
            String invoiceNo = purchase.getPurchaseInvoiceNo();
            if (invoiceNo != null && invoiceNo.startsWith(prefix)) {
                try {
                    String numPart = invoiceNo.substring(prefix.length());
                    int num = Integer.parseInt(numPart);
                    if (num > maxNumber) {
                        maxNumber = num;
                    }
                } catch (NumberFormatException e) {
                    // Ignore
                }
            }
        }
        
        int nextNumber = maxNumber + 1;
        return prefix + String.format("%04d", nextNumber);
    }

    public List<PurchaseEntry> getAllPurchases() {
        try {
            List<PurchaseEntry> purchases = purchaseEntryRepository.findAll();
            for (PurchaseEntry purchase : purchases) {
                List<PurchaseItem> items = purchaseItemRepository.findByPurchaseId(purchase.getId());
                purchase.setItems(items != null ? items : new ArrayList<>());
            }
            return purchases;
        } catch (Exception e) {
            System.err.println("❌ Error fetching purchases: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }

    public PurchaseEntry getPurchaseById(Long id) {
        PurchaseEntry purchase = purchaseEntryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Purchase not found with id: " + id));
        List<PurchaseItem> items = purchaseItemRepository.findByPurchaseId(id);
        purchase.setItems(items != null ? items : new ArrayList<>());
        return purchase;
    }

    public PurchaseEntry getPurchaseByInvoiceNo(String invoiceNo) {
        PurchaseEntry purchase = purchaseEntryRepository.findByPurchaseInvoiceNo(invoiceNo)
                .orElseThrow(() -> new RuntimeException("Purchase not found with invoice: " + invoiceNo));
        List<PurchaseItem> items = purchaseItemRepository.findByPurchaseId(purchase.getId());
        purchase.setItems(items != null ? items : new ArrayList<>());
        return purchase;
    }

    public List<PurchaseEntry> getPurchasesBySupplier(Long supplierId) {
        return purchaseEntryRepository.findBySupplierId(supplierId);
    }

    public List<PurchaseEntry> getPurchasesByDateRange(LocalDate start, LocalDate end) {
        return purchaseEntryRepository.findByPurchaseDateBetween(start, end);
    }

    @Transactional
    public PurchaseEntry createPurchase(PurchaseEntry purchaseEntry) {
        try {
            System.out.println("=========================================");
            System.out.println("📝 Creating purchase invoice");
            System.out.println("=========================================");
            
            if (purchaseEntry.getPurchaseInvoiceNo() == null || purchaseEntry.getPurchaseInvoiceNo().isEmpty()) {
                purchaseEntry.setPurchaseInvoiceNo(generateInvoiceNumber());
                System.out.println("✅ Generated Invoice Number: " + purchaseEntry.getPurchaseInvoiceNo());
            }
            
            if (purchaseEntry.getItems() == null || purchaseEntry.getItems().isEmpty()) {
                throw new RuntimeException("No items to save!");
            }
            
            System.out.println("📦 Items received: " + purchaseEntry.getItems().size());
            
            // Calculate item amounts
            for (PurchaseItem item : purchaseEntry.getItems()) {
                BigDecimal unitPrice = item.getUnitPrice() != null ? item.getUnitPrice() : BigDecimal.ZERO;
                Integer quantity = item.getQuantity() != null ? item.getQuantity() : 0;
                BigDecimal discountPercent = item.getDiscountPercent() != null ? item.getDiscountPercent() : BigDecimal.ZERO;
                
                BigDecimal discountAmount = unitPrice.multiply(new BigDecimal(quantity))
                    .multiply(discountPercent).divide(new BigDecimal("100"), 2, java.math.RoundingMode.HALF_UP);
                BigDecimal amount = unitPrice.multiply(new BigDecimal(quantity)).subtract(discountAmount);
                item.setAmount(amount);
            }
            
            // Calculate totals
            calculatePurchaseTotals(purchaseEntry);
            
            // Save purchase
            List<PurchaseItem> itemsToSave = new ArrayList<>(purchaseEntry.getItems());
            purchaseEntry.setItems(new ArrayList<>());
            
            PurchaseEntry savedPurchase = purchaseEntryRepository.save(purchaseEntry);
            Long purchaseId = savedPurchase.getId();
            System.out.println("✅ Purchase saved with ID: " + purchaseId);
            
            // Save items with purchase_id and UPDATE STOCK
            List<PurchaseItem> savedItems = new ArrayList<>();
            for (PurchaseItem item : itemsToSave) {
                PurchaseItem newItem = new PurchaseItem();
                newItem.setPurchaseId(purchaseId);
                newItem.setItemId(item.getItemId());
                newItem.setItemCode(item.getItemCode());
                newItem.setItemName(item.getItemName());
                newItem.setUnitPrice(item.getUnitPrice());
                newItem.setQuantity(item.getQuantity());
                newItem.setDiscountPercent(item.getDiscountPercent() != null ? item.getDiscountPercent() : BigDecimal.ZERO);
                newItem.setAmount(item.getAmount());
                
                // UPDATE STOCK - INCREASE for purchase
                Item inventoryItem = findItem(item);
                if (inventoryItem != null) {
                    int currentStock = inventoryItem.getStockQty();
                    int newStock = currentStock + item.getQuantity();
                    inventoryItem.setStockQty(newStock);
                    itemRepository.save(inventoryItem);
                    newItem.setItemId(inventoryItem.getId());
                    System.out.println("📦 Stock INCREASED for: " + inventoryItem.getItemName() + 
                        " (Old: " + currentStock + ", Added: " + item.getQuantity() + ", New: " + newStock + ")");
                } else {
                    System.err.println("⚠️ Item not found: " + item.getItemCode());
                }
                
                PurchaseItem savedItem = purchaseItemRepository.save(newItem);
                savedItems.add(savedItem);
                System.out.println("   ✅ Item saved with ID: " + savedItem.getId());
            }
            
            savedPurchase.setItems(savedItems);
            PurchaseEntry result = purchaseEntryRepository.save(savedPurchase);
            
            System.out.println("✅ Purchase created successfully!");
            System.out.println("   Total items: " + result.getItems().size());
            System.out.println("   Subtotal: " + result.getSubtotal());
            System.out.println("   Total Amount: " + result.getTotalAmount());
            System.out.println("=========================================");
            
            return result;
            
        } catch (Exception e) {
            System.err.println("❌ Error creating purchase: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Failed to create purchase: " + e.getMessage());
        }
    }

    @Transactional
    public PurchaseEntry updatePurchase(Long id, PurchaseEntry purchaseEntry) {
        try {
            System.out.println("=========================================");
            System.out.println("📝 Updating purchase invoice: " + id);
            System.out.println("=========================================");
            
            PurchaseEntry existingPurchase = getPurchaseById(id);
            
            // RESTORE OLD STOCK - subtract the quantities that were added
            if (existingPurchase.getItems() != null && !existingPurchase.getItems().isEmpty()) {
                System.out.println("🔄 Restoring old stock...");
                for (PurchaseItem oldItem : existingPurchase.getItems()) {
                    Item inventoryItem = findItem(oldItem);
                    if (inventoryItem != null) {
                        int currentStock = inventoryItem.getStockQty();
                        int restoredStock = currentStock - oldItem.getQuantity();
                        if (restoredStock < 0) restoredStock = 0;
                        inventoryItem.setStockQty(restoredStock);
                        itemRepository.save(inventoryItem);
                        System.out.println("📦 Stock RESTORED for: " + inventoryItem.getItemName() + 
                            " (Old: " + currentStock + ", Removed: " + oldItem.getQuantity() + ", New: " + restoredStock + ")");
                    }
                }
            }
            
            // Delete old items
            System.out.println("🗑️ Deleting old items...");
            purchaseItemRepository.deleteByPurchaseId(id);
            existingPurchase.getItems().clear();
            
            // Update basic fields
            existingPurchase.setSupplierId(purchaseEntry.getSupplierId());
            existingPurchase.setPurchaseDate(purchaseEntry.getPurchaseDate());
            existingPurchase.setPaymentType(purchaseEntry.getPaymentType());
            existingPurchase.setDiscount(purchaseEntry.getDiscount());
            existingPurchase.setTaxRate(purchaseEntry.getTaxRate());
            existingPurchase.setAmountPaid(purchaseEntry.getAmountPaid());
            existingPurchase.setPurchasePerson(purchaseEntry.getPurchasePerson());
            existingPurchase.setNotes(purchaseEntry.getNotes());
            
            // Calculate item amounts
            if (purchaseEntry.getItems() != null && !purchaseEntry.getItems().isEmpty()) {
                for (PurchaseItem item : purchaseEntry.getItems()) {
                    BigDecimal unitPrice = item.getUnitPrice() != null ? item.getUnitPrice() : BigDecimal.ZERO;
                    Integer quantity = item.getQuantity() != null ? item.getQuantity() : 0;
                    BigDecimal discountPercent = item.getDiscountPercent() != null ? item.getDiscountPercent() : BigDecimal.ZERO;
                    
                    BigDecimal discountAmount = unitPrice.multiply(new BigDecimal(quantity))
                        .multiply(discountPercent).divide(new BigDecimal("100"), 2, java.math.RoundingMode.HALF_UP);
                    BigDecimal amount = unitPrice.multiply(new BigDecimal(quantity)).subtract(discountAmount);
                    item.setAmount(amount);
                }
            }
            
            // Calculate totals
            calculatePurchaseTotals(existingPurchase);
            
            // Save updated purchase
            PurchaseEntry updatedPurchase = purchaseEntryRepository.save(existingPurchase);
            System.out.println("✅ Purchase updated with new totals, ID: " + updatedPurchase.getId());
            
            // Add new items and UPDATE STOCK
            List<PurchaseItem> newItems = new ArrayList<>();
            if (purchaseEntry.getItems() != null && !purchaseEntry.getItems().isEmpty()) {
                System.out.println("🔄 Adding " + purchaseEntry.getItems().size() + " new items...");
                
                for (PurchaseItem item : purchaseEntry.getItems()) {
                    PurchaseItem newItem = new PurchaseItem();
                    newItem.setPurchaseId(id);
                    newItem.setItemId(item.getItemId());
                    newItem.setItemCode(item.getItemCode());
                    newItem.setItemName(item.getItemName());
                    newItem.setUnitPrice(item.getUnitPrice());
                    newItem.setQuantity(item.getQuantity());
                    newItem.setDiscountPercent(item.getDiscountPercent() != null ? item.getDiscountPercent() : BigDecimal.ZERO);
                    newItem.setAmount(item.getAmount());
                    
                    System.out.println("   Adding item: " + newItem.getItemCode() + " with purchase_id: " + id);
                    
                    // UPDATE STOCK - INCREASE for purchase
                    Item inventoryItem = findItem(item);
                    if (inventoryItem != null) {
                        int currentStock = inventoryItem.getStockQty();
                        int newStock = currentStock + item.getQuantity();
                        inventoryItem.setStockQty(newStock);
                        itemRepository.save(inventoryItem);
                        newItem.setItemId(inventoryItem.getId());
                        System.out.println("📦 Stock INCREASED for: " + inventoryItem.getItemName() + 
                            " (Old: " + currentStock + ", Added: " + item.getQuantity() + ", New: " + newStock + ")");
                    } else {
                        System.err.println("⚠️ Item not found: " + item.getItemCode());
                    }
                    
                    PurchaseItem savedItem = purchaseItemRepository.save(newItem);
                    newItems.add(savedItem);
                    System.out.println("   ✅ Item saved with ID: " + savedItem.getId());
                }
            }
            
            // Set new items
            updatedPurchase.setItems(newItems);
            
            // RECALCULATE TOTALS AFTER ADDING ITEMS
            calculatePurchaseTotals(updatedPurchase);
            
            // Save the final purchase with correct totals
            PurchaseEntry result = purchaseEntryRepository.save(updatedPurchase);
            
            System.out.println("✅ Purchase updated successfully!");
            System.out.println("   Total items: " + result.getItems().size());
            System.out.println("   Subtotal: " + result.getSubtotal());
            System.out.println("   Total Amount: " + result.getTotalAmount());
            System.out.println("=========================================");
            
            return getPurchaseById(result.getId());
            
        } catch (Exception e) {
            System.err.println("❌ Error updating purchase: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Failed to update purchase: " + e.getMessage());
        }
    }

    @Transactional
    public void deletePurchase(Long id) {
        try {
            System.out.println("🗑️ Deleting purchase: " + id);
            PurchaseEntry purchase = getPurchaseById(id);
            
            // Remove stock - subtract the quantities that were added
            if (purchase.getItems() != null && !purchase.getItems().isEmpty()) {
                for (PurchaseItem item : purchase.getItems()) {
                    Item inventoryItem = findItem(item);
                    if (inventoryItem != null) {
                        int currentStock = inventoryItem.getStockQty();
                        int restoredStock = currentStock - item.getQuantity();
                        if (restoredStock < 0) restoredStock = 0;
                        inventoryItem.setStockQty(restoredStock);
                        itemRepository.save(inventoryItem);
                        System.out.println("📦 Stock REMOVED for: " + inventoryItem.getItemName() + 
                            " (Old: " + currentStock + ", Removed: " + item.getQuantity() + ", New: " + restoredStock + ")");
                    }
                }
            }
            
            purchaseItemRepository.deleteByPurchaseId(id);
            purchaseEntryRepository.deleteById(id);
            System.out.println("✅ Purchase deleted: " + id);
            
        } catch (Exception e) {
            System.err.println("❌ Error deleting purchase: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Failed to delete purchase: " + e.getMessage());
        }
    }

    private void calculatePurchaseTotals(PurchaseEntry purchase) {
        BigDecimal subtotal = BigDecimal.ZERO;
        if (purchase.getItems() != null && !purchase.getItems().isEmpty()) {
            for (PurchaseItem item : purchase.getItems()) {
                subtotal = subtotal.add(item.getAmount());
            }
        }
        purchase.setSubtotal(subtotal);
        
        BigDecimal taxRate = purchase.getTaxRate() != null ? purchase.getTaxRate() : BigDecimal.ZERO;
        BigDecimal discount = purchase.getDiscount() != null ? purchase.getDiscount() : BigDecimal.ZERO;
        BigDecimal taxAmount = subtotal.multiply(taxRate).divide(new BigDecimal("100"), 2, java.math.RoundingMode.HALF_UP);
        purchase.setTaxAmount(taxAmount);
        
        BigDecimal totalAmount = subtotal.add(taxAmount).subtract(discount);
        purchase.setTotalAmount(totalAmount);
        
        BigDecimal amountPaid = purchase.getAmountPaid() != null ? purchase.getAmountPaid() : BigDecimal.ZERO;
        BigDecimal balance = totalAmount.subtract(amountPaid);
        purchase.setBalance(balance);
    }

    private Item findItem(PurchaseItem item) {
        Item inventoryItem = null;
        if (item.getItemId() != null) {
            inventoryItem = itemRepository.findById(item.getItemId()).orElse(null);
        }
        if (inventoryItem == null && item.getItemCode() != null) {
            List<Item> allItems = itemRepository.findAll();
            for (Item i : allItems) {
                if (i.getItemCode().equals(item.getItemCode())) {
                    inventoryItem = i;
                    break;
                }
            }
        }
        return inventoryItem;
    }
}