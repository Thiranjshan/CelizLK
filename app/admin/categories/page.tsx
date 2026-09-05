'use client';

import { FormEvent, useEffect, useState } from 'react';
import { LayoutGrid, Pencil, Trash2, X } from 'lucide-react';
import AdminAuthGate from '@/components/AdminAuthGate';

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  _count: { products: number };
}

export default function CategoriesPage() {
  return <AdminAuthGate active="categories">{(_, token) => <CategoriesManager token={token} />}</AdminAuthGate>;
}

function CategoriesManager({ token }: { token: string }) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState({ name: '', slug: '', description: '' });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  async function load() {
    const response = await fetch('/api/admin/categories', { headers: { Authorization: `Bearer ${token}` } });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error);
    setCategories(result);
  }

  useEffect(() => {
    load().catch((reason) => setError(reason instanceof Error ? reason.message : 'Failed to load categories.'));
  }, [token]);

  function reset() {
    setEditingId(null);
    setForm({ name: '', slug: '', description: '' });
  }

  function edit(category: Category) {
    setEditingId(category.id);
    setForm({ name: category.name, slug: category.slug, description: category.description || '' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    setError('');
    const response = await fetch(editingId ? `/api/admin/categories/${editingId}` : '/api/admin/categories', {
      method: editingId ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(form),
    });
    const result = await response.json();
    if (!response.ok) { setError(result.error); return; }
    setMessage(editingId ? 'Category updated.' : 'Category created.');
    reset();
    await load();
  }

  async function remove(category: Category) {
    if (category._count.products > 0 || !window.confirm(`Delete ${category.name}?`)) return;
    const response = await fetch(`/api/admin/categories/${category.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    if (!response.ok) { const result = await response.json(); setError(result.error); return; }
    setMessage('Category deleted.');
    await load();
  }

  return <>
    <header className="admin-header"><div><div className="admin-kicker">Catalog structure</div><h1>Categories</h1><p>Manage your product categories.</p></div><LayoutGrid size={30} color="var(--accent-purple)" /></header>
    {error && <div className="admin-error" role="alert">{error}</div>}
    {message && <div className="admin-success">{message}</div>}
    <form className="admin-form-panel" onSubmit={save}>
      <div className="admin-panel-heading"><div><h2>{editingId ? 'Edit category' : 'Create category'}</h2><p>Organize products in your catalog.</p></div>{editingId && <button type="button" className="admin-icon-button" onClick={reset}><X size={18} /></button>}</div>
      <div className="admin-form-grid"><label>Name<input required minLength={2} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label><label>Slug<input disabled={Boolean(editingId)} value={form.slug} placeholder="Generated from name" onChange={(event) => setForm({ ...form, slug: event.target.value })} /></label><label className="admin-form-wide">Description<textarea rows={3} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></label></div>
      <button className="btn-primary">{editingId ? 'Save category changes' : 'Create category'}</button>
    </form>
    <section className="admin-panel admin-wide-panel"><div className="admin-panel-heading"><div><h2>Current categories</h2><p>{categories.length} categories in the database</p></div></div>{categories.length ? <div className="admin-category-grid">{categories.map((category) => <article className="admin-category-card" key={category.id}><div><h3>{category.name}</h3><small>/{category.slug} · {category._count.products} products</small></div><p>{category.description || 'No description'}</p><div className="admin-row-actions"><button onClick={() => edit(category)} title="Edit category"><Pencil size={15} /> Edit</button><button className="admin-danger-button" onClick={() => remove(category)} disabled={category._count.products > 0}><Trash2 size={15} /> {category._count.products ? 'Has products' : 'Delete'}</button></div></article>)}</div> : <div className="admin-empty">No categories found.</div>}</section>
  </>;
}
