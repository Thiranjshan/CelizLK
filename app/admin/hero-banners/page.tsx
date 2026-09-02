'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Edit2, Trash2, Eye, EyeOff } from 'lucide-react';
import AdminAuthGate from '@/components/AdminAuthGate';

interface HeroBanner {
  id: string;
  imageUrl: string;
  buttonLabel: string;
  buttonLink: string;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function HeroBannersPage() {
  return (
    <AdminAuthGate active="hero banners">
      {(_, token) => <HeroBannersManager token={token} />}
    </AdminAuthGate>
  );
}

function HeroBannersManager({ token }: { token: string }) {
  const [banners, setBanners] = useState<HeroBanner[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ imageUrl: '', buttonLabel: '', buttonLink: '', order: '', isActive: true });
  const [preview, setPreview] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadBanners();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadBanners() {
    try {
      const response = await fetch('/api/admin/hero-banners', {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      });
      if (response.ok) {
        setBanners(await response.json());
      }
    } catch {
      setError('Failed to load banners');
    } finally {
      setLoading(false);
    }
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    setError('');
    setSuccess('');

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

    setUploading(true);

    try {
      const form = new FormData();
      form.append('file', file);

      const response = await fetch('/api/admin/hero-banner-uploads', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || 'Failed to upload image.');
        return;
      }

      const data = await response.json();
      setFormData({ ...formData, imageUrl: data.url });
      setPreview(data.url);
      setSuccess('Image uploaded successfully!');

      // Reset the file input
      e.target.value = '';
    } catch {
      setError('Failed to upload image.');
    } finally {
      setUploading(false);
    }
  }

  function selectBanner(banner: HeroBanner) {
    setEditingId(banner.id);
    setFormData({
      imageUrl: banner.imageUrl,
      buttonLabel: banner.buttonLabel,
      buttonLink: banner.buttonLink,
      order: String(banner.order),
      isActive: banner.isActive,
    });
    setPreview(banner.imageUrl);
  }

  function resetForm() {
    setEditingId(null);
    setFormData({ imageUrl: '', buttonLabel: '', buttonLink: '', order: '', isActive: true });
    setPreview('');
    setError('');
  }

  async function save() {
    setError('');
    setSuccess('');

    try {
      const response = await fetch(
        editingId ? `/api/admin/hero-banners/${editingId}` : '/api/admin/hero-banners',
        {
          method: editingId ? 'PATCH' : 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(formData),
        },
      );

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || 'Failed to save banner');
        return;
      }

      setSuccess(editingId ? 'Banner updated!' : 'Banner created!');
      resetForm();
      loadBanners();
    } catch {
      setError('Failed to save banner');
    }
  }

  async function deleteBanner(banner: HeroBanner) {
    if (!confirm(`Delete banner "${banner.buttonLabel}"?`)) return;

    try {
      const response = await fetch(`/api/admin/hero-banners/${banner.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        setSuccess('Banner deleted!');
        loadBanners();
      }
    } catch {
      setError('Failed to delete banner');
    }
  }

  async function toggleBanner(banner: HeroBanner) {
    try {
      const response = await fetch(`/api/admin/hero-banners/${banner.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isActive: !banner.isActive }),
      });

      if (response.ok) {
        loadBanners();
      }
    } catch {
      setError('Failed to toggle banner');
    }
  }

  if (loading) return <p>Loading...</p>;

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Hero Banners</h1>

      {error && <div style={{ color: '#EF4444', marginBottom: '1rem' }}>{error}</div>}
      {success && <div style={{ color: '#10B981', marginBottom: '1rem' }}>{success}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
        {/* Form */}
        <div style={{ border: '1px solid #EAEAEA', padding: '1.5rem', borderRadius: '8px' }}>
          <h2>{editingId ? 'Edit Banner' : 'New Banner'}</h2>

          <div style={{ marginTop: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
              Upload Banner Image
            </label>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleImageUpload}
              disabled={uploading}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '2px dashed #EAEAEA',
                borderRadius: '4px',
                marginBottom: '0.5rem',
                cursor: uploading ? 'not-allowed' : 'pointer',
              }}
            />
            <p style={{ fontSize: '0.8rem', color: '#71717A', marginBottom: '1rem' }}>
              Recommended: <strong>1920 × 720 px</strong> (8:3 ratio) | Max: <strong>5MB</strong>
              <br />
              Supported: JPEG, PNG, WebP
            </p>
          </div>

          <div style={{ marginTop: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
              Image URL
            </label>
            <input
              type="text"
              placeholder="/uploads/banner.jpg or https://..."
              value={formData.imageUrl}
              onChange={(e) => {
                setFormData({ ...formData, imageUrl: e.target.value });
                setPreview(e.target.value);
              }}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #EAEAEA',
                borderRadius: '4px',
                marginBottom: '0.5rem',
              }}
            />
            <p style={{ fontSize: '0.8rem', color: '#71717A', marginBottom: '1rem' }}>
              Or paste an image URL manually
            </p>
          </div>

          <div style={{ marginTop: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
              Button Label
            </label>
            <input
              type="text"
              placeholder="Shop Now"
              value={formData.buttonLabel}
              onChange={(e) => setFormData({ ...formData, buttonLabel: e.target.value })}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #EAEAEA',
                borderRadius: '4px',
                marginBottom: '1rem',
              }}
            />
          </div>

          <div style={{ marginTop: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
              Button Link
            </label>
            <input
              type="text"
              placeholder="/products or /category/audio"
              value={formData.buttonLink}
              onChange={(e) => setFormData({ ...formData, buttonLink: e.target.value })}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #EAEAEA',
                borderRadius: '4px',
                marginBottom: '1rem',
              }}
            />
          </div>

          <div style={{ marginTop: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
              Order (Leave empty to append)
            </label>
            <input
              type="number"
              min="1"
              placeholder="1"
              value={formData.order}
              onChange={(e) => setFormData({ ...formData, order: e.target.value })}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #EAEAEA',
                borderRadius: '4px',
                marginBottom: '1rem',
              }}
            />
          </div>

          <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
            <button
              onClick={save}
              style={{
                flex: 1,
                padding: '0.75rem',
                backgroundColor: '#6D28D9',
                color: '#FFF',
                border: 'none',
                borderRadius: '4px',
                fontWeight: 600,
              }}
            >
              {editingId ? 'Update' : 'Create'}
            </button>
            {editingId && (
              <button
                onClick={resetForm}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  backgroundColor: '#E5E7EB',
                  color: '#111',
                  border: 'none',
                  borderRadius: '4px',
                  fontWeight: 600,
                }}
              >
                Cancel
              </button>
            )}
          </div>
        </div>

        {/* Preview */}
        <div style={{ border: '1px solid #EAEAEA', padding: '1.5rem', borderRadius: '8px' }}>
          <h2>Preview</h2>
          {preview && (
            <div
              style={{
                marginTop: '1rem',
                width: '100%',
                height: '300px',
                backgroundImage: `url(${preview})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'center',
                padding: '1rem',
              }}
            >
              <button
                style={{
                  backgroundColor: '#6D28D9',
                  color: '#FFF',
                  padding: '0.75rem 1.5rem',
                  border: 'none',
                  borderRadius: '4px',
                  fontWeight: 600,
                  marginBottom: '1rem',
                }}
              >
                {formData.buttonLabel || 'Button Label'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Banner List */}
      <div style={{ marginTop: '2rem' }}>
        <h2>Active Banners ({banners.length})</h2>
        <div style={{ marginTop: '1rem' }}>
          {banners.length === 0 ? (
            <p>No banners yet. Create one to get started!</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #EAEAEA' }}>
                  <th style={{ textAlign: 'left', padding: '1rem' }}>Order</th>
                  <th style={{ textAlign: 'left', padding: '1rem' }}>Preview</th>
                  <th style={{ textAlign: 'left', padding: '1rem' }}>Button Label</th>
                  <th style={{ textAlign: 'left', padding: '1rem' }}>Status</th>
                  <th style={{ textAlign: 'left', padding: '1rem' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {banners.map((banner) => (
                  <tr key={banner.id} style={{ borderBottom: '1px solid #EAEAEA' }}>
                    <td style={{ padding: '1rem' }}>#{banner.order}</td>
                    <td style={{ padding: '1rem' }}>
                      <Image
                        src={banner.imageUrl}
                        alt="preview"
                        width={80}
                        height={60}
                        style={{
                          objectFit: 'cover',
                          borderRadius: '4px',
                        }}
                        unoptimized
                      />
                    </td>
                    <td style={{ padding: '1rem' }}>{banner.buttonLabel}</td>
                    <td style={{ padding: '1rem' }}>
                      {banner.isActive ? (
                        <span style={{ color: '#10B981', fontWeight: 600 }}>Active</span>
                      ) : (
                        <span style={{ color: '#71717A', fontWeight: 600 }}>Inactive</span>
                      )}
                    </td>
                    <td style={{ padding: '1rem', display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={() => toggleBanner(banner)}
                        style={{
                          backgroundColor: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          color: '#6D28D9',
                        }}
                        title={banner.isActive ? 'Deactivate' : 'Activate'}
                      >
                        {banner.isActive ? <Eye size={16} /> : <EyeOff size={16} />}
                      </button>
                      <button
                        onClick={() => selectBanner(banner)}
                        style={{
                          backgroundColor: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          color: '#6D28D9',
                        }}
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => deleteBanner(banner)}
                        style={{
                          backgroundColor: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          color: '#EF4444',
                        }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
