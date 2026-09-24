import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const css = readFileSync(join(process.cwd(), 'app', 'globals.css'), 'utf8');

test('product detail layout includes mobile-safe sizing and wrapping rules', () => {
  assert.match(css, /min-width:\s*0/);
  assert.match(css, /overflow-wrap:\s*break-word/);
  assert.match(css, /word-break:\s*break-word/);
  assert.match(css, /flex-wrap:\s*wrap/);
  assert.match(css, /max-width:\s*100%/);
});
