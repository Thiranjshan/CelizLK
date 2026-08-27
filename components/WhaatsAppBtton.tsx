'use client';

import { FaWhatsapp } from 'react-icons/fa';
import { usePathname } from 'next/navigation';

export default function WhatsAppButton() {
  const pathname = usePathname();

  // Pages where WhatsApp button should NOT appear
  const hiddenPaths = [
    '/order-success',
    '/checkout',
    '/admin',
  ];

  const shouldHide = hiddenPaths.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );

  if (shouldHide) return null;

  const phoneNumber = '94751205996'; // Your WhatsApp number

  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(
    'Hello Celiz LK, I have a question about a product.'
  )}`;

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="whatsapp-floating-btn"
      aria-label="Chat with Celiz LK on WhatsApp"
    >
      <FaWhatsapp />
    </a>
  );
}