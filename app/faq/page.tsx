import Link from 'next/link';

export default function FaqPage() {
  const faqs = [
    {
      q: 'Are your products genuine?',
      a: 'Yes, Celiz LK only sells 100% genuine and original branded products. We source directly from official manufacturers or their authorized distributors, ensuring that you receive authentic products in retail packaging.'
    },
    {
      q: 'What is your warranty policy?',
      a: 'We offer an official replacement or service warranty for all eligible electronics products. The specific warranty period is mentioned on each product page and starts from the date of delivery. For claims, please reach out to our WhatsApp support team.'
    },
    {
      q: 'Do you deliver islandwide in Sri Lanka?',
      a: 'Yes! We deliver to any address within Sri Lanka. Orders are typically processed within 24 hours and delivered within 1-3 business days. Delivery fees are flat LKR 350 across the island.'
    },
    {
      q: 'What payment methods do you support?',
      a: 'We support Cash on Delivery (COD), Secure Card Payments (Visa, Mastercard, AMEX) via PayHere, Bank Transfers, and easy installments through Koko.'
    },
    {
      q: 'Can I return a product?',
      a: 'We offer a hassle-free refund and returns policy. You can return any product within 7 days of receipt if it is damaged, defective, or in unopened original packaging. Please review our full Refund & Returns Policy for details.'
    }
  ];

  return (
    <div className="container" style={{ padding: '4rem 1.25rem 6rem', maxWidth: '800px' }}>
      <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--text-headline)', marginBottom: '1rem', textAlign: 'center' }}>
        Frequently Asked Questions
      </h1>
      <p style={{ color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '3.5rem', fontSize: '1.05rem' }}>
        Find quick answers to common questions about ordering, delivery, and warranty.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {faqs.map((faq, index) => (
          <div key={index} style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '2rem' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-headline)', marginBottom: '0.75rem' }}>
              {index + 1}. {faq.q}
            </h3>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, fontSize: '0.95rem' }}>
              {faq.a}
            </p>
          </div>
        ))}
      </div>

      <div style={{ marginTop: '4rem', textAlign: 'center', background: 'var(--bg-surface)', padding: '2rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-headline)', marginBottom: '0.5rem' }}>
          Still have questions?
        </h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
          If you could not find the answer to your question, feel free to contact our customer support team directly.
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <Link href="/contact" className="btn-primary" style={{ padding: '0.7rem 1.5rem', fontSize: '0.85rem' }}>
            Contact Support
          </Link>
          <a href="https://wa.me/94770000000" target="_blank" rel="noopener noreferrer" className="btn-add-cart" style={{ padding: '0.7rem 1.5rem', fontSize: '0.85rem', width: 'auto' }}>
            WhatsApp Chat
          </a>
        </div>
      </div>
    </div>
  );
}
