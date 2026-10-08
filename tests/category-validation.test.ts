import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizeCategoryImageUrl } from '../lib/category-validation';

test('normalizeCategoryImageUrl accepts site-relative and HTTP image URLs', () => {
  assert.equal(normalizeCategoryImageUrl('/uploads/category.webp'), '/uploads/category.webp');
  assert.equal(normalizeCategoryImageUrl('https://example.com/category.jpg'), 'https://example.com/category.jpg');
  assert.equal(normalizeCategoryImageUrl('  /uploads/category.webp  '), '/uploads/category.webp');
});

test('normalizeCategoryImageUrl allows clearing and rejects unsafe or oversized values', () => {
  assert.equal(normalizeCategoryImageUrl(null), null);
  assert.equal(normalizeCategoryImageUrl('  '), null);
  assert.equal(normalizeCategoryImageUrl('javascript:alert(1)'), undefined);
  assert.equal(normalizeCategoryImageUrl('//example.com/category.jpg'), undefined);
  assert.equal(normalizeCategoryImageUrl('a'.repeat(1001)), undefined);
});
