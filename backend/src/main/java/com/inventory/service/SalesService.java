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
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

@Service
public class SalesService {
    
    @Autowired
    private SalesEntryRepository salesEntryRepository;
    
    @Autowired
    private SalesItemRepository salesItemRepository;
    
    @Autowired
    private ItemRepository itemRepository;

    private String generateInvoiceNumber() {
        LocalDate today = LocalDate.now();
        String dateStr = today.format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        String prefix = "SAL-" + dateStr + "-";
        List<SalesEntry> todaySales = salesEntryRepository.findByInvoiceDate(today);
        
        int maxNumber = 0;
        for (SalesEntry sale : todaySales) {
            String invoiceNo = sale.getInvoiceNo();
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

    public List<SalesEntry> getAllSales() {
        try {
            List<SalesEntry> sales = salesEntryRepository.findAll();
            for (SalesEntry sale : sales) {
                List<SalesItem> items = salesItemRepository.findBySaleId(sale.getId());
                sale.setItems(items != null ? items : new ArrayList<>());
            }
            return sales;
        } catch (Exception e) {
            System.err.println("❌ Error fetching sales: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }

    public SalesEntry getSalesById(Long id) {
        SalesEntry sale = salesEntryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Sales not found with id: " + id));
        List<SalesItem> items = salesItemRepository.findBySaleId(id);
        sale.setItems(items != null ? items : new ArrayList<>());
        return sale;
    }

    public SalesEntry getSalesByInvoiceNo(String invoiceNo) {
        SalesEntry sale = salesEntryRepository.findByInvoiceNo(invoiceNo)
                .orElseThrow(() -> new RuntimeException("Sales not found with invoice: " + invoiceNo));
        List<SalesItem> items = salesItemRepository.findBySaleId(sale.getId());
        sale.setItems(items != null ? items : new ArrayList<>());
        return sale;
    }

    public List<SalesEntry> getSalesByCustomer(Long customerId) {
        return salesEntryRepository.findByCustomerId(customerId);
    }

    public List<SalesEntry> getSalesByDateRange(LocalDate start, LocalDate end) {
        return salesEntryRepository.findByInvoiceDateBetween(start, end);
    }

    @Transactional
    public SalesEntry createSales(SalesEntry salesEntry) {
        try {
            System.out.println("=========================================");
            System.out.println("📝 Creating sales invoice");
            System.out.println("=========================================");
            
            if (salesEntry.getInvoiceNo() == null || salesEntry.getInvoiceNo().isEmpty()) {
                salesEntry.setInvoiceNo(generateInvoiceNumber());
                System.out.println("✅ Generated Invoice Number: " + salesEntry.getInvoiceNo());
            }
            
            if (salesEntry.getItems() == null || salesEntry.getItems().isEmpty()) {
                throw new RuntimeException("No items to save!");
            }
            
            System.out.println("📦 Items received: " + salesEntry.getItems().size());
            
            // Calculate item amounts
            for (SalesItem item : salesEntry.getItems()) {
                BigDecimal unitPrice = item.getUnitPrice() != null ? item.getUnitPrice() : BigDecimal.ZERO;
                Integer quantity = item.getQuantity() != null ? item.getQuantity() : 0;
                BigDecimal discountPercent = item.getDiscountPercent() != null ? item.getDiscountPercent() : BigDecimal.ZERO;
                
                BigDecimal discountAmount = unitPrice.multiply(new BigDecimal(quantity))
                    .multiply(discountPercent).divide(new BigDecimal("100"), 2, java.math.RoundingMode.HALF_UP);
                BigDecimal amount = unitPrice.multiply(new BigDecimal(quantity)).subtract(discountAmount);
                item.setAmount(amount);
            }
            
            // Calculate totals
            calculateSalesTotals(salesEntry);
            
            // Save sales
            List<SalesItem> itemsToSave = new ArrayList<>(salesEntry.getItems());
            salesEntry.setItems(new ArrayList<>());
            
            SalesEntry savedSales = salesEntryRepository.save(salesEntry);
            Long saleId = savedSales.getId();
            System.out.println("✅ Sales saved with ID: " + saleId);
            
            // Save items with sale_id and UPDATE STOCK (DECREASE)
            List<SalesItem> savedItems = new ArrayList<>();
            for (SalesItem item : itemsToSave) {
                SalesItem newItem = new SalesItem();
                newItem.setSaleId(saleId);
                newItem.setItemId(item.getItemId());
                newItem.setItemCode(item.getItemCode());
                newItem.setItemName(item.getItemName());
                newItem.setUnitPrice(item.getUnitPrice());
                newItem.setQuantity(item.getQuantity());
                newItem.setDiscountPercent(item.getDiscountPercent() != null ? item.getDiscountPercent() : BigDecimal.ZERO);
                newItem.setAmount(item.getAmount());
                
                // UPDATE STOCK - DECREASE for sales
                Item inventoryItem = findItem(item);
                if (inventoryItem != null) {
                    int currentStock = inventoryItem.getStockQty();
                    int newStock = currentStock - item.getQuantity();
                    
                    if (newStock < 0) {
                        throw new RuntimeException("Insufficient stock for item: " + inventoryItem.getItemName() + 
                            ". Available: " + currentStock + ", Requested: " + item.getQuantity());
                    }
                    
                    inventoryItem.setStockQty(newStock);
                    itemRepository.save(inventoryItem);
                    newItem.setItemId(inventoryItem.getId());
                    System.out.println("📦 Stock DECREASED for: " + inventoryItem.getItemName() + 
                        " (Old: " + currentStock + ", Sold: " + item.getQuantity() + ", New: " + newStock + ")");
                } else {
                    System.err.println("⚠️ Item not found: " + item.getItemCode());
                }
                
                SalesItem savedItem = salesItemRepository.save(newItem);
                savedItems.add(savedItem);
                System.out.println("   ✅ Item saved with ID: " + savedItem.getId());
            }
            
            savedSales.setItems(savedItems);
            SalesEntry result = salesEntryRepository.save(savedSales);
            
            System.out.println("✅ Sales created successfully!");
            System.out.println("   Total items: " + result.getItems().size());
            System.out.println("   Subtotal: " + result.getSubtotal());
            System.out.println("   Total Amount: " + result.getTotalAmount());
            System.out.println("=========================================");
            
            return result;
            
        } catch (Exception e) {
            System.err.println("❌ Error creating sales: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Failed to create sales: " + e.getMessage());
        }
    }

    @Transactional
    public SalesEntry updateSales(Long id, SalesEntry salesEntry) {
        try {
            System.out.println("=========================================");
            System.out.println("📝 Updating sales invoice: " + id);
            System.out.println("=========================================");
            
            SalesEntry existingSales = getSalesById(id);
            
            // RESTORE OLD STOCK - add back the quantities that were sold
            if (existingSales.getItems() != null && !existingSales.getItems().isEmpty()) {
                System.out.println("🔄 Restoring old stock...");
                for (SalesItem oldItem : existingSales.getItems()) {
                    Item inventoryItem = findItem(oldItem);
                    if (inventoryItem != null) {
                        int currentStock = inventoryItem.getStockQty();
                        int restoredStock = currentStock + oldItem.getQuantity();
                        inventoryItem.setStockQty(restoredStock);
                        itemRepository.save(inventoryItem);
                        System.out.println("📦 Stock RESTORED for: " + inventoryItem.getItemName() + 
                            " (Old: " + currentStock + ", Added Back: " + oldItem.getQuantity() + ", New: " + restoredStock + ")");
                    }
                }
            }
            
            // Delete old items
            System.out.println("🗑️ Deleting old items...");
            salesItemRepository.deleteBySaleId(id);
            existingSales.getItems().clear();
            
            // Update basic fields
            existingSales.setCustomerId(salesEntry.getCustomerId());
            existingSales.setInvoiceDate(salesEntry.getInvoiceDate());
            existingSales.setPaymentType(salesEntry.getPaymentType());
            existingSales.setDiscount(salesEntry.getDiscount());
            existingSales.setTaxRate(salesEntry.getTaxRate());
            existingSales.setAmountPaid(salesEntry.getAmountPaid());
            existingSales.setSalesPerson(salesEntry.getSalesPerson());
            existingSales.setNotes(salesEntry.getNotes());
            
            // Calculate item amounts
            if (salesEntry.getItems() != null && !salesEntry.getItems().isEmpty()) {
                for (SalesItem item : salesEntry.getItems()) {
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
            calculateSalesTotals(existingSales);
            
            // Save updated sales
            SalesEntry updatedSales = salesEntryRepository.save(existingSales);
            System.out.println("✅ Sales updated with new totals, ID: " + updatedSales.getId());
            
            // Add new items and UPDATE STOCK (DECREASE)
            List<SalesItem> newItems = new ArrayList<>();
            if (salesEntry.getItems() != null && !salesEntry.getItems().isEmpty()) {
                System.out.println("🔄 Adding " + salesEntry.getItems().size() + " new items...");
                
                for (SalesItem item : salesEntry.getItems()) {
                    SalesItem newItem = new SalesItem();
                    newItem.setSaleId(id);
                    newItem.setItemId(item.getItemId());
                    newItem.setItemCode(item.getItemCode());
                    newItem.setItemName(item.getItemName());
                    newItem.setUnitPrice(item.getUnitPrice());
                    newItem.setQuantity(item.getQuantity());
                    newItem.setDiscountPercent(item.getDiscountPercent() != null ? item.getDiscountPercent() : BigDecimal.ZERO);
                    newItem.setAmount(item.getAmount());
                    
                    System.out.println("   Adding item: " + newItem.getItemCode() + " with sale_id: " + id);
                    
                    // UPDATE STOCK - DECREASE for sales
                    Item inventoryItem = findItem(item);
                    if (inventoryItem != null) {
                        int currentStock = inventoryItem.getStockQty();
                        int newStock = currentStock - item.getQuantity();
                        
                        if (newStock < 0) {
                            throw new RuntimeException("Insufficient stock for item: " + inventoryItem.getItemName() + 
                                ". Available: " + currentStock + ", Requested: " + item.getQuantity());
                        }
                        
                        inventoryItem.setStockQty(newStock);
                        itemRepository.save(inventoryItem);
                        newItem.setItemId(inventoryItem.getId());
                        System.out.println("📦 Stock DECREASED for: " + inventoryItem.getItemName() + 
                            " (Old: " + currentStock + ", Sold: " + item.getQuantity() + ", New: " + newStock + ")");
                    } else {
                        System.err.println("⚠️ Item not found: " + item.getItemCode());
                    }
                    
                    SalesItem savedItem = salesItemRepository.save(newItem);
                    newItems.add(savedItem);
                    System.out.println("   ✅ Item saved with ID: " + savedItem.getId());
                }
            }
            
            // Set new items
            updatedSales.setItems(newItems);
            
            // RECALCULATE TOTALS AFTER ADDING ITEMS
            calculateSalesTotals(updatedSales);
            
            // Save the final sales with correct totals
            SalesEntry result = salesEntryRepository.save(updatedSales);
            
            System.out.println("✅ Sales updated successfully!");
            System.out.println("   Total items: " + result.getItems().size());
            System.out.println("   Subtotal: " + result.getSubtotal());
            System.out.println("   Total Amount: " + result.getTotalAmount());
            System.out.println("=========================================");
            
            return getSalesById(result.getId());
            
        } catch (Exception e) {
            System.err.println("❌ Error updating sales: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Failed to update sales: " + e.getMessage());
        }
    }

    @Transactional
    public void deleteSales(Long id) {
        try {
            System.out.println("🗑️ Deleting sales: " + id);
            SalesEntry sales = getSalesById(id);
            
            // Restore stock - add back the quantities that were sold
            if (sales.getItems() != null && !sales.getItems().isEmpty()) {
                for (SalesItem item : sales.getItems()) {
                    Item inventoryItem = findItem(item);
                    if (inventoryItem != null) {
                        int currentStock = inventoryItem.getStockQty();
                        int restoredStock = currentStock + item.getQuantity();
                        inventoryItem.setStockQty(restoredStock);
                        itemRepository.save(inventoryItem);
                        System.out.println("📦 Stock RESTORED for: " + inventoryItem.getItemName() + 
                            " (Old: " + currentStock + ", Added Back: " + item.getQuantity() + ", New: " + restoredStock + ")");
                    }
                }
            }
            
            salesItemRepository.deleteBySaleId(id);
            salesEntryRepository.deleteById(id);
            System.out.println("✅ Sales deleted: " + id);
            
        } catch (Exception e) {
            System.err.println("❌ Error deleting sales: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Failed to delete sales: " + e.getMessage());
        }
    }

    private void calculateSalesTotals(SalesEntry sales) {
        BigDecimal subtotal = BigDecimal.ZERO;
        if (sales.getItems() != null && !sales.getItems().isEmpty()) {
            for (SalesItem item : sales.getItems()) {
                subtotal = subtotal.add(item.getAmount());
            }
        }
        sales.setSubtotal(subtotal);
        
        BigDecimal taxRate = sales.getTaxRate() != null ? sales.getTaxRate() : BigDecimal.ZERO;
        BigDecimal discount = sales.getDiscount() != null ? sales.getDiscount() : BigDecimal.ZERO;
        BigDecimal taxAmount = subtotal.multiply(taxRate).divide(new BigDecimal("100"), 2, java.math.RoundingMode.HALF_UP);
        sales.setTaxAmount(taxAmount);
        
        BigDecimal totalAmount = subtotal.add(taxAmount).subtract(discount);
        sales.setTotalAmount(totalAmount);
        
        BigDecimal amountPaid = sales.getAmountPaid() != null ? sales.getAmountPaid() : BigDecimal.ZERO;
        BigDecimal balance = totalAmount.subtract(amountPaid);
        sales.setBalance(balance);
    }

    private Item findItem(SalesItem item) {
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