package com.inventory.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "purchase_items")
public class PurchaseItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "purchase_id", nullable = false)
    private Long purchaseId;
    
    @Column(name = "item_id")
    private Long itemId;
    
    @Column(name = "item_code", nullable = false)
    private String itemCode;
    
    @Column(name = "item_name", nullable = false)
    private String itemName;
    
    @Column(name = "unit_price", nullable = false)
    private BigDecimal unitPrice;
    
    @Column(name = "quantity", nullable = false)
    private Integer quantity;
    
    @Column(name = "discount_percent")
    private BigDecimal discountPercent = BigDecimal.ZERO;
    
    @Column(name = "amount", nullable = false)
    private BigDecimal amount;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @ManyToOne
    @JoinColumn(name = "purchase_id", insertable = false, updatable = false)
    private PurchaseEntry purchaseEntry;

    public PurchaseItem() {}

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        calculateAmount();
    }

    @PreUpdate
    protected void onUpdate() {
        calculateAmount();
    }
    
    private void calculateAmount() {
        BigDecimal discountAmount = unitPrice.multiply(new BigDecimal(quantity))
            .multiply(discountPercent).divide(new BigDecimal("100"), 2, java.math.RoundingMode.HALF_UP);
        amount = unitPrice.multiply(new BigDecimal(quantity)).subtract(discountAmount);
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getPurchaseId() { return purchaseId; }
    public void setPurchaseId(Long purchaseId) { this.purchaseId = purchaseId; }
    public Long getItemId() { return itemId; }
    public void setItemId(Long itemId) { this.itemId = itemId; }
    public String getItemCode() { return itemCode; }
    public void setItemCode(String itemCode) { this.itemCode = itemCode; }
    public String getItemName() { return itemName; }
    public void setItemName(String itemName) { this.itemName = itemName; }
    public BigDecimal getUnitPrice() { return unitPrice; }
    public void setUnitPrice(BigDecimal unitPrice) { this.unitPrice = unitPrice; }
    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; }
    public BigDecimal getDiscountPercent() { return discountPercent; }
    public void setDiscountPercent(BigDecimal discountPercent) { this.discountPercent = discountPercent; }
    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public PurchaseEntry getPurchaseEntry() { return purchaseEntry; }
    public void setPurchaseEntry(PurchaseEntry purchaseEntry) { this.purchaseEntry = purchaseEntry; }
}