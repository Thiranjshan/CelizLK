'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { 
  Sparkles, 
  ArrowUp, 
  ArrowDown, 
  Eye, 
  EyeOff, 
  Pencil, 
  Trash2, 
  Upload, 
  X, 
  CheckCircle2, 
  AlertCircle,
  ImageIcon,
  ExternalLink,
  Layers,
  RotateCcw
} from 'lucide-react';
import AdminAuthGate from '@/components/AdminAuthGate';

interface CategorySummary {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  description: string | null;
  _count?: { products: number };
}

interface FeaturedCategory {
  id: string;
  categoryId: string;
  category: CategorySummary;
  imageUrl: string | null;
  title: string | null;
  description: string | null;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function FeaturedCategoriesAdminPage() {
  return (
    <AdminAuthGate active="bento collections">
      {(_, token) => <FeaturedCategoriesManager token={token} />}
    </AdminAuthGate>
  );
}

function FeaturedCategoriesManager({ token }: { token: string }) {
  const [items, setItems] = useState<FeaturedCategory[]>([]);
  const [availableCategories, setAvailableCategories] = useState<CategorySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [uploading, setUploading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Deletion modal state
  const [deletingItem, setDeletingItem] = useState<FeaturedCategory | null>(null);
  const [showClearAllModal, setShowClearAllModal] = useState(false);

  // Form state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [categoryId, setCategoryId] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [order, setOrder] = useState<number | ''>('');
  const [isActive, setIsActive] = useState(true);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function loadData() {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/featured-categories', {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to load featured categories');
      }
      const data = await response.json();
      setItems(data.items || []);
      setAvailableCategories(data.availableCategories || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setEditingId(null);
    setCategoryId('');
    setImageUrl('');
    setTitle('');
    setDescription('');
    setOrder('');
    setIsActive(true);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function startEdit(item: FeaturedCategory) {
    setEditingId(item.id);
    setCategoryId(item.categoryId);
    setImageUrl(item.imageUrl || '');
    setTitle(item.title || '');
    setDescription(item.description || '');
    setOrder(item.order);
    setIsActive(item.isActive);
    setError('');
    setSuccess('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  const selectedCategory = availableCategories.find((c) => c.id === categoryId);

  // Selectable categories: unassigned categories + the current category if editing
  const selectableCategories = availableCategories.filter(
    (cat) => !items.some((item) => item.categoryId === cat.id) || cat.id === categoryId
  );

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Please upload a JPEG, PNG, or WebP image.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be smaller than 5MB.');
      return;
    }

    setError('');
    setUploading(true);

    try {
      const form = new FormData();
      form.append('file', file);

      const response = await fetch('/api/admin/featured-category-uploads', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to upload image.');

      setImageUrl(data.url);
      setSuccess('Image uploaded successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!categoryId) {
      setError('Please select a category.');
      return;
    }

    setActionLoading(true);

    try {
      if (editingId) {
        // Update existing item
        const response = await fetch(`/api/admin/featured-categories/${editingId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            categoryId,
            imageUrl: imageUrl.trim() || null,
            title: title.trim() || null,
            description: description.trim() || null,
            order: order === '' ? null : Number(order),
            isActive,
          }),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to update category.');

        setSuccess(`Updated "${data.title || data.category.name}" in Bento Grid!`);
      } else {
        // Create new featured category
        const response = await fetch('/api/admin/featured-categories', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            categoryId,
            imageUrl: imageUrl.trim() || null,
            title: title.trim() || null,
            description: description.trim() || null,
            order: order === '' ? null : Number(order),
            isActive,
          }),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to add category.');

        setSuccess(`Added "${data.category.name}" to Bento Grid!`);
      }

      resetForm();
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Operation failed');
    } finally {
      setActionLoading(false);
    }
  }

  async function confirmDeleteItem() {
    if (!deletingItem) return;

    setActionLoading(true);
    try {
      const response = await fetch(`/api/admin/featured-categories/${deletingItem.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to remove category.');
      }

      setSuccess(`Removed "${deletingItem.category.name}" from Bento Grid.`);
      if (editingId === deletingItem.id) resetForm();
      setDeletingItem(null);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete');
    } finally {
      setActionLoading(false);
    }
  }

  async function confirmClearAll() {
    setActionLoading(true);
    try {
      const response = await fetch('/api/admin/featured-categories', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to clear Bento Grid.');
      }

      setSuccess('Cleared all categories from Bento Grid.');
      resetForm();
      setShowClearAllModal(false);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clear');
    } finally {
      setActionLoading(false);
    }
  }

  async function handlePopulateDefaults() {
    setActionLoading(true);
    setError('');
    setSuccess('');

    try {
      for (let i = 0; i < availableCategories.length; i++) {
        const cat = availableCategories[i];
        if (!items.some((item) => item.categoryId === cat.id)) {
          await fetch('/api/admin/featured-categories', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              categoryId: cat.id,
              order: items.length + i + 1,
              isActive: true,
              imageUrl: cat.imageUrl,
            }),
          });
        }
      }

      setSuccess('Populated root categories into Bento Grid!');
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to populate defaults');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleToggleActive(item: FeaturedCategory) {
    try {
      const response = await fetch(`/api/admin/featured-categories/${item.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isActive: !item.isActive }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to toggle status.');
      }

      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Toggle failed');
    }
  }

  async function handleMoveOrder(item: FeaturedCategory, direction: 'up' | 'down') {
    const currentIndex = items.findIndex((i) => i.id === item.id);
    if (currentIndex === -1) return;
    if (direction === 'up' && currentIndex === 0) return;
    if (direction === 'down' && currentIndex === items.length - 1) return;

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    const targetOrder = items[targetIndex].order;

    try {
      const response = await fetch(`/api/admin/featured-categories/${item.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ order: targetOrder }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to move order.');
      }

      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reorder failed');
    }
  }

  return (
    <>
      {/* Header */}
      <header className="admin-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div className="admin-kicker">Homepage Bento Grid</div>
          <h1>Featured Collections</h1>
          <p>Update, reorder, or delete categories displayed on the homepage Bento Grid.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {items.length > 0 && (
            <button
              type="button"
              onClick={() => setShowClearAllModal(true)}
              className="btn-secondary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 0.85rem', fontSize: '0.85rem', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)', borderRadius: '6px' }}
            >
              <Trash2 size={14} /> Clear All
            </button>
          )}
          <span style={{ 
            fontSize: '0.85rem', 
            fontWeight: 600, 
            background: 'rgba(124, 58, 237, 0.12)', 
            color: 'var(--accent-purple)', 
            padding: '0.4rem 0.8rem', 
            borderRadius: '999px',
            border: '1px solid rgba(124, 58, 237, 0.25)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem'
          }}>
            <Sparkles size={14} />
            {items.filter(i => i.isActive).length} Active on Homepage
          </span>
          <Link
            href="/#collections"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', textDecoration: 'none', padding: '0.5rem 0.9rem', fontSize: '0.85rem', borderRadius: '6px' }}
          >
            <span>View on Site</span>
            <ExternalLink size={14} />
          </Link>
        </div>
      </header>

      {/* Notifications */}
      {error && (
        <div className="admin-error" role="alert" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
          <AlertCircle size={18} />
          <span>{error}</span>
          <button type="button" onClick={() => setError('')} style={{ marginLeft: 'auto', background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer' }}>
            <X size={16} />
          </button>
        </div>
      )}
      {success && (
        <div className="admin-success" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
          <CheckCircle2 size={18} />
          <span>{success}</span>
          <button type="button" onClick={() => setSuccess('')} style={{ marginLeft: 'auto', background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer' }}>
            <X size={16} />
          </button>
        </div>
      )}

      {/* Confirmation Modal for Single Delete */}
      {deletingItem && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
          backdropFilter: 'blur(4px)',
        }}>
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            padding: '1.75rem',
            maxWidth: '460px',
            width: '100%',
            boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#ef4444', marginBottom: '1rem' }}>
              <Trash2 size={24} />
              <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--text-primary)' }}>Remove from Bento Grid?</h3>
            </div>
            <p style={{ margin: '0 0 1rem', fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Are you sure you want to remove <strong style={{ color: 'var(--text-primary)' }}>&ldquo;{deletingItem.title || deletingItem.category.name}&rdquo;</strong> from the homepage Bento Grid?
            </p>
            <p style={{ margin: '0 0 1.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)', background: 'rgba(255, 255, 255, 0.04)', padding: '0.6rem 0.8rem', borderRadius: '6px' }}>
              ✓ The catalog category, its subcategories, and all product listings remain completely intact.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                type="button"
                className="btn-secondary"
                disabled={actionLoading}
                onClick={() => setDeletingItem(null)}
                style={{ padding: '0.6rem 1.2rem', borderRadius: '6px' }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={confirmDeleteItem}
                style={{
                  background: '#ef4444',
                  color: '#fff',
                  border: 'none',
                  padding: '0.6rem 1.2rem',
                  borderRadius: '6px',
                  fontWeight: 600,
                  cursor: actionLoading ? 'wait' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                }}
              >
                {actionLoading ? 'Removing...' : 'Yes, Remove Category'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Clear All */}
      {showClearAllModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
          backdropFilter: 'blur(4px)',
        }}>
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            padding: '1.75rem',
            maxWidth: '460px',
            width: '100%',
            boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#ef4444', marginBottom: '1rem' }}>
              <Trash2 size={24} />
              <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--text-primary)' }}>Clear Entire Bento Grid?</h3>
            </div>
            <p style={{ margin: '0 0 1rem', fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              This will remove all {items.length} categories from the homepage Bento Grid section.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                type="button"
                className="btn-secondary"
                disabled={actionLoading}
                onClick={() => setShowClearAllModal(false)}
                style={{ padding: '0.6rem 1.2rem', borderRadius: '6px' }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={confirmClearAll}
                style={{
                  background: '#ef4444',
                  color: '#fff',
                  border: 'none',
                  padding: '0.6rem 1.2rem',
                  borderRadius: '6px',
                  fontWeight: 600,
                  cursor: actionLoading ? 'wait' : 'pointer',
                }}
              >
                {actionLoading ? 'Clearing...' : 'Clear All'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Grid: Form + List */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(340px, 440px) 1fr', gap: '2rem', alignItems: 'start' }}>
        
        {/* Editor Form */}
        <form className="admin-form-panel" onSubmit={handleSubmit} style={{ margin: 0 }}>
          <div className="admin-panel-heading" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ fontSize: '1.25rem', margin: 0 }}>{editingId ? 'Update Bento Category' : 'Feature a Category'}</h2>
              <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                {editingId ? 'Modify category, custom image, order, or remove.' : 'Add a category to the homepage editorial bento grid.'}
              </p>
            </div>
            {editingId && (
              <button
                type="button"
                className="admin-icon-button"
                onClick={resetForm}
                title="Cancel editing"
                style={{ background: 'transparent', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '0.35rem', cursor: 'pointer', color: 'var(--text-secondary)' }}
              >
                <X size={18} />
              </button>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginTop: '1.25rem' }}>
            
            {/* Category Selector */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                <label style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                  Target Category <span style={{ color: 'var(--error)' }}>*</span>
                </label>
                {editingId && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--accent-purple)' }}>Editing #{order}</span>
                )}
              </div>
              <select
                value={categoryId}
                onChange={(e) => {
                  setCategoryId(e.target.value);
                  const selected = availableCategories.find((c) => c.id === e.target.value);
                  if (selected && (!imageUrl || imageUrl === selectedCategory?.imageUrl) && selected.imageUrl) {
                    setImageUrl(selected.imageUrl);
                  }
                }}
                required
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '6px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-main)',
                  color: 'var(--text-primary)',
                  fontSize: '0.95rem',
                }}
              >
                <option value="">-- Choose Category --</option>
                {selectableCategories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name} {cat._count ? `(${cat._count.products} products)` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Image Upload & URL */}
            <div style={{ border: '1px solid var(--border-color)', padding: '1rem', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.02)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <label style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                  Bento Card Background Image
                </label>
                {selectedCategory?.imageUrl && imageUrl !== selectedCategory.imageUrl && (
                  <button
                    type="button"
                    onClick={() => setImageUrl(selectedCategory.imageUrl || '')}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--accent-purple)',
                      fontSize: '0.78rem',
                      cursor: 'pointer',
                      textDecoration: 'underline',
                      padding: 0,
                    }}
                  >
                    Use Category Image
                  </button>
                )}
              </div>

              {/* Upload Input */}
              <div style={{ marginBottom: '0.75rem' }}>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  style={{ display: 'none' }}
                  id="bento-image-upload"
                />
                <label
                  htmlFor="bento-image-upload"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    padding: '0.65rem 1rem',
                    border: '1px dashed var(--border-color)',
                    borderRadius: '6px',
                    cursor: uploading ? 'wait' : 'pointer',
                    background: 'var(--bg-card)',
                    fontSize: '0.85rem',
                    fontWeight: 500,
                  }}
                >
                  <Upload size={16} />
                  <span>{uploading ? 'Uploading image...' : 'Upload Image (JPEG, PNG, WebP ≤ 5MB)'}</span>
                </label>
              </div>

              {/* Manual URL input */}
              <input
                type="text"
                placeholder="Or paste image URL (e.g. /uploads/image.webp)"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.6rem 0.75rem',
                  borderRadius: '6px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-main)',
                  color: 'var(--text-primary)',
                  fontSize: '0.85rem',
                }}
              />

              {/* Thumbnail Preview */}
              {imageUrl && (
                <div style={{ marginTop: '0.75rem', position: 'relative', width: '100%', height: '140px', borderRadius: '6px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                  <Image
                    src={imageUrl}
                    alt="Preview"
                    fill
                    style={{ objectFit: 'cover' }}
                    unoptimized
                  />
                  <button
                    type="button"
                    onClick={() => setImageUrl('')}
                    style={{
                      position: 'absolute',
                      top: '6px',
                      right: '6px',
                      background: 'rgba(0, 0, 0, 0.7)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '50%',
                      width: '24px',
                      height: '24px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                    }}
                    title="Remove image"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}
              <p style={{ margin: '0.5rem 0 0', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                Recommended: 800×600 px or landscape photo. If left empty, falls back to category or product image.
              </p>
            </div>

            {/* Display Order & Active status */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 600, fontSize: '0.9rem' }}>
                  Display Order
                </label>
                <input
                  type="number"
                  min={1}
                  placeholder={editingId ? String(order) : `Auto (${items.length + 1})`}
                  value={order}
                  onChange={(e) => setOrder(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.75rem',
                    borderRadius: '6px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-main)',
                    color: 'var(--text-primary)',
                    fontSize: '0.9rem',
                  }}
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>1 = Top Left card</span>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 600, fontSize: '0.9rem' }}>
                  Visibility
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', padding: '0.65rem 0' }}>
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  <span style={{ fontSize: '0.9rem' }}>Active on Homepage</span>
                </label>
              </div>
            </div>

            {/* Optional Overrides */}
            <div>
              <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 600, fontSize: '0.9rem' }}>
                Custom Title Override <span style={{ fontWeight: 400, color: 'var(--text-secondary)', fontSize: '0.8rem' }}>(optional)</span>
              </label>
              <input
                type="text"
                placeholder={selectedCategory?.name || 'Default category name'}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.75rem',
                  borderRadius: '6px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-main)',
                  color: 'var(--text-primary)',
                  fontSize: '0.9rem',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 600, fontSize: '0.9rem' }}>
                Custom Description Override <span style={{ fontWeight: 400, color: 'var(--text-secondary)', fontSize: '0.8rem' }}>(optional)</span>
              </label>
              <textarea
                rows={2}
                placeholder={selectedCategory?.description || 'Default category description'}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.75rem',
                  borderRadius: '6px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-main)',
                  color: 'var(--text-primary)',
                  fontSize: '0.9rem',
                }}
              />
            </div>

            {/* Form Actions */}
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
              <button
                type="submit"
                disabled={actionLoading}
                className="btn-primary"
                style={{ flex: 1, padding: '0.75rem', fontSize: '0.95rem', fontWeight: 600, borderRadius: '6px', cursor: actionLoading ? 'wait' : 'pointer' }}
              >
                {actionLoading ? 'Saving...' : editingId ? 'Update Bento Item' : 'Add to Bento Grid'}
              </button>

              {editingId && (
                <>
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => {
                      const item = items.find((i) => i.id === editingId);
                      if (item) setDeletingItem(item);
                    }}
                    style={{
                      background: 'rgba(239, 68, 68, 0.1)',
                      color: '#ef4444',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      padding: '0.75rem 1rem',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      fontSize: '0.9rem',
                      fontWeight: 500,
                    }}
                    title="Delete this item from Bento Grid"
                  >
                    <Trash2 size={16} /> Delete
                  </button>

                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={resetForm}
                    style={{ padding: '0.75rem 1.25rem', borderRadius: '6px', cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                </>
              )}
            </div>

          </div>
        </form>

        {/* List of Featured Categories */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <h2 style={{ fontSize: '1.25rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Layers size={18} color="var(--accent-purple)" />
              Configured Bento Cards ({items.length})
            </h2>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Card column spans auto-balance (7-col / 5-col / 12-col)
            </span>
          </div>

          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
              Loading featured categories...
            </div>
          ) : items.length === 0 ? (
            <div style={{ 
              padding: '3rem 2rem', 
              textAlign: 'center', 
              border: '1px dashed var(--border-color)', 
              borderRadius: '8px', 
              background: 'var(--bg-card)',
              color: 'var(--text-secondary)' 
            }}>
              <ImageIcon size={40} style={{ margin: '0 auto 1rem', opacity: 0.4 }} />
              <p style={{ fontWeight: 600, margin: '0 0 0.5rem', color: 'var(--text-primary)' }}>No categories currently in the Bento Grid.</p>
              <p style={{ fontSize: '0.85rem', margin: '0 0 1.5rem' }}>Add individual categories on the left, or restore all default root categories with 1 click.</p>
              <button
                type="button"
                onClick={handlePopulateDefaults}
                disabled={actionLoading}
                className="btn-secondary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.65rem 1.25rem', borderRadius: '6px', cursor: 'pointer' }}
              >
                <RotateCcw size={16} /> Populate All Default Root Categories
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {items.map((item, index) => {
                const isSelected = editingId === item.id;
                const displayImage = item.imageUrl || item.category.imageUrl;

                return (
                  <div
                    key={item.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem',
                      padding: '0.9rem 1rem',
                      borderRadius: '8px',
                      background: isSelected ? 'rgba(124, 58, 237, 0.08)' : 'var(--bg-card)',
                      border: isSelected ? '1px solid var(--accent-purple)' : '1px solid var(--border-color)',
                      transition: 'all 0.2s ease',
                      opacity: item.isActive ? 1 : 0.65,
                    }}
                  >
                    {/* Order Controls */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                      <button
                        type="button"
                        disabled={index === 0}
                        onClick={() => handleMoveOrder(item, 'up')}
                        title="Move Up"
                        style={{
                          background: 'none',
                          border: 'none',
                          color: index === 0 ? 'var(--border-color)' : 'var(--text-primary)',
                          cursor: index === 0 ? 'default' : 'pointer',
                          padding: '2px',
                          display: 'flex',
                        }}
                      >
                        <ArrowUp size={15} />
                      </button>
                      <span style={{ 
                        fontSize: '0.78rem', 
                        fontWeight: 700, 
                        width: '24px', 
                        height: '24px', 
                        borderRadius: '50%', 
                        background: 'rgba(255, 255, 255, 0.06)', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        color: 'var(--text-primary)'
                      }}>
                        {item.order}
                      </span>
                      <button
                        type="button"
                        disabled={index === items.length - 1}
                        onClick={() => handleMoveOrder(item, 'down')}
                        title="Move Down"
                        style={{
                          background: 'none',
                          border: 'none',
                          color: index === items.length - 1 ? 'var(--border-color)' : 'var(--text-primary)',
                          cursor: index === items.length - 1 ? 'default' : 'pointer',
                          padding: '2px',
                          display: 'flex',
                        }}
                      >
                        <ArrowDown size={15} />
                      </button>
                    </div>

                    {/* Thumbnail */}
                    <div style={{ 
                      position: 'relative', 
                      width: '64px', 
                      height: '64px', 
                      borderRadius: '6px', 
                      overflow: 'hidden', 
                      background: 'rgba(0, 0, 0, 0.2)',
                      border: '1px solid var(--border-color)',
                      flexShrink: 0
                    }}>
                      {displayImage ? (
                        <Image
                          src={displayImage}
                          alt={item.category.name}
                          fill
                          style={{ objectFit: 'cover' }}
                          unoptimized
                        />
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
                          <ImageIcon size={20} />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0, cursor: 'pointer' }} onClick={() => startEdit(item)}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>
                          {item.title || item.category.name}
                        </h3>
                        {item.title && (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                            ({item.category.name})
                          </span>
                        )}
                        {!item.isActive && (
                          <span style={{ 
                            fontSize: '0.7rem', 
                            background: 'rgba(239, 68, 68, 0.15)', 
                            color: '#ef4444', 
                            padding: '0.15rem 0.5rem', 
                            borderRadius: '4px',
                            fontWeight: 600 
                          }}>
                            Hidden
                          </span>
                        )}
                      </div>
                      <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        Slug: <code>{item.category.slug}</code> • {item.description || item.category.description || 'No description'}
                      </p>
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <button
                        type="button"
                        onClick={() => handleToggleActive(item)}
                        title={item.isActive ? 'Hide on Homepage' : 'Show on Homepage'}
                        style={{
                          background: 'none',
                          border: '1px solid var(--border-color)',
                          borderRadius: '6px',
                          padding: '0.45rem',
                          cursor: 'pointer',
                          color: item.isActive ? 'var(--accent-purple)' : 'var(--text-secondary)',
                          display: 'flex',
                        }}
                      >
                        {item.isActive ? <Eye size={16} /> : <EyeOff size={16} />}
                      </button>

                      <button
                        type="button"
                        onClick={() => startEdit(item)}
                        title="Edit Bento card"
                        style={{
                          background: isSelected ? 'var(--accent-purple)' : 'none',
                          border: '1px solid var(--border-color)',
                          borderRadius: '6px',
                          padding: '0.45rem',
                          cursor: 'pointer',
                          color: isSelected ? '#fff' : 'var(--text-primary)',
                          display: 'flex',
                        }}
                      >
                        <Pencil size={16} />
                      </button>

                      <button
                        type="button"
                        onClick={() => setDeletingItem(item)}
                        title="Remove from Bento Grid"
                        style={{
                          background: 'none',
                          border: '1px solid var(--border-color)',
                          borderRadius: '6px',
                          padding: '0.45rem',
                          cursor: 'pointer',
                          color: '#ef4444',
                          display: 'flex',
                        }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>
          )}

          {/* Mini Layout Guide */}
          <div style={{ marginTop: '2rem', padding: '1.25rem', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'var(--bg-card)' }}>
            <h4 style={{ margin: '0 0 0.5rem', fontSize: '0.9rem', fontWeight: 600 }}>Homepage Grid Pattern Reference</h4>
            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              The Bento Grid pairs items symmetrically in alternating <strong>7-column wide</strong> and <strong>5-column wide</strong> editorial banners. When the card count leaves remainder cards at the bottom, they automatically stretch to balanced 6-column or full 12-column spans.
            </p>
          </div>
        </div>

      </div>
    </>
  );
}
