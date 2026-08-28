'use client';

import Link from 'next/link';
import { useStore } from '@/lib/store';
import { ShoppingBag, Trash2, Plus, Minus, ArrowRight, ArrowLeft, ShieldCheck } from 'lucide-react';

export default function CartPage() {
  const cart = useStore((state) => state.cart);
  const user = useStore((state) => state.user);
  const removeFromCart = useStore((state) => state.removeFromCart);
  const updateQuantity = useStore((state) => state.updateQuantity);
  const toggleCartItemSelection = useStore((state) => state.toggleCartItemSelection);
  const toggleAllCartItems = useStore((state) => state.toggleAllCartItems);
  const clearCart = useStore((state) => state.clearCart);
  const setBuyNowItem = useStore((state) => state.setBuyNowItem);
  const selectedItems = cart.filter((item) => item.selected !== false);
  const getCartSubtotal = selectedItems.reduce((acc, item) => {
    const price = item.product.discountPrice ?? item.product.price;
    return acc + price * item.quantity;
  }, 0);

  const allSelected = cart.length > 0 && cart.every((item) => item.selected !== false);
  const shippingFee = getCartSubtotal > 15000 ? 0 : 350;
  const grandTotal = getCartSubtotal + shippingFee;

  const handleCheckoutClick = (e: React.MouseEvent) => {
    if (selectedItems.length === 0) {
      e.preventDefault();
      return;
    }
    setBuyNowItem(null);
  };

  if (cart.length === 0) {
    return (
      <div className="container" style={{ padding: '5rem 1.25rem', textAlign: 'center' }}>
        <div style={{ background: 'var(--bg-white)', maxWidth: 500, margin: '0 auto', padding: '4rem 2rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
          <div style={{ width: 72, height: 72, background: 'rgba(109, 40, 217, 0.1)', color: 'var(--accent-purple)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem auto' }}>
            <ShoppingBag size={32} />
          </div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.5rem' }}>Your Cart is Empty</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
            Looks like you haven't added any high-tech gadgets to your cart yet.
          </p>
          <Link href="/products" className="btn-primary">
            Explore Tech Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '3rem 1.25rem 5rem 1.25rem' }}>
      <h1 style={{ fontSize: '2.25rem', fontWeight: 800, marginBottom: '2rem' }}>Shopping Cart</h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '2.5rem', alignItems: 'start' }}>
        {/* Cart Items List */}
        <div>
          {/* Free shipping threshold banner */}
          <div style={{ background: getCartSubtotal > 15000 ? 'var(--success-bg)' : 'var(--warning-bg)', padding: '1rem 1.25rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', fontSize: '0.9rem', color: getCartSubtotal > 15000 ? 'var(--success)' : 'var(--warning)', fontWeight: 700 }}>
            {getCartSubtotal > 15000
              ? '🎉 Congratulations! You unlocked FREE islandwide shipping.'
              : `Add LKR ${(15000 - getCartSubtotal).toLocaleString()} more to your cart to qualify for FREE Shipping!`}
          </div>

          <div style={{ background: 'var(--bg-white)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
            <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border-color)', fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={(e) => toggleAllCartItems(e.target.checked)}
                  style={{ width: 18, height: 18, accentColor: 'var(--accent-purple)' }}
                />
                <span>Select All Items ({selectedItems.length}/{cart.length} selected)</span>
              </label>
              <button onClick={clearCart} style={{ color: 'var(--error)', fontSize: '0.85rem', fontWeight: 600 }}>
                Clear All
              </button>
            </div>

            {cart.map((item) => {
              const isSelected = item.selected !== false;
              const unitPrice = item.product.discountPrice ?? item.product.price;
              const images = Array.isArray(item.product.images) ? item.product.images : [];
              const mainImg = images[0] || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=800&auto=format&fit=crop';

              return (
                <div key={item.product.id} style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', padding: '1.25rem', borderBottom: '1px solid var(--border-color)', opacity: isSelected ? 1 : 0.65 }}>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleCartItemSelection(item.product.id)}
                    style={{ width: 18, height: 18, accentColor: 'var(--accent-purple)', cursor: 'pointer' }}
                  />

                  <img src={mainImg} alt={item.product.name} style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 'var(--radius-md)', background: '#F9FAFB', border: '1px solid var(--border-color)' }} />

                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-purple)', textTransform: 'uppercase' }}>
                      {item.product.brand?.name || 'Gadget'}
                    </div>
                    <Link href={`/product/${item.product.slug}`} style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-headline)' }}>
                      {item.product.name}
                    </Link>
                    <div style={{ fontSize: '0.9rem', color: 'var(--primary-indigo)', fontWeight: 800, marginTop: '0.25rem' }}>
                      LKR {unitPrice.toLocaleString()}
                    </div>
                  </div>

                  {/* Quantity controls */}
                  <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
                    <button onClick={() => updateQuantity(item.product.id, item.quantity - 1)} style={{ padding: '0.4rem 0.6rem', color: 'var(--text-secondary)' }}>
                      <Minus size={14} />
                    </button>
                    <span style={{ fontWeight: 800, padding: '0 0.75rem', fontSize: '0.9rem' }}>{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.product.id, item.quantity + 1)} style={{ padding: '0.4rem 0.6rem', color: 'var(--text-secondary)' }}>
                      <Plus size={14} />
                    </button>
                  </div>

                  <div style={{ width: 120, textAlign: 'right', fontWeight: 900, fontSize: '1.05rem', color: 'var(--primary-indigo)' }}>
                    LKR {(unitPrice * item.quantity).toLocaleString()}
                  </div>

                  <button onClick={() => removeFromCart(item.product.id)} style={{ color: 'var(--text-muted)', padding: '0.5rem' }}>
                    <Trash2 size={18} />
                  </button>
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: '1.5rem' }}>
            <Link href="/products" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
              <ArrowLeft size={16} /> Continue Shopping
            </Link>
          </div>
        </div>

        {/* Summary Card */}
        <div style={{ background: 'var(--bg-white)', padding: '1.75rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-color)' }}>
            Order Summary
          </h3>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.85rem', color: 'var(--text-secondary)' }}>
            <span>Subtotal ({selectedItems.length} selected)</span>
            <span style={{ fontWeight: 700, color: 'var(--text-headline)' }}>LKR {getCartSubtotal.toLocaleString()}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.25rem', color: 'var(--text-secondary)' }}>
            <span>Islandwide Shipping</span>
            <span style={{ fontWeight: 700, color: shippingFee === 0 ? 'var(--success)' : 'var(--text-headline)' }}>
              {shippingFee === 0 ? 'FREE' : `LKR ${shippingFee}`}
            </span>
          </div>

          <div style={{ borderTop: '2px dashed var(--border-color)', paddingTop: '1rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', fontWeight: 900, color: 'var(--primary-indigo)' }}>
            <span>Total</span>
            <span>LKR {grandTotal.toLocaleString()}</span>
          </div>

          <Link
            href={user ? '/checkout' : '/login?returnTo=/checkout'}
            onClick={handleCheckoutClick}
            className="btn-primary"
            style={{
              width: '100%',
              justifyContent: 'center',
              padding: '0.9rem',
              fontSize: '1.05rem',
              marginBottom: '1.25rem',
              opacity: selectedItems.length === 0 ? 0.5 : 1,
              pointerEvents: selectedItems.length === 0 ? 'none' : 'auto',
            }}
          >
            <span>Proceed to Checkout ({selectedItems.length})</span>
            <ArrowRight size={18} />
          </Link>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)', justifyContent: 'center' }}>
            <ShieldCheck size={16} color="var(--success)" />
            <span>Guaranteed Safe & Secure Checkout</span>
          </div>
        </div>
      </div>
    </div>
  );
}
