'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useStore } from '@/lib/store';
import { ArrowLeft, Building2 } from 'lucide-react';

interface Payment { method: string; status: string; amount: number; currency: string; transferReference?: string | null; transferAmount?: number | null; transferDate?: string | null; transferSubmittedAt?: string | null; failureReason?: string | null; }
interface TimelineEvent { status: string; label: string; createdAt: string; }
interface OrderItem { id: string; productId: string; productName: string; quantity: number; unitPrice: number; lineTotal: number; image?: string | null; }
interface Order { id: string; orderNumber: string; status: string; paymentStatus: string; paymentMethod: string; subtotal: number; discount: number; deliveryFee: number; total: number; createdAt: string; customerName: string; customerPhone: string; customerEmail: string; shippingAddress: { addressLine1?: string; addressLine2?: string; city?: string; district?: string; postalCode?: string }; payment: Payment | null; timeline: TimelineEvent[]; bankTransferInstructions: { bankName: string; accountName: string; accountNumber: string; branch: string; currency: string } | null; items: OrderItem[]; }

const statusSteps = ['CONFIRMED', 'PROCESSING', 'PACKED', 'SHIPPED', 'DELIVERED'];
const statusLabel = (status: string) => status.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
const money = (value: number) => `LKR ${value.toLocaleString()}`;

