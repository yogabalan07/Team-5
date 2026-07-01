package com.inventory.service;

import com.inventory.dto.response.StockTransactionResponse;
import com.inventory.enums.TransactionType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.util.List;

public interface StockService {
    List<StockTransactionResponse> getStockTransactionsByItem(Long itemId);
    Page<StockTransactionResponse> getStockTransactionsByType(TransactionType type, String startDate, String endDate, Pageable pageable);
    Page<StockTransactionResponse> getStockTransactionsByDateRange(String startDate, String endDate, Pageable pageable);
    void updateStock(Long itemId, BigDecimal quantity, TransactionType type, String referenceNo, Long referenceId);
}