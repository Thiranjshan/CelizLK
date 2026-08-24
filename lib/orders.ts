import { createHash, randomInt } from 'node:crypto';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export const paymentMethods = ['COD', 'BANK_TRANSFER', 'PAYHERE'] as const;
export type PaymentMethod = typeof paymentMethods[number];

export const paymentStatuses = ['UNPAID', 'PENDING', 'PAID', 'FAILED', 'CANCELLED', 'REFUND_PENDING', 'REFUNDED', 'CHARGEBACK'] as const;
export type PaymentStatus = typeof paymentStatuses[number];

export const orderStatuses = ['AWAITING_PAYMENT', 'CONFIRMED', 'PROCESSING', 'PACKED', 'SHIPPED', 'DELIVERED', 'CANCELLED'] as const;
export type OrderStatus = typeof orderStatuses[number];

export const orderTransitions: Record<OrderStatus, OrderStatus[]> = {
  AWAITING_PAYMENT: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PROCESSING', 'CANCELLED'],
  PROCESSING: ['PACKED', 'CANCELLED'],
  PACKED: ['SHIPPED'],
  SHIPPED: ['DELIVERED'],
  DELIVERED: [],
  CANCELLED: [],
};

export const orderEventTypes = ['ORDER_CREATED', 'PAYMENT_PENDING', 'PAYMENT_DETAILS_SUBMITTED', 'PAYMENT_CONFIRMED', 'COD_PAYMENT_CONFIRMED', 'PAYMENT_REJECTED', 'ORDER_CONFIRMED', 'ORDER_PROCESSING', 'ORDER_PACKED', 'ORDER_SHIPPED', 'ORDER_DELIVERED', 'ORDER_CANCELLED'] as const;
export type OrderEventType = typeof orderEventTypes[number];

export type BankTransferDetails = {
  transferReference: unknown;
  transferAmount: unknown;
  transferDate: unknown;
  bankName?: unknown;
  transferNote?: unknown;
  proofUrl?: unknown;
};

export type CreateOrderInput = {
  userId: string;
  customerPhone?: unknown;
  shippingAddress: Record<string, unknown>;
  paymentMethod?: unknown;
  items: ReadonlyArray<{ productId: string; quantity: number }>;
  idempotencyKey?: string | null;
};

type OrderTransaction = Prisma.TransactionClient;

function makeIdempotencyKey(input: CreateOrderInput) {
  const normalized = JSON.stringify({
    userId: input.userId,
    paymentMethod: input.paymentMethod,
    shippingAddress: input.shippingAddress,
    items: [...input.items].sort((left, right) => left.productId.localeCompare(right.productId)),
  });
  return createHash('sha256').update(normalized).digest('hex');
}

function makeOrderNumber() {
  return `CELIZ-${randomInt(100000, 1000000)}`;
}

