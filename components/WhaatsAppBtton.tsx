'use client';

import { useEffect, useState } from 'react';
import { FaWhatsapp } from 'react-icons/fa';
import { usePathname } from 'next/navigation';
import { defaultStoreSettings, type StoreSettings } from '@/lib/store-settings-data';

export default function WhatsAppButton() {
  const pathname = usePathname();
  const [settings, setSettings] = useState<StoreSettings>(defaultStoreSettings);

  useEffect(() => {
    fetch('/api/settings')
      .then(async (response) => response.ok ? response.json() : null)
      .then((data) => data && setSettings({ ...defaultStoreSettings, ...data }))
      .catch(() => undefined);
  }, []);

  const hiddenPaths = [
    '/order-success',
    '/checkout',
    '/admin',
    '/login',
    '/signup',
  ];

  const shouldHide = hiddenPaths.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );

  if (shouldHide) return null;

  const phoneNumber = (settings.contact.whatsappNumber || '94751205996').replace(/\D/g, '');
  if (!phoneNumber) return null;

  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(
    settings.contact.whatsappMessage || 'Hello Celiz LK, I have a question about a product.'
  )}`;

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="whatsapp-floating-btn"
      aria-label={`Chat with ${settings.business.storeName} on WhatsApp`}
    >
      <FaWhatsapp />
    </a>
  );
}