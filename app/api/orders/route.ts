import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

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
      },
    });

    const formatted = orders.map((o) => ({
      ...o,
      shippingAddress: JSON.parse(o.shippingAddress),
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

    const orderNumber = `CELIZ-${Math.floor(100000 + Math.random() * 900000)}`;

    const newOrder = await prisma.$transaction(async (transaction) => {
      const products = await Promise.all(requestedItems.map((item) => transaction.product.findUnique({ where: { id: item.productId }, select: { id: true, price: true, discountPrice: true, stockQty: true, isActive: true } })));
      if (products.some((product) => !product || !product.isActive)) throw new Error('PRODUCT_UNAVAILABLE');
      const pricedItems = requestedItems.map((item, index) => ({ ...item, product: products[index]! }));
      if (pricedItems.some((item) => item.quantity > item.product.stockQty)) throw new Error('INSUFFICIENT_STOCK');
      const subtotal = pricedItems.reduce((sum, item) => sum + (item.product.discountPrice ?? item.product.price) * item.quantity, 0);
      const shippingFee = subtotal > 15000 ? 0 : 350;
      for (const item of pricedItems) {
        const changed = await transaction.product.updateMany({ where: { id: item.product.id, stockQty: item.product.stockQty }, data: { stockQty: { decrement: item.quantity } } });
        if (changed.count !== 1) throw new Error('STOCK_CONFLICT');
        await transaction.inventoryLog.create({ data: { productId: item.product.id, change: -item.quantity, reason: `Order ${orderNumber}`, adminUserId: null } });
      }
      const selectedPaymentMethod = ['COD', 'BANK_TRANSFER', 'PAYHERE'].includes(paymentMethod) ? paymentMethod : 'COD';
      const gatewayName = selectedPaymentMethod === 'PAYHERE' ? 'PayHere' : selectedPaymentMethod === 'BANK_TRANSFER' ? 'BankTransfer' : 'COD';
      return transaction.order.create({
        data: {
          orderNumber,
          userId: user.id,
          customerName: user.fullName,
          customerEmail: user.email,
          customerPhone: customerPhone || user.phone || '',
          shippingAddress: JSON.stringify(shippingAddress),
          paymentMethod: selectedPaymentMethod,
          subtotal,
          shippingFee,
          total: subtotal + shippingFee,
          status: 'PENDING',
          items: {
            create: pricedItems.map((item) => ({ productId: item.product.id, quantity: item.quantity, unitPrice: item.product.discountPrice ?? item.product.price }))
          },
          payments: {
            create: {
              amount: subtotal + shippingFee,
              method: selectedPaymentMethod,
              gateway: gatewayName,
              status: 'PENDING'
            }
          }
        },
        include: {
          items: { include: { product: true } },
          payments: true
        }
      });
    }).catch((error) => {
      if (error instanceof Error && error.message === 'PRODUCT_UNAVAILABLE') return null;
      if (error instanceof Error && error.message === 'INSUFFICIENT_STOCK') return null;
      if (error instanceof Error && error.message === 'STOCK_CONFLICT') return null;
      throw error;
    });
    if (!newOrder) return NextResponse.json({ error: 'One or more products are unavailable or out of stock.' }, { status: 409 });

    return NextResponse.json(
      {
        ...newOrder,
        shippingAddress: JSON.parse(newOrder.shippingAddress),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
  }
}
