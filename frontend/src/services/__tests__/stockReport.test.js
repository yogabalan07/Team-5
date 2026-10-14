import { reportService } from '../reportService';

jest.mock('@firebase/firestore', () => {
  const actual = jest.requireActual('@firebase/firestore');
  return {
    ...actual,
    collection: jest.fn((db, name) => ({ __mockRef: true, db, name })),
    doc: jest.fn((ref, pathOrId, docId) => ({
      __mockDoc: true,
      ref,
      id: docId !== undefined ? String(docId) : String(pathOrId),
    })),
    getDocs: jest.fn(),
    getDoc: jest.fn(),
    setDoc: jest.fn(),
    updateDoc: jest.fn(),
    deleteDoc: jest.fn(),
    addDoc: jest.fn(),
    query: jest.fn((...args) => ({ __mockQuery: true, args })),
    where: jest.fn((field, op, value) => ({ field, op, value })),
    orderBy: jest.fn((field, dir) => ({ field, dir })),
    limit: jest.fn((n) => ({ n })),
    runTransaction: jest.fn(),
    serverTimestamp: jest.fn(() => ({ __serverTimestamp: true })),
  };
});

jest.mock('../authService', () => ({
  getCurrentUser: jest.fn(() => ({ uid: 'user-123', username: 'tester' })),
}));

jest.mock('../../firebase/firebase', () => ({ db: { __mockDb: true } }));

jest.mock('../../firebase/config', () => ({
  firebaseSetupMessage: () => 'Firebase not configured in tests',
}));

const mockFirestore = require('@firebase/firestore');

const snap = (data) => ({ exists: () => !!data, data: () => data, id: data && data.id });
const querySnap = (docs) => ({ docs: (docs || []).map((d) => snap(d)) });

// reportService.getStockReport reads the `items` collection first (via
// itemMasterMap) and then the `stockTransactions` journal. Route the mocked
// getDocs call by collection name so both reads are served.
function mockCollections({ items = [], stockTransactions = [] } = {}) {
  mockFirestore.getDocs.mockImplementation(async (ref) => {
    const name = ref && ref.name;
    if (name === 'items') return querySnap(items);
    if (name === 'stockTransactions') return querySnap(stockTransactions);
    return querySnap([]);
  });
}

const FILTERS = { startDate: '2024-01-01', endDate: '2024-01-31' };

beforeEach(() => {
  jest.clearAllMocks();
  // react-scripts sets resetMocks: true, which strips the implementations
  // given in jest.mock above before every test. Reinstate them here.
  mockFirestore.collection.mockImplementation((db, name) => ({ __mockRef: true, db, name }));
  mockFirestore.doc.mockImplementation((ref, pathOrId, docId) => ({
    __mockDoc: true,
    ref,
    id: docId !== undefined ? String(docId) : String(pathOrId),
  }));
  const { getCurrentUser } = require('../authService');
  getCurrentUser.mockReturnValue({ uid: 'user-123', username: 'tester' });
});

