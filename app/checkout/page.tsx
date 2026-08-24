'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { Truck, CreditCard, Banknote, Building2, Lock, ArrowRight } from 'lucide-react';

export default function CheckoutPage() {
  const router = useRouter();
  const cart = useStore((state) => state.cart);
  const clearCart = useStore((state) => state.clearCart);
  const user = useStore((state) => state.user);
  const addToast = useStore((state) => state.addToast);
  const accessToken = useStore((state) => state.accessToken);
  const setUser = useStore((state) => state.setUser);
  const setAccessToken = useStore((state) => state.setAccessToken);
  const getCartSubtotal = useStore((state) => state.getCartSubtotal());

  const [loading, setLoading] = useState(false);
  const [idempotencyKey] = useState(() => crypto.randomUUID());
  const [savedAddresses, setSavedAddresses] = useState<{ id: string; label: string; recipientName: string; phone: string; addressLine1: string; addressLine2?: string | null; city: string; district: string; postalCode?: string | null }[]>([]);
  const [resolvedDeliveryFee, setResolvedDeliveryFee] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    district: 'Colombo',
    postalCode: '',
    password: '',
    paymentMethod: 'COD', // COD | BANK_TRANSFER | PAYHERE
  });

  useEffect(() => {
    if (!accessToken) return;
    fetch('/api/addresses', { headers: { Authorization: `Bearer ${accessToken}` } }).then((response) => response.ok ? response.json() : []).then(setSavedAddresses).catch(() => setSavedAddresses([]));
  }, [accessToken]);

  useEffect(() => {
    if (!formData.district) return;
    fetch(`/api/delivery-zones?district=${encodeURIComponent(formData.district)}`).then((response) => response.ok ? response.json() : null).then((zone) => setResolvedDeliveryFee(zone?.fee ?? null)).catch(() => setResolvedDeliveryFee(null));
  }, [formData.district]);

  const shippingFee = getCartSubtotal > 15000 ? 0 : resolvedDeliveryFee ?? 350;
  const grandTotal = getCartSubtotal + shippingFee;

  if (cart.length === 0) {
    return (
      <div className="container" style={{ padding: '5rem 1.25rem', textAlign: 'center' }}>
        <h2>Your cart is empty</h2>
        <button onClick={() => router.push('/products')} className="btn-primary" style={{ marginTop: '1rem' }}>
          Return to Shop
        </button>
      </div>
    );
  }

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let currentToken = accessToken;
      if (!user || !currentToken) {
        if (formData.password.length < 8) throw new Error('Enter a password of at least 8 characters to continue.');
        const customerResponse = await fetch('/api/checkout/customer', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fullName: formData.fullName, email: formData.email, phone: formData.phone, password: formData.password }) });
        const customerResult = await customerResponse.json();
        if (!customerResponse.ok) throw new Error(customerResult.error || 'Unable to authenticate your account.');
        setUser(customerResult.user); setAccessToken(customerResult.accessToken); currentToken = customerResult.accessToken;
      }
      const orderPayload = {
        customerName: formData.fullName || user?.fullName || '',
        customerEmail: formData.email || user?.email || '',
        customerPhone: formData.phone || user?.phone || '',
        shippingAddress: {
          addressLine1: formData.addressLine1,
          addressLine2: formData.addressLine2,
          city: formData.city,
          district: formData.district,
          postalCode: formData.postalCode,
        },
        paymentMethod: formData.paymentMethod,
        items: cart.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
          unitPrice: item.product.discountPrice ?? item.product.price,
        })),
      };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${currentToken}`, 'Idempotency-Key': idempotencyKey },
        body: JSON.stringify(orderPayload),
      });

      const orderResult = await res.json();
      if (!res.ok) throw new Error(orderResult.error || 'Order creation failed');

      const createdOrder = orderResult;
      if (!savedAddresses.some((address) => address.addressLine1 === formData.addressLine1 && address.city === formData.city && address.district === formData.district)) await fetch('/api/addresses', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${currentToken}` }, body: JSON.stringify({ label: 'Checkout address', recipientName: formData.fullName || user?.fullName || '', phone: formData.phone || user?.phone || '', addressLine1: formData.addressLine1, addressLine2: formData.addressLine2, city: formData.city, district: formData.district, postalCode: formData.postalCode, isDefault: true }) });
      clearCart();
      addToast('success', `Order #${createdOrder.orderNumber} placed successfully!`);
      router.push(`/checkout/success?orderNumber=${createdOrder.orderNumber}`);
    } catch (err) {
      console.error('Error placing order:', err);
      addToast('error', err instanceof Error ? err.message : 'Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ padding: '3rem 1.25rem 5rem 1.25rem' }}>
      <h1 style={{ fontSize: '2.25rem', fontWeight: 800, marginBottom: '2rem' }}>Checkout</h1>

      <form onSubmit={handleSubmitOrder} style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '3rem', alignItems: 'start' }}>
        {/* Left Column: Form Fields */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Section 1: Customer Details */}
          <div style={{ background: 'var(--bg-white)', padding: '2rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>1. Customer & Contact Details</span>
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input
                  type="text"
                  required
                  value={formData.fullName || user?.fullName || ''}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Phone Number (WhatsApp) *</label>
                <input
                  type="text"
                  required
                  value={formData.phone || user?.phone || ''}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="form-input"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Email Address (Order Confirmation) *</label>
              <input
                type="email"
                required
                value={formData.email || user?.email || ''}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="form-input"
              />
            </div>

            {!user && <div className="form-group">
              <label className="form-label">Create or access your account password *</label>
              <input
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="form-input"
              />
              <small style={{ color: 'var(--text-secondary)' }}>At least 8 characters. Existing customers should enter their account password.</small>
            </div>}
          </div>

          {/* Section 2: Delivery Address */}
          <div style={{ background: 'var(--bg-white)', padding: '2rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Truck size={20} color="var(--accent-purple)" />
              <span>2. Delivery Address in Sri Lanka</span>
            </h3>

            {savedAddresses.length > 0 && <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.5rem', marginBottom: '1rem' }}>{savedAddresses.map((address) => <button type="button" key={address.id} className="admin-outline-button" onClick={() => setFormData({ ...formData, fullName: address.recipientName, phone: address.phone, addressLine1: address.addressLine1, addressLine2: address.addressLine2 || '', city: address.city, district: address.district, postalCode: address.postalCode || '' })}>{address.label}</button>)}</div>}

            <div className="form-group">
              <label className="form-label">Street Address *</label>
              <input
                type="text"
                required
                placeholder="House No / Street Name"
                value={formData.addressLine1}
                onChange={(e) => setFormData({ ...formData, addressLine1: e.target.value })}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Landmark / Apartment (Optional)</label>
              <input
                type="text"
                value={formData.addressLine2}
                onChange={(e) => setFormData({ ...formData, addressLine2: e.target.value })}
                className="form-input"
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">City *</label>
                <input
                  type="text"
                  required
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">District *</label>
                <select
                  required
                  value={formData.district}
                  onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                  className="form-select"
                >
                  {['Colombo', 'Gampaha', 'Kalutara', 'Kandy', 'Galle', 'Matara', 'Kurunegala', 'Jaffna', 'Ratnapura'].map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Postal Code</label>
                <input
                  type="text"
                  value={formData.postalCode}
                  onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                  className="form-input"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Payment Method Selection */}
          <div style={{ background: 'var(--bg-white)', padding: '2rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Lock size={20} color="var(--accent-purple)" />
              <span>3. Payment Method</span>
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Option A: Cash on Delivery */}
              <label style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: formData.paymentMethod === 'COD' ? '2px solid var(--accent-purple)' : '1px solid var(--border-color)', background: formData.paymentMethod === 'COD' ? 'rgba(109, 40, 217, 0.04)' : 'var(--bg-white)', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="paymentMethod"
                  value="COD"
                  checked={formData.paymentMethod === 'COD'}
                  onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                />
                <Banknote size={24} color="var(--success)" />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '1rem' }}>Cash on Delivery (COD)</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Pay cash to courier driver when your parcel arrives</div>
                </div>
              </label>

              {/* Option B: Bank Transfer */}
              <label style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: formData.paymentMethod === 'BANK_TRANSFER' ? '2px solid var(--accent-purple)' : '1px solid var(--border-color)', background: formData.paymentMethod === 'BANK_TRANSFER' ? 'rgba(109, 40, 217, 0.04)' : 'var(--bg-white)', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="paymentMethod"
                  value="BANK_TRANSFER"
                  checked={formData.paymentMethod === 'BANK_TRANSFER'}
                  onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                />
                <Building2 size={24} color="var(--primary-indigo)" />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '1rem' }}>Bank Transfer (Manual Confirmation)</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Direct deposit to Commercial Bank / HNB Account</div>
                </div>
              </label>

              {/* Option C: PayHere Gateway (Phase A Placeholder) */}
              <label style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: formData.paymentMethod === 'PAYHERE' ? '2px solid var(--accent-purple)' : '1px solid var(--border-color)', background: formData.paymentMethod === 'PAYHERE' ? 'rgba(109, 40, 217, 0.04)' : 'var(--bg-white)', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="paymentMethod"
                  value="PAYHERE"
                  checked={formData.paymentMethod === 'PAYHERE'}
                  onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                />
                <CreditCard size={24} color="var(--accent-purple)" />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span>Credit / Debit Card (PayHere Gateway)</span>
                    <span className="badge badge-pending" style={{ fontSize: '0.7rem' }}>Sandbox Ready</span>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Visa, Mastercard & eZ Cash via PayHere gateway</div>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Right Column: Order Review Sidebar */}
        <div style={{ background: 'var(--bg-white)', padding: '1.75rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', position: 'sticky', top: 90 }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-color)' }}>
            Review Your Items
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem', maxHeight: 280, overflowY: 'auto', paddingRight: '0.5rem' }}>
            {cart.map((item) => {
              const unitPrice = item.product.discountPrice ?? item.product.price;
              return (
                <div key={item.product.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                  <div>
                    <div style={{ fontWeight: 700 }}>{item.product.name}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Qty: {item.quantity} × LKR {unitPrice.toLocaleString()}</div>
                  </div>
                  <div style={{ fontWeight: 800, color: 'var(--primary-indigo)' }}>
                    LKR {(unitPrice * item.quantity).toLocaleString()}
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.95rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
              <span>Items Subtotal</span>
              <span>LKR {getCartSubtotal.toLocaleString()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
              <span>Shipping Fee</span>
              <span style={{ color: shippingFee === 0 ? 'var(--success)' : 'inherit', fontWeight: 700 }}>
                {shippingFee === 0 ? 'FREE' : `LKR ${shippingFee}`}
              </span>
            </div>

            <div style={{ borderTop: '2px dashed var(--border-color)', paddingTop: '0.75rem', marginTop: '0.5rem', display: 'flex', justifyContent: 'space-between', fontSize: '1.25rem', fontWeight: 900, color: 'var(--primary-indigo)' }}>
              <span>Total Payable</span>
              <span>LKR {grandTotal.toLocaleString()}</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
            style={{ width: '100%', justifyContent: 'center', padding: '1rem', fontSize: '1.05rem', opacity: loading ? 0.7 : 1 }}
          >
            <span>{loading ? 'Processing Order...' : 'Place Order Now'}</span>
            <ArrowRight size={18} />
          </button>
        </div>
      </form>
    </div>
  );
}
