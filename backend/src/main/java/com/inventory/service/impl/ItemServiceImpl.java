package com.inventory.service.impl;

import com.inventory.dto.request.ItemRequest;
import com.inventory.dto.response.ItemResponse;
import com.inventory.exception.BusinessException;
import com.inventory.exception.ResourceNotFoundException;
import com.inventory.model.*;
import com.inventory.repository.*;
import com.inventory.service.ItemService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class ItemServiceImpl implements ItemService {

    @Autowired
    private ItemRepository itemRepository;

    @Autowired
    private ItemBrandRepository itemBrandRepository;

    @Autowired
    private ItemGroupRepository itemGroupRepository;

    @Autowired
    private ItemSectionRepository itemSectionRepository;

    @Autowired
    private UnitRepository unitRepository;

    @Autowired
    private TaxMasterRepository taxMasterRepository;

    @Autowired
    private StockTransactionRepository stockTransactionRepository;

    @Override
    public ItemResponse createItem(ItemRequest request) {
        // Check if item already exists with same code
        if (itemRepository.findByCode(request.getCode()).isPresent()) {
            throw new BusinessException("Item already exists with code: " + request.getCode());
        }

        Item item = new Item();
        item.setCode(request.getCode());
        item.setName(request.getName());
        item.setDescription(request.getDescription());
        
        // Set brand if provided
        if (request.getBrandId() != null) {
            ItemBrand brand = itemBrandRepository.findById(request.getBrandId())
                .orElseThrow(() -> new ResourceNotFoundException("Brand not found with id: " + request.getBrandId()));
            item.setBrand(brand);
        }
        
        // Set group if provided
        if (request.getGroupId() != null) {
            ItemGroup group = itemGroupRepository.findById(request.getGroupId())
                .orElseThrow(() -> new ResourceNotFoundException("Group not found with id: " + request.getGroupId()));
            item.setGroup(group);
        }
        
        // Set section if provided
        if (request.getSectionId() != null) {
            ItemSection section = itemSectionRepository.findById(request.getSectionId())
                .orElseThrow(() -> new ResourceNotFoundException("Section not found with id: " + request.getSectionId()));
            item.setSection(section);
        }
        
        // Set unit if provided
        if (request.getUnitId() != null) {
            Unit unit = unitRepository.findById(request.getUnitId())
                .orElseThrow(() -> new ResourceNotFoundException("Unit not found with id: " + request.getUnitId()));
            item.setUnit(unit);
        }
        
        // Set tax if provided
        if (request.getTaxId() != null) {
            TaxMaster tax = taxMasterRepository.findById(request.getTaxId())
                .orElseThrow(() -> new ResourceNotFoundException("Tax not found with id: " + request.getTaxId()));
            item.setTax(tax);
        }

        // Set pricing and stock
        item.setPurchasePrice(request.getPurchasePrice() != null ? request.getPurchasePrice() : BigDecimal.ZERO);
        item.setSellingPrice(request.getSellingPrice() != null ? request.getSellingPrice() : BigDecimal.ZERO);
        item.setGstRate(request.getGstRate() != null ? request.getGstRate() : BigDecimal.ZERO);
        item.setHsnCode(request.getHsnCode());
        item.setOpeningStock(request.getOpeningStock() != null ? request.getOpeningStock() : BigDecimal.ZERO);
        
        // Set current stock
        if (request.getCurrentStock() != null) {
            item.setCurrentStock(request.getCurrentStock());
        } else {
            item.setCurrentStock(item.getOpeningStock());
        }
        
        item.setMinStockLevel(request.getMinStockLevel() != null ? request.getMinStockLevel() : BigDecimal.ZERO);
        item.setMaxStockLevel(request.getMaxStockLevel() != null ? request.getMaxStockLevel() : BigDecimal.ZERO);
        item.setReorderLevel(request.getReorderLevel() != null ? request.getReorderLevel() : BigDecimal.ZERO);
        item.setIsActive(true);

        Item saved = itemRepository.save(item);
        System.out.println("✅ Item created: " + saved.getId() + " - " + saved.getName() + " | Stock: " + saved.getCurrentStock());
        return convertToResponse(saved);
    }

    @Override
    public ItemResponse updateItem(Long id, ItemRequest request) {
        System.out.println("🔄 Updating item with ID: " + id);
        
        Item item = itemRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Item not found with id: " + id));

        // Update basic info
        item.setName(request.getName());
        item.setDescription(request.getDescription());
        
        // Update brand if provided
        if (request.getBrandId() != null) {
            ItemBrand brand = itemBrandRepository.findById(request.getBrandId())
                .orElseThrow(() -> new ResourceNotFoundException("Brand not found with id: " + request.getBrandId()));
            item.setBrand(brand);
        } else {
            item.setBrand(null);
        }
        
        // Update group if provided
        if (request.getGroupId() != null) {
            ItemGroup group = itemGroupRepository.findById(request.getGroupId())
                .orElseThrow(() -> new ResourceNotFoundException("Group not found with id: " + request.getGroupId()));
            item.setGroup(group);
        } else {
            item.setGroup(null);
        }
        
        // Update section if provided
        if (request.getSectionId() != null) {
            ItemSection section = itemSectionRepository.findById(request.getSectionId())
                .orElseThrow(() -> new ResourceNotFoundException("Section not found with id: " + request.getSectionId()));
            item.setSection(section);
        } else {
            item.setSection(null);
        }
        
        // Update unit if provided
        if (request.getUnitId() != null) {
            Unit unit = unitRepository.findById(request.getUnitId())
                .orElseThrow(() -> new ResourceNotFoundException("Unit not found with id: " + request.getUnitId()));
            item.setUnit(unit);
        } else {
            item.setUnit(null);
        }
        
        // Update tax if provided
        if (request.getTaxId() != null) {
            TaxMaster tax = taxMasterRepository.findById(request.getTaxId())
                .orElseThrow(() -> new ResourceNotFoundException("Tax not found with id: " + request.getTaxId()));
            item.setTax(tax);
        } else {
            item.setTax(null);
        }

        // Update pricing
        item.setPurchasePrice(request.getPurchasePrice() != null ? request.getPurchasePrice() : BigDecimal.ZERO);
        item.setSellingPrice(request.getSellingPrice() != null ? request.getSellingPrice() : BigDecimal.ZERO);
        item.setGstRate(request.getGstRate() != null ? request.getGstRate() : BigDecimal.ZERO);
        item.setHsnCode(request.getHsnCode());
        item.setOpeningStock(request.getOpeningStock() != null ? request.getOpeningStock() : BigDecimal.ZERO);
        
        // ============================================================
        // IMPORTANT: Update current stock if provided
        // ============================================================
        if (request.getCurrentStock() != null) {
            BigDecimal oldStock = item.getCurrentStock();
            BigDecimal newStock = request.getCurrentStock();
            
            // Validate stock is not negative
            if (newStock.compareTo(BigDecimal.ZERO) < 0) {
                throw new BusinessException("Current stock cannot be negative");
            }
            
            item.setCurrentStock(newStock);
            System.out.println("📦 Stock updated: " + oldStock + " → " + newStock);
            
            // Record stock adjustment transaction
            StockTransaction transaction = new StockTransaction();
            transaction.setItem(item);
            transaction.setTransactionType(com.inventory.enums.TransactionType.ADJUSTMENT);
            transaction.setReferenceNo("ADJ-" + System.currentTimeMillis());
            transaction.setQuantity(newStock.subtract(oldStock));
            transaction.setPreviousStock(oldStock);
            transaction.setNewStock(newStock);
            transaction.setUnitPrice(item.getPurchasePrice());
            stockTransactionRepository.save(transaction);
            System.out.println("📝 Stock transaction recorded");
        } else {
            // If currentStock is not provided, keep the existing value
            System.out.println("ℹ️ Current stock not changed: " + item.getCurrentStock());
        }
        
        item.setMinStockLevel(request.getMinStockLevel() != null ? request.getMinStockLevel() : BigDecimal.ZERO);
        item.setMaxStockLevel(request.getMaxStockLevel() != null ? request.getMaxStockLevel() : BigDecimal.ZERO);
        item.setReorderLevel(request.getReorderLevel() != null ? request.getReorderLevel() : BigDecimal.ZERO);

        Item updated = itemRepository.save(item);
        System.out.println("✅ Item updated: " + updated.getId() + " - " + updated.getName() + " | Stock: " + updated.getCurrentStock());
        return convertToResponse(updated);
    }

    @Override
    @Transactional
    public void deleteItem(Long id) {
        try {
            System.out.println("🗑️ Attempting to delete item with ID: " + id);
            
            Item item = itemRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Item not found with id: " + id));
            
            // Try hard delete first
            try {
                itemRepository.delete(item);
                System.out.println("✅ Item permanently deleted from database: " + id + " - " + item.getName());
            } catch (Exception e) {
                System.err.println("⚠️ Hard delete failed, falling back to soft delete: " + e.getMessage());
                
                // Fallback to soft delete
                item.setIsActive(false);
                itemRepository.save(item);
                System.out.println("✅ Item soft deleted (deactivated): " + id + " - " + item.getName());
            }
            
        } catch (Exception e) {
            System.err.println("❌ Error deleting item: " + e.getMessage());
            e.printStackTrace();
            throw new BusinessException("Cannot delete item: " + e.getMessage());
        }
    }

    /**
     * Hard Delete - Permanently remove item from database
     */
    @Transactional
    public void hardDeleteItem(Long id) {
        System.out.println("🗑️ Hard deleting item with ID: " + id);
        
        Item item = itemRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Item not found with id: " + id));
        
        itemRepository.delete(item);
        System.out.println("✅ Item hard deleted: " + id + " - " + item.getName());
    }

    /**
     * Soft Delete - Deactivate item
     */
    @Transactional
    public void softDeleteItem(Long id) {
        System.out.println("🗑️ Soft deleting item with ID: " + id);
        
        Item item = itemRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Item not found with id: " + id));
        
        item.setIsActive(false);
        itemRepository.save(item);
        System.out.println("✅ Item soft deleted (deactivated): " + id + " - " + item.getName());
    }

    /**
     * Restore a soft-deleted item
     */
    @Transactional
    public ItemResponse restoreItem(Long id) {
        Item item = itemRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Item not found with id: " + id));
        
        if (item.getIsActive()) {
            throw new BusinessException("Item is already active");
        }
        
        item.setIsActive(true);
        Item restored = itemRepository.save(item);
        System.out.println("✅ Item restored: " + id + " - " + item.getName());
        return convertToResponse(restored);
    }

    @Override
    public ItemResponse getItemById(Long id) {
        Item item = itemRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Item not found with id: " + id));
        return convertToResponse(item);
    }

    @Override
    public ItemResponse getItemByCode(String code) {
        Item item = itemRepository.findByCode(code)
            .orElseThrow(() -> new ResourceNotFoundException("Item not found with code: " + code));
        return convertToResponse(item);
    }

    @Override
    public Page<ItemResponse> getAllItems(Pageable pageable) {
        return itemRepository.findAll(pageable)
            .map(this::convertToResponse);
    }

    @Override
    public Page<ItemResponse> searchItems(String search, Pageable pageable) {
        return itemRepository.searchItems(search, pageable)
            .map(this::convertToResponse);
    }

    @Override
    public List<ItemResponse> getLowStockItems() {
        return itemRepository.findLowStockItems()
            .stream()
            .map(this::convertToResponse)
            .collect(Collectors.toList());
    }

    @Override
    public List<ItemResponse> getRecentItems() {
        return itemRepository.findTop10ByOrderByCreatedAtDesc()
            .stream()
            .map(this::convertToResponse)
            .collect(Collectors.toList());
    }

    /**
     * Update stock for an item
     */
    @Transactional
    public ItemResponse updateStock(Long id, BigDecimal newStock) {
        Item item = itemRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Item not found with id: " + id));
        
        if (newStock.compareTo(BigDecimal.ZERO) < 0) {
            throw new BusinessException("Stock cannot be negative");
        }
        
        BigDecimal oldStock = item.getCurrentStock();
        item.setCurrentStock(newStock);
        Item updated = itemRepository.save(item);
        
        // Record stock transaction
        StockTransaction transaction = new StockTransaction();
        transaction.setItem(item);
        transaction.setTransactionType(com.inventory.enums.TransactionType.ADJUSTMENT);
        transaction.setReferenceNo("ADJ-" + System.currentTimeMillis());
        transaction.setQuantity(newStock.subtract(oldStock));
        transaction.setPreviousStock(oldStock);
        transaction.setNewStock(newStock);
        transaction.setUnitPrice(item.getPurchasePrice());
        stockTransactionRepository.save(transaction);
        
        System.out.println("✅ Stock updated for item: " + id + " - " + oldStock + " → " + newStock);
        return convertToResponse(updated);
    }

    /**
     * Get stock transactions for an item
     */
    public List<StockTransaction> getStockTransactions(Long itemId) {
        return stockTransactionRepository.findByItemId(itemId);
    }

    private ItemResponse convertToResponse(Item item) {
        return ItemResponse.builder()
            .id(item.getId())
            .code(item.getCode())
            .name(item.getName())
            .description(item.getDescription())
            .brandName(item.getBrand() != null ? item.getBrand().getName() : null)
            .groupName(item.getGroup() != null ? item.getGroup().getName() : null)
            .sectionName(item.getSection() != null ? item.getSection().getName() : null)
            .unitName(item.getUnit() != null ? item.getUnit().getName() : null)
            .taxName(item.getTax() != null ? item.getTax().getName() : null)
            .purchasePrice(item.getPurchasePrice())
            .sellingPrice(item.getSellingPrice())
            .gstRate(item.getGstRate())
            .hsnCode(item.getHsnCode())
            .openingStock(item.getOpeningStock())
            .currentStock(item.getCurrentStock())
            .minStockLevel(item.getMinStockLevel())
            .maxStockLevel(item.getMaxStockLevel())
            .reorderLevel(item.getReorderLevel())
            .isActive(item.getIsActive())
            .createdAt(item.getCreatedAt())
            .updatedAt(item.getUpdatedAt())
            .build();
    }
}