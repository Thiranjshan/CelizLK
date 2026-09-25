import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import { createOrder } from '@/lib/orders';
import { bankTransferInstructions } from '@/lib/payment-config';

export async function GET(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });

    const orders = await prisma.order.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        items: {
          include: { product: true },
        },
        payment: true,
        events: { orderBy: { createdAt: 'asc' } },
      },
    });

    const formatted = orders.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      status: o.status,
      paymentStatus: o.paymentStatus,
      paymentMethod: o.paymentMethod,
      subtotal: o.subtotal,
      deliveryFee: o.deliveryFee,
      total: o.total,
      createdAt: o.createdAt,
      customerName: o.customerName,
      customerEmail: o.customerEmail,
      customerPhone: o.customerPhone,
      shippingAddress: JSON.parse(o.shippingAddress),
      items: o.items.map((item) => ({
        id: item.id,
        productId: item.productId,
        productName: item.productName || item.product.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        lineTotal: item.lineSubtotal || item.unitPrice * item.quantity,
      })),
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
    const body = await request.json();
    const { customerPhone, shippingAddress, paymentMethod, items } = body;
    if (!Array.isArray(items) || items.length === 0 || items.length > 50 || !shippingAddress || typeof shippingAddress.addressLine1 !== 'string' || !shippingAddress.addressLine1.trim() || typeof shippingAddress.city !== 'string' || !shippingAddress.city.trim() || typeof shippingAddress.district !== 'string' || !shippingAddress.district.trim()) {
      return NextResponse.json({ error: 'Valid shipping details and cart items are required.' }, { status: 400 });
    }
    const requestedItems = items.map((item: { productId?: unknown; quantity?: unknown }) => ({ productId: String(item.productId || ''), quantity: Number(item.quantity) }));
    if (requestedItems.some((item) => !item.productId || !Number.isInteger(item.quantity) || item.quantity <= 0 || item.quantity > 99)) return NextResponse.json({ error: 'Invalid cart items.' }, { status: 400 });

    const newOrder = await createOrder({ userId: user.id, customerPhone, shippingAddress, paymentMethod, items: requestedItems, idempotencyKey: request.headers.get('idempotency-key') });

    return NextResponse.json(
      {
        id: newOrder.id,
        orderNumber: newOrder.orderNumber,
        status: newOrder.status,
        paymentStatus: newOrder.paymentStatus,
        paymentMethod: newOrder.paymentMethod,
        subtotal: newOrder.subtotal,
        deliveryFee: newOrder.deliveryFee,
        total: newOrder.total,
        createdAt: newOrder.createdAt,
        shippingAddress: JSON.parse(newOrder.shippingAddress),
        items: newOrder.items.map((item) => ({ id: item.id, productId: item.productId, productName: item.productName, quantity: item.quantity, unitPrice: item.unitPrice, lineTotal: item.lineSubtotal || item.unitPrice * item.quantity })),
        payment: newOrder.payment[0] ? { method: newOrder.payment[0].method, status: newOrder.payment[0].status, amount: newOrder.payment[0].amount, currency: newOrder.payment[0].currency } : null,
        bankTransferInstructions: paymentMethod === 'BANK_TRANSFER' ? bankTransferInstructions : null,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating order:', error);
    if (error instanceof Error && error.message === 'INVALID_PAYMENT_METHOD') {
      return NextResponse.json({ error: 'Invalid payment method.' }, { status: 400 });
    }
    if (error instanceof Error && ['PRODUCT_UNAVAILABLE', 'INSUFFICIENT_STOCK', 'STOCK_CONFLICT'].includes(error.message)) {
      return NextResponse.json({ error: 'One or more products are unavailable or out of stock.' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
  }
}
