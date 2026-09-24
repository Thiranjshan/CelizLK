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

        {/* Bank Transfer Payment Instructions */}
        {order.paymentMethod === 'BANK_TRANSFER' && (
          <div
            style={{
              background:
                'linear-gradient(135deg, rgba(37,211,102,0.06) 0%, rgba(37,211,102,0.02) 100%)',
              border: '1.5px solid rgba(37,211,102,0.3)',
              borderRadius: 'var(--radius-lg)',
              padding: '1.75rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem',
            }}
          >
            {/* Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
              }}
            >
              <div
                style={{
                  width: 42,
                  height: 42,
                  background: 'rgba(37,211,102,0.15)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Building2 size={20} color="#25d366" />
              </div>

              <div>
                <div
                  style={{
                    fontWeight: 800,
                    fontSize: '1rem',
                    color: 'var(--text-main)',
                  }}
                >
                  Bank Transfer Payment
                </div>

                <div
                  style={{
                    fontSize: '0.82rem',
                    color: 'var(--text-secondary)',
                  }}
                >
                  Complete the payment using the account details below
                </div>
              </div>
            </div>

            {/* Bank Details */}
            <div
              style={{
                background: 'var(--bg-white)',
                borderRadius: 'var(--radius-md)',
                padding: '1.25rem',
                border: '1px solid var(--border-color)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.65rem',
                fontSize: '0.9rem',
              }}
            >
              {/* Bank */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: '1rem',
                  flexWrap: 'wrap',
                }}
              >
                <span style={{ color: 'var(--text-secondary)' }}>Bank</span>
                <strong style={{ textAlign: 'right' }}>
                  Commercial Bank of Ceylon
                </strong>
              </div>

              {/* Account Name */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: '1rem',
                  flexWrap: 'wrap',
                }}
              >
                <span style={{ color: 'var(--text-secondary)' }}>
                  Account Name
                </span>
                <strong style={{ textAlign: 'right' }}>
                  Celiz LK (Pvt) Ltd
                </strong>
              </div>

              {/* Account Number */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '1rem',
                  flexWrap: 'wrap',
                }}
              >
                <span style={{ color: 'var(--text-secondary)' }}>
                  Account Number
                </span>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <strong
                    style={{
                      fontFamily: 'var(--font-family-base)',
                      letterSpacing: '0.05em',
                    }}
                  >
                    1234567890
                  </strong>

                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard?.writeText('1234567890');
                    }}
                    style={{
                      border: '1px solid var(--border-color)',
                      background: 'var(--bg-white)',
                      color: 'var(--text-secondary)',
                      borderRadius: '6px',
                      padding: '0.25rem 0.5rem',
                      fontSize: '0.72rem',
                      cursor: 'pointer',
                    }}
                    title="Copy account number"
                  >
                    Copy
                  </button>
                </div>
              </div>

              {/* Branch */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: '1rem',
                  flexWrap: 'wrap',
                }}
              >
                <span style={{ color: 'var(--text-secondary)' }}>Branch</span>
                <strong style={{ textAlign: 'right' }}>Colombo 03</strong>
              </div>

              {/* Divider */}
              <div
                style={{
                  height: 1,
                  background: 'var(--border-color)',
                  margin: '0.35rem 0',
                }}
              />

              {/* Amount */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '1rem',
                  flexWrap: 'wrap',
                }}
              >
                <span style={{ color: 'var(--text-secondary)' }}>
                  Amount to Transfer
                </span>

                <strong
                  style={{
                    color: 'var(--accent-purple)',
                    fontSize: '1rem',
                  }}
                >
                  LKR {order.total.toLocaleString()}
                </strong>
              </div>
            </div>

            {/* Payment / Receipt Instructions */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
              }}
            >
              <div
                style={{
                  color: 'var(--text-main)',
                  lineHeight: 1.6,
                }}
              >
                <strong>Already made the payment?</strong>

                <p
                  style={{
                    fontSize: '0.75rem',
                    margin: '0.35rem 0 0',
                    color: 'var(--text-secondary)',
                  }}
                >
                  Send your payment receipt to us on WhatsApp so our team can
                  verify your payment and confirm your order.
                </p>
              </div>

              {/* WhatsApp Button */}
              <a
                href={`https://wa.me/94751205996?text=${encodeURIComponent(
                  `Hi Celiz LK, I have completed a bank transfer for Order #${order.id}. Please verify my payment.`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.6rem',
                  background: '#25d366',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  padding: '0.75rem 1.5rem',
                  borderRadius: 'var(--radius-md)',
                  textDecoration: 'none',
                  alignSelf: 'flex-start',
                }}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>

                Send via WhatsApp
              </a>

              {/* Later Submission Notice */}
              <div
                style={{
                  background: 'rgba(99, 102, 241, 0.05)',
                  border: '1px solid rgba(99, 102, 241, 0.12)',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.8rem 0.9rem',
                  fontSize: '0.82rem',
                  lineHeight: 1.5,
                  color: 'var(--text-secondary)',
                }}
              >
                <strong style={{ color: 'var(--text-main)' }}>
                  You can send the receipt later.
                </strong>
                <p
                  style={{
                    fontSize: '0.75rem',
                    margin: '0.35rem 0 0',
                    color: 'var(--text-secondary)',
                  }}
                >
                  If you are not ready to send it now, you can return to this
                  order anytime from
                </p>
                <strong style={{ color: 'var(--text-main)', margin: '0.5rem 0 0', display: 'block' }}>
                  My Account → Order History → View Order Details
                </strong>
              </div>
            </div>
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
      <div className="checkout-success-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
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
