'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { FaFacebookF, FaInstagram, FaTiktok,FaCcVisa, FaCcMastercard} from 'react-icons/fa';

export default function Footer() {
  const pathname = usePathname();
  if (pathname.startsWith('/admin') || pathname.startsWith('/checkout')) return null;

  return (
    <footer className="site-footer">
      <div className="container">
        {/* Footer Top Grid */}
        <div className="footer-grid">
          {/* Brand Info */}
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

          {/* Shop */}
          <div>
            <h4 className="footer-col-title">Shop</h4>
            <ul className="footer-links">
              <li><Link href="/products">All Products</Link></li>
              <li><Link href="/category/earbuds">Audio</Link></li>
              <li><Link href="/category/chargers">Chargers &amp; Cables</Link></li>
              <li><Link href="/category/power-banks">Power Banks</Link></li>
              <li><Link href="/category/smartwatches">Smartwatches</Link></li>
              <li><Link href="/category/accessories">Accessories</Link></li>
              <li><Link href="/products?filter=deals">Deals</Link></li>
            </ul>
          </div>

          {/* Help */}
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

          {/* Company */}
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

        {/* Footer Bottom Bar */}
        <div className="footer-bottom">
  <div>© {new Date().getFullYear()} Celiz LK. All rights reserved.</div>

  <div className="footer-payment-methods">
    <span className="footer-payment-label">We accept:</span>

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
