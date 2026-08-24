import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { test } from 'node:test';
import { prisma } from '@/lib/prisma';
import { confirmBankTransfer, confirmCodPayment, createOrder, rejectBankTransfer, submitBankTransferDetails, transitionOrder } from '@/lib/orders';
import { createAccessToken } from '@/lib/auth';
import { GET as getCustomerOrder, PATCH as patchCustomerOrder } from '@/app/api/orders/[id]/route';
import { POST as confirmCodRoute } from '@/app/api/admin/orders/[id]/payment/confirm-cod/route';
import { POST as checkoutCustomer } from '@/app/api/checkout/customer/route';
import { GET as getDeliveryZone } from '@/app/api/delivery-zones/route';

async function fixtures() {
  const user = await prisma.user.findFirstOrThrow({ where: { role: 'CUSTOMER' } });
  let product = await prisma.product.findFirst({ where: { isActive: true } });
  if (!product) throw new Error('No product found');
  if (product.stockQty < 10) {
    product = await prisma.product.update({ where: { id: product.id }, data: { stockQty: 100 } });
  }
  return { user, product };
}

test('creates a COD order with payment and initial events', async () => {
  const { user, product } = await fixtures();
  const idempotencyKey = randomUUID();
  const order = await createOrder({
    userId: user.id,
    customerPhone: user.phone,
    shippingAddress: { addressLine1: 'Test address', city: 'Colombo', district: 'Colombo' },
    paymentMethod: 'COD',
    items: [{ productId: product.id, quantity: 1 }],
    idempotencyKey,
  });

  assert.equal(order.status, 'CONFIRMED');
  assert.equal(order.paymentStatus, 'UNPAID');
  assert.equal(order.payment[0]?.method, 'COD');
  assert.equal(order.payment[0]?.status, 'UNPAID');
  assert.deepEqual(order.events.map((event) => event.eventType), ['ORDER_CREATED', 'ORDER_CONFIRMED']);
  assert.equal(order.payment[0]?.currency, 'LKR');
  assert.equal(order.items[0]?.productName, product.name);
});

test('does not deduct stock twice for the same idempotency key', async () => {
  const { user, product } = await fixtures();
  const idempotencyKey = randomUUID();
  const input = {
    userId: user.id,
    shippingAddress: { addressLine1: 'Retry address', city: 'Colombo', district: 'Colombo' },
    paymentMethod: 'COD',
    items: [{ productId: product.id, quantity: 1 }],
    idempotencyKey,
  } as const;
  const before = await prisma.product.findUniqueOrThrow({ where: { id: product.id }, select: { stockQty: true } });
  const first = await createOrder(input);
  const afterFirst = await prisma.product.findUniqueOrThrow({ where: { id: product.id }, select: { stockQty: true } });
  const second = await createOrder(input);
  const afterSecond = await prisma.product.findUniqueOrThrow({ where: { id: product.id }, select: { stockQty: true } });

  assert.equal(first.id, second.id);
  assert.equal(afterFirst.stockQty, before.stockQty - 1);
  assert.equal(afterSecond.stockQty, afterFirst.stockQty);
});

test('rolls back stock when a later item conflicts', async () => {
  const { user, product } = await fixtures();
  const idempotencyKey = randomUUID();
  const before = await prisma.product.findUniqueOrThrow({ where: { id: product.id }, select: { stockQty: true } });

  await assert.rejects(() => createOrder({
    userId: user.id,
    shippingAddress: { addressLine1: 'Rollback address', city: 'Colombo', district: 'Colombo' },
    paymentMethod: 'COD',
    items: [{ productId: product.id, quantity: 1 }, { productId: product.id, quantity: 1 }],
    idempotencyKey,
  }), /STOCK_CONFLICT/);

  const after = await prisma.product.findUniqueOrThrow({ where: { id: product.id }, select: { stockQty: true } });
  assert.equal(after.stockQty, before.stockQty);
  assert.equal(await prisma.order.count({ where: { idempotencyKey } }), 0);
});

test('confirms COD payment explicitly and completes the fulfillment lifecycle', async () => {
  const { user, product } = await fixtures();
  const admin = await prisma.adminUser.findFirstOrThrow();
  const order = await createOrder({ userId: user.id, shippingAddress: { addressLine1: 'Lifecycle address', city: 'Colombo', district: 'Colombo' }, paymentMethod: 'COD', items: [{ productId: product.id, quantity: 1 }], idempotencyKey: randomUUID() });

  const payment = await confirmCodPayment(order.id, admin.id);
  assert.equal(payment.status, 'PAID');
  assert.equal((await prisma.order.findUniqueOrThrow({ where: { id: order.id } })).paymentStatus, 'PAID');

  for (const status of ['PROCESSING', 'PACKED', 'SHIPPED', 'DELIVERED']) await transitionOrder(order.id, status, admin.id);
  const completed = await prisma.order.findUniqueOrThrow({ where: { id: order.id } });
  assert.equal(completed.status, 'DELIVERED');
  assert.equal((await prisma.orderEvent.count({ where: { orderId: order.id } })), 7);
  assert.ok(await prisma.orderEvent.findFirst({ where: { orderId: order.id, eventType: 'COD_PAYMENT_CONFIRMED' } }));
});

