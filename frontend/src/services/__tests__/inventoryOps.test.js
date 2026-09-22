import { applyStockLine, TYPE_SALES, TYPE_PURCHASE, TYPE_SALES_RETURN } from '../inventoryOps';

jest.mock('firebase/firestore', () => {
  const actual = jest.requireActual('firebase/firestore');
  return {
    ...actual,
    collection: jest.fn((db, name) => ({ __mockRef: true, db, name })),
    doc: jest.fn((ref, pathOrId, docId) => ({
      __mockDoc: true,
      ref,
      id: docId !== undefined ? String(docId) : pathOrId === undefined ? 'auto-trans' : String(pathOrId),
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

const mockFirestore = require('firebase/firestore');

function makeTx(itemSnap) {
  return {
    get: jest.fn(async () => itemSnap),
    update: jest.fn(() => {}),
    set: jest.fn(() => {}),
  };
}

const snap = (data) => ({ exists: () => !!data, data: () => data });

beforeEach(() => {
  // react-scripts sets resetMocks: true, which strips the implementations
  // given in jest.mock below before every test. Reinstate them here.
  mockFirestore.collection.mockImplementation((db, name) => ({ __mockRef: true, db, name }));
  mockFirestore.doc.mockImplementation((ref, pathOrId, docId) => ({
    __mockDoc: true,
    ref,
    id: docId !== undefined ? String(docId) : pathOrId === undefined ? 'auto-trans' : String(pathOrId),
  }));
  const { getCurrentUser } = require('../authService');
  getCurrentUser.mockReturnValue({ uid: 'user-123', username: 'tester' });
});

describe('applyStockLine', () => {
  const base = { itemId: 'item-1', itemName: 'Apple', qty: 5 };

  test('SALES reduces stock and writes an auto-id journal entry', async () => {
    const tx = makeTx(snap({ name: 'Apple', currentStock: 100, minStock: 10 }));
    const result = await applyStockLine(tx, { ...base, sign: -1, type: TYPE_SALES, referenceNumber: 'INV-0001', referenceId: 'inv-1' });

    expect(tx.update).toHaveBeenCalledTimes(1);
    const [itemRef, itemUpdate] = tx.update.mock.calls[0];
    expect(itemRef.id).toBe('item-1');
    expect(itemUpdate.currentStock).toBe(95);
    expect(itemUpdate.isLowStock).toBe(false);
    expect(itemUpdate.isOutOfStock).toBe(false);

    expect(tx.set).toHaveBeenCalledTimes(1);
    const [journalRef, journal] = tx.set.mock.calls[0];
    expect(journalRef.id).toBe('auto-trans');
    expect(journal.type).toBe(TYPE_SALES);
    expect(journal.quantity).toBe(5);
    expect(journal.stockBefore).toBe(100);
    expect(journal.stockAfter).toBe(95);
    expect(journal.referenceNumber).toBe('INV-0001');
    expect(result.stockAfter).toBe(95);
  });

  test('PURCHASE increases stock', async () => {
    const tx = makeTx(snap({ name: 'Apple', currentStock: 100, minStock: 5 }));
    await applyStockLine(tx, { ...base, sign: 1, type: TYPE_PURCHASE, referenceNumber: 'PO-0001' });
    expect(tx.update.mock.calls[0][1].currentStock).toBe(105);
  });

  test('SALES_RETURN restores stock', async () => {
    const tx = makeTx(snap({ name: 'Apple', currentStock: 100, minStock: 5 }));
    await applyStockLine(tx, { ...base, qty: 2, sign: 1, type: TYPE_SALES_RETURN });
    expect(tx.update.mock.calls[0][1].currentStock).toBe(102);
  });

  test('flags low stock when new stock falls below minimum', async () => {
    const tx = makeTx(snap({ name: 'Apple', currentStock: 11, minStock: 10 }));
    await applyStockLine(tx, { ...base, qty: 3, sign: -1, type: TYPE_SALES });
    expect(tx.update.mock.calls[0][1].currentStock).toBe(8);
    expect(tx.update.mock.calls[0][1].isLowStock).toBe(true);
    expect(tx.update.mock.calls[0][1].isOutOfStock).toBe(false);
  });

  test('rejects with INSUFFICIENT_STOCK and performs no writes', async () => {
    const tx = makeTx(snap({ name: 'Apple', currentStock: 3, minStock: 0 }));
    await expect(applyStockLine(tx, { ...base, qty: 10, sign: -1, type: TYPE_SALES }))
      .rejects.toMatchObject({ code: 'INSUFFICIENT_STOCK' });
    expect(tx.update).not.toHaveBeenCalled();
    expect(tx.set).not.toHaveBeenCalled();
  });

  test('throws when the item does not exist', async () => {
    const tx = makeTx(snap(undefined));
    tx.get = jest.fn(async () => ({ exists: () => false }));
    await expect(applyStockLine(tx, { ...base, sign: -1, type: TYPE_SALES }))
      .rejects.toThrow(/Item not found/);
    expect(tx.update).not.toHaveBeenCalled();
  });

  test('throws on unknown transaction type', async () => {
    const tx = makeTx(snap({ name: 'Apple', currentStock: 10, minStock: 0 }));
    await expect(applyStockLine(tx, { ...base, sign: 1, type: 'Mystery' }))
      .rejects.toThrow(/Unknown stock transaction type/);
    expect(tx.update).not.toHaveBeenCalled();
    expect(tx.set).not.toHaveBeenCalled();
  });

  test('no-ops for zero or missing quantity', async () => {
    const tx = makeTx(snap({ name: 'Apple', currentStock: 10, minStock: 0 }));
    await expect(applyStockLine(tx, { ...base, qty: 0, sign: 1, type: TYPE_PURCHASE })).resolves.toEqual({ itemId: 'item-1', quantity: 0 });
    await expect(applyStockLine(tx, { itemId: '', qty: 5, sign: 1, type: TYPE_PURCHASE })).resolves.toEqual({ itemId: '', quantity: 0 });
    expect(tx.update).not.toHaveBeenCalled();
    expect(tx.set).not.toHaveBeenCalled();
  });
});
