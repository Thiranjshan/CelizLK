import React from 'react';
import Link from 'next/link';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionText?: string;
  actionLink?: string;
}

export default function EmptyState({
  icon: Icon,
  title,
  description,
  actionText,
  actionLink,
}: EmptyStateProps) {
  return (
    <div style={{ background: '#FFFFFF', padding: '4rem 1.5rem', textAlign: 'center', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      {Icon && <Icon size={40} color="var(--text-muted)" style={{ marginBottom: '1.25rem' }} />}
      <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-headline)', marginBottom: '0.5rem' }}>{title}</h2>
      <p style={{ color: 'var(--text-secondary)', maxWidth: '420px', fontSize: '0.95rem', margin: '0 auto 1.5rem', lineHeight: 1.6 }}>{description}</p>
      {actionText && actionLink && (
        <Link href={actionLink} className="btn-primary" style={{ padding: '0.75rem 1.5rem', fontSize: '0.9rem' }}>
          {actionText}
        </Link>
      )}
    </div>
  );
}
