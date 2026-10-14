import {
  round2,
  asNumber,
  lineAmount,
  lineAmounts,
  invoiceTotals,
  computePayment,
  applyStock,
  classifyStock,
  isLowStock,
  isOutOfStock,
  stockValue,
  buildSearchText,
  searchRange,
  pad6,
  formatBusinessNumber,
  todayKey,
  ROLES,
  DEFAULT_SELF_REGISTERED_ROLE,
  can,
  pageResponse,
  slicePage,
  sortByCreatedDesc,
  filterBySearch,
  toDateKey,
} from '../businessLogic';

describe('numbers & money', () => {
  test('round2 handles floating point drift', () => {
    expect(round2(10.005)).toBe(10.01);
    expect(round2('7.5')).toBe(7.5);
    expect(round2(undefined)).toBe(0);
  });

  test('asNumber coerces safely', () => {
    expect(asNumber('12.5')).toBe(12.5);
    expect(asNumber(null)).toBe(0);
  });

  test('lineAmount multiplies qty * price', () => {
    expect(lineAmount(2, 150.5)).toBe(301);
  });

  test('lineAmounts computes disc then tax on discounted base', () => {
    const result = lineAmounts(10, 100, 10, 5); // 1000 - 100 disc, tax on 900 = 45
    expect(result).toEqual({
      totalAmount: 1000,
      discountAmount: 100,
      taxAmount: 45,
      lineNet: 945,
    });
  });

  test('invoiceTotals aggregates lines', () => {
    const result = invoiceTotals([
      { quantity: 1, unitPrice: 100, discountPercent: 0, taxPercent: 10 },
      { quantity: 2, unitPrice: 50, discountPercent: 0, taxPercent: 10 },
    ]);
    expect(result.totalAmount).toBe(200);
    expect(result.discountAmount).toBe(0);
    expect(result.taxAmount).toBe(20);
    expect(result.netAmount).toBe(220);
  });

  test('invoiceTotals handles empty lines', () => {
    expect(invoiceTotals([])).toEqual({
      totalAmount: 0,
      discountAmount: 0,
      taxAmount: 0,
      netAmount: 0,
    });
  });

  test('computePayment leaves credit balance untouched', () => {
    expect(computePayment('CREDIT', 500)).toEqual({ paidAmount: 0, balanceAmount: 500 });
    expect(computePayment('CASH', 500)).toEqual({ paidAmount: 500, balanceAmount: 0 });
    expect(computePayment('UPI', 500)).toEqual({ paidAmount: 500, balanceAmount: 0 });
  });
});

describe('stock movement', () => {
  test('purchase adds stock', () => {
    expect(applyStock(10, 'PURCHASE', 5)).toEqual({ quantity: 5, previousStock: 10, newStock: 15 });
  });

  test('sales return adds stock (RETURN_IN)', () => {
    expect(applyStock(10, 'RETURN_IN', 5)).toEqual({ quantity: 5, previousStock: 10, newStock: 15 });
  });

  test('sales subtracts stock and throws on insufficient stock', () => {
    expect(applyStock(10, 'SALES', 4)).toEqual({ quantity: -4, previousStock: 10, newStock: 6 });
    expect(() => applyStock(3, 'SALES', 5)).toThrow('Insufficient stock');
  });

  test('adjustment sets exact quantity and rejects negatives', () => {
    expect(applyStock(10, 'ADJUSTMENT', 42)).toEqual({ quantity: 42, previousStock: 10, newStock: 42 });
    expect(() => applyStock(10, 'ADJUSTMENT', -1)).toThrow('Stock cannot be negative');
  });

  test('unknown type throws', () => {
    expect(() => applyStock(10, 'BOGUS', 1)).toThrow('Unknown stock transaction type');
  });
});

describe('stock classification', () => {
  test('classifyStock buckets status', () => {
    expect(classifyStock(0, 5, 50)).toBe('OUT_OF_STOCK');
    expect(classifyStock(5, 5, 50)).toBe('CRITICAL');
    expect(classifyStock(8, 5, 50)).toBe('LOW');
    expect(classifyStock(20, 5, 50)).toBe('IN_STOCK');
    expect(classifyStock(50, 5, 50)).toBe('OVER');
  });

  test('isLowStock / isOutOfStock', () => {
    expect(isLowStock({ currentStock: 4, minStockLevel: 5 })).toBe(true);
    expect(isLowStock({ currentStock: 0, minStockLevel: 5 })).toBe(true);
    expect(isLowStock({ currentStock: 20, minStockLevel: 5, maxStockLevel: 50 })).toBe(false);
    expect(isOutOfStock({ currentStock: 0, minStockLevel: 5 })).toBe(true);
  });

  test('stockValue uses purchase price', () => {
    expect(stockValue({ currentStock: 10, purchasePrice: 12.5 })).toBe(125);
  });
});

