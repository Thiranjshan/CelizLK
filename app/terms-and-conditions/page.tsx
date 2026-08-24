import Link from 'next/link';

export const metadata = {
  title: 'Terms & Conditions — Celiz LK',
  description: 'Terms & Conditions for ordering tech products and gadgets on Celiz LK Sri Lanka.',
};

export default function TermsAndConditionsPage() {
  return (
    <div className="container" style={{ maxWidth: 840, padding: '4rem 1.25rem 6rem 1.25rem' }}>
      <div style={{ background: 'var(--bg-white)', padding: '3rem 2.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
        <h1 style={{ fontSize: '2.25rem', fontWeight: 900, marginBottom: '0.5rem', color: 'var(--primary-indigo)' }}>
          Terms & Conditions
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '2.5rem' }}>
          Last updated: August 2026 • Celiz LK Online Store Sri Lanka
        </p>

        <section style={{ display: 'flex', flexDirection: 'column', gap: '2rem', lineHeight: 1.7, color: 'var(--text-main)', fontSize: '0.975rem' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.75rem', color: 'var(--text-headline)' }}>
              1. General Ordering Policy
            </h2>
            <p>
              By placing an order on Celiz LK, you confirm that all information provided during checkout (including recipient name, contact phone number, and delivery address) is accurate and accurate to facilitate islandwide parcel delivery.
            </p>
          </div>

          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.75rem', color: 'var(--text-headline)' }}>
              2. Payment & Pricing
            </h2>
            <p>
              All prices listed on Celiz LK are in Sri Lankan Rupees (LKR). Payment methods accepted include Cash on Delivery (COD), Direct Bank Transfer, and PayHere Online Gateway. Orders paid via Bank Transfer require payment verification before dispatch.
            </p>
          </div>

          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.75rem', color: 'var(--text-headline)' }}>
              3. Islandwide Express Shipping & Delivery
            </h2>
            <p>
              Delivery timeframe for standard islandwide orders across Sri Lanka is 1-3 business days. Deliveries are fulfilled through recognized local courier partners. Free shipping applies to qualifying order amounts.
            </p>
          </div>

          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.75rem', color: 'var(--text-headline)' }}>
              4. Authentic Warranty & Return Policy
            </h2>
            <p>
              All gadgets and accessories sold on Celiz LK carry official authentic warranties against manufacturing defects. If you receive a damaged or incorrect product, please notify customer support within 48 hours of parcel delivery for prompt exchange or resolution.
            </p>
          </div>

          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.75rem', color: 'var(--text-headline)' }}>
              5. Contact Us
            </h2>
            <p>
              If you have any questions regarding these terms, please contact our support team at <strong>support@celiz.lk</strong> or via WhatsApp support.
            </p>
          </div>
        </section>

        <div style={{ marginTop: '3rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)' }}>
          <Link href="/products" className="btn-primary" style={{ display: 'inline-flex' }}>
            Return to Shop
          </Link>
        </div>
      </div>
    </div>
  );
}
