package com.inventory.service.impl;

import com.inventory.dto.response.StockTransactionResponse;
import com.inventory.enums.TransactionType;
import com.inventory.exception.ResourceNotFoundException;
import com.inventory.model.Item;
import com.inventory.model.StockTransaction;
import com.inventory.repository.ItemRepository;
import com.inventory.repository.StockTransactionRepository;
import com.inventory.service.StockService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class StockServiceImpl implements StockService {

    @Autowired
    private StockTransactionRepository stockTransactionRepository;

    @Autowired
    private ItemRepository itemRepository;

    @Override
    public List<StockTransactionResponse> getStockTransactionsByItem(Long itemId) {
        if (!itemRepository.existsById(itemId)) {
            throw new ResourceNotFoundException("Item not found with id: " + itemId);
        }

        return stockTransactionRepository.findByItemId(itemId)
            .stream()
            .map(this::convertToResponse)
            .collect(Collectors.toList());
    }

    @Override
    public Page<StockTransactionResponse> getStockTransactionsByType(TransactionType type, String startDate, String endDate, Pageable pageable) {
        LocalDateTime start = LocalDateTime.parse(startDate + "T00:00:00", DateTimeFormatter.ISO_LOCAL_DATE_TIME);
        LocalDateTime end = LocalDateTime.parse(endDate + "T23:59:59", DateTimeFormatter.ISO_LOCAL_DATE_TIME);

        return stockTransactionRepository.findByTypeAndDateRange(type, start, end, pageable)
            .map(this::convertToResponse);
    }

    @Override
    public Page<StockTransactionResponse> getStockTransactionsByDateRange(String startDate, String endDate, Pageable pageable) {
        LocalDateTime start = LocalDateTime.parse(startDate + "T00:00:00", DateTimeFormatter.ISO_LOCAL_DATE_TIME);
        LocalDateTime end = LocalDateTime.parse(endDate + "T23:59:59", DateTimeFormatter.ISO_LOCAL_DATE_TIME);

        return stockTransactionRepository.findByDateRange(start, end, pageable)
            .map(this::convertToResponse);
    }

    @Override
    public void updateStock(Long itemId, BigDecimal quantity, TransactionType type, String referenceNo, Long referenceId) {
        Item item = itemRepository.findById(itemId)
            .orElseThrow(() -> new ResourceNotFoundException("Item not found with id: " + itemId));

        BigDecimal previousStock = item.getCurrentStock();
        BigDecimal newStock;

        switch (type) {
            case PURCHASE:
            case RETURN_IN:
                newStock = previousStock.add(quantity);
                break;
            case SALES:
            case RETURN_OUT:
                newStock = previousStock.subtract(quantity);
                break;
            case ADJUSTMENT:
                newStock = quantity;
                break;
            default:
                throw new IllegalArgumentException("Invalid transaction type: " + type);
        }

        if (newStock.compareTo(BigDecimal.ZERO) < 0 && type != TransactionType.ADJUSTMENT) {
            throw new RuntimeException("Insufficient stock. Current stock: " + previousStock + 
                ", Attempted to " + type + ": " + quantity);
        }

        item.setCurrentStock(newStock);
        itemRepository.save(item);

        StockTransaction transaction = new StockTransaction();
        transaction.setItem(item);
        transaction.setTransactionType(type);
        transaction.setReferenceNo(referenceNo);
        transaction.setReferenceId(referenceId);
        transaction.setQuantity(quantity);
        transaction.setPreviousStock(previousStock);
        transaction.setNewStock(newStock);
        transaction.setUnitPrice(item.getPurchasePrice());

        stockTransactionRepository.save(transaction);
    }

    private StockTransactionResponse convertToResponse(StockTransaction transaction) {
        return StockTransactionResponse.builder()
            .id(transaction.getId())
            .itemName(transaction.getItem().getName())
            .itemCode(transaction.getItem().getCode())
            .transactionDate(transaction.getTransactionDate())
            .transactionType(transaction.getTransactionType().toString())
            .referenceNo(transaction.getReferenceNo())
            .quantity(transaction.getQuantity())
            .previousStock(transaction.getPreviousStock())
            .newStock(transaction.getNewStock())
            .unitPrice(transaction.getUnitPrice())
            .createdAt(transaction.getCreatedAt())
            .build();
    }
}