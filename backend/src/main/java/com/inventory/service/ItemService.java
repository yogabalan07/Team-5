package com.inventory.service;

import com.inventory.dto.request.ItemRequest;
import com.inventory.dto.response.ItemResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface ItemService {
    ItemResponse createItem(ItemRequest request);
    ItemResponse updateItem(Long id, ItemRequest request);
    void deleteItem(Long id);
    ItemResponse getItemById(Long id);
    ItemResponse getItemByCode(String code);
    Page<ItemResponse> getAllItems(Pageable pageable);
    Page<ItemResponse> searchItems(String search, Pageable pageable);
    List<ItemResponse> getLowStockItems();
    List<ItemResponse> getRecentItems();
}