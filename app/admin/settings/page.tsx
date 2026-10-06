'use client';

import { useEffect, useMemo, useState } from 'react';
import { Building2, CreditCard, Globe, MessageCircleMore, Save, Settings2, Truck } from 'lucide-react';
import AdminAuthGate from '@/components/AdminAuthGate';
import { defaultStoreSettings, type StoreSettings } from '@/lib/store-settings-data';

const sectionMeta = [
  { key: 'business', label: 'Business', icon: Building2 },
  { key: 'contact', label: 'Contact & WhatsApp', icon: MessageCircleMore },
  { key: 'payments', label: 'Payments', icon: CreditCard },
  { key: 'delivery', label: 'Delivery', icon: Truck },
  { key: 'social', label: 'Social Media', icon: Globe },
  { key: 'website', label: 'Website', icon: Settings2 },
] as const;

export default function StoreSettingsPage() {
  return <AdminAuthGate active="settings">{(_, token) => <SettingsEditor token={token} />}</AdminAuthGate>;
}

function SettingsEditor({ token }: { token: string }) {
  const [settings, setSettings] = useState<StoreSettings>(defaultStoreSettings);
  const [activeSection, setActiveSection] = useState<(typeof sectionMeta)[number]['key']>('business');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    let mounted = true;

    fetch('/api/admin/settings', { headers: { Authorization: `Bearer ${token}` } })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Unable to load settings.');
        if (mounted) setSettings({ ...defaultStoreSettings, ...data });
      })
      .catch((reason) => mounted && setError(reason instanceof Error ? reason.message : 'Unable to load settings.'))
      .finally(() => mounted && setLoading(false));

    return () => { mounted = false; };
  }, [token]);

  const activeMeta = useMemo(
    () => sectionMeta.find((section) => section.key === activeSection) ?? sectionMeta[0],
    [activeSection]
  );

  const updateField = (section: keyof StoreSettings, field: string, value: string | number) => {
    setSettings((current) => ({
      ...current,
      [section]: {
        ...current[section],
        [field]: value,
      },
    }));
    setError('');
    setSuccess('');
  };

  const saveSettings = async () => {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(settings),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to save settings.');
      setSettings({ ...defaultStoreSettings, ...data });
      setSuccess('Store settings saved successfully.');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to save settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <header className="admin-header">
        <div>
          <div className="admin-kicker">Store configuration</div>
          <h1>Store Settings</h1>
          <p>Manage the business details, contact information, payment instructions, and public storefront branding.</p>
        </div>
      </header>

      {error && <div className="admin-error">{error}</div>}
      {success && <div className="admin-success" style={{ marginBottom: '1rem' }}>{success}</div>}

      {loading ? (
        <div className="admin-empty">Loading settings…</div>
      ) : (
        <div style={{ display: 'grid', gap: '1.25rem' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
            {sectionMeta.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                type="button"
                onClick={() => setActiveSection(key)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 0.95rem', borderRadius: 'var(--radius-md)',
                  border: activeSection === key ? '1px solid var(--accent-purple)' : '1px solid var(--border-color)',
                  background: activeSection === key ? 'rgba(109, 40, 217, 0.08)' : 'var(--bg-white)',
                  color: activeSection === key ? 'var(--accent-purple)' : 'var(--text-main)',
                  fontWeight: 700, cursor: 'pointer',
                }}
              >
                <Icon size={16} /> {label}
              </button>
            ))}
          </div>

          <section className="admin-panel">
            <div className="admin-panel-heading">
              <div>
                <h2>{activeMeta.label}</h2>
                <p>{renderDescription(activeMeta.key)}</p>
              </div>
              <button className="btn-primary" onClick={saveSettings} disabled={saving}>
                <Save size={16} /> {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>

            <div style={{ display: 'grid', gap: '1rem' }}>
              {renderSection(activeSection, settings, updateField)}
            </div>
          </section>
        </div>
      )}
    </>
  );
}

function renderDescription(section: (typeof sectionMeta)[number]['key']) {
  const descriptions: Record<string, string> = {
    business: 'Core business information shown throughout the website and admin workflows.',
    contact: 'Customer support and WhatsApp contact details used in the storefront and order flows.',
    payments: 'Bank transfer and payment instructions used at checkout and order confirmation.',
    delivery: 'Delivery fee and delivery instructions shown to customers in checkout and delivery information pages.',
    social: 'Social links used in the website footer and contact areas.',
    website: 'Storefront branding and metadata used for the website identity and SEO.',
  };

  return descriptions[section] || 'Store configuration';
}

