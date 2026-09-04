'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, useSyncExternalStore } from 'react';
import { ShoppingBag, Search, User, Heart, Menu, X, MessageCircle } from 'lucide-react';
import { useStore } from '@/lib/store';
import CategoryMegaMenu from '@/components/CategoryMegaMenu';
import BrandMegaMenu from '@/components/BrandMegaMenu';

interface Brand { id: string; name: string; slug: string; logoUrl: string | null; }
interface Category { id: string; name: string; slug: string; parentId: string | null; }

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brandsOpen, setBrandsOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const hasHydrated = useSyncExternalStore(() => () => undefined, () => true, () => false);
  const cart = useStore((state) => state.cart);
  const cartCount = hasHydrated ? cart.filter((item) => item.selected !== false).reduce((sum, item) => sum + item.quantity, 0) : 0;
  const wishlist = useStore((state) => state.wishlist);
  const wishlistCount = hasHydrated ? wishlist.length : 0;
  const user = useStore((state) => hasHydrated ? state.user : null);

  useEffect(() => {
    // Load navigation data from the catalog so admin changes appear in the header.
    fetch('/api/brands').then((response) => response.ok ? response.json() : []).then(setBrands).catch(() => undefined);
    fetch('/api/categories').then((response) => response.ok ? response.json() : []).then(setCategories).catch(() => undefined);
  }, []);

  if (pathname.startsWith('/admin') || pathname.startsWith('/checkout')) return null;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setMobileMenuOpen(false);
    }
  };

  // Show only top-level catalog categories; Deals is a product filter, not a category record.
  const navCategories = [
    ...categories
      .filter((category) => category.parentId === null)
      .map((category) => ({ name: category.name, href: `/category/${category.slug}` })),
    { name: 'Deals', href: '/products?filter=deals' },
  ];

  const infoLinks = [
    { name: 'About', href: '/about' },
    { name: 'FAQ', href: '/faq' },
    { name: 'Support', href: '/contact' },
  ];

  const closeMenus = () => {
    setCategoriesOpen(false);
    setBrandsOpen(false);
  };

  const closeMobileNavigation = () => {
    closeMenus();
    setMobileMenuOpen(false);
  };

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

        <nav className="cat-nav-bar desktop-only" onKeyDown={(event) => { if (event.key === 'Escape') closeMenus(); }}>
          <div className="container cat-nav-container">
            <ul className="cat-nav-list left-nav">
              <li className="cat-nav-item">
                <Link href="/products" className={pathname === '/products' ? 'active' : ''}>
                  Shop <span className="nav-accent">All</span>
                </Link>
              </li>
              <li className={`cat-nav-item mega-nav-item ${categoriesOpen ? 'open' : ''}`} onMouseEnter={() => { setCategoriesOpen(true); setBrandsOpen(false); }} onMouseLeave={() => setCategoriesOpen(false)}>
                <button type="button" aria-expanded={categoriesOpen} onClick={() => { setCategoriesOpen((open) => !open); setBrandsOpen(false); }} onFocus={() => { setCategoriesOpen(true); setBrandsOpen(false); }}>
                  Shop by <span className="nav-accent">Category</span> <span className="nav-chevron" aria-hidden="true">▾</span>
                </button>
                {categoriesOpen && <CategoryMegaMenu categories={navCategories} onNavigate={closeMenus} />}
              </li>
              {brands.length > 0 && <li className={`cat-nav-item mega-nav-item ${brandsOpen ? 'open' : ''}`} onMouseEnter={() => { setBrandsOpen(true); setCategoriesOpen(false); }} onMouseLeave={() => setBrandsOpen(false)}>
                <button type="button" aria-expanded={brandsOpen} onClick={() => { setBrandsOpen((open) => !open); setCategoriesOpen(false); }} onFocus={() => { setBrandsOpen(true); setCategoriesOpen(false); }}>
                  Shop by <span className="nav-accent">Brand</span> <span className="nav-chevron" aria-hidden="true">▾</span>
                </button>
                {brandsOpen && <BrandMegaMenu brands={brands} onNavigate={closeMenus} />}
              </li>}
            </ul>
            <ul className="cat-nav-list right-nav">
              {infoLinks.map((link) => <li key={link.href} className="cat-nav-item"><Link href={link.href} className={pathname === link.href ? 'active' : ''}>{link.name}</Link></li>)}
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
                <li className="mobile-nav-item">
                  <Link href="/products" onClick={closeMobileNavigation}>Shop <span className="nav-accent">All</span></Link>
                </li>
                <li className="mobile-nav-item mobile-menu-group">
                  <button type="button" aria-expanded={categoriesOpen} onClick={() => { setCategoriesOpen((open) => !open); setBrandsOpen(false); }}>
                    <span className="mobile-nav-label">Shop by <span className="nav-accent">Category</span></span> <span aria-hidden="true">{categoriesOpen ? '⌃' : '›'}</span>
                  </button>
                  {categoriesOpen && <ul className="mobile-subnav-list">{navCategories.map((category) => <li key={category.href}><Link href={category.href} onClick={closeMobileNavigation}>{category.name}</Link></li>)}</ul>}
                </li>
                {brands.length > 0 && <li className="mobile-nav-item mobile-menu-group"><button type="button" aria-expanded={brandsOpen} onClick={() => { setBrandsOpen((open) => !open); setCategoriesOpen(false); }}><span className="mobile-nav-label">Shop by <span className="nav-accent">Brand</span></span> <span aria-hidden="true">{brandsOpen ? '⌃' : '›'}</span></button>{brandsOpen && <ul className="mobile-subnav-list mobile-brand-list">{brands.map((brand) => <li key={brand.id}><Link href={`/products?brand=${brand.slug}`} onClick={closeMobileNavigation}>{brand.name}</Link></li>)}</ul>}</li>}

                <li className="mobile-nav-section-title" style={{ marginTop: '1.5rem' }}>Information</li>
                {infoLinks.map((link) => (
                  <li key={link.href} className="mobile-nav-item">
                    <Link
                      href={link.href}
                      onClick={closeMobileNavigation}
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
