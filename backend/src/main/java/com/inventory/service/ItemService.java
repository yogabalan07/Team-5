package com.inventory.service;

import com.inventory.model.Item;
import com.inventory.repository.ItemRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class ItemService {
    @Autowired
    private ItemRepository itemRepository;

    public List<Item> getAllItems() {
        return itemRepository.findAll();
    }

    public Item getItemById(Long id) {
        return itemRepository.findById(id).orElseThrow(() -> new RuntimeException("Item not found with id: " + id));
    }

    public Item getItemByCode(String itemCode) {
        return itemRepository.findAll().stream()
            .filter(item -> item.getItemCode().equals(itemCode))
            .findFirst()
            .orElseThrow(() -> new RuntimeException("Item not found with code: " + itemCode));
    }

    public Item createItem(Item item) {
        return itemRepository.save(item);
    }

    public Item updateItem(Long id, Item item) {
        Item existing = getItemById(id);
        existing.setItemName(item.getItemName());
        existing.setCategory(item.getCategory());
        existing.setUnit(item.getUnit());
        existing.setPrice(item.getPrice());
        existing.setStockQty(item.getStockQty());
        existing.setReorderLevel(item.getReorderLevel());
        return itemRepository.save(existing);
    }

    public void deleteItem(Long id) {
        itemRepository.deleteById(id);
    }

    public Item updateStock(Long id, int quantityChange) {
        Item item = getItemById(id);
        int newStock = item.getStockQty() + quantityChange;
        if (newStock < 0) {
            throw new RuntimeException("Insufficient stock. Available: " + item.getStockQty());
        }
        item.setStockQty(newStock);
        return itemRepository.save(item);
    }
}