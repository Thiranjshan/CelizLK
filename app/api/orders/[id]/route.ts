import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import { bankTransferInstructions } from '@/lib/payment-config';

const timelineLabels: Record<string, string> = {
  AWAITING_PAYMENT: 'Payment pending',
  CONFIRMED: 'Order confirmed',
  PROCESSING: 'Processing',
  PACKED: 'Packed',
  SHIPPED: 'Shipped',
  OUT_FOR_DELIVERY: 'Out for delivery',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
};

type CustomerOrder = Prisma.OrderGetPayload<{
  include: { items: { include: { product: true } }; payment: true; events: true };
}>;

function customerOrder(order: CustomerOrder) {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    paymentStatus: order.paymentStatus,
    paymentMethod: order.paymentMethod,
    subtotal: order.subtotal,
    discount: Math.max(0, order.subtotal + order.deliveryFee - order.total),
    deliveryFee: order.deliveryFee,
    total: order.total,
    createdAt: order.createdAt,
    customerName: order.customerName,
    customerEmail: order.customerEmail,
    customerPhone: order.customerPhone,
    shippingAddress: JSON.parse(order.shippingAddress),
    items: order.items.map((item) => ({
      id: item.id,
      productId: item.productId,
      productName: item.productName || item.product.name,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      lineTotal: item.lineSubtotal || item.unitPrice * item.quantity,
      image: (() => { try { return JSON.parse(item.product.images)[0] || null; } catch { return null; } })(),
    })),
    payment: order.payment[0] ? {
      method: order.payment[0].method,
      status: order.payment[0].status,
      amount: order.payment[0].amount,
      currency: order.payment[0].currency,
      referenceId: order.payment[0].referenceId,
      transferReference: order.payment[0].transferReference,
      transferAmount: order.payment[0].transferAmount,
      transferDate: order.payment[0].transferDate,
      transferSubmittedAt: order.payment[0].transferSubmittedAt,
      failureReason: order.payment[0].status === 'FAILED' ? order.payment[0].failureReason : null,
    } : null,
    timeline: order.events
      .filter((event) => event.newOrderStatus && timelineLabels[event.newOrderStatus])
      .map((event) => ({ status: event.newOrderStatus, label: timelineLabels[event.newOrderStatus!], createdAt: event.createdAt })),
    bankTransferInstructions: order.paymentMethod === 'BANK_TRANSFER' ? bankTransferInstructions : null,
  };
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
    const { id } = await params;
    const order = await prisma.order.findFirst({
      where: {
        userId: user.id,
        OR: [{ id }, { orderNumber: id }],
      },
      include: {
        items: {
          include: { product: true },
        },
        payment: true,
        events: { orderBy: { createdAt: 'asc' } },
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json(customerOrder(order));
  } catch (error) {
    console.error('Error fetching order:', error);
    return NextResponse.json({ error: 'Failed to fetch order' }, { status: 500 });
  }
}

export async function PATCH() {
  return NextResponse.json({ error: 'Order status changes are restricted to the admin API.' }, { status: 403 });
}
