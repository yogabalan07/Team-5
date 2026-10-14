import {
  serviceError,
  notFound,
  forbidden,
  unauthorized,
  fromSnap,
  fromQuery,
  currentUserId,
  requireAuth,
  getRoleFromUser,
  getPaged,
  getByIdOr404,
  fetchDocs,
} from '../firestoreHelpers';
import { getCurrentUser } from '../authService';

jest.mock('@firebase/firestore', () => {
  const actual = jest.requireActual('@firebase/firestore');
  return {
    ...actual,
    collection: jest.fn((db, name) => ({ __mockRef: true, db, name })),
    doc: jest.fn((ref, id) => ({ __mockDoc: true, ref, id: String(id) })),
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
  getCurrentUser: jest.fn(() => ({ uid: 'user-123', role: 'ADMIN' })),
}));

jest.mock('../../firebase/firebase', () => ({ db: { __mockDb: true } }));

jest.mock('../../firebase/config', () => ({
  firebaseSetupMessage: () => 'Firebase not configured in tests',
}));

const mockFirestore = require('@firebase/firestore');

const makeSnap = (exists, data) => {
  const snap = {
    exists: jest.fn(() => exists),
    data: jest.fn(() => data),
    id: data && data.id ? data.id : 'doc-1',
  };
  return snap;
};

const makeQuerySnap = (docs) => ({
  docs,
});

describe('axios-compatible errors', () => {
  test('serviceError exposes response.data.error and code', () => {
    const err = serviceError('boom', 400);
    expect(err.message).toBe('boom');
    expect(err.code).toBe('SERVICE_400');
    expect(err.response.status).toBe(400);
    expect(err.response.data.error).toBe('boom');
    expect(err.response.data.status).toBe(400);
  });

  test('notFound/forbidden/unauthorized map to 404/403/401', () => {
    expect(notFound().code).toBe('SERVICE_404');
    expect(forbidden().code).toBe('SERVICE_403');
    expect(unauthorized().code).toBe('SERVICE_401');
  });
});

describe('document mappers', () => {
  test('fromSnap flattens data plus id', () => {
    expect(fromSnap(makeSnap(true, { name: 'x', id: 'a' }))).toEqual({ name: 'x', id: 'a' });
    expect(fromSnap(makeSnap(false, null))).toBeNull();
  });

  test('fromQuery maps every doc', () => {
    const docs = [
      makeSnap(true, { name: 'a', id: 'a' }),
      makeSnap(true, { name: 'b', id: 'b' }),
    ];
    expect(fromQuery(makeQuerySnap(docs))).toEqual([
      { name: 'a', id: 'a' },
      { name: 'b', id: 'b' },
    ]);
  });
});

describe('auth helpers', () => {
  test('currentUserId reads uid/id from cached user', () => {
    getCurrentUser.mockReturnValue({ uid: 'user-123', role: 'ADMIN' });
    expect(currentUserId()).toBe('user-123');
  });

  test('requireAuth returns uid and throws unauthorized when missing', () => {
    getCurrentUser.mockReturnValue({ uid: 'user-123' });
    expect(requireAuth()).toBe('user-123');
    getCurrentUser.mockReturnValue(null);
    expect(() => requireAuth()).toThrow();
  });
});

describe('getRoleFromUser', () => {
  test('prefers user.role', () => {
    expect(getRoleFromUser({ role: 'STORE_MANAGER' })).toBe('STORE_MANAGER');
  });

  test('reads roles array and strips ROLE_ prefix', () => {
    expect(getRoleFromUser({ roles: [{ name: 'ROLE_BILLING_CLERK' }] })).toBe('BILLING_CLERK');
    expect(getRoleFromUser({ roles: ['ROLE_ACCOUNTS'] })).toBe('ACCOUNTS');
  });

  test('handles missing user', () => {
    expect(getRoleFromUser(null)).toBeNull();
  });
});

describe('listing & paging', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('getPaged applies search range and slices content', async () => {
    const items = Array.from({ length: 25 }, (_, i) => ({
      id: `i${i}`,
      name: `item ${i}`,
      searchText: `item ${i}`,
      createdAt: `2024-01-01T00:00:${String(i).padStart(2, '0')}Z`,
    }));
    mockFirestore.getDocs.mockResolvedValueOnce(
      makeQuerySnap(items.map((item) => makeSnap(true, item)))
    );

    const result = await getPaged({ __mockRef: true }, { page: 1, size: 10, search: 'item' });
    expect(result.totalElements).toBe(25);
    expect(result.content).toHaveLength(10);
    expect(result.number).toBe(1);
    expect(result.size).toBe(10);
    expect(mockFirestore.where).toHaveBeenCalledWith('searchText', '>=', 'item');
    expect(mockFirestore.where).toHaveBeenCalledWith('searchText', '<=', 'item\uf8ff');
  });

  test('getByIdOr404 throws notFound on missing id/docs', async () => {
    expect.hasAssertions();
    await expect(getByIdOr404({ __mockRef: true }, '')).rejects.toThrow();
    mockFirestore.getDoc.mockResolvedValueOnce(makeSnap(false, null));
    await expect(getByIdOr404({ __mockRef: true }, 'abc')).rejects.toThrow();
  });

  test('fetchDocs returns items and total', async () => {
    mockFirestore.getDocs.mockResolvedValueOnce(
      makeQuerySnap([makeSnap(true, { id: 'a' }), makeSnap(true, { id: 'b' })])
    );
    const { items, total } = await fetchDocs({ __mockRef: true });
    expect(total).toBe(2);
    expect(items).toHaveLength(2);
  });
});