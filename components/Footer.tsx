'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { FaFacebookF, FaInstagram, FaTiktok, FaCcVisa, FaCcMastercard } from 'react-icons/fa';

type CategoryItem = {
  id: string;
  name: string;
  slug: string;
  parentId?: string | null;
  _count?: {
    products: number;
  };
};

const FALLBACK_SHOP_CATEGORIES = [
  { id: 'audio', name: 'Audio', slug: 'earbuds' },
  { id: 'chargers', name: 'Chargers & Cables', slug: 'chargers' },
  { id: 'power-banks', name: 'Power Banks', slug: 'power-banks' },
  { id: 'smartwatches', name: 'Smartwatches', slug: 'smartwatches' },
  { id: 'accessories', name: 'Accessories', slug: 'accessories' },
];

export default function Footer() {
  const pathname = usePathname();
  const [shopCategories, setShopCategories] = useState<CategoryItem[]>(FALLBACK_SHOP_CATEGORIES);

  useEffect(() => {
    let isMounted = true;

    async function loadCategories() {
      try {
        const response = await fetch('/api/categories');
        if (!response.ok) throw new Error('Failed to load categories');

        const data = await response.json();
        if (!Array.isArray(data)) return;

        const topLevelCategories = data
          .filter((category: CategoryItem) => !category.parentId)
          .map((category: CategoryItem) => ({
            ...category,
            _count: category._count ?? { products: 0 },
          }))
          .sort((a: CategoryItem, b: CategoryItem) => {
            const productDiff = (b._count?.products ?? 0) - (a._count?.products ?? 0);
            if (productDiff !== 0) return productDiff;
            return (a.name || '').localeCompare(b.name || '');
          })
          .slice(0, 6);

        if (isMounted && topLevelCategories.length > 0) {
          setShopCategories(topLevelCategories);
        }
      } catch (error) {
        console.error('Failed to fetch footer categories:', error);
      }
    }

    loadCategories();

    return () => {
      isMounted = false;
    };
  }, []);

  if (pathname.startsWith('/admin') || pathname.startsWith('/checkout')) return null;

  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <Link href="/" style={{ display: 'inline-block', marginBottom: '1rem' }}>
              <Image
                src="/logo.png"
                alt="Celiz LK"
                width={140}
                height={42}
                priority
                unoptimized
                style={{ objectFit: 'contain' }}
              />
            </Link>
            <p>
              Your trusted gadget partner in Sri Lanka. Providing genuine branded tech accessories, audio devices, chargers, and wearables with official local warranty.
            </p>
            <div className="footer-social-links" style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
              <a
                href="https://www.facebook.com/share/1LXMTdG8jr/?mibextid=wwXIfr"
                target="_blank"
                rel="noopener noreferrer"
                className="social-icon-btn"
                aria-label="Facebook"
              >
                <FaFacebookF />
              </a>

              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="social-icon-btn"
                aria-label="Instagram"
              >
                <FaInstagram />
              </a>

              <a
                href="https://tiktok.com"
                target="_blank"
                rel="noopener noreferrer"
                className="social-icon-btn"
                aria-label="TikTok"
              >
                <FaTiktok />
              </a>
            </div>
          </div>

          <div>
            <h4 className="footer-col-title">Shop</h4>
            <ul className="footer-links">
              <li><Link href="/products">All Products</Link></li>
              {shopCategories.map((category) => (
                <li key={category.id}>
                  <Link href={`/category/${category.slug}`}>{category.name}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="footer-col-title">Help</h4>
            <ul className="footer-links">
              <li><Link href="/contact">Contact Us</Link></li>
              <li><Link href="/faq">FAQ</Link></li>
              <li><Link href="/delivery-information">Delivery Information</Link></li>
              <li><Link href="/warranty">Warranty</Link></li>
              <li><Link href="/refund-policy">Returns &amp; Refunds</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="footer-col-title">Company</h4>
            <ul className="footer-links">
              <li><Link href="/about">About Celiz LK</Link></li>
              <li><Link href="/about#story">Our Story</Link></li>
              <li><Link href="/privacy-policy">Privacy Policy</Link></li>
              <li><Link href="/terms-and-conditions">Terms &amp; Conditions</Link></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <div>© {new Date().getFullYear()} Celiz LK. All rights reserved.</div>

          <div className="footer-payment-methods">
            <span>We accept:</span>

            <span className="payment-logo payment-logo-visa" aria-label="Visa">
              <FaCcVisa />
            </span>

            <span className="payment-logo payment-logo-mastercard" aria-label="Mastercard">
              <FaCcMastercard />
            </span>

            <span className="payment-logo payment-logo-koko" aria-label="Koko">
              <Image
                src="/koko-logo.png"
                alt="Koko"
                width={48}
                height={24}
                style={{ objectFit: 'contain' }}
              />
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
