 'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShieldCheck, Truck, Headphones, Award } from 'lucide-react';

export default function Footer() {
  const pathname = usePathname();
  if (pathname.startsWith('/admin')) return null;

  return (
    <footer className="site-footer">
      <div className="container">
        {/* Footer Top Grid */}
        <div className="footer-grid">
          {/* Brand Info */}
          <div className="footer-brand">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.4rem', fontWeight: 900, fontFamily: 'var(--font-heading)' }}>
              <div style={{ width: 36, height: 36, background: 'var(--brand-gradient)', color: 'white', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900 }}>C</div>
              <span>Celiz <span style={{ color: '#C084FC' }}>LK</span></span>
            </div>
            <p>
              Your Trusted Gadget Partner in Sri Lanka. Premium wireless audio, ultra-fast charging, smart wearables, and mobile tech delivered fast with authentic local warranty.
            </p>
          </div>

          {/* Shop Categories */}
          <div>
            <h4 className="footer-col-title">Categories</h4>
            <ul className="footer-links">
              <li><Link href="/category/earbuds">Wireless Earbuds</Link></li>
              <li><Link href="/category/chargers">Fast Chargers & Cables</Link></li>
              <li><Link href="/category/power-banks">Portable Power Banks</Link></li>
              <li><Link href="/category/smartwatches">Smartwatches</Link></li>
              <li><Link href="/category/accessories">Tech Accessories</Link></li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h4 className="footer-col-title">Customer Care</h4>
            <ul className="footer-links">
              <li><Link href="/account/orders">Track Your Order</Link></li>
              <li><Link href="/contact">Contact Support</Link></li>
              <li><Link href="/about">About Celiz LK</Link></li>
              <li><Link href="/admin">Admin Portal</Link></li>
            </ul>
          </div>

          {/* Legal Pages (Required for PayHere Approval) */}
          <div>
            <h4 className="footer-col-title">Legal & Policies</h4>
            <ul className="footer-links">
              <li><Link href="/privacy-policy">Privacy Policy</Link></li>
              <li><Link href="/refund-policy">Refund & Returns Policy</Link></li>
              <li><Link href="/terms-and-conditions">Terms & Conditions</Link></li>
              <li><Link href="/contact">Business Details</Link></li>
            </ul>
          </div>
        </div>

        {/* Footer Bottom Bar */}
        <div className="footer-bottom">
          <div>
            © {new Date().getFullYear()} Celiz LK (Private) Limited. All Rights Reserved.
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', color: '#9CA3AF' }}>
            <span>🔒 Secure Checkout via PayHere</span>
            <span>💵 Cash on Delivery</span>
            <span>🏦 Bank Transfer</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
