import test from 'node:test';
import assert from 'node:assert/strict';
import {
  escapeLikeWildcards,
  getFirstProductImage,
  normalizeProductSearchQuery,
} from '../lib/product-search';

test('normalizes product search input and caps it at 60 characters', () => {
  assert.equal(normalizeProductSearchQuery('  earbuds  '), 'earbuds');
  assert.equal(normalizeProductSearchQuery('x'), 'x');
  assert.equal(normalizeProductSearchQuery(null), '');
  assert.equal(normalizeProductSearchQuery('a'.repeat(75)), 'a'.repeat(60));
});

test('escapes LIKE wildcards and backslashes in search input', () => {
  assert.equal(escapeLikeWildcards('50%_off\\'), '50\\%\\_off\\\\');
});

test('reads the first image from the product images JSON string', () => {
  assert.equal(getFirstProductImage('["/first.webp","/second.webp"]'), '/first.webp');
  assert.equal(getFirstProductImage('[]'), null);
  assert.equal(getFirstProductImage('invalid json'), null);
});
