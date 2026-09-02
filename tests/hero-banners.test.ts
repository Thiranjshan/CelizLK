import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveHeroBannerOrderList } from '@/lib/hero-banners';

test('resolves insert order deterministically when adding at an occupied slot', () => {
  const list = resolveHeroBannerOrderList(
    [
      { id: 'a', order: 1 },
      { id: 'b', order: 2 },
      { id: 'c', order: 3 },
    ],
    2,
    null,
  );

  assert.deepEqual(
    list.map((item) => ({ id: item.id, order: item.order })),
    [
      { id: 'a', order: 1 },
      { id: 'new', order: 2 },
      { id: 'b', order: 3 },
      { id: 'c', order: 4 },
    ],
  );
});

test('reindexes order list when moving an existing banner upward', () => {
  const list = resolveHeroBannerOrderList(
    [
      { id: 'a', order: 1 },
      { id: 'b', order: 2 },
      { id: 'c', order: 3 },
      { id: 'd', order: 4 },
    ],
    2,
    'd',
  );

  assert.deepEqual(
    list.map((item) => ({ id: item.id, order: item.order })),
    [
      { id: 'a', order: 1 },
      { id: 'd', order: 2 },
      { id: 'b', order: 3 },
      { id: 'c', order: 4 },
    ],
  );
});

test('appends to the end when no order is specified', () => {
  const list = resolveHeroBannerOrderList(
    [
      { id: 'a', order: 1 },
      { id: 'b', order: 2 },
    ],
    null,
    null,
  );

  assert.deepEqual(
    list.map((item) => ({ id: item.id, order: item.order })),
    [
      { id: 'a', order: 1 },
      { id: 'b', order: 2 },
      { id: 'new', order: 3 },
    ],
  );
});

test('handles insertion with empty list', () => {
  const list = resolveHeroBannerOrderList([], null, null);

  assert.deepEqual(
    list.map((item) => ({ id: item.id, order: item.order })),
    [{ id: 'new', order: 1 }],
  );
});

test('handles insertion with explicit order 1 into empty list', () => {
  const list = resolveHeroBannerOrderList([], 1, null);

  assert.deepEqual(
    list.map((item) => ({ id: item.id, order: item.order })),
    [{ id: 'new', order: 1 }],
  );
});
