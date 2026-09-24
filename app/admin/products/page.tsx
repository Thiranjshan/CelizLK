'use client';

import { ChangeEvent, ClipboardEvent, DragEvent, FormEvent, useCallback, useEffect, useState } from 'react';
import { ImagePlus, Pencil, Plus, Search, Trash2, X } from 'lucide-react';
import AdminAuthGate from '@/components/AdminAuthGate';
import { isValidProductSlug, normalizeProductSlug, PRODUCT_DESCRIPTION_MAX_LENGTH, PRODUCT_NAME_MAX_LENGTH, PRODUCT_SLUG_MAX_LENGTH, PRODUCT_SPECS_MAX_LENGTH } from '@/lib/product-validation';
import { ALLOWED_UPLOAD_MIME_TYPES, MAX_UPLOAD_BYTES } from '@/lib/security';

interface Category { id: string; name: string; }
interface Brand { id: string; name: string; isActive: boolean; }
interface Product { id: string; name: string; slug: string; description: string; price: number; discountPrice: number | null; stockQty: number; brandId: string; brandRecord: Brand | null; images: string[]; specs: string; categoryId: string; isActive: boolean; isFeatured: boolean; isNewArrival: boolean; status: string; }

type ProductForm = { name: string; slug: string; description: string; price: string; discountPrice: string; stockQty: string; brandId: string; categoryId: string; images: string[]; specs: string; isFeatured: boolean; isNewArrival: boolean; status: string };
const emptyForm: ProductForm = { name: '', slug: '', description: '', price: '', discountPrice: '', stockQty: '0', brandId: '', categoryId: '', images: [], specs: '', isFeatured: false, isNewArrival: false, status: 'ACTIVE' };

export default function ProductsPage() {
  return <AdminAuthGate active="products">{(session, token) => <ProductsManager token={token} adminRole={session.role} />}</AdminAuthGate>;
}

function ProductsManager({ token, adminRole }: { token: string; adminRole: string }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [isDraggingPhotos, setIsDraggingPhotos] = useState(false);
  const canEdit = adminRole === 'SUPER_ADMIN' || adminRole === 'PRODUCT_MANAGER';

  const load = useCallback(async () => {
    const headers = { Authorization: `Bearer ${token}` };
    const [productResponse, categoryResponse, brandResponse] = await Promise.all([fetch('/api/admin/products', { headers, cache: 'no-store' }), fetch('/api/admin/categories', { headers, cache: 'no-store' }), fetch('/api/admin/brands', { headers, cache: 'no-store' })]);
    const productData = await productResponse.json();
    const categoryData = await categoryResponse.json();
    const brandData = await brandResponse.json();
    if (!productResponse.ok) throw new Error(productData.error);
    setProducts(productData);
    if (categoryResponse.ok) setCategories(categoryData);
    if (brandResponse.ok) setBrands(brandData);
  }, [token]);

  useEffect(() => {
    const loadPromise = Promise.resolve().then(load);
    void loadPromise.catch((reason) => {
      setError(reason instanceof Error ? reason.message : 'Failed to load catalog data.');
    });
  }, [load]);

  function selectProduct(product: Product) {
    setEditingId(product.id);
    setForm({ name: product.name, slug: product.slug, description: product.description, price: String(product.price), discountPrice: product.discountPrice === null ? '' : String(product.discountPrice), stockQty: String(product.stockQty), brandId: product.brandId, categoryId: product.categoryId, images: product.images, specs: product.specs, isFeatured: product.isFeatured, isNewArrival: product.isNewArrival, status: product.status });
    setError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function reset() { setEditingId(null); setForm(emptyForm); setError(''); }

  async function save(event: FormEvent) {
    event.preventDefault();
    const price = Number(form.price);
    const discountPrice = form.discountPrice === '' ? null : Number(form.discountPrice);
    const stockQty = Number(form.stockQty);
    const slug = normalizeProductSlug(form.slug || form.name);

    if (form.name.trim().length < 2 || form.name.trim().length > PRODUCT_NAME_MAX_LENGTH) {
      setError(`Product name must be between 2 and ${PRODUCT_NAME_MAX_LENGTH} characters.`);
      return;
    }
    if (!isValidProductSlug(slug)) {
      setError('Slug must contain only lowercase letters, numbers, and hyphens.');
      return;
    }
    if (!Number.isFinite(price) || price < 0) {
      setError('Price must be a valid non-negative number.');
      return;
    }
    if (discountPrice !== null && (!Number.isFinite(discountPrice) || discountPrice < 0 || discountPrice > price)) {
      setError('Discount price must be non-negative and cannot exceed the price.');
      return;
    }
    if (!Number.isInteger(stockQty) || stockQty < 0) {
      setError('Stock quantity must be a non-negative whole number.');
      return;
    }
    if (form.description.trim().length < 10 || form.description.length > PRODUCT_DESCRIPTION_MAX_LENGTH) {
      setError(`Description must be between 10 and ${PRODUCT_DESCRIPTION_MAX_LENGTH} characters.`);
      return;
    }
    if (form.specs.length > PRODUCT_SPECS_MAX_LENGTH) {
      setError(`Technical specifications cannot exceed ${PRODUCT_SPECS_MAX_LENGTH} characters.`);
      return;
    }

    setSaving(true);
    setError('');
    const payload = { ...form, slug, price, discountPrice, stockQty };
    try {
      const response = await fetch('/api/admin/products', { method: editingId ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(editingId ? { ...payload, id: editingId } : payload) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setMessage(editingId ? 'Product updated.' : 'Product created.');
      reset();
      await load();
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to save product.'); }
    finally { setSaving(false); }
  }

  async function uploadFiles(files: File[]) {
    const failures: string[] = [];

    for (const file of files) {
      if (!ALLOWED_UPLOAD_MIME_TYPES[file.type] || file.size === 0 || file.size > MAX_UPLOAD_BYTES) {
        failures.push(`${file.name}: upload a non-empty JPEG, PNG, or WebP image smaller than 5MB.`);
        continue;
      }

      try {
        const body = new FormData();
        body.append('file', file);
        const response = await fetch('/api/admin/uploads', { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body });
        const result = await response.json();
        if (!response.ok) {
          failures.push(`${file.name}: ${result.error || 'Upload failed.'}`);
          continue;
        }
        if (typeof result.url === 'string' && result.url) {
          setForm((current) => ({ ...current, images: [...current.images, result.url] }));
        } else {
          failures.push(`${file.name}: upload returned no image URL.`);
        }
      } catch {
        failures.push(`${file.name}: upload failed.`);
      }
    }

    setError(failures.length ? failures.join(' ') : '');
  }

  function upload(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files || []);
    event.target.value = '';
    void uploadFiles(files);
  }

  function handleDragOver(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
  }

  function handleDragEnter(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDraggingPhotos(true);
  }

  function handleDragLeave(event: DragEvent<HTMLDivElement>) {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
      setIsDraggingPhotos(false);
    }
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDraggingPhotos(false);
    const files = Array.from(event.dataTransfer.files).filter((file) => Boolean(ALLOWED_UPLOAD_MIME_TYPES[file.type]));
    void uploadFiles(files);
  }

  function handlePaste(event: ClipboardEvent<HTMLFormElement>) {
    const files = Array.from(event.clipboardData.items)
      .filter((item) => item.type.startsWith('image/'))
      .map((item) => item.getAsFile())
      .filter((file): file is File => file !== null);
    if (!files.length) return;
    event.preventDefault();
    void uploadFiles(files);
  }

  async function archive(product: Product) {
    if (!window.confirm(`Archive ${product.name}? It will no longer appear in the storefront.`)) return;
    const response = await fetch(`/api/admin/products/${product.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    if (response.ok) { setMessage('Product archived.'); await load(); }
    else { const result = await response.json(); setError(result.error); }
  }

  const visible = products.filter((product) => `${product.name} ${product.brandRecord?.name || ''}`.toLowerCase().includes(search.toLowerCase()));

  return <>
    <header className="admin-header"><div><div className="admin-kicker">Catalog</div><h1>Products</h1><p>Create, update, archive, and merchandise your live catalog.</p></div><button className="admin-refresh" onClick={reset} title="Add product"><Plus size={18} /></button></header>
    {error && <div className="admin-error" role="alert">{error}</div>}{message && <div className="admin-success">{message}</div>}
    {canEdit && <form className="admin-form-panel" onSubmit={save} onPaste={handlePaste}>
      <div className="admin-panel-heading"><div><h2>{editingId ? 'Edit product' : 'Add product'}</h2><p>Required details are validated before they reach the database.</p></div>{editingId && <button type="button" className="admin-icon-button" onClick={reset}><X size={18} /></button>}</div>
      <div className="admin-form-grid">
        <label>Product name<input required minLength={2} maxLength={PRODUCT_NAME_MAX_LENGTH} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label>
        <label>Slug<input maxLength={PRODUCT_SLUG_MAX_LENGTH} value={form.slug} placeholder="Generated from name" onChange={(event) => setForm({ ...form, slug: event.target.value })} /></label>
        <label>Brand<select required value={form.brandId} onChange={(event) => setForm({ ...form, brandId: event.target.value })}><option value="">Select brand</option>{brands.filter((brand) => brand.isActive || brand.id === form.brandId).map((brand) => <option key={brand.id} value={brand.id}>{brand.name}{!brand.isActive ? ' (inactive)' : ''}</option>)}</select></label>
        <label>Category<select required value={form.categoryId} onChange={(event) => setForm({ ...form, categoryId: event.target.value })}><option value="">Select category</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
        <label>Price (LKR)<input required type="number" min="0" step="0.01" value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} /></label>
        <label>Discount price (LKR)<input type="number" min="0" step="0.01" value={form.discountPrice} onChange={(event) => setForm({ ...form, discountPrice: event.target.value })} /></label>
        <label>Initial/current stock<input required type="number" min="0" step="1" value={form.stockQty} onChange={(event) => setForm({ ...form, stockQty: event.target.value })} /></label>
        <label>Status<select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}><option>ACTIVE</option><option>DRAFT</option><option>ARCHIVED</option></select></label>
        <label className="admin-form-wide">Description<textarea required minLength={10} maxLength={PRODUCT_DESCRIPTION_MAX_LENGTH} rows={7} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Write a Markdown product description" /></label>
        <label className="admin-form-wide">Technical specifications<textarea maxLength={PRODUCT_SPECS_MAX_LENGTH} rows={8} value={form.specs} onChange={(event) => setForm({ ...form, specs: event.target.value })} placeholder="Write technical specifications in Markdown" /></label>
      </div>
      <div className="admin-form-section"><h3>Product photos</h3><div className={`admin-upload-row${isDraggingPhotos ? ' admin-upload-row-dragging' : ''}`} onDragOver={handleDragOver} onDragEnter={handleDragEnter} onDragLeave={handleDragLeave} onDrop={handleDrop}>{form.images.map((image) => <div className="admin-image-thumb" key={image}><img src={image} alt="Product preview" /><button type="button" onClick={() => setForm({ ...form, images: form.images.filter((item) => item !== image) })}><X size={14} /></button></div>)}<label className="admin-upload-button"><ImagePlus size={20} /> Upload photo<input type="file" multiple accept="image/png,image/jpeg,image/webp" onChange={upload} /></label></div><small>JPEG, PNG, or WebP up to 5MB each. You can also drag images here or paste from the clipboard.</small></div>
      <div className="admin-checkboxes"><label><input type="checkbox" checked={form.isFeatured} onChange={(event) => setForm({ ...form, isFeatured: event.target.checked })} /> Featured product</label><label><input type="checkbox" checked={form.isNewArrival} onChange={(event) => setForm({ ...form, isNewArrival: event.target.checked })} /> New arrival</label></div>
      <button className="btn-primary" disabled={saving}>{saving ? 'Saving...' : editingId ? 'Save product changes' : 'Create product'}</button>
    </form>}
    <section className="admin-panel admin-wide-panel"><div className="admin-panel-heading"><div><h2>Catalog inventory</h2><p>{visible.length} products from the database</p></div><div className="admin-search"><Search size={16} /><input placeholder="Search name or brand" value={search} onChange={(event) => setSearch(event.target.value)} /></div></div>{visible.length ? <div className="admin-table-wrap"><table><thead><tr><th>Product</th><th>Brand</th><th>Category</th><th>Price</th><th>Stock</th><th>Status</th><th>Actions</th></tr></thead><tbody>{visible.map((product) => <tr key={product.id}><td><strong>{product.name}</strong></td><td>{product.brandRecord?.name || 'Unassigned'}</td><td>{categories.find((category) => category.id === product.categoryId)?.name || 'Unassigned'}</td><td>LKR {(product.discountPrice ?? product.price).toLocaleString()}</td><td>{product.stockQty}</td><td><span className="admin-status">{product.status}</span></td><td><div className="admin-row-actions"><button onClick={() => selectProduct(product)} title="Edit"><Pencil size={16} /></button><button onClick={() => archive(product)} title="Archive"><Trash2 size={16} /></button></div></td></tr>)}</tbody></table></div> : <div className="admin-empty">No products match this search.</div>}</section>
  </>;
}
