'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useSyncExternalStore } from 'react';
import { ShoppingBag, Search, User, ShieldCheck, Zap, Menu, X } from 'lucide-react';
import { useStore } from '@/lib/store';

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const hasHydrated = useSyncExternalStore(() => () => undefined, () => true, () => false);
  const cartCount = useStore((state) => hasHydrated ? state.getCartCount() : 0);
  const user = useStore((state) => hasHydrated ? state.user : null);

  if (pathname.startsWith('/admin') || pathname.startsWith('/checkout')) return null;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const navCategories = [
    { name: 'All Gadgets', href: '/products' },
    { name: 'Earbuds', href: '/category/earbuds' },
    { name: 'Chargers & Cables', href: '/category/chargers' },
    { name: 'Power Banks', href: '/category/power-banks' },
    { name: 'Smartwatches', href: '/category/smartwatches' },
    { name: 'Accessories', href: '/category/accessories' },
  ];

  return (
    <>
      {/* Top bar */}
      <div className="header-topbar">
        ⚡ <strong>Celiz LK Official Store</strong> — Islandwide Express Delivery | 100% Genuine Warranty Products
      </div>

      <header className="site-header">
        <div className="container">
          <div className="header-content">
            {/* Logo */}
            <Link href="/" className="brand-logo">
              <Image
                src="/logo.png"
                alt="Celiz LK"
                width={210}
                height={64}
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
                placeholder="Search high-tech earbuds, chargers, smartwatches..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
            </form>

            {/* Action Buttons */}
            <div className="nav-actions">
              {user ? (
                <Link href={user.role === 'ADMIN' ? '/admin' : '/account'} className="nav-link-btn">
                  <User size={18} />
                  <span>{user.fullName.split(' ')[0]}</span>
                </Link>
              ) : (
                <Link href="/login" className="nav-link-btn">
                  <User size={18} />
                  <span>Login</span>
                </Link>
              )}

              <Link href="/cart" className="cart-icon-btn">
                <ShoppingBag size={18} />
                <span>Cart</span>
                {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
              </Link>
            </div>
          </div>
        </div>

        {/* Category Navigation Bar */}
        <nav className="cat-nav-bar">
          <div className="container">
            <ul className="cat-nav-list">
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
          </div>
        </nav>
      </header>
    </>
  );
}
