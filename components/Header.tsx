'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useSyncExternalStore } from 'react';
import { ShoppingBag, Search, User, Heart, Menu, X, MessageCircle } from 'lucide-react';
import { useStore } from '@/lib/store';

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const hasHydrated = useSyncExternalStore(() => () => undefined, () => true, () => false);
  const cart = useStore((state) => state.cart);
  const cartCount = hasHydrated ? cart.filter((item) => item.selected !== false).reduce((sum, item) => sum + item.quantity, 0) : 0;
  const wishlist = useStore((state) => state.wishlist);
  const wishlistCount = hasHydrated ? wishlist.length : 0;
  const user = useStore((state) => hasHydrated ? state.user : null);

  if (pathname.startsWith('/admin') || pathname.startsWith('/checkout')) return null;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setMobileMenuOpen(false);
    }
  };

  const navCategories = [
    { name: 'Shop All', href: '/products' },
    { name: 'Audio', href: '/category/earbuds' },
    { name: 'Chargers & Cables', href: '/category/chargers' },
    { name: 'Power Banks', href: '/category/power-banks' },
    { name: 'Smartwatches', href: '/category/smartwatches' },
    { name: 'Accessories', href: '/category/accessories' },
    { name: 'Deals', href: '/products?filter=deals' },
  ];

  const infoLinks = [
    { name: 'About', href: '/about' },
    { name: 'FAQ', href: '/faq' },
    { name: 'Support', href: '/contact' },
  ];

  return (
    <>
      {/* Layer 1 — Announcement bar */}
      <div className="header-topbar-wrapper">
        <div className="container header-topbar-content">
          <div className="header-topbar-left">
            <span>Islandwide Express Delivery</span>
            <span className="separator">|</span>
            <span>100% Genuine Products</span>
            <span className="separator">|</span>
            <span>Official Warranty</span>
          </div>
          <div className="header-topbar-right">
            <a
              href="https://wa.me/94770000000"
              target="_blank"
              rel="noopener noreferrer"
              className="topbar-whatsapp-link"
            >
              <span>Need help? Chat on WhatsApp</span>
              <MessageCircle size={13} className="whatsapp-icon" />
            </a>
          </div>
        </div>
      </div>

      <header className="site-header">
        <div className="container">
          <div className="header-content">
            {/* Logo */}
            <Link href="/" className="brand-logo">
              <Image
                src="/logo.png"
                alt="Celiz LK"
                width={160}
                height={48}
                priority
                unoptimized
                className="brand-logo-image"
              />
            </Link>

            {/* Global Search Bar */}
            <form onSubmit={handleSearchSubmit} className="search-bar">
              <Search className="search-icon" />
              <input
                type="text"
                placeholder="Search earbuds, chargers, smartwatches..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
            </form>

            {/* Action Buttons */}
            <div className="nav-actions">
              {/* Wishlist */}
              <Link href="/wishlist" className="nav-link-btn" aria-label="Wishlist">
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <Heart size={20} />
                  {wishlistCount > 0 && <span className="cart-badge">{wishlistCount}</span>}
                </div>
              </Link>

              {/* Account */}
              {user ? (
                <Link href={user.role === 'ADMIN' ? '/admin' : '/account'} className="nav-link-btn" aria-label="Account">
                  <User size={20} />
                </Link>
              ) : (
                <Link href="/login" className="nav-link-btn" aria-label="Login">
                  <User size={20} />
                </Link>
              )}

              {/* Cart */}
              <Link href="/cart" className="cart-icon-btn" aria-label="Cart">
                <ShoppingBag size={20} />
                {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
              </Link>

              {/* Mobile menu toggle */}
              <button
                className="mobile-menu-toggle"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle Menu"
              >
                {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </div>

        {/* Category Navigation Bar (Desktop Only) */}
        <nav className="cat-nav-bar desktop-only">
          <div className="container cat-nav-container">
            <ul className="cat-nav-list left-nav">
              {navCategories.map((cat) => {
                const isActive = pathname === cat.href;
                return (
                  <li key={cat.href} className="cat-nav-item">
                    <Link href={cat.href} className={isActive ? 'active' : ''}>
                      {cat.name}
                    </Link>
                  </li>
                );
              })}
            </ul>
            <ul className="cat-nav-list right-nav">
              {infoLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <li key={link.href} className="cat-nav-item">
                    <Link href={link.href} className={isActive ? 'active' : ''}>
                      {link.name}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </nav>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="mobile-nav-drawer">
            <div className="container mobile-nav-content">
              {/* Search bar inside mobile drawer */}
              <form onSubmit={handleSearchSubmit} className="mobile-search-bar">
                <Search className="search-icon" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input"
                />
              </form>

              <ul className="mobile-nav-list">
                <li className="mobile-nav-section-title">Shop Categories</li>
                {navCategories.map((cat) => (
                  <li key={cat.href} className="mobile-nav-item">
                    <Link
                      href={cat.href}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {cat.name}
                    </Link>
                  </li>
                ))}

                <li className="mobile-nav-section-title" style={{ marginTop: '1.5rem' }}>Information</li>
                {infoLinks.map((link) => (
                  <li key={link.href} className="mobile-nav-item">
                    <Link
                      href={link.href}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </header>
    </>
  );
}