async function createOrderInTransaction(transaction: OrderTransaction, input: CreateOrderInput, idempotencyKey: string, user: { fullName: string; email: string; phone: string | null }) {
  const existing = await transaction.order.findFirst({ where: { idempotencyKey }, include: { payment: true, items: { include: { product: true } }, events: true } });
  if (existing) return existing;

  if (input.paymentMethod !== undefined && !paymentMethods.includes(input.paymentMethod as PaymentMethod)) throw new Error('INVALID_PAYMENT_METHOD');
  const selectedPaymentMethod: PaymentMethod = input.paymentMethod as PaymentMethod || 'COD';
  const products = await Promise.all(input.items.map((item) => transaction.product.findUnique({ where: { id: item.productId }, select: { id: true, name: true, price: true, discountPrice: true, stockQty: true, isActive: true } })));
  if (products.some((product) => !product || !product.isActive)) throw new Error('PRODUCT_UNAVAILABLE');
  const pricedItems = input.items.map((item, index) => ({ ...item, product: products[index]! }));
  if (pricedItems.some((item) => item.quantity > item.product.stockQty)) throw new Error('INSUFFICIENT_STOCK');

  const subtotal = pricedItems.reduce((sum, item) => sum + (item.product.discountPrice ?? item.product.price) * item.quantity, 0);
  const district = typeof input.shippingAddress.district === 'string' ? input.shippingAddress.district.trim() : '';
  const zone = district ? await transaction.deliveryZone.findFirst({ where: { district, isActive: true }, select: { fee: true } }) : null;
  if (district && !zone) throw new Error('DELIVERY_AREA_UNAVAILABLE');
  const deliveryFee = subtotal > 15000 ? 0 : zone?.fee ?? 350;
  const total = subtotal + deliveryFee;
  const orderStatus: OrderStatus = selectedPaymentMethod === 'COD' ? 'CONFIRMED' : 'AWAITING_PAYMENT';
  const paymentStatus: PaymentStatus = selectedPaymentMethod === 'COD' ? 'UNPAID' : 'PENDING';
  const orderNumber = makeOrderNumber();

  for (const item of pricedItems) {
    const changed = await transaction.product.updateMany({ where: { id: item.product.id, stockQty: item.product.stockQty }, data: { stockQty: { decrement: item.quantity } } });
    if (changed.count !== 1) throw new Error('STOCK_CONFLICT');
    await transaction.inventoryLog.create({ data: { productId: item.product.id, change: -item.quantity, reason: `Order ${orderNumber}`, adminUserId: null } });
  }

  return transaction.order.create({
    data: {
      orderNumber,
      idempotencyKey,
      userId: input.userId,
      customerName: user.fullName,
      customerEmail: user.email,
      customerPhone: typeof input.customerPhone === 'string' && input.customerPhone ? input.customerPhone : user.phone || '',
      shippingAddress: JSON.stringify(input.shippingAddress),
      paymentMethod: selectedPaymentMethod,
      paymentStatus,
      subtotal,
      deliveryFee,
      shippingFee: deliveryFee,
      total,
      status: orderStatus,
      items: { create: pricedItems.map((item) => ({ productId: item.product.id, productName: item.product.name, quantity: item.quantity, unitPrice: item.product.discountPrice ?? item.product.price, lineSubtotal: (item.product.discountPrice ?? item.product.price) * item.quantity })) },
      payment: { create: { amount: total, method: selectedPaymentMethod, gateway: selectedPaymentMethod === 'PAYHERE' ? 'PayHere' : selectedPaymentMethod === 'BANK_TRANSFER' ? 'BankTransfer' : 'COD', status: paymentStatus } },
      events: { create: selectedPaymentMethod === 'COD' ? [
        { eventType: 'ORDER_CREATED', newOrderStatus: orderStatus, actorType: 'CUSTOMER', actorId: input.userId, description: 'Order created' },
        { eventType: 'ORDER_CONFIRMED', previousOrderStatus: null, newOrderStatus: 'CONFIRMED', actorType: 'SYSTEM', description: 'COD order confirmed' },
      ] : [
        { eventType: 'ORDER_CREATED', newOrderStatus: orderStatus, actorType: 'CUSTOMER', actorId: input.userId, description: 'Order created' },
        { eventType: 'PAYMENT_PENDING', newOrderStatus: orderStatus, actorType: 'SYSTEM', description: 'Payment is pending' },
      ] },
    },
    include: { items: { include: { product: true } }, payment: true, events: true },
  });
}

export async function createOrder(input: CreateOrderInput) {
  const idempotencyKey = input.idempotencyKey?.trim() || makeIdempotencyKey(input);
  const user = await prisma.user.findUnique({ where: { id: input.userId }, select: { id: true, fullName: true, email: true, phone: true } });
  if (!user) throw new Error('USER_NOT_FOUND');
  try {
    return await prisma.$transaction((transaction) => createOrderInTransaction(transaction, input, idempotencyKey, user));
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return prisma.order.findUniqueOrThrow({ where: { idempotencyKey }, include: { items: { include: { product: true } }, payment: true, events: true } });
    }
    throw error;
  }
}

export async function transitionOrder(orderId: string, nextStatus: string, adminId: string) {
  if (!orderStatuses.includes(nextStatus as OrderStatus)) throw new Error('INVALID_ORDER_STATUS');
  const targetStatus = nextStatus as OrderStatus;

  return prisma.$transaction(async (transaction) => {
    const order = await transaction.order.findUnique({ where: { id: orderId }, include: { payment: true, items: true } });
    if (!order) throw new Error('ORDER_NOT_FOUND');
    const currentStatus = order.status as OrderStatus;
    if (!orderTransitions[currentStatus]?.includes(targetStatus)) throw new Error('INVALID_ORDER_TRANSITION');
    const payment = order.payment[0];
    if (['CONFIRMED', 'PROCESSING'].includes(targetStatus) && order.paymentMethod === 'BANK_TRANSFER' && payment?.status !== 'PAID') throw new Error('PAYMENT_REQUIRED');

    if (targetStatus === 'CANCELLED') {
      for (const item of order.items) {
        await transaction.product.update({ where: { id: item.productId }, data: { stockQty: { increment: item.quantity } } });
        await transaction.inventoryLog.create({ data: { productId: item.productId, change: item.quantity, reason: `Order ${order.orderNumber} cancelled`, adminUserId: adminId, orderId: order.id, eventType: 'RELEASE' } });
      }
    }

    const changed = await transaction.order.updateMany({ where: { id: order.id, status: order.status }, data: { status: targetStatus, ...(targetStatus === 'CANCELLED' ? { cancelledAt: new Date() } : {}) } });
    if (changed.count !== 1) throw new Error('ORDER_CONFLICT');
    await transaction.orderEvent.create({ data: { orderId: order.id, eventType: `ORDER_${targetStatus}`, previousOrderStatus: order.status, newOrderStatus: targetStatus, actorType: 'ADMIN', actorId: adminId, description: `Order status changed to ${targetStatus}` } });
    return transaction.order.findUniqueOrThrow({ where: { id: order.id }, include: { payment: true, events: { orderBy: { createdAt: 'asc' } } } });
  });
}

