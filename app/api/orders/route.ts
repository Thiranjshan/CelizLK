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
      ...o,
      shippingAddress: JSON.parse(o.shippingAddress),
      payments: o.payment,
      bankTransferInstructions,
      items: o.items.map((item) => ({
        ...item,
        product: {
          ...item.product,
          images: JSON.parse(item.product.images),
          specs: JSON.parse(item.product.specs),
        },
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
    if (!Array.isArray(items) || items.length === 0 || items.length > 50 || !shippingAddress || typeof shippingAddress.addressLine1 !== 'string' || typeof shippingAddress.city !== 'string') {
      return NextResponse.json({ error: 'Valid shipping details and cart items are required.' }, { status: 400 });
    }
    const requestedItems = items.map((item: { productId?: unknown; quantity?: unknown }) => ({ productId: String(item.productId || ''), quantity: Number(item.quantity) }));
    if (requestedItems.some((item) => !item.productId || !Number.isInteger(item.quantity) || item.quantity <= 0 || item.quantity > 99)) return NextResponse.json({ error: 'Invalid cart items.' }, { status: 400 });

    const newOrder = await createOrder({ userId: user.id, customerPhone, shippingAddress, paymentMethod, items: requestedItems, idempotencyKey: request.headers.get('idempotency-key') });

    return NextResponse.json(
      {
        ...newOrder,
        shippingAddress: JSON.parse(newOrder.shippingAddress),
        payments: newOrder.payment,
        bankTransferInstructions,
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
