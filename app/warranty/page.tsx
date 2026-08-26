export default function WarrantyPage() {
  return (
    <div className="container" style={{ padding: '4rem 1.25rem 6rem', maxWidth: '800px', lineHeight: 1.7 }}>
      <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--text-headline)', marginBottom: '2rem' }}>
        Warranty Information
      </h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
        Last updated: August 26, 2026
      </p>

      <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
        At Celiz LK, we stand behind the quality of our gadgets. We source only genuine branded products and offer local replacement or service warranties to ensure your tech remains protected.
      </p>

      <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-headline)', margin: '2rem 0 1rem' }}>
        Warranty Coverage
      </h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
        Products covered by a Celiz LK warranty are protected against manufacturing defects, software malfunctions, and component failures under normal usage conditions.
      </p>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
        Specific warranty periods (e.g. 6 months or 12 months) are clearly stated on individual product pages and listed on your purchase invoice.
      </p>

      <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-headline)', margin: '2rem 0 1rem' }}>
        Warranty Exclusions
      </h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
        The warranty does not cover:
      </p>
      <ul style={{ color: 'var(--text-secondary)', paddingLeft: '1.5rem', marginBottom: '1.5rem', display: 'grid', gap: '0.5rem' }}>
        <li>Physical damage caused by drops, impacts, or accidents.</li>
        <li>Liquid damage or moisture ingress (unless explicitly protected by IP rating under specified conditions).</li>
        <li>Unauthorized repairs, modifications, or tampering with the product components.</li>
        <li>Natural wear and tear of battery capacity over time.</li>
      </ul>

      <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-headline)', margin: '2rem 0 1rem' }}>
        How to Claim Warranty
      </h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
        To file a warranty claim, please contact our support team on WhatsApp at <strong>+94 77 123 4567</strong> or email us at <strong>support@celiz.lk</strong>.
      </p>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
        Please provide your order number (e.g. CZ-1001), phone number, and a short description or video of the defect. We will guide you through returning the item for inspection and shipping out your replacement unit.
      </p>
    </div>
  );
}
