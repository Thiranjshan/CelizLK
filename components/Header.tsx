'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { ShoppingBag, Search, User, Menu, X, MessageCircle } from 'lucide-react';
import { useStore } from '@/lib/store';
import CategoryMegaMenu from '@/components/CategoryMegaMenu';
import BrandMegaMenu from '@/components/BrandMegaMenu';

interface Brand { id: string; name: string; slug: string; logoUrl: string | null; }
interface Category { id: string; name: string; slug: string; parentId: string | null; }
interface ProductSuggestion {
  id: string;
  name: string;
  slug: string;
  price: number;
  discountPrice: number | null;
  image: string | null;
}

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchRegionRef = useRef<HTMLDivElement>(null);
  const suggestionAbortRef = useRef<AbortController | null>(null);
  const suggestionRequestIdRef = useRef(0);
  const [suggestions, setSuggestions] = useState<ProductSuggestion[]>([]);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [suggestionsError, setSuggestionsError] = useState(false);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brandsOpen, setBrandsOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [desktopSearchOpen, setDesktopSearchOpen] = useState(false);
  const hasHydrated = useSyncExternalStore(() => () => undefined, () => true, () => false);
  const cart = useStore((state) => state.cart);
  const cartCount = hasHydrated ? cart.filter((item) => item.selected !== false).reduce((sum, item) => sum + item.quantity, 0) : 0;
  const user = useStore((state) => hasHydrated ? state.user : null);

  useEffect(() => {
    // Load navigation data from the catalog so admin changes appear in the header.
    fetch('/api/brands').then((response) => response.ok ? response.json() : []).then(setBrands).catch(() => undefined);
    fetch('/api/categories').then((response) => response.ok ? response.json() : []).then(setCategories).catch(() => undefined);
  }, []);

  useEffect(() => {
    if (mobileSearchOpen) searchInputRef.current?.focus();
  }, [mobileSearchOpen]);

  useEffect(() => {
    const query = searchQuery.trim();
    if (query.length < 2) {
      suggestionAbortRef.current?.abort();
      suggestionAbortRef.current = null;
      suggestionRequestIdRef.current += 1;
      return;
    }

    const timeoutId = window.setTimeout(() => {
      suggestionAbortRef.current?.abort();
      const controller = new AbortController();
      const requestId = ++suggestionRequestIdRef.current;
      suggestionAbortRef.current = controller;
      setSuggestionsLoading(true);
      setSuggestionsError(false);
      setSuggestionsOpen(true);

      fetch(`/api/search/suggest?q=${encodeURIComponent(query.slice(0, 60))}`, { signal: controller.signal })
        .then(async (response) => {
          if (!response.ok) throw new Error('Suggestions are unavailable');
          return response.json();
        })
        .then((data: { products?: ProductSuggestion[]; error?: boolean }) => {
          if (requestId !== suggestionRequestIdRef.current) return;
          if (data.error) throw new Error('Suggestions are unavailable');
          setSuggestions(data.products ?? []);
          setSuggestionsOpen(true);
          setSuggestionsLoading(false);
        })
        .catch((error: unknown) => {
          if (controller.signal.aborted || requestId !== suggestionRequestIdRef.current) return;
          console.error('Unable to load product suggestions:', error);
          setSuggestions([]);
          setSuggestionsError(true);
          setSuggestionsOpen(true);
          setSuggestionsLoading(false);
        });
    }, 250);

    return () => {
      window.clearTimeout(timeoutId);
      suggestionAbortRef.current?.abort();
    };
  }, [searchQuery]);

  useEffect(() => {
    const handleOutsidePointerDown = (event: PointerEvent) => {
      if (searchRegionRef.current?.contains(event.target as Node)) return;
      suggestionAbortRef.current?.abort();
      suggestionRequestIdRef.current += 1;
      setSuggestionsOpen(false);
      setSuggestionsLoading(false);
      setDesktopSearchOpen(false);
      setMobileSearchOpen(false);
    };

    document.addEventListener('pointerdown', handleOutsidePointerDown);
    return () => document.removeEventListener('pointerdown', handleOutsidePointerDown);
  }, []);

  const clearSuggestions = () => {
    suggestionAbortRef.current?.abort();
    suggestionAbortRef.current = null;
    suggestionRequestIdRef.current += 1;
    setSuggestions([]);
    setSuggestionsOpen(false);
    setSuggestionsLoading(false);
    setSuggestionsError(false);
    setDesktopSearchOpen(false);
  };

  if (pathname.startsWith('/admin') || pathname.startsWith('/checkout')) return null;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setMobileMenuOpen(false);
      setMobileSearchOpen(false);
      setDesktopSearchOpen(false);
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
    clearSuggestions();
    setMobileMenuOpen(false);
  };

  return (
    <>
      <header className="site-header">
        <div className="container">
          <div className="header-content">

              {/* Mobile menu toggle */}
              <button
                type="button"
                className="mobile-menu-toggle"
                onClick={() => mobileMenuOpen ? closeMobileNavigation() : setMobileMenuOpen(true)}
                aria-label={mobileMenuOpen ? 'Close Menu' : 'Open Menu'}
                aria-expanded={mobileMenuOpen}
                aria-controls={mobileMenuOpen ? 'mobile-nav-drawer' : undefined}
              >
                <span className="mobile-menu-icon-stack" aria-hidden="true">
                  <Menu className={`mobile-menu-icon ${mobileMenuOpen ? 'mobile-menu-icon-hidden' : ''}`} size={20} />
                  <X className={`mobile-menu-icon ${mobileMenuOpen ? '' : 'mobile-menu-icon-hidden'}`} size={20} />
                </span>
              </button>

            {/* Logo */}
            <Link href="/" className="brand-logo">
              <Image
                src="/logo.webp"
                alt="Celiz LK"
                width={160}
                height={48}
                priority
                unoptimized
                className="brand-logo-image"
              />
            </Link>

            {/* Action Buttons */}
            <div className="nav-actions">
              <div
                ref={searchRegionRef}
                className={`header-search-container ${mobileSearchOpen ? 'mobile-search-open' : ''} ${desktopSearchOpen ? 'header-search-open' : ''}`}
              >
                <button
                  type="button"
                  className="desktop-search-trigger nav-link-btn"
                  aria-label={desktopSearchOpen ? 'Close search' : 'Open search'}
                  onClick={() => {
                    if (desktopSearchOpen) {
                      setDesktopSearchOpen(false);
                      clearSuggestions();
                      return;
                    }
                    setMobileSearchOpen(false);
                    setDesktopSearchOpen(true);
                    setSuggestionsOpen(true);
                    setTimeout(() => searchInputRef.current?.focus(), 0);
                  }}
                >
                  <Search size={20} />
                </button>

                <form
                  id="header-search-form"
                  onSubmitCapture={clearSuggestions}
                  onSubmit={handleSearchSubmit}
                  onKeyDown={(event) => {
                    if (event.key === 'Escape') clearSuggestions();
                  }}
                  className="search-bar"
                >
                  <Search className="search-icon" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search earbuds, chargers, smartwatches..."
                    value={searchQuery}
                    onChange={(event) => {
                      setSearchQuery(event.target.value);
                      if (event.target.value.trim().length < 2) clearSuggestions();
                    }}
                    className="search-input"
                    role="combobox"
                    aria-autocomplete="list"
                    aria-expanded={suggestionsOpen}
                    aria-controls="header-search-suggestions"
                    onFocus={() => setDesktopSearchOpen(true)}
                  />
                </form>
                {suggestionsOpen && (
                  <div id="header-search-suggestions" className="search-suggestions" role="listbox" aria-label="Product suggestions" aria-live="polite">
                    {suggestionsLoading ? (
                      <div className="search-suggestion-status">Searching products...</div>
                    ) : suggestionsError ? (
                      <div className="search-suggestion-status" role="status">Suggestions are temporarily unavailable.</div>
                    ) : suggestions.length === 0 ? (
                      <div className="search-suggestion-status" role="status">No suggestions found.</div>
                    ) : (
                      suggestions.map((suggestion) => (
                        <Link
                          key={suggestion.id}
                          href={`/product/${suggestion.slug}`}
                          className="search-suggestion-link"
                          role="option"
                          onClick={clearSuggestions}
                        >
                          <span>{suggestion.name}</span>
                          <strong>LKR {(suggestion.discountPrice ?? suggestion.price).toLocaleString()}</strong>
                        </Link>
                      ))
                    )}
                  </div>
                )}
              </div>
              <button
                type="button"
                className="mobile-search-toggle"
                aria-label={mobileSearchOpen ? 'Close search' : 'Open search'}
                aria-expanded={mobileSearchOpen}
                aria-controls="header-search-form"
                onClick={() => {
                  if (mobileSearchOpen) clearSuggestions();
                  setMobileSearchOpen((open) => !open);
                }}
              >
                {mobileSearchOpen ? <X size={20} /> : <Search size={20} />}
              </button>

              {/* Account */}
              {user ? (
                // Storefront account navigation must not expose the separate admin area.
                <Link href="/account" className="nav-link-btn" aria-label="Account">
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

            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="mobile-nav-drawer" id="mobile-nav-drawer">
            <div className="container mobile-nav-content">
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
