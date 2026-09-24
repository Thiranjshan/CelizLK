'use client';

import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function BackButton({ label = 'Back' }: { label?: string }) {
  const router = useRouter();

  function goBack() {
    const hasInternalReferrer = document.referrer.startsWith(window.location.origin) && window.history.length > 1;
    if (hasInternalReferrer) router.back();
    else router.push('/');
  }

  return (
    <button type="button" onClick={goBack} className="page-back-button">
      <ArrowLeft size={16} /> {label}
    </button>
  );
}