export default function CustomerOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const token = useStore((state) => state.accessToken);
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState('');


  useEffect(() => {
    if (!token) return;
    fetch(`/api/orders/${id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(async (response) => { const result = await response.json(); if (!response.ok) throw new Error(result.error); return result; })
      .then(setOrder)
      .catch((reason) => setError(reason instanceof Error ? reason.message : 'Unable to load order.'));
  }, [id, token]);



  if (!token) return <div className="container" style={{ padding: '5rem 1.25rem', textAlign: 'center' }}><h2>Sign in to view this order</h2><Link className="btn-primary" href="/login">Sign in</Link></div>;
  if (error) return <div className="container" style={{ padding: '5rem 1.25rem', textAlign: 'center' }}><p role="alert">{error}</p><Link href="/account/orders">Back to orders</Link></div>;
  if (!order) return <div className="container" style={{ padding: '5rem 1.25rem' }}>Loading order...</div>;

  const address = order.shippingAddress;
  const eventByStatus = new Map(order.timeline.map((event) => [event.status, event]));
  const cancelled = order.status === 'CANCELLED';
  const steps = cancelled ? [...statusSteps.filter((step) => eventByStatus.has(step)), 'CANCELLED'] : statusSteps;

  return <div className="container" style={{ maxWidth: 900, padding: '3rem 1.25rem 5rem' }}>
    <Link
      href="/account/orders"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 38,
        height: 38,
        background: 'var(--primary-indigo)',
        borderRadius: 8,
        textDecoration: 'none',
      }}
    >
      <ArrowLeft size={20} strokeWidth={3} color="#fff" />
    </Link>
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', alignItems: 'end', margin: '1rem 0 1.5rem' }}><div><h1 style={{ margin: 0 }}>Order #{order.orderNumber}</h1><p style={{ color: 'var(--text-secondary)', margin: '.4rem 0 0' }}>Placed {new Date(order.createdAt).toLocaleString()}</p></div><strong style={{ fontSize: '1.2rem' }}>{statusLabel(order.status)}</strong></div>
    <section className="admin-form-panel" style={{ marginBottom: '1rem' }}><h2>Order timeline</h2><div style={{ display: 'grid', gap: '.9rem' }}>{steps.map((step) => { const event = eventByStatus.get(step); const complete = Boolean(event); const current = step === order.status; return <div key={step} style={{ display: 'flex', gap: '.75rem', alignItems: 'flex-start', opacity: complete || current ? 1 : .45 }}><span aria-hidden="true" style={{ width: 26, height: 26, borderRadius: '50%', display: 'grid', placeItems: 'center', background: current ? 'var(--primary-indigo)' : complete ? 'var(--success)' : 'var(--border-color)', color: 'white', fontWeight: 800 }}>{step === 'CANCELLED' ? 'x' : complete ? '✓' : '·'}</span><div><strong>{event?.label || statusLabel(step)}</strong>{event && <div style={{ color: 'var(--text-secondary)', fontSize: '.85rem' }}>{new Date(event.createdAt).toLocaleString()}</div>}</div></div>; })}</div></section>
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '1.5rem',
      }}
    >
      {/* Products */}
      <section className="admin-form-panel">
        <h2 style={{ marginBottom: '1.25rem' }}>Products</h2>

        <div>
          {order.items.map((item) => (
            <div
              key={item.id}
              style={{
                display: 'flex',
                gap: '1rem',
                alignItems: 'flex-start', // was 'center' — fixes lopsided look when title wraps
                padding: '1rem 0',
                borderBottom: '1px solid var(--border-color)',
              }}
            >
              {item.image && (
                <img
                  src={item.image}
                  alt=""
                  width="64"
                  height="64"
                  style={{
                    objectFit: 'cover',
                    borderRadius: 8,
                    flexShrink: 0,
                  }}
                />
              )}

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, lineHeight: 1.35, marginBottom: '.35rem' }}>
                  {item.productName}
                </div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '.85rem' }}>
                  Qty: {item.quantity} · {money(item.unitPrice)} each
                </div>
              </div>

              <strong style={{ whiteSpace: 'nowrap', paddingTop: '.1rem' }}>
                {money(item.lineTotal)}
              </strong>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div style={{ display: 'grid', gap: '.6rem', marginTop: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Subtotal</span>
            <strong>{money(order.subtotal)}</strong>
          </div>

          {order.discount > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Discount</span>
              <strong style={{ color: 'var(--success)' }}>-{money(order.discount)}</strong>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Delivery</span>
            <strong>{order.deliveryFee ? money(order.deliveryFee) : 'FREE'}</strong>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              borderTop: '1px solid var(--border-color)',
              paddingTop: '.85rem',
              marginTop: '.25rem',
              fontSize: '1.05rem',
            }}
          >
            <span>Total</span>
            <strong>{money(order.total)}</strong>
          </div>
        </div>
      </section>

      {/* Delivery + Payment */}
      <section className="admin-form-panel">
        <h2 style={{ marginBottom: '.85rem' }}>Delivery information</h2>

        <div style={{ lineHeight: 1.7, marginBottom: '1.75rem', fontSize: '13px' }}>
          <div style={{ fontWeight: 600 }}>{order.customerName}</div>
          <div style={{ color: 'var(--text-secondary)' }}>{order.customerPhone}</div>
          <div style={{ color: 'var(--text-secondary)', marginBottom: '.6rem' }}>
            {order.customerEmail}

          </div>

          <div>
            {address.addressLine1}
            {address.addressLine2 && (
              <>
                <br />
                {address.addressLine2}
              </>
            )}
            <br />
            {address.city}, {address.district}
            {address.postalCode ? ` ${address.postalCode}` : ''}
            <br />
            Sri Lanka
          </div>
        </div>

        <h2 style={{ marginBottom: '.6rem' }}>Payment</h2>
        <div style={{ lineHeight: 1.7, fontSize: '13px' }}>
          <div>
            Payment method: <strong>{order.paymentMethod === 'COD' ? 'Cash on Delivery' : statusLabel(order.paymentMethod)}</strong></div>
          <div>
            Status: <strong>{order.payment?.status || order.paymentStatus}</strong>
          </div>
        </div>
      </section>
    </div>
    {/* Bank Transfer Payment Instructions */}
    {order.paymentMethod === 'BANK_TRANSFER' && (order.payment?.status || order.paymentStatus) !== 'PAID' && (
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
                  fontFamily: 'monospace',
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

        </div>
      </div>
    )}
  </div >;
}
