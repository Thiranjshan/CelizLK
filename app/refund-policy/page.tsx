export default function RefundPolicyPage() {
  return (
    <div className="container" style={{ padding: '4rem 1.25rem 6rem', maxWidth: '800px', lineHeight: 1.7 }}>
      <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--text-headline)', marginBottom: '2rem' }}>
        Refund & Returns Policy
      </h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
        Last updated: August 26, 2026
      </p>
      
      <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
        Thank you for shopping at Celiz LK. We want you to be fully satisfied with your purchase. If you are not completely satisfied, we are here to help.
      </p>

      <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-headline)', margin: '2rem 0 1rem' }}>
        Returns
      </h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
        You have 7 calendar days to return an item from the date you received it. To be eligible for a return:
      </p>
      <ul style={{ color: 'var(--text-secondary)', paddingLeft: '1.5rem', marginBottom: '1.5rem', display: 'grid', gap: '0.5rem' }}>
        <li>The item must be unused, undamaged, and in the same condition that you received it.</li>
        <li>The item must be in its original, unopened packaging.</li>
        <li>You must have the receipt, invoice, or proof of purchase.</li>
      </ul>

      <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-headline)', margin: '2rem 0 1rem' }}>
        Refunds
      </h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
        Once we receive your item, we will inspect it and notify you that we have received your returned item. We will immediately notify you on the status of your refund after inspecting the item.
      </p>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
        If your return is approved, we will initiate a refund to your original payment method (Card payment reversal) or perform a direct bank transfer if COD/Bank Transfer was used. Reversals typically take 5-10 business days depending on your card issuer.
      </p>

      <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-headline)', margin: '2rem 0 1rem' }}>
        Shipping Costs
      </h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
        You will be responsible for paying your own shipping costs for returning your item unless the item was delivered damaged or defective, in which case Celiz LK will cover the return delivery costs.
      </p>
    </div>
  );
}
