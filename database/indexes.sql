-- ============================================================
-- INVENTORY MANAGEMENT SYSTEM - PERFORMANCE INDEXES
-- Target: PostgreSQL (Neon)
-- Created: 2026-08-23
-- ============================================================
-- Primary key, unique constraint indexes are automatic.
-- Only non-unique performance indexes are listed here.
-- ============================================================

-- ============================================================
-- PURCHASES - supplier lookup, date range
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_purchases_supplier_id ON purchases(supplier_id);
CREATE INDEX IF NOT EXISTS idx_purchases_purchase_date ON purchases(purchase_date);

-- ============================================================
-- PURCHASE_ITEMS - joins
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_purchase_items_purchase_id ON purchase_items(purchase_id);
CREATE INDEX IF NOT EXISTS idx_purchase_items_item_id ON purchase_items(item_id);

-- ============================================================
-- SALES - customer lookup, date range
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_sales_customer_id ON sales(customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_invoice_date ON sales(invoice_date);

-- ============================================================
-- SALE_ITEMS - joins
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_sale_items_sale_id ON sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_item_id ON sale_items(item_id);

-- ============================================================
-- STOCK_REPORTS - item lookup
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_stock_reports_item_id ON stock_reports(item_id);

-- ============================================================
-- ITEMS - category search
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_items_category ON items(category);