describe('searching', () => {
  test('buildSearchText lowercases, trims and joins parts', () => {
    expect(buildSearchText('  John ', '    Doe  ', null, '')).toBe('john doe');
  });

  test('searchRange returns null for empty input and prefix range otherwise', () => {
    expect(searchRange('')).toBeNull();
    expect(searchRange('  ')).toBeNull();
    const range = searchRange('Al');
    expect(range.start).toBe('al');
    expect(range.end).toBe('al\uf8ff');
  });

  test('filterBySearch keeps only prefix matches', () => {
    const list = [
      { searchText: 'alice' },
      { searchText: 'bob' },
      { searchText: 'alvin' },
      { searchText: 'carla' },
    ];
    const result = filterBySearch(list, 'al');
    expect(result.map((i) => i.searchText).sort()).toEqual(['alice', 'alvin']);
  });
});

describe('business document numbers', () => {
  test('pad6 zero pads', () => {
    expect(pad6(1)).toBe('000001');
    expect(pad6(123456)).toBe('123456');
  });

  test('formatBusinessNumber renders prefix-date-seq', () => {
    expect(formatBusinessNumber('INV', '2024-01-15', 7)).toBe('INV-20240115-000007');
  });

  test('todayKey is UTC YYYY-MM-DD', () => {
    expect(todayKey()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe('roles & permissions', () => {
  test('self registration is always STAFF', () => {
    expect(DEFAULT_SELF_REGISTERED_ROLE).toBe(ROLES.STAFF);
  });

  test('can.manageItems excludes accountants', () => {
    expect(can.manageItems(ROLES.ADMIN)).toBe(true);
    expect(can.manageItems(ROLES.STORE_MANAGER)).toBe(true);
    expect(can.manageItems(ROLES.ACCOUNTS)).toBe(false);
  });

  test('only admin manages users and deletes', () => {
    expect(can.manageUsers(ROLES.ADMIN)).toBe(true);
    expect(can.manageUsers(ROLES.PURCHASE_MANAGER)).toBe(false);
    expect(can.deleteItems(ROLES.STORE_MANAGER)).toBe(false);
    expect(can.deleteItems(ROLES.ADMIN)).toBe(true);
  });

  test('sales/purchase/accounts gating', () => {
    expect(can.manageSales(ROLES.BILLING_CLERK)).toBe(true);
    expect(can.managePurchases(ROLES.PURCHASE_MANAGER)).toBe(true);
    expect(can.manageAccounts(ROLES.ACCOUNTS)).toBe(true);
    expect(can.manageSales(ROLES.ACCOUNTS)).toBe(false);
  });
});

describe('pagination helpers', () => {
  test('pageResponse mirrors Spring Page shape', () => {
    const page = pageResponse([1, 2, 3], 0, 2, 3);
    expect(page.content).toHaveLength(3);
    expect(page.totalElements).toBe(3);
    expect(page.totalPages).toBe(2);
    expect(page.last).toBe(false);
    expect(page.first).toBe(true);
    expect(page.empty).toBe(false);
  });

  test('slicePage selects the right window', () => {
    const list = [0, 1, 2, 3, 4, 5];
    expect(slicePage(list, 1, 2)).toEqual([2, 3]);
    expect(slicePage(list, 3, 2)).toEqual([]);
    expect(slicePage([], 0, 10)).toEqual([]);
  });

  test('sortByCreatedDesc orders newest first', () => {
    const list = [
      { id: 'a', createdAt: '2024-01-01T00:00:00Z' },
      { id: 'b', createdAt: '2024-03-01T00:00:00Z' },
      { id: 'c', createdAt: '2024-02-01T00:00:00Z' },
    ];
    expect(sortByCreatedDesc(list).map((i) => i.id)).toEqual(['b', 'c', 'a']);
  });
});

describe('date helpers', () => {
  test('toDateKey slices date strings', () => {
    expect(toDateKey('2024-06-15T10:30:00.000Z')).toBe('2024-06-15');
    expect(toDateKey('2024-06-15')).toBe('2024-06-15');
  });
});