'use client';

import { ChangeEvent, useCallback, useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import AdminAuthGate from '@/components/AdminAuthGate';

interface MerchandisingProduct {
  id: string;
  name: string;
  brandRecord: { name: string } | null;
  status: string;
  isFeatured: boolean;
  isBestSeller: boolean;
  isNewArrival: boolean;
}

type MerchandisingFlag = 'isFeatured' | 'isBestSeller' | 'isNewArrival';

const flags: { key: MerchandisingFlag; label: string }[] = [
  { key: 'isFeatured', label: 'Featured' },
  { key: 'isBestSeller', label: 'Best seller' },
  { key: 'isNewArrival', label: 'New arrival' },
];

export default function MerchandisingPage() {
  return <AdminAuthGate active="merchandising">{(_, token) => <MerchandisingManager token={token} />}</AdminAuthGate>;
}

function MerchandisingManager({ token }: { token: string }) {
  const [products, setProducts] = useState<MerchandisingProduct[]>([]);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadProducts = useCallback(async () => {
    const response = await fetch('/api/admin/products', {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Failed to load products.');
    setProducts(result);
  }, [token]);

  useEffect(() => {
    const loadPromise = Promise.resolve().then(loadProducts);
    void loadPromise
      .catch((reason) => setError(reason instanceof Error ? reason.message : 'Failed to load products.'))
      .finally(() => setLoading(false));
  }, [loadProducts]);

  async function updateFlag(product: MerchandisingProduct, flag: MerchandisingFlag, event: ChangeEvent<HTMLInputElement>) {
    const checked = event.target.checked;
    setSaving(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch('/api/admin/products', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id: product.id, [flag]: checked }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to update product merchandising.');

      setProducts((current) => current.map((item) => item.id === product.id ? { ...item, [flag]: checked } : item));
      setMessage(`${product.name} updated.`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Failed to update product merchandising.');
    } finally {
      setSaving(false);
    }
  }

  const visibleProducts = products.filter((product) =>
    `${product.name} ${product.brandRecord?.name || ''}`.toLowerCase().includes(search.toLowerCase()),
  );

  return <>
    <header className="admin-header">
      <div>
        <div className="admin-kicker">Storefront</div>
        <h1>Merchandising</h1>
        <p>Choose which storefront collections each product appears in. Products can have multiple labels.</p>
      </div>
    </header>
    {error && <div className="admin-error" role="alert">{error}</div>}
    {message && <div className="admin-success" role="status">{message}</div>}
    <section className="admin-panel admin-wide-panel">
      <div className="admin-panel-heading">
        <div>
          <h2>Product collections</h2>
          <p>{visibleProducts.length} products</p>
        </div>
        <div className="admin-search">
          <Search size={16} />
          <input
            aria-label="Search products"
            placeholder="Search name or brand"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
      </div>
      {loading ? <div className="admin-empty">Loading products...</div> : visibleProducts.length ? (
        <div className="admin-table-wrap">
          <table className="admin-merchandising-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Status</th>
                {flags.map((flag) => <th key={flag.key}>{flag.label}</th>)}
              </tr>
            </thead>
            <tbody>
              {visibleProducts.map((product) => (
                <tr key={product.id}>
                  <td>
                    <strong>{product.name}</strong>
                    <small>{product.brandRecord?.name || 'Unassigned brand'}</small>
                  </td>
                  <td><span className="admin-status">{product.status}</span></td>
                  {flags.map((flag) => (
                    <td key={flag.key} className="admin-merchandising-toggle-cell">
                      <label className="admin-merchandising-toggle">
                        <input
                          type="checkbox"
                          aria-label={`${flag.label}: ${product.name}`}
                          checked={product[flag.key]}
                          disabled={saving}
                          onChange={(event) => void updateFlag(product, flag.key, event)}
                        />
                        <span>{product[flag.key] ? 'On' : 'Off'}</span>
                      </label>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : <div className="admin-empty">{loading ? 'Loading products...' : 'No products match this search.'}</div>}
    </section>
  </>;
}