export async function confirmCodPayment(orderId: string, adminId: string) {
  return prisma.$transaction(async (transaction) => {
    const order = await transaction.order.findUnique({ where: { id: orderId }, include: { payment: true } });
    if (!order) throw new Error('ORDER_NOT_FOUND');
    const payment = order.payment[0];
    if (!payment) throw new Error('PAYMENT_NOT_FOUND');
    if (payment.method !== 'COD') throw new Error('INVALID_PAYMENT_METHOD');
    if (payment.status !== 'UNPAID') throw new Error(payment.status === 'PAID' ? 'PAYMENT_ALREADY_PAID' : 'INVALID_PAYMENT_STATE');
    if (order.status === 'CANCELLED') throw new Error('ORDER_CANCELLED');
    if (!['CONFIRMED', 'PROCESSING', 'PACKED', 'SHIPPED', 'DELIVERED'].includes(order.status)) throw new Error('INVALID_ORDER_STATE');

    const changed = await transaction.payment.updateMany({ where: { id: payment.id, status: 'UNPAID' }, data: { status: 'PAID', verifiedAt: new Date(), verifiedByAdminId: adminId } });
    if (changed.count !== 1) throw new Error('PAYMENT_CONFLICT');
    await transaction.order.update({ where: { id: order.id }, data: { paymentStatus: 'PAID' } });
    await transaction.orderEvent.create({ data: { orderId: order.id, eventType: 'COD_PAYMENT_CONFIRMED', previousPaymentStatus: 'UNPAID', newPaymentStatus: 'PAID', actorType: 'ADMIN', actorId: adminId, description: 'COD payment received' } });
    return transaction.payment.findUniqueOrThrow({ where: { id: payment.id } });
  });
}

function parseTransferDetails(input: BankTransferDetails) {
  const transferReference = typeof input.transferReference === 'string' ? input.transferReference.trim() : '';
  const transferAmount = Number(input.transferAmount);
  const transferDate = new Date(String(input.transferDate || ''));
  if (!transferReference || transferReference.length > 120) throw new Error('INVALID_TRANSFER_REFERENCE');
  if (!Number.isFinite(transferAmount) || transferAmount <= 0) throw new Error('INVALID_TRANSFER_AMOUNT');
  if (!Number.isFinite(transferDate.getTime())) throw new Error('INVALID_TRANSFER_DATE');
  return {
    transferReference,
    transferAmount,
    transferDate,
    bankName: typeof input.bankName === 'string' ? input.bankName.trim().slice(0, 100) || null : null,
    transferNote: typeof input.transferNote === 'string' ? input.transferNote.trim().slice(0, 500) || null : null,
    proofUrl: typeof input.proofUrl === 'string' ? input.proofUrl.trim().slice(0, 500) || null : null,
  };
}

export async function submitBankTransferDetails(orderId: string, userId: string, input: BankTransferDetails) {
  const details = parseTransferDetails(input);
  return prisma.$transaction(async (transaction) => {
    const order = await transaction.order.findUnique({ where: { id: orderId }, include: { payment: true } });
    if (!order) throw new Error('ORDER_NOT_FOUND');
    if (order.userId !== userId) throw new Error('ORDER_FORBIDDEN');
    if (order.paymentMethod !== 'BANK_TRANSFER') throw new Error('INVALID_PAYMENT_METHOD');
    const payment = order.payment[0];
    if (!payment) throw new Error('PAYMENT_NOT_FOUND');
    if (payment.status === 'PAID') throw new Error('PAYMENT_ALREADY_PAID');
    if (!['PENDING', 'FAILED'].includes(payment.status)) throw new Error('INVALID_PAYMENT_STATE');
    const sameSubmission = payment.status === 'PENDING' && payment.transferReference === details.transferReference && payment.transferAmount === details.transferAmount && payment.transferDate?.getTime() === details.transferDate.getTime();
    if (sameSubmission) return payment;
    if (payment.status === 'PENDING' && payment.transferSubmittedAt) throw new Error('PAYMENT_ALREADY_SUBMITTED');

    const updated = await transaction.payment.update({ where: { id: payment.id }, data: { status: 'PENDING', transferReference: details.transferReference, transferAmount: details.transferAmount, transferDate: details.transferDate, transferSubmittedAt: new Date(), bankName: details.bankName, transferNote: details.transferNote, proofUrl: details.proofUrl, failureReason: null, rejectedAt: null } });
    await transaction.order.update({ where: { id: order.id }, data: { paymentStatus: 'PENDING' } });
    await transaction.orderEvent.create({ data: { orderId: order.id, eventType: 'PAYMENT_DETAILS_SUBMITTED', previousPaymentStatus: payment.status, newPaymentStatus: 'PENDING', actorType: 'CUSTOMER', actorId: userId, description: 'Bank transfer details submitted' } });
    return updated;
  });
}

