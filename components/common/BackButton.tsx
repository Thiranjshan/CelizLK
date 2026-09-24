'use client';

import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface BackButtonProps {
  label?: string;
  fallbackHref?: string;
  className?: string;
}

export default function BackButton({ label = 'Back', fallbackHref = '/', className }: BackButtonProps) {
  const router = useRouter();

  function goBack() {
    if (typeof window !== 'undefined') {
      const hasInternalReferrer =
        document.referrer &&
        document.referrer.startsWith(window.location.origin) &&
        window.history.length > 1;
      if (hasInternalReferrer) {
        router.back();
        return;
      }
    }
    router.push(fallbackHref);
  }

  return (
    <button
      type="button"
      onClick={goBack}
      className={className ? `page-back-button ${className}` : 'page-back-button'}
    >
      <ArrowLeft size={16} /> {label}
    </button>
  );
}