test('rejects skipped COD fulfillment transitions', async () => {
  const { user, product } = await fixtures();
  const admin = await prisma.adminUser.findFirstOrThrow();
  const order = await createOrder({ userId: user.id, shippingAddress: { addressLine1: 'Invalid transition address', city: 'Colombo', district: 'Colombo' }, paymentMethod: 'COD', items: [{ productId: product.id, quantity: 1 }], idempotencyKey: randomUUID() });

  await assert.rejects(() => transitionOrder(order.id, 'SHIPPED', admin.id), /INVALID_ORDER_TRANSITION/);
});

test('rejects unsupported payment methods', async () => {
  const { user, product } = await fixtures();
  await assert.rejects(() => createOrder({ userId: user.id, shippingAddress: { addressLine1: 'Method address', city: 'Colombo', district: 'Colombo' }, paymentMethod: 'CARD', items: [{ productId: product.id, quantity: 1 }], idempotencyKey: randomUUID() }), /INVALID_PAYMENT_METHOD/);
});

test('cancels a COD order and restores stock transactionally', async () => {
  const { user, product } = await fixtures();
  const admin = await prisma.adminUser.findFirstOrThrow();
  const before = await prisma.product.findUniqueOrThrow({ where: { id: product.id }, select: { stockQty: true } });
  const order = await createOrder({ userId: user.id, shippingAddress: { addressLine1: 'Cancel address', city: 'Colombo', district: 'Colombo' }, paymentMethod: 'COD', items: [{ productId: product.id, quantity: 1 }], idempotencyKey: randomUUID() });
  await transitionOrder(order.id, 'CANCELLED', admin.id);
  const after = await prisma.product.findUniqueOrThrow({ where: { id: product.id }, select: { stockQty: true } });
  const cancelled = await prisma.order.findUniqueOrThrow({ where: { id: order.id }, include: { payment: true, events: true } });
  assert.equal(after.stockQty, before.stockQty);
  assert.equal(cancelled.status, 'CANCELLED');
  assert.equal(cancelled.paymentStatus, 'UNPAID');
  assert.equal(cancelled.payment[0]?.status, 'UNPAID');
  assert.equal(cancelled.events.at(-1)?.eventType, 'ORDER_CANCELLED');
  await assert.rejects(() => transitionOrder(order.id, 'PROCESSING', admin.id), /INVALID_ORDER_TRANSITION/);
});

test('does not confirm COD payment for a cancelled order', async () => {
  const { user, product } = await fixtures();
  const admin = await prisma.adminUser.findFirstOrThrow();
  const order = await createOrder({ userId: user.id, shippingAddress: { addressLine1: 'Cancelled payment address', city: 'Colombo', district: 'Colombo' }, paymentMethod: 'COD', items: [{ productId: product.id, quantity: 1 }], idempotencyKey: randomUUID() });
  await transitionOrder(order.id, 'CANCELLED', admin.id);
  await assert.rejects(() => confirmCodPayment(order.id, admin.id), /ORDER_CANCELLED/);
});

test('enforces customer ownership and rejects customer admin actions', async () => {
  const { product } = await fixtures();
  const owner = await prisma.user.findFirstOrThrow({ where: { role: 'CUSTOMER' } });
  const otherCustomer = await prisma.user.create({ data: { email: `other-${randomUUID()}@example.com`, passwordHash: 'test-only', fullName: 'Other Customer', role: 'CUSTOMER' } });
  const order = await createOrder({ userId: otherCustomer.id, shippingAddress: { addressLine1: 'Private address', city: 'Colombo', district: 'Colombo' }, paymentMethod: 'COD', items: [{ productId: product.id, quantity: 1 }], idempotencyKey: randomUUID() });
  const ownerToken = await createAccessToken(owner);
  const request = new Request(`http://localhost/api/orders/${order.id}`, { headers: { Authorization: `Bearer ${ownerToken}` } });

  assert.equal((await getCustomerOrder(request, { params: Promise.resolve({ id: order.id }) })).status, 404);
  assert.equal((await patchCustomerOrder()).status, 403);
  assert.equal((await confirmCodRoute(new Request('http://localhost/api/admin/orders/test/payment/confirm-cod', { method: 'POST', headers: { Authorization: `Bearer ${ownerToken}` } }), { params: Promise.resolve({ id: order.id }) })).status, 401);
});