function renderSection(section: (typeof sectionMeta)[number]['key'], settings: StoreSettings, updateField: (section: keyof StoreSettings, field: string, value: string | number) => void) {
  switch (section) {
    case 'business':
      return (
        <>
          <Field label="Store Name" value={settings.business.storeName} onChange={(value) => updateField('business', 'storeName', value)} />
          <Field label="Legal / Business Name" value={settings.business.legalName} onChange={(value) => updateField('business', 'legalName', value)} />
          <Field label="Business Email" value={settings.business.email} type="email" onChange={(value) => updateField('business', 'email', value)} />
          <Field label="Primary Phone" value={settings.business.phone} onChange={(value) => updateField('business', 'phone', value)} />
          <Field label="Address Line 1" value={settings.business.addressLine1} onChange={(value) => updateField('business', 'addressLine1', value)} />
          <Field label="Address Line 2" value={settings.business.addressLine2} onChange={(value) => updateField('business', 'addressLine2', value)} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            <Field label="City" value={settings.business.city} onChange={(value) => updateField('business', 'city', value)} />
            <Field label="District" value={settings.business.district} onChange={(value) => updateField('business', 'district', value)} />
            <Field label="Country" value={settings.business.country} onChange={(value) => updateField('business', 'country', value)} />
          </div>
          <Field label="Business Hours" value={settings.business.businessHours} onChange={(value) => updateField('business', 'businessHours', value)} />
        </>
      );
    case 'contact':
      return (
        <>
          <Field label="WhatsApp Number" value={settings.contact.whatsappNumber} onChange={(value) => updateField('contact', 'whatsappNumber', value)} />
          <Field label="WhatsApp Default Message" value={settings.contact.whatsappMessage} onChange={(value) => updateField('contact', 'whatsappMessage', value)} />
          <Field label="Support Phone" value={settings.contact.supportPhone} onChange={(value) => updateField('contact', 'supportPhone', value)} />
          <Field label="Support Email" value={settings.contact.supportEmail} type="email" onChange={(value) => updateField('contact', 'supportEmail', value)} />
        </>
      );
    case 'payments':
      return (
        <>
          <Field label="Bank Name" value={settings.payments.bankName} onChange={(value) => updateField('payments', 'bankName', value)} />
          <Field label="Account Name" value={settings.payments.accountName} onChange={(value) => updateField('payments', 'accountName', value)} />
          <Field label="Account Number" value={settings.payments.accountNumber} onChange={(value) => updateField('payments', 'accountNumber', value)} />
          <Field label="Branch" value={settings.payments.branch} onChange={(value) => updateField('payments', 'branch', value)} />
          <Field label="Payment Instructions" value={settings.payments.instructions} large onChange={(value) => updateField('payments', 'instructions', value)} />
        </>
      );
    case 'delivery':
      return (
        <>
          <Field label="Delivery Fee (LKR)" value={String(settings.delivery.fee)} type="number" onChange={(value) => updateField('delivery', 'fee', Number(value || 0))} />
          <Field label="Free Delivery Threshold (LKR)" value={String(settings.delivery.freeDeliveryThreshold)} type="number" onChange={(value) => updateField('delivery', 'freeDeliveryThreshold', Number(value || 0))} />
          <Field label="Delivery Instructions" value={settings.delivery.instructions} large onChange={(value) => updateField('delivery', 'instructions', value)} />
        </>
      );
    case 'social':
      return (
        <>
          <Field label="Facebook URL" value={settings.social.facebook} onChange={(value) => updateField('social', 'facebook', value)} />
          <Field label="Instagram URL" value={settings.social.instagram} onChange={(value) => updateField('social', 'instagram', value)} />
          <Field label="TikTok URL" value={settings.social.tiktok} onChange={(value) => updateField('social', 'tiktok', value)} />
          <Field label="YouTube URL" value={settings.social.youtube} onChange={(value) => updateField('social', 'youtube', value)} />
        </>
      );
    case 'website':
      return (
        <>
          <Field label="Website Title" value={settings.website.title} onChange={(value) => updateField('website', 'title', value)} />
          <Field label="Meta Description" value={settings.website.metaDescription} large onChange={(value) => updateField('website', 'metaDescription', value)} />
          <Field label="Copyright Text" value={settings.headerFooter.copyrightText} onChange={(value) => updateField('headerFooter', 'copyrightText', value)} />
          <Field label="Support Text" value={settings.headerFooter.supportText} onChange={(value) => updateField('headerFooter', 'supportText', value)} />
        </>
      );
    default:
      return null;
  }
}

function Field({ label, value, type = 'text', large = false, onChange }: { label: string; value: string | number; type?: string; large?: boolean; onChange: (value: string) => void; }) {
  return (
    <label style={{ display: 'grid', gap: '0.55rem', color: 'var(--text-main)', fontWeight: 700, fontSize: '0.88rem' }}>
      {label}
      <input
        value={value}
        type={type}
        onChange={(event) => onChange(event.target.value)}
        style={{
          width: '100%', padding: '0.85rem 0.9rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)',
          background: 'var(--bg-white)', color: 'var(--text-main)', fontSize: '0.96rem', minHeight: large ? 110 : 48,
        }}
      />
    </label>
  );
}
