'use client';

import { useState } from 'react';
import Link from 'next/link';

interface SortOption {
  value: string;
  label: string;
  href: string;
}

interface ProductSortSelectProps {
  options: SortOption[];
  current: string;
}

export default function ProductSortSelect({ options, current }: ProductSortSelectProps) {
  const [open, setOpen] = useState(false);
  const currentLabel = options.find((o) => o.value === current)?.label ?? options[0].label;

  return (
    <div className={`sort-dropdown${open ? ' is-open' : ''}`}>
      {open && (
        <div
          className="sort-dropdown-backdrop"
          onClick={() => setOpen(false)}
          onWheel={() => setOpen(false)}
          onTouchMove={() => setOpen(false)}
        />
      )}

      <span className="sort-dropdown-label">Sort by:</span>
      <button
        type="button"
        className="sort-dropdown-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        {currentLabel}
      </button>

      <ul className="sort-dropdown-menu" role="listbox" aria-label="Sort products">
        {options.map((o) => (
          <li key={o.value} role="option" aria-selected={o.value === current}>
            <Link
              href={o.href}
              scroll={false}
              className={o.value === current ? 'active' : ''}
              onClick={() => setOpen(false)}
            >
              {o.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}