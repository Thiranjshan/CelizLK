import assert from 'node:assert/strict';
import { test } from 'node:test';
import { prisma } from '@/lib/prisma';
import { defaultStoreSettings, getStoreSettings, saveStoreSettings } from '@/lib/store-settings';

test('stores and reads storefront settings from the shared SiteContent record', async () => {
  const updated = await saveStoreSettings({
    business: { ...defaultStoreSettings.business, storeName: 'Celiz LK Store' },
    contact: { ...defaultStoreSettings.contact, whatsappNumber: '+94 75 999 0000' },
    payments: { ...defaultStoreSettings.payments, bankName: 'Bank of Ceylon' },
  });

  assert.equal(updated.business.storeName, 'Celiz LK Store');
  assert.equal(updated.contact.whatsappNumber, '+94 75 999 0000');
  assert.equal(updated.payments.bankName, 'Bank of Ceylon');

  const loaded = await getStoreSettings();
  assert.equal(loaded.business.storeName, 'Celiz LK Store');
  assert.equal(loaded.contact.whatsappNumber, '+94 75 999 0000');
  assert.equal(loaded.payments.bankName, 'Bank of Ceylon');
});

test.after(async () => {
  await prisma.$disconnect();
});
