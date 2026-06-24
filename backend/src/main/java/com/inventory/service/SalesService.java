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

import java.util.List;

@Service
public class SalesService {
    @Autowired
    private SalesEntryRepository salesEntryRepository;
    @Autowired
    private SalesItemRepository salesItemRepository;
    @Autowired
    private ItemRepository itemRepository;

    public List<SalesEntry> getAllSales() {
        return salesEntryRepository.findAll();
    }

    public SalesEntry getSalesById(Long id) {
        return salesEntryRepository.findById(id).orElseThrow(() -> new RuntimeException("Sales not found"));
    }

    @Transactional
    public SalesEntry createSales(SalesEntry salesEntry) {
        // Save sales entry first
        SalesEntry savedSales = salesEntryRepository.save(salesEntry);
        
        // Update stock for each item
        for (SalesItem item : salesEntry.getItems()) {
            item.setSaleId(savedSales.getId());
            
            // Find item by code
            List<Item> items = itemRepository.findAll();
            boolean itemFound = false;
            for (Item inventoryItem : items) {
                if (inventoryItem.getItemCode().equals(item.getItemCode())) {
                    int newStock = inventoryItem.getStockQty() - item.getQuantity();
                    if (newStock < 0) {
                        throw new RuntimeException("Insufficient stock for item: " + inventoryItem.getItemName() + 
                            ". Available: " + inventoryItem.getStockQty());
                    }
                    inventoryItem.setStockQty(newStock);
                    itemRepository.save(inventoryItem);
                    item.setItemId(inventoryItem.getId());
                    itemFound = true;
                    break;
                }
            }
            if (!itemFound) {
                throw new RuntimeException("Item not found with code: " + item.getItemCode());
            }
            salesItemRepository.save(item);
        }
        
        savedSales.setItems(salesEntry.getItems());
        return savedSales;
    }

    @Transactional
    public SalesEntry updateSales(Long id, SalesEntry salesEntry) {
        SalesEntry existing = getSalesById(id);
        existing.setCustomerId(salesEntry.getCustomerId());
        existing.setInvoiceDate(salesEntry.getInvoiceDate());
        existing.setPaymentType(salesEntry.getPaymentType());
        existing.setDiscount(salesEntry.getDiscount());
        existing.setTaxRate(salesEntry.getTaxRate());
        existing.setAmountPaid(salesEntry.getAmountPaid());
        existing.setSalesPerson(salesEntry.getSalesPerson());
        existing.setNotes(salesEntry.getNotes());
        return salesEntryRepository.save(existing);
    }

    @Transactional
    public void deleteSales(Long id) {
        SalesEntry sales = getSalesById(id);
        // Restore stock
        for (SalesItem item : sales.getItems()) {
            if (item.getItemId() != null) {
                Item inventoryItem = itemRepository.findById(item.getItemId()).orElse(null);
                if (inventoryItem != null) {
                    int newStock = inventoryItem.getStockQty() + item.getQuantity();
                    inventoryItem.setStockQty(newStock);
                    itemRepository.save(inventoryItem);
                }
            }
        }
        salesEntryRepository.deleteById(id);
    }
}