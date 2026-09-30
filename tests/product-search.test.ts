import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildProductSearchQueries,
  escapeLikeWildcards,
  getFirstProductImage,
  normalizeProductSearchQuery,
} from '../lib/product-search';

test('normalizes product search input and caps it at 60 characters', () => {
  assert.equal(normalizeProductSearchQuery('  earbuds  '), 'earbuds');
  assert.equal(normalizeProductSearchQuery('x'), 'x');
  assert.equal(normalizeProductSearchQuery(null), '');
  assert.equal(normalizeProductSearchQuery('a'.repeat(75)), 'a'.repeat(60));
  assert.equal(buildProductSearchQueries(' x '), null);
  assert.equal(buildProductSearchQueries(''), null);
});

test('escapes LIKE wildcards and backslashes in search input', () => {
  assert.equal(escapeLikeWildcards('50%_off\\'), '50\\%\\_off\\\\');
});

test('reads the first image from the product images JSON string', () => {
  assert.equal(getFirstProductImage('["/first.webp","/second.webp"]'), '/first.webp');
  assert.equal(getFirstProductImage('[]'), null);
  assert.equal(getFirstProductImage('invalid json'), null);
});

test('builds search SQL with user input kept in parameters', () => {
  const userInput = "phone' OR TRUE --%_\\";
  const queries = buildProductSearchQueries(userInput, { limit: 8, offset: 16 });

  assert.ok(queries);
  assert.equal(queries.query, userInput);
  assert.doesNotMatch(queries.products.sql, /phone|OR TRUE/);
  assert.ok(queries.products.values.includes(userInput));
  assert.ok(queries.products.values.includes(`%${escapeLikeWildcards(userInput)}%`));
  assert.ok(queries.products.values.includes(8));
  assert.ok(queries.products.values.includes(16));
});
