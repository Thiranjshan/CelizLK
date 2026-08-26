'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useStore } from '@/lib/store';
import {
  Lock,
  ArrowRight,
  ArrowLeft,
  Truck,
  CreditCard,
  Banknote,
  Building2,
  ShieldCheck,
  Trash2,
  Plus,
  Minus,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  FileText,
  User,
  Phone,
  Globe,
  ChevronRight,
  Edit2
} from 'lucide-react';

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="container" style={{ padding: '5rem 1.25rem', textAlign: 'center', fontSize: '1.1rem', color: 'var(--text-secondary)' }}>Loading checkout details...</div>}>
      <CheckoutContent />
    </Suspense>
  );
}

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isBuyNow = searchParams.get('buyNow') === '1';

  const user = useStore((state) => state.user);
  const authInitialized = useStore((state) => state.authInitialized);
  const accessToken = useStore((state) => state.accessToken);
  const addToast = useStore((state) => state.addToast);

  const buyNowItem = useStore((state) => state.buyNowItem);
  const updateBuyNowQuantity = useStore((state) => state.updateBuyNowQuantity);
  const setBuyNowItem = useStore((state) => state.setBuyNowItem);

  const cart = useStore((state) => state.cart);
  const updateQuantity = useStore((state) => state.updateQuantity);
  const removeFromCart = useStore((state) => state.removeFromCart);
  const clearCart = useStore((state) => state.clearCart);

  // Authentication check: redirect to sign in with returnTo URL if unauthenticated
  useEffect(() => {
    if (authInitialized && !user) {
      const returnUrl = isBuyNow ? '/checkout?buyNow=1' : '/checkout';
      router.push(`/login?returnTo=${encodeURIComponent(returnUrl)}`);
    }
  }, [authInitialized, user, router, isBuyNow]);

  const checkoutItems = isBuyNow ? (buyNowItem ? [buyNowItem] : []) : cart.filter((item) => item.selected !== false);

  const subtotal = checkoutItems.reduce((acc, item) => {
    const price = item.product.discountPrice ?? item.product.price;
    return acc + price * item.quantity;
  }, 0);

  const [step, setStep] = useState<1 | 2>(1);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [idempotencyKey] = useState(() => crypto.randomUUID());
  const [showDiscardModal, setShowDiscardModal] = useState(false);

  const [savedAddresses, setSavedAddresses] = useState<{ id: string; label: string; recipientName: string; phone: string; addressLine1: string; addressLine2?: string | null; city: string; district: string; postalCode?: string | null }[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [resolvedDeliveryFee, setResolvedDeliveryFee] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    fullName: user?.fullName || '',
    phone: user?.phone || '',
    country: 'Sri Lanka',
    addressLine1: '',
    addressLine2: '',
    city: '',
    district: 'Colombo',
    postalCode: '',
    saveAddress: true,
    specialNotes: '',
    paymentMethod: 'COD', // COD | BANK_TRANSFER | PAYHERE
  });

  // Prefill user name/phone when loaded
  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        fullName: prev.fullName || user.fullName || '',
        phone: prev.phone || user.phone || '',
      }));
    }
  }, [user]);

  // Fetch saved user addresses
  useEffect(() => {
    if (!accessToken) return;
    fetch('/api/addresses', { headers: { Authorization: `Bearer ${accessToken}` } })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        setSavedAddresses(data);
        if (data.length > 0) {
          const first = data[0];
          setSelectedAddressId(first.id);
          setFormData((prev) => ({
            ...prev,
            fullName: first.recipientName || prev.fullName,
            phone: first.phone || prev.phone,
            addressLine1: first.addressLine1,
            addressLine2: first.addressLine2 || '',
            city: first.city,
            district: first.district,
            postalCode: first.postalCode || '',
          }));
        } else {
          setShowNewAddressForm(true);
        }
      })
      .catch(() => setShowNewAddressForm(true));
  }, [accessToken]);

  // Fetch dynamic delivery fee per district
  useEffect(() => {
    if (!formData.district) return;
    fetch(`/api/delivery-zones?district=${encodeURIComponent(formData.district)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((zone) => setResolvedDeliveryFee(zone?.fee ?? null))
      .catch(() => setResolvedDeliveryFee(null));
  }, [formData.district]);

  const shippingFee = subtotal > 15000 ? 0 : (resolvedDeliveryFee ?? 350);
  const totalPayable = subtotal + shippingFee;

  const selectSavedAddress = (addr: typeof savedAddresses[0]) => {
    setSelectedAddressId(addr.id);
    setShowNewAddressForm(false);
    setFormData((prev) => ({
      ...prev,
      fullName: addr.recipientName || prev.fullName,
      phone: addr.phone || prev.phone,
      addressLine1: addr.addressLine1,
      addressLine2: addr.addressLine2 || '',
      city: addr.city,
      district: addr.district,
      postalCode: addr.postalCode || '',
    }));
  };

  const handleItemQuantityChange = (productId: string, newQty: number) => {
    if (newQty <= 0) {
      handleItemRemove(productId);
      return;
    }
    if (isBuyNow) {
      updateBuyNowQuantity(newQty);
    } else {
      updateQuantity(productId, newQty);
    }
  };

  const handleItemRemove = (productId: string) => {
    if (checkoutItems.length <= 1) {
      setShowDiscardModal(true);
      return;
    }
    if (isBuyNow) {
      setBuyNowItem(null);
    } else {
      removeFromCart(productId);
    }
  };

  const handleConfirmDiscard = () => {
    if (isBuyNow) {
      setBuyNowItem(null);
      router.push('/products');
    } else {
      router.push('/cart');
    }
  };

  const validateStep1 = () => {
    if (!formData.fullName.trim()) {
      addToast('error', 'Please enter your full name.');
      return false;
    }
    if (!formData.phone.trim()) {
      addToast('error', 'Please enter your contact phone number.');
      return false;
    }
    if (!formData.addressLine1.trim()) {
      addToast('error', 'Please enter your street address.');
      return false;
    }
    if (!formData.city.trim()) {
      addToast('error', 'Please enter your city.');
      return false;
    }
    if (!formData.district.trim()) {
      addToast('error', 'Please select your district.');
      return false;
    }
    return true;
  };

  const handleProceedToStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateStep1()) {
      setStep(2);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep1()) {
      setStep(1);
      return;
    }
    if (!agreeTerms) {
      addToast('error', 'Please agree to the Terms & Conditions to place your order.');
      return;
    }
    setLoading(true);

    try {
      if (!accessToken) throw new Error('Session expired. Please sign in again.');

      const orderPayload = {
        customerName: formData.fullName,
        customerPhone: formData.phone,
        shippingAddress: {
          addressLine1: formData.addressLine1,
          addressLine2: formData.addressLine2,
          city: formData.city,
          district: formData.district,
          postalCode: formData.postalCode,
          country: formData.country,
          specialNotes: formData.specialNotes,
        },
        paymentMethod: formData.paymentMethod,
        items: checkoutItems.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
          unitPrice: item.product.discountPrice ?? item.product.price,
        })),
      };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
          'Idempotency-Key': idempotencyKey,
        },
        body: JSON.stringify(orderPayload),
      });

      const orderResult = await res.json();
      if (!res.ok) throw new Error(orderResult.error || 'Failed to place order');

      const createdOrder = orderResult;

      // Save address if user checked the save box and it's a new address
      if (formData.saveAddress && showNewAddressForm) {
        await fetch('/api/addresses', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            label: `${formData.city} Address`,
            recipientName: formData.fullName,
            phone: formData.phone,
            addressLine1: formData.addressLine1,
            addressLine2: formData.addressLine2,
            city: formData.city,
            district: formData.district,
            postalCode: formData.postalCode,
            isDefault: true,
          }),
        }).catch(() => undefined);
      }

      if (isBuyNow) {
        setBuyNowItem(null);
      } else {
        // Only remove items that were part of this order (selected items), not the whole cart
        checkoutItems.forEach((item) => removeFromCart(item.product.id));
      }

      addToast('success', `Order #${createdOrder.orderNumber} placed successfully!`);
      router.push(`/checkout/success?orderNumber=${createdOrder.orderNumber}`);
    } catch (err) {
      console.error('Error placing order:', err);
      addToast('error', err instanceof Error ? err.message : 'Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (checkoutItems.length === 0) {
    return (
      <div style={{ minHeight: '80vh', background: 'var(--bg-main)', padding: '4rem 1.25rem' }}>
        <div className="container" style={{ maxWidth: 540, margin: '0 auto', textAlign: 'center', background: 'var(--bg-white)', padding: '3.5rem 2rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
          <div style={{ width: 64, height: 64, background: 'rgba(109, 40, 217, 0.08)', color: 'var(--accent-purple)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem auto' }}>
            <Lock size={28} />
          </div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '0.75rem' }}>No Items Selected for Checkout</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', fontSize: '0.95rem' }}>
            {isBuyNow ? 'No product selected for Buy Now.' : 'You have no selected items in your shopping cart to checkout.'}
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button onClick={() => router.push('/cart')} className="btn-primary" style={{ padding: '0.8rem 1.5rem' }}>
              View Cart
            </button>
            <button onClick={() => router.push('/products')} className="btn-primary" style={{ background: 'var(--border-color)', color: 'var(--text-main)', padding: '0.8rem 1.5rem' }}>
              Browse Shop
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', paddingBottom: '5rem' }}>
      {/* Focused Top Header Bar (No main header/footer) */}
      <header style={{ background: 'var(--bg-white)', borderBottom: '1px solid var(--border-color)', position: 'sticky', top: 0, zIndex: 100, boxShadow: 'var(--shadow-sm)' }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.25rem' }}>
          <Link href="/products" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '1.3rem', fontWeight: 900, fontFamily: 'var(--font-heading)', color: 'var(--text-headline)', textDecoration: 'none' }}>
            <div style={{ width: 34, height: 34, background: 'var(--brand-gradient)', color: 'white', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900 }}>C</div>
            <span>Celiz <span style={{ color: 'var(--accent-purple)' }}>LK</span></span>
          </Link>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--success)', fontSize: '0.85rem', fontWeight: 700, background: 'var(--success-bg)', padding: '0.4rem 0.85rem', borderRadius: 'var(--radius-md)' }}>
            <ShieldCheck size={16} />
            <span>256-Bit SSL Encrypted Checkout</span>
          </div>

          <button
            onClick={() => setShowDiscardModal(true)}
            style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem', border: '1px solid var(--border-color)', padding: '0.4rem 0.85rem', borderRadius: 'var(--radius-md)', background: 'var(--bg-white)' }}
          >
            <span>Discard Checkout</span>
          </button>
        </div>
      </header>

      <div className="container" style={{ maxWidth: 1100, padding: '2.5rem 1.25rem' }}>
        {/* Stepper Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', marginBottom: '2.5rem', background: 'var(--bg-white)', padding: '1.25rem 2rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
          <div
            onClick={() => setStep(1)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', opacity: step === 1 ? 1 : 0.8 }}
          >
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: step === 1 ? 'var(--accent-purple)' : 'var(--success)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.9rem' }}>
              {step > 1 ? <CheckCircle2 size={18} /> : '1'}
            </div>
            <span style={{ fontWeight: 800, fontSize: '0.95rem', color: step === 1 ? 'var(--primary-indigo)' : 'var(--text-headline)' }}>
              Order & Delivery Details
            </span>
          </div>

          <ChevronRight size={18} color="var(--text-muted)" />

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', opacity: step === 2 ? 1 : 0.5 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: step === 2 ? 'var(--accent-purple)' : 'var(--border-color)', color: step === 2 ? 'white' : 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.9rem' }}>
              2
            </div>
            <span style={{ fontWeight: 800, fontSize: '0.95rem', color: step === 2 ? 'var(--primary-indigo)' : 'var(--text-secondary)' }}>
              Payment Method
            </span>
          </div>
        </div>

        {/* Main Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '2.5rem', alignItems: 'start' }}>
          {/* Left Column: Form Steps */}
          <div>
            {step === 1 ? (
              <form onSubmit={handleProceedToStep2} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                {/* Customer Contact Details */}
                <div style={{ background: 'var(--bg-white)', padding: '2rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary-indigo)' }}>
                    <User size={20} color="var(--accent-purple)" />
                    <span>Contact Information</span>
                  </h3>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                    <div className="form-group">
                      <label className="form-label" style={{ fontWeight: 700 }}>Full Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Ruwan Perera"
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        className="form-input"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label" style={{ fontWeight: 700 }}>Mobile / WhatsApp Number *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. +94 77 123 4567"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="form-input"
                      />
                    </div>
                  </div>
                </div>

                {/* Delivery Address Section */}
                <div style={{ background: 'var(--bg-white)', padding: '2rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary-indigo)' }}>
                      <Truck size={20} color="var(--accent-purple)" />
                      <span>Delivery Address</span>
                    </h3>

                    {savedAddresses.length > 0 && !showNewAddressForm && (
                      <button
                        type="button"
                        onClick={() => {
                          setShowNewAddressForm(true);
                          setSelectedAddressId(null);
                        }}
                        style={{ color: 'var(--accent-purple)', fontSize: '0.88rem', fontWeight: 700, background: 'rgba(109, 40, 217, 0.08)', padding: '0.4rem 0.85rem', borderRadius: 'var(--radius-md)' }}
                      >
                        + Add New Billing Address
                      </button>
                    )}
                  </div>

                  {/* Saved addresses selector */}
                  {savedAddresses.length > 0 && !showNewAddressForm && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1rem' }}>
                      <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Select from your saved addresses:</label>
                      {savedAddresses.map((addr) => {
                        const isSelected = selectedAddressId === addr.id;
                        return (
                          <div
                            key={addr.id}
                            onClick={() => selectSavedAddress(addr)}
                            style={{
                              padding: '1.25rem',
                              borderRadius: 'var(--radius-md)',
                              border: isSelected ? '2px solid var(--accent-purple)' : '1px solid var(--border-color)',
                              background: isSelected ? 'rgba(109, 40, 217, 0.04)' : 'var(--bg-white)',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'flex-start',
                              gap: '1rem',
                            }}
                          >
                            <input
                              type="radio"
                              name="savedAddress"
                              checked={isSelected}
                              onChange={() => selectSavedAddress(addr)}
                              style={{ marginTop: '0.2rem', accentColor: 'var(--accent-purple)' }}
                            />
                            <div style={{ flex: 1, fontSize: '0.9rem', lineHeight: 1.5 }}>
                              <div style={{ fontWeight: 800, color: 'var(--text-headline)' }}>
                                {addr.label} — <span style={{ fontWeight: 600 }}>{addr.recipientName} ({addr.phone})</span>
                              </div>
                              <div style={{ color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                                {addr.addressLine1}{addr.addressLine2 ? `, ${addr.addressLine2}` : ''}, {addr.city}, {addr.district} {addr.postalCode}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* New address form or single address form */}
                  {(showNewAddressForm || savedAddresses.length === 0) && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {savedAddresses.length > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                          <span style={{ fontWeight: 800, fontSize: '0.95rem' }}>New Address Details:</span>
                          <button
                            type="button"
                            onClick={() => {
                              setShowNewAddressForm(false);
                              if (savedAddresses[0]) selectSavedAddress(savedAddresses[0]);
                            }}
                            style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600 }}
                          >
                            Use Saved Address Instead
                          </button>
                        </div>
                      )}

                      <div className="form-group">
                        <label className="form-label" style={{ fontWeight: 700 }}>Country *</label>
                        <select
                          required
                          value={formData.country}
                          onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                          className="form-select"
                        >
                          <option value="Sri Lanka">Sri Lanka</option>
                        </select>
                      </div>

                      <div className="form-group">
                        <label className="form-label" style={{ fontWeight: 700 }}>Street Address *</label>
                        <input
                          type="text"
                          required
                          placeholder="House No, Building Name & Street"
                          value={formData.addressLine1}
                          onChange={(e) => setFormData({ ...formData, addressLine1: e.target.value })}
                          className="form-input"
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label" style={{ fontWeight: 700 }}>Landmark / Apartment / Suite (Optional)</label>
                        <input
                          type="text"
                          placeholder="e.g. Near Keells Super, Apt 4B"
                          value={formData.addressLine2}
                          onChange={(e) => setFormData({ ...formData, addressLine2: e.target.value })}
                          className="form-input"
                        />
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                        <div className="form-group">
                          <label className="form-label" style={{ fontWeight: 700 }}>City *</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Dehiwala"
                            value={formData.city}
                            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                            className="form-input"
                          />
                        </div>

                        <div className="form-group">
                          <label className="form-label" style={{ fontWeight: 700 }}>District *</label>
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
                          <label className="form-label" style={{ fontWeight: 700 }}>Postal Code</label>
                          <input
                            type="text"
                            placeholder="e.g. 10350"
                            value={formData.postalCode}
                            onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                            className="form-input"
                          />
                        </div>
                      </div>

                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', marginTop: '0.5rem', fontSize: '0.9rem', color: 'var(--text-main)' }}>
                        <input
                          type="checkbox"
                          checked={formData.saveAddress}
                          onChange={(e) => setFormData({ ...formData, saveAddress: e.target.checked })}
                          style={{ width: 18, height: 18, accentColor: 'var(--accent-purple)' }}
                        />
                        <span>Save this address to my account for future orders</span>
                      </label>
                    </div>
                  )}
                </div>

                {/* Special Delivery Notes */}
                <div style={{ background: 'var(--bg-white)', padding: '2rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary-indigo)' }}>
                    <FileText size={20} color="var(--accent-purple)" />
                    <span>Special Notes (Optional)</span>
                  </h3>

                  <div className="form-group">
                    <textarea
                      placeholder="Add any specific instructions for courier delivery or special requests..."
                      rows={3}
                      value={formData.specialNotes}
                      onChange={(e) => setFormData({ ...formData, specialNotes: e.target.value })}
                      className="form-input"
                      style={{ resize: 'vertical', fontFamily: 'inherit' }}
                    />
                  </div>
                </div>

                {/* Proceed to Step 2 Button */}
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ width: '100%', justifyContent: 'center', padding: '1rem', fontSize: '1.05rem' }}
                >
                  <span>Proceed to Payment Method</span>
                  <ArrowRight size={18} />
                </button>
              </form>
            ) : (
              /* Step 2: Payment Method Selection */
              <form onSubmit={handleSubmitOrder} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                {/* Summary of Step 1 */}
                <div style={{ background: 'var(--bg-white)', padding: '1.75rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-color)' }}>
                    <h4 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--primary-indigo)' }}>1. Delivery Destination & Customer</h4>
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      style={{ color: 'var(--accent-purple)', fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                    >
                      <Edit2 size={14} /> Edit Details
                    </button>
                  </div>

                  <div style={{ fontSize: '0.9rem', lineHeight: 1.6, color: 'var(--text-main)' }}>
                    <div><strong>Recipient:</strong> {formData.fullName} ({formData.phone})</div>
                    <div><strong>Address:</strong> {formData.addressLine1}{formData.addressLine2 ? `, ${formData.addressLine2}` : ''}, {formData.city}, {formData.district} {formData.postalCode}, {formData.country}</div>
                    {formData.specialNotes && <div style={{ color: 'var(--text-secondary)', marginTop: '0.3rem' }}><strong>Notes:</strong> {formData.specialNotes}</div>}
                  </div>
                </div>

                {/* Payment Method Selector */}
                <div style={{ background: 'var(--bg-white)', padding: '2rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary-indigo)' }}>
                    <Lock size={20} color="var(--accent-purple)" />
                    <span>Select Payment Method</span>
                  </h3>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {/* COD */}
                    <label style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: formData.paymentMethod === 'COD' ? '2px solid var(--accent-purple)' : '1px solid var(--border-color)', background: formData.paymentMethod === 'COD' ? 'rgba(109, 40, 217, 0.04)' : 'var(--bg-white)', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="COD"
                        checked={formData.paymentMethod === 'COD'}
                        onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                        style={{ accentColor: 'var(--accent-purple)' }}
                      />
                      <Banknote size={24} color="var(--success)" />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 800, fontSize: '1rem' }}>Cash on Delivery (COD)</div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Pay cash to courier driver upon parcel delivery across Sri Lanka</div>
                      </div>
                    </label>

                    {/* Bank Transfer */}
                    <label style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: formData.paymentMethod === 'BANK_TRANSFER' ? '2px solid var(--accent-purple)' : '1px solid var(--border-color)', background: formData.paymentMethod === 'BANK_TRANSFER' ? 'rgba(109, 40, 217, 0.04)' : 'var(--bg-white)', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="BANK_TRANSFER"
                        checked={formData.paymentMethod === 'BANK_TRANSFER'}
                        onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                        style={{ accentColor: 'var(--accent-purple)' }}
                      />
                      <Building2 size={24} color="var(--primary-indigo)" />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 800, fontSize: '1rem' }}>Bank Deposit / Online Transfer</div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Direct deposit to Commercial Bank / HNB Account</div>
                      </div>
                    </label>

                    {/* PayHere */}
                    <label style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: formData.paymentMethod === 'PAYHERE' ? '2px solid var(--accent-purple)' : '1px solid var(--border-color)', background: formData.paymentMethod === 'PAYHERE' ? 'rgba(109, 40, 217, 0.04)' : 'var(--bg-white)', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="PAYHERE"
                        checked={formData.paymentMethod === 'PAYHERE'}
                        onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                        style={{ accentColor: 'var(--accent-purple)' }}
                      />
                      <CreditCard size={24} color="var(--accent-purple)" />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 800, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span>Credit / Debit Card (PayHere)</span>
                          <span className="badge badge-pending" style={{ fontSize: '0.7rem' }}>Sandbox Ready</span>
                        </div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Visa, Mastercard & eZ Cash via PayHere payment gateway</div>
                      </div>
                    </label>
                  </div>
                </div>



                <label style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', cursor: 'pointer', fontSize: '0.9rem', color: 'var(--text-main)', background: 'var(--bg-white)', padding: '1rem 1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                  <input
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    style={{ width: 18, height: 18, accentColor: 'var(--accent-purple)', cursor: 'pointer' }}
                  />
                  <span>
                    I have read and agree to Celiz LK's{' '}
                    <Link href="/terms-and-conditions" target="_blank" style={{ color: 'var(--accent-purple)', fontWeight: 700, textDecoration: 'underline' }}>
                      Terms & Conditions
                    </Link>
                  </span>
                </label>

                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="btn-primary"
                    style={{ background: 'var(--border-color)', color: 'var(--text-main)', padding: '1rem 1.5rem' }}
                  >
                    <ArrowLeft size={16} /> Back
                  </button>

                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary"
                    style={{ flex: 1, justifyContent: 'center', padding: '1rem', fontSize: '1.1rem', opacity: loading ? 0.7 : 1 }}
                  >
                    <span>{loading ? 'Placing Order...' : `Place Order Now (LKR ${totalPayable.toLocaleString()})`}</span>
                    <ArrowRight size={18} />
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Right Column: Review Items Sidebar */}
          <div style={{ background: 'var(--bg-white)', padding: '1.75rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)', position: 'sticky', top: 90 }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Review Items ({checkoutItems.length})</span>
              {isBuyNow && <span className="badge badge-pending" style={{ fontSize: '0.7rem' }}>Buy Now</span>}
            </h3>

            {/* Items List with Quantity Controls & Removal */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '1.5rem', maxHeight: 320, overflowY: 'auto', paddingRight: '0.5rem' }}>
              {checkoutItems.map((item) => {
                const unitPrice = item.product.discountPrice ?? item.product.price;
                const images = Array.isArray(item.product.images) ? item.product.images : [];
                const mainImg = images[0] || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=800&auto=format&fit=crop';

                return (
                  <div key={item.product.id} style={{ display: 'flex', gap: '1rem', alignItems: 'center', paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)' }}>
                    <img src={mainImg} alt="" style={{ width: 54, height: 54, objectFit: 'cover', borderRadius: 'var(--radius-md)', background: '#F9FAFB', border: '1px solid var(--border-color)' }} />

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.product.name}
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--primary-indigo)', fontWeight: 800, marginTop: '0.15rem' }}>
                        LKR {unitPrice.toLocaleString()}
                      </div>

                      {/* Inline Quantity Controls */}
                      <div style={{ display: 'inline-flex', alignItems: 'center', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', marginTop: '0.4rem', background: 'var(--bg-white)' }}>
                        <button
                          type="button"
                          onClick={() => handleItemQuantityChange(item.product.id, item.quantity - 1)}
                          style={{ padding: '0.2rem 0.4rem', color: 'var(--text-secondary)' }}
                        >
                          <Minus size={12} />
                        </button>
                        <span style={{ fontWeight: 800, padding: '0 0.5rem', fontSize: '0.85rem' }}>{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => handleItemQuantityChange(item.product.id, item.quantity + 1)}
                          style={{ padding: '0.2rem 0.4rem', color: 'var(--text-secondary)' }}
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 900, fontSize: '0.95rem', color: 'var(--primary-indigo)' }}>
                        LKR {(unitPrice * item.quantity).toLocaleString()}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleItemRemove(item.product.id)}
                        style={{ color: 'var(--text-muted)', padding: '0.3rem', marginTop: '0.25rem' }}
                        title="Remove item"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Financial Summary */}
            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.95rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                <span>Subtotal</span>
                <span>LKR {subtotal.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                <span>Islandwide Delivery</span>
                <span style={{ color: shippingFee === 0 ? 'var(--success)' : 'inherit', fontWeight: 700 }}>
                  {shippingFee === 0 ? 'FREE' : `LKR ${shippingFee}`}
                </span>
              </div>

              <div style={{ borderTop: '2px dashed var(--border-color)', paddingTop: '0.75rem', marginTop: '0.5rem', display: 'flex', justifyContent: 'space-between', fontSize: '1.25rem', fontWeight: 900, color: 'var(--primary-indigo)' }}>
                <span>Total Payable</span>
                <span>LKR {totalPayable.toLocaleString()}</span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)', justifyContent: 'center' }}>
              <ShieldCheck size={16} color="var(--success)" />
              <span>Official Authentic Local Warranty</span>
            </div>
          </div>
        </div>
      </div>

      {/* Discard Confirmation Modal */}
      {showDiscardModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.25rem' }}>
          <div style={{ background: 'var(--bg-white)', maxWidth: 440, width: '100%', padding: '2rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-md)', textAlign: 'center' }}>
            <div style={{ width: 56, height: 56, background: '#FEE2E2', color: '#EF4444', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem auto' }}>
              <AlertTriangle size={28} />
            </div>

            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--text-headline)' }}>
              Discard Checkout?
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: 1.5, marginBottom: '1.75rem' }}>
              Are you sure you want to cancel your checkout? Removing items will discard your current order setup.
            </p>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => setShowDiscardModal(false)}
                className="btn-primary"
                style={{ flex: 1, background: 'var(--border-color)', color: 'var(--text-main)', justifyContent: 'center' }}
              >
                Keep Checkout
              </button>
              <button
                type="button"
                onClick={handleConfirmDiscard}
                className="btn-primary"
                style={{ flex: 1, background: '#EF4444', justifyContent: 'center' }}
              >
                Discard Checkout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
