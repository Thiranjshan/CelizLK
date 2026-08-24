import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

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
        payments: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const formatted = {
      ...order,
      shippingAddress: JSON.parse(order.shippingAddress),
      items: order.items.map((item) => ({
        ...item,
        product: {
          ...item.product,
          images: JSON.parse(item.product.images),
          specs: JSON.parse(item.product.specs),
        },
      })),
    };

    return NextResponse.json(formatted);
  } catch (error) {
    console.error('Error fetching order:', error);
    return NextResponse.json({ error: 'Failed to fetch order' }, { status: 500 });
  }
}

export async function PATCH() {
  return NextResponse.json({ error: 'Order status changes are restricted to the admin API.' }, { status: 403 });
}