export async function confirmBankTransfer(orderId: string, adminId: string) {
  return prisma.$transaction(async (transaction) => {
    const order = await transaction.order.findUnique({ where: { id: orderId }, include: { payment: true } });
    if (!order) throw new Error('ORDER_NOT_FOUND');
    if (order.paymentMethod !== 'BANK_TRANSFER') throw new Error('INVALID_PAYMENT_METHOD');
    const payment = order.payment[0];
    if (!payment) throw new Error('PAYMENT_NOT_FOUND');
    if (payment.status === 'PAID') throw new Error('PAYMENT_ALREADY_PAID');
    if (payment.status === 'FAILED') throw new Error('PAYMENT_ALREADY_REJECTED');
    if (payment.status !== 'PENDING' || order.status !== 'AWAITING_PAYMENT') throw new Error('INVALID_PAYMENT_STATE');
    if (payment.transferAmount === null || payment.transferAmount === undefined || Math.abs(payment.transferAmount - order.total) > 0.005) throw new Error('AMOUNT_MISMATCH');

    const verifiedAt = new Date();
    const changed = await transaction.payment.updateMany({ where: { id: payment.id, status: 'PENDING' }, data: { status: 'PAID', verifiedAt, verifiedByAdminId: adminId } });
    if (changed.count !== 1) throw new Error('PAYMENT_CONFLICT');
    const confirmed = await transaction.order.updateMany({ where: { id: order.id, status: 'AWAITING_PAYMENT' }, data: { status: 'CONFIRMED', paymentStatus: 'PAID', confirmedAt: verifiedAt } });
    if (confirmed.count !== 1) throw new Error('ORDER_CONFLICT');
    await transaction.orderEvent.createMany({ data: [
      { orderId: order.id, eventType: 'PAYMENT_CONFIRMED', previousPaymentStatus: 'PENDING', newPaymentStatus: 'PAID', actorType: 'ADMIN', actorId: adminId, description: 'Bank transfer payment confirmed' },
      { orderId: order.id, eventType: 'ORDER_CONFIRMED', previousOrderStatus: 'AWAITING_PAYMENT', newOrderStatus: 'CONFIRMED', actorType: 'ADMIN', actorId: adminId, description: 'Order confirmed after bank transfer verification' },
    ] });
    return { payment: await transaction.payment.findUniqueOrThrow({ where: { id: payment.id } }), order: await transaction.order.findUniqueOrThrow({ where: { id: order.id } }) };
  });
}

export async function rejectBankTransfer(orderId: string, adminId: string, reason: unknown) {
  const rejectionReason = typeof reason === 'string' ? reason.trim().slice(0, 500) : '';
  if (!rejectionReason) throw new Error('REJECTION_REASON_REQUIRED');
  return prisma.$transaction(async (transaction) => {
    const order = await transaction.order.findUnique({ where: { id: orderId }, include: { payment: true } });
    if (!order) throw new Error('ORDER_NOT_FOUND');
    if (order.paymentMethod !== 'BANK_TRANSFER') throw new Error('INVALID_PAYMENT_METHOD');
    const payment = order.payment[0];
    if (!payment) throw new Error('PAYMENT_NOT_FOUND');
    if (payment.status === 'PAID') throw new Error('PAYMENT_ALREADY_PAID');
    if (payment.status === 'FAILED') throw new Error('PAYMENT_ALREADY_REJECTED');
    if (payment.status !== 'PENDING' || order.status !== 'AWAITING_PAYMENT') throw new Error('INVALID_PAYMENT_STATE');

    const rejectedAt = new Date();
    const changed = await transaction.payment.updateMany({ where: { id: payment.id, status: 'PENDING' }, data: { status: 'FAILED', failureReason: rejectionReason, rejectedAt } });
    if (changed.count !== 1) throw new Error('PAYMENT_CONFLICT');
    await transaction.order.update({ where: { id: order.id }, data: { paymentStatus: 'FAILED' } });
    await transaction.orderEvent.create({ data: { orderId: order.id, eventType: 'PAYMENT_REJECTED', previousPaymentStatus: 'PENDING', newPaymentStatus: 'FAILED', actorType: 'ADMIN', actorId: adminId, description: rejectionReason } });
    return transaction.payment.findUniqueOrThrow({ where: { id: payment.id } });
  });
}