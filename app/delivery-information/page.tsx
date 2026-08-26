export default function DeliveryInformationPage() {
  return (
    <div className="container" style={{ padding: '4rem 1.25rem 6rem', maxWidth: '800px', lineHeight: 1.7 }}>
      <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--text-headline)', marginBottom: '2rem' }}>
        Delivery Information
      </h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
        Last updated: August 26, 2026
      </p>

      <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
        At Celiz LK, we aim to provide reliable, fast, and secure delivery services to customers all over Sri Lanka. We partner with leading courier services to ensure your orders reach you in perfect condition.
      </p>

      <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-headline)', margin: '2rem 0 1rem' }}>
        Delivery Timelines
      </h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
        All orders placed on our website are dispatched within 24 hours of confirmation (excluding Sundays and public holidays). Estimated delivery times are:
      </p>
      <ul style={{ color: 'var(--text-secondary)', paddingLeft: '1.5rem', marginBottom: '1.5rem', display: 'grid', gap: '0.5rem' }}>
        <li><strong>Colombo & Suburbs</strong>: 1 to 2 business days.</li>
        <li><strong>Outstation Areas</strong>: 2 to 3 business days.</li>
      </ul>

      <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-headline)', margin: '2rem 0 1rem' }}>
        Shipping Charges
      </h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
        We charge a flat delivery fee of <strong>LKR 350</strong> across any district in Sri Lanka.
      </p>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
        Shipping charges are added automatically to your checkout total based on your delivery address district.
      </p>

      <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-headline)', margin: '2rem 0 1rem' }}>
        Order Tracking
      </h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
        Once your order has been dispatched, you will receive a tracking link via SMS or email containing the courier tracking number and link. You can also view the delivery progress on your Account page.
      </p>
    </div>
  );
}