describe('reportService.getStockReport', () => {
  test('reconstructs opening, purchases, sales and closing from a mixed journal', async () => {
    mockCollections({
      items: [
        {
          id: 'item-1',
          itemCode: 'A1',
          name: 'Apple',
          currentStock: 90,
          minStock: 10,
          maxStock: 100,
          purchasePrice: 5,
          sellingPrice: 8,
        },
      ],
      stockTransactions: [
        // Opening stock SET from 0 -> 100 (ADJUSTMENT stores the signed delta).
        { itemId: 'item-1', type: 'ADJUSTMENT', sign: 1, quantity: 100, transactionDate: '2024-01-05T00:00:00.000Z' },
        { itemId: 'item-1', type: 'PURCHASE', sign: 1, quantity: 20, transactionDate: '2024-01-10T00:00:00.000Z' },
        { itemId: 'item-1', type: 'SALES', sign: -1, quantity: 30, transactionDate: '2024-01-15T00:00:00.000Z' },
        // Negative adjustment (damaged stock): already-signed delta AND sign -1.
        { itemId: 'item-1', type: 'ADJUSTMENT', sign: -1, quantity: -10, transactionDate: '2024-01-20T00:00:00.000Z' },
        // Movement AFTER the reporting window; only affects closing stock.
        { itemId: 'item-1', type: 'SALES', sign: -1, quantity: 5, transactionDate: '2024-02-10T00:00:00.000Z' },
      ],
    });

    const { content, summary } = await reportService.getStockReport(FILTERS);

    expect(content).toHaveLength(1);
    const row = content[0];
    // net in range = +100 +20 -30 -10 = 80; closing = 90 - (-5) = 95
    expect(row.closingStock).toBe(95);
    expect(row.openingStock).toBe(15); // 95 - 80
    expect(row.purchases).toBe(120); // opening +100 + purchase +20
    expect(row.sales).toBe(40); // sale 30 + adjustment decrease 10
    // valuation = closing * purchasePrice = 95 * 5
    expect(summary.totalStockValue).toBe(475);
    expect(summary.totalItems).toBe(1);
  });

  test('does not double-negate a negative adjustment (opening stays 0)', async () => {
    mockCollections({
      items: [
        { id: 'item-1', itemCode: 'A1', name: 'Apple', currentStock: 90, minStock: 0, purchasePrice: 2, sellingPrice: 3 },
      ],
      stockTransactions: [
        { itemId: 'item-1', type: 'ADJUSTMENT', sign: 1, quantity: 100, transactionDate: '2024-01-05T00:00:00.000Z' },
        { itemId: 'item-1', type: 'ADJUSTMENT', sign: -1, quantity: -10, transactionDate: '2024-01-06T00:00:00.000Z' },
      ],
    });

    const { content } = await reportService.getStockReport(FILTERS);
    // With the old (buggy) formula net in range would be +110 and opening -20.
    expect(content[0].openingStock).toBe(0);
    expect(content[0].closingStock).toBe(90);
    expect(content[0].purchases).toBe(100);
    expect(content[0].sales).toBe(10);
  });

  test('keeps valid purchase and sales behavior unchanged', async () => {
    mockCollections({
      items: [
        { id: 'item-1', itemCode: 'A1', name: 'Apple', currentStock: 20, minStock: 5, purchasePrice: 10, sellingPrice: 12 },
      ],
      stockTransactions: [
        { itemId: 'item-1', type: 'PURCHASE', sign: 1, quantity: 50, transactionDate: '2024-01-05T00:00:00.000Z' },
        { itemId: 'item-1', type: 'SALES', sign: -1, quantity: 30, transactionDate: '2024-01-06T00:00:00.000Z' },
      ],
    });

    const { content, summary } = await reportService.getStockReport(FILTERS);
    expect(content[0].purchases).toBe(50);
    expect(content[0].sales).toBe(30);
    // opening = closing - net = 20 - 20 = 0
    expect(content[0].openingStock).toBe(0);
    expect(content[0].closingStock).toBe(20);
    expect(summary.totalStockValue).toBe(200); // 20 * 10
  });

  test('flags out-of-stock and low-stock items in the summary', async () => {
    mockCollections({
      items: [
        { id: 'a', itemCode: 'A', name: 'Zero', currentStock: 0, minStock: 5, purchasePrice: 1 },
        { id: 'b', itemCode: 'B', name: 'Low', currentStock: 4, minStock: 5, purchasePrice: 1 },
        { id: 'c', itemCode: 'C', name: 'Healthy', currentStock: 50, minStock: 5, maxStock: 100, purchasePrice: 1 },
      ],
      stockTransactions: [],
    });

    const { summary } = await reportService.getStockReport(FILTERS);
    expect(summary.totalItems).toBe(3);
    expect(summary.outOfStock).toBe(1);
    expect(summary.lowStockItems).toBe(2);
  });
});
