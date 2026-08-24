'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useStore } from '@/lib/store';
import { CheckCircle2, Truck, CreditCard, Banknote, Building2, Package, ArrowRight } from 'lucide-react';

interface OrderItem {
  id: string;
  productName: string;
  image?: string | null;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

interface ShippingAddress {
  addressLine1: string;
  addressLine2?: string;
  city: string;
  district: string;
  postalCode?: string;
}

interface OrderDetails {
  id: string;
  orderNumber: string;
  createdAt: string;
  status: string;
  paymentStatus?: string;
  paymentMethod: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: ShippingAddress;
  subtotal: number;
  deliveryFee: number;
  total: number;
  items: OrderItem[];
  bankTransferInstructions?: { bankName: string; accountName: string; accountNumber: string; branch: string; currency: string };
}

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={<div className="container" style={{ padding: '5rem 1.25rem', textAlign: 'center' }}>Loading order confirmation...</div>}>
      <OrderSuccessContent />
    </Suspense>
  );
}

function OrderSuccessContent() {
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get('orderNumber');
  const token = useStore((state) => state.accessToken);

  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!orderNumber || !token) return;

    fetch(`/api/orders/${orderNumber}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to fetch order details.');
        return data;
      })
      .then((data) => {
        setOrder(data);
      })
      .catch((err) => {
        setError(err.message || 'Order not found or access denied.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [orderNumber, token]);

  const requestError = !orderNumber ? 'No order specified.' : !token ? 'Please sign in to view your order details.' : error;

  if (requestError && !error) {
    return (
      <div className="container" style={{ padding: '5rem 1.25rem', textAlign: 'center', maxWidth: 600 }}>
        <div style={{ background: 'var(--bg-white)', padding: '2.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1rem', color: 'var(--accent-purple)' }}>Order Confirmation Notice</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>{requestError}</p>
          <Link href="/account/orders" className="btn-primary">View Order History</Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container" style={{ padding: '5rem 1.25rem', textAlign: 'center' }}>
        <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)' }}>Verifying your order details...</p>
      </div>
    );
  }

  if (requestError || !order) {
    return (
      <div className="container" style={{ padding: '5rem 1.25rem', textAlign: 'center', maxWidth: 600 }}>
        <div style={{ background: 'var(--bg-white)', padding: '2.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1rem', color: 'var(--accent-purple)' }}>Order Confirmation Notice</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>{requestError || 'Unable to display order details.'}</p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <Link href="/account/orders" className="btn-primary">
              View Order History
            </Link>
            <Link href="/products" className="btn-primary" style={{ background: 'var(--border-color)', color: 'var(--text-main)' }}>
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ maxWidth: 850, padding: '3rem 1.25rem 5rem 1.25rem' }}>
      {/* Header Banner */}
      <div style={{ background: 'var(--bg-white)', padding: '2.5rem 2rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', textAlign: 'center', marginBottom: '2rem' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 64, height: 64, borderRadius: '50%', background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', marginBottom: '1rem' }}>
          <CheckCircle2 size={36} />
        </div>
        <h1 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '0.5rem' }}>Order Placed Successfully!</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem' }}>
          Thank you for shopping with Celiz LK, <strong>{order.customerName}</strong>.
        </p>
        <div style={{ marginTop: '1.25rem', display: 'inline-block', padding: '0.5rem 1.25rem', background: 'var(--bg-main)', borderRadius: 'var(--radius-md)', fontWeight: 700, fontSize: '0.95rem' }}>
          Order Reference: <span style={{ color: 'var(--primary-indigo)' }}>#{order.orderNumber}</span>
        </div>
      </div>

      {/* Payment Method Specific Instructions */}
      <div style={{ background: 'var(--bg-white)', padding: '1.75rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {order.paymentMethod === 'COD' && <Banknote size={22} color="#22c55e" />}
          {order.paymentMethod === 'BANK_TRANSFER' && <Building2 size={22} color="var(--primary-indigo)" />}
          {order.paymentMethod === 'PAYHERE' && <CreditCard size={22} color="var(--accent-purple)" />}
          <span>Payment Instructions · {order.paymentMethod === 'COD' ? 'Cash on Delivery' : order.paymentMethod === 'BANK_TRANSFER' ? 'Bank Transfer' : 'PayHere Card Payment'}</span>
        </h3>

        {order.paymentMethod === 'COD' && (
          <div style={{ fontSize: '0.95rem', color: 'var(--text-main)', lineHeight: 1.6 }}>
            <p>Your order is confirmed and will be dispatched shortly.</p>
            <p style={{ marginTop: '0.5rem', fontWeight: 700, color: 'var(--primary-indigo)' }}>
              {order.paymentStatus === 'PAID' ? 'COD payment received.' : `Payment due on delivery: LKR ${order.total.toLocaleString()}.`}
            </p>
          </div>
        )}

        {order.paymentMethod === 'BANK_TRANSFER' && (
          <div style={{ fontSize: '0.95rem', color: 'var(--text-main)', lineHeight: 1.6 }}>
            <p style={{ marginBottom: '0.75rem' }}>Please complete a bank deposit or online transfer to verify your order:</p>
            <div style={{ background: 'var(--bg-main)', padding: '1rem 1.25rem', borderRadius: 'var(--radius-md)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.9rem' }}>
              <div><strong>Bank Name:</strong> {order.bankTransferInstructions?.bankName}</div>
              <div><strong>Account Name:</strong> {order.bankTransferInstructions?.accountName}</div>
              <div><strong>Account No:</strong> {order.bankTransferInstructions?.accountNumber}</div>
              <div><strong>Branch:</strong> {order.bankTransferInstructions?.branch}</div>
              <div style={{ gridColumn: '1 / -1', borderTop: '1px dashed var(--border-color)', paddingTop: '0.5rem', marginTop: '0.25rem', color: 'var(--primary-indigo)', fontWeight: 700 }}>
                Transfer Reference: Include Order #{order.orderNumber} in your bank transaction description.
              </div>
            </div>
            <p style={{ marginTop: '0.75rem' }}>Payment Status: {order.paymentStatus === 'PAID' ? 'Paid' : 'Awaiting payment verification'}</p>
          </div>
        )}

        {order.paymentMethod === 'PAYHERE' && (
          <div style={{ fontSize: '0.95rem', color: 'var(--text-main)', lineHeight: 1.6 }}>
            <p>Your order has been recorded with PayHere Payment Gateway.</p>
            <p style={{ marginTop: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
              Current Payment Status: <span style={{ fontWeight: 700, color: 'var(--primary-indigo)' }}>{order.status}</span>. Our team will verify card clearance and update your delivery status.
            </p>
          </div>
        )}
      </div>

      {/* Order Details & Summary Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
        {/* Customer & Address Details */}
        <div style={{ background: 'var(--bg-white)', padding: '1.75rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
          <h4 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
            <Truck size={18} />
            <span>Delivery Destination</span>
          </h4>
          <div style={{ fontSize: '0.95rem', lineHeight: 1.6 }}>
            <div style={{ fontWeight: 700 }}>{order.customerName}</div>
            <div>{order.shippingAddress.addressLine1}</div>
            {order.shippingAddress.addressLine2 && <div>{order.shippingAddress.addressLine2}</div>}
            <div>{order.shippingAddress.city}, {order.shippingAddress.district} {order.shippingAddress.postalCode}</div>
            <div style={{ marginTop: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
              Phone: {order.customerPhone}
            </div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
              Email: {order.customerEmail}
            </div>
          </div>
        </div>

        {/* Financial Summary */}
        <div style={{ background: 'var(--bg-white)', padding: '1.75rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <h4 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '1rem', color: 'var(--text-secondary)' }}>
            Financial Summary
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.95rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Items Subtotal</span>
              <span>LKR {order.subtotal.toLocaleString()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Shipping Fee</span>
              <span>{order.deliveryFee === 0 ? 'FREE' : `LKR ${order.deliveryFee}`}</span>
            </div>
            <div style={{ borderTop: '2px dashed var(--border-color)', paddingTop: '0.75rem', marginTop: '0.5rem', display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', fontWeight: 900, color: 'var(--primary-indigo)' }}>
              <span>Total Payable</span>
              <span>LKR {order.total.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Purchased Items List */}
      <div style={{ background: 'var(--bg-white)', padding: '1.75rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', marginBottom: '2.5rem' }}>
        <h4 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Package size={20} color="var(--accent-purple)" />
          <span>Items Ordered ({order.items.length})</span>
        </h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {order.items.map((item) => (
            <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                {item.image && (
                  <img src={item.image} alt="" style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 'var(--radius-md)' }} />
                )}
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.98rem' }}>{item.productName}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    Qty: {item.quantity} × LKR {item.unitPrice.toLocaleString()}
                  </div>
                </div>
              </div>
              <div style={{ fontWeight: 800, color: 'var(--primary-indigo)' }}>
                LKR {item.lineTotal.toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Buttons */}
      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
        <Link href={`/account/orders/${order.id}`} className="btn-primary" style={{ padding: '0.85rem 1.75rem' }}>
          View Order
        </Link>
        <Link href="/products" className="btn-primary" style={{ background: 'var(--border-color)', color: 'var(--text-main)', padding: '0.85rem 1.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span>Continue Shopping</span>
          <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  );
}