test('creates a bank-transfer order awaiting payment', async () => {
  const { user, product } = await fixtures();
  const admin = await prisma.adminUser.findFirstOrThrow();
  const order = await createOrder({ userId: user.id, shippingAddress: { addressLine1: 'Bank address', city: 'Colombo', district: 'Colombo' }, paymentMethod: 'BANK_TRANSFER', items: [{ productId: product.id, quantity: 1 }], idempotencyKey: randomUUID() });
  assert.equal(order.status, 'AWAITING_PAYMENT');
  assert.equal(order.paymentStatus, 'PENDING');
  assert.equal(order.payment[0]?.method, 'BANK_TRANSFER');
  assert.equal(order.payment[0]?.status, 'PENDING');
  assert.deepEqual(order.events.map((event) => event.eventType), ['ORDER_CREATED', 'PAYMENT_PENDING']);
  await assert.rejects(() => transitionOrder(order.id, 'CONFIRMED', admin.id), /PAYMENT_REQUIRED/);
});

test('submits bank details once and keeps duplicate retries idempotent', async () => {
  const { user, product } = await fixtures();
  const order = await createOrder({ userId: user.id, shippingAddress: { addressLine1: 'Submission address', city: 'Colombo', district: 'Colombo' }, paymentMethod: 'BANK_TRANSFER', items: [{ productId: product.id, quantity: 1 }], idempotencyKey: randomUUID() });
  const input = { transferReference: 'TXN-123456', transferAmount: order.total, transferDate: '2026-08-24', transferNote: 'Online transfer' };
  const first = await submitBankTransferDetails(order.id, user.id, input);
  const second = await submitBankTransferDetails(order.id, user.id, input);
  assert.equal(first.id, second.id);
  assert.equal(second.transferReference, input.transferReference);
  assert.equal(await prisma.orderEvent.count({ where: { orderId: order.id, eventType: 'PAYMENT_DETAILS_SUBMITTED' } }), 1);
});

test('rejects mismatched bank amount, supports rejection, resubmission, and confirmation', async () => {
  const { user, product } = await fixtures();
  const admin = await prisma.adminUser.findFirstOrThrow();
  const order = await createOrder({ userId: user.id, shippingAddress: { addressLine1: 'Review address', city: 'Colombo', district: 'Colombo' }, paymentMethod: 'BANK_TRANSFER', items: [{ productId: product.id, quantity: 1 }], idempotencyKey: randomUUID() });
  await submitBankTransferDetails(order.id, user.id, { transferReference: 'WRONG-AMOUNT', transferAmount: order.total - 1, transferDate: '2026-08-24' });
  await assert.rejects(() => confirmBankTransfer(order.id, admin.id), /AMOUNT_MISMATCH/);
  const rejected = await rejectBankTransfer(order.id, admin.id, 'Amount does not match order total.');
  assert.equal(rejected.status, 'FAILED');
  assert.equal(rejected.failureReason, 'Amount does not match order total.');
  await submitBankTransferDetails(order.id, user.id, { transferReference: 'CORRECT-123', transferAmount: order.total, transferDate: '2026-08-24' });
  const confirmed = await confirmBankTransfer(order.id, admin.id);
  assert.equal(confirmed.payment.status, 'PAID');
  assert.equal(confirmed.order.status, 'CONFIRMED');
  assert.equal(confirmed.order.paymentStatus, 'PAID');
  assert.equal(await prisma.orderEvent.count({ where: { orderId: order.id, eventType: 'PAYMENT_REJECTED' } }), 1);
  assert.equal(await prisma.orderEvent.count({ where: { orderId: order.id, eventType: 'PAYMENT_CONFIRMED' } }), 1);
});

test.after(async () => {
  await prisma.$disconnect();
});

test('creates and authenticates a checkout customer without duplicate accounts', async () => {
  const email = `checkout-${randomUUID()}@example.com`;
  const createdResponse = await checkoutCustomer(new Request('http://localhost/api/checkout/customer', { method: 'POST', body: JSON.stringify({ fullName: 'Checkout Customer', email, phone: '+94770000000', password: 'checkout123' }) }));
  const created = await createdResponse.json();
  assert.equal(createdResponse.status, 201);
  assert.ok(created.accessToken);
  const user = await prisma.user.findUniqueOrThrow({ where: { email } });
  assert.notEqual(user.passwordHash, 'checkout123');

  const wrong = await checkoutCustomer(new Request('http://localhost/api/checkout/customer', { method: 'POST', body: JSON.stringify({ email, password: 'wrongpass' }) }));
  assert.equal(wrong.status, 401);
  assert.equal(await prisma.user.count({ where: { email } }), 1);
});

test('returns active delivery-zone fees and rejects unknown districts', async () => {
  const colombo = await getDeliveryZone(new Request('http://localhost/api/delivery-zones?district=Colombo'));
  assert.equal(colombo.status, 200);
  assert.equal((await colombo.json()).fee, 350);
  const unknown = await getDeliveryZone(new Request('http://localhost/api/delivery-zones?district=Unknown'));
  assert.equal(unknown.status, 404);
});