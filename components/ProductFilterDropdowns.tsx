'use client';

import Link from 'next/link';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface ProductFilterDropdownsProps {
  categories: Array<{ id: string; name: string; slug: string }>;
  brands: Array<{ id: string; name: string; slug: string }>;
  selectedCategories: string[];
  selectedBrands: string[];
  sort?: string;
  featured?: string;
  newArrivals?: string;
}

function buildProductsUrl({
  category,
  brand,
  sort,
  featured,
  newArrivals,
}: {
  category?: string[];
  brand?: string[];
  sort?: string;
  featured?: string;
  newArrivals?: string;
}) {
  const searchParams = new URLSearchParams();

  category?.forEach((slug) => searchParams.append('category', slug));
  brand?.forEach((slug) => searchParams.append('brand', slug));
  if (sort) searchParams.set('sort', sort);
  if (featured) searchParams.set('featured', featured);
  if (newArrivals) searchParams.set('newArrivals', newArrivals);

  const queryString = searchParams.toString();
  return queryString ? `/products?${queryString}` : '/products';
}

export default function ProductFilterDropdowns({
  categories,
  brands,
  selectedCategories,
  selectedBrands,
  sort,
  featured,
  newArrivals,
}: ProductFilterDropdownsProps) {
  const [openMenu, setOpenMenu] = useState<'category' | 'brand' | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent | TouchEvent) {
      if (!containerRef.current) return;
      const target = event.target as Node;
      if (!containerRef.current.contains(target)) {
        setOpenMenu(null);
      }
    }

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown, { passive: true });

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
    };
  }, []);

  const toggleMenu = (menu: 'category' | 'brand') => {
    setOpenMenu((prev) => (prev === menu ? null : menu));
  };

  const categoryLabel = selectedCategories.length ? `Category (${selectedCategories.length})` : 'Select Category';
  const brandLabel = selectedBrands.length ? `Brand (${selectedBrands.length})` : 'Select brand';

  return (
    <div className="shop-all-filter-toolbar" ref={containerRef}>
      <div className="shop-all-filter-group-inline">
        <button
          type="button"
          className="shop-all-filter-button"
          aria-expanded={openMenu === 'category'}
          aria-haspopup="listbox"
          aria-label="Toggle category filter"
          onClick={() => toggleMenu('category')}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ' || event.key === 'ArrowDown') {
              event.preventDefault();
              toggleMenu('category');
            }
          }}
        >
          <span>{categoryLabel}</span>
          {openMenu === 'category' ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </button>

        {openMenu === 'category' ? (
          <div className="shop-all-filter-menu" role="listbox" aria-label="Category options">
            <ul className="shop-all-filter-menu-list">
              {categories.map((categoryItem) => {
                const isSelected = selectedCategories.includes(categoryItem.slug);
                const nextCategories = isSelected
                  ? selectedCategories.filter((slug) => slug !== categoryItem.slug)
                  : [...selectedCategories, categoryItem.slug];

                return (
                  <li key={categoryItem.id}>
                    <Link
                      href={buildProductsUrl({
                        category: nextCategories,
                        brand: selectedBrands,
                        sort,
                        featured,
                        newArrivals,
                      })}
                      className={`shop-all-filter-option ${isSelected ? 'selected' : ''}`}
                      onClick={() => setOpenMenu(null)}
                    >
                      <span>{categoryItem.name}</span>
                      {isSelected ? <span aria-hidden="true">✓</span> : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : null}
      </div>

      <div className="shop-all-filter-group-inline">
        <button
          type="button"
          className="shop-all-filter-button"
          aria-expanded={openMenu === 'brand'}
          aria-haspopup="listbox"
          aria-label="Toggle brand filter"
          onClick={() => toggleMenu('brand')}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ' || event.key === 'ArrowDown') {
              event.preventDefault();
              toggleMenu('brand');
            }
          }}
        >
          <span>{brandLabel}</span>
          {openMenu === 'brand' ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </button>

        {openMenu === 'brand' ? (
          <div className="shop-all-filter-menu" role="listbox" aria-label="Brand options">
            <ul className="shop-all-filter-menu-list">
              {brands.map((brandItem) => {
                const isSelected = selectedBrands.includes(brandItem.slug);
                const nextBrands = isSelected
                  ? selectedBrands.filter((slug) => slug !== brandItem.slug)
                  : [...selectedBrands, brandItem.slug];

                return (
                  <li key={brandItem.id}>
                    <Link
                      href={buildProductsUrl({
                        category: selectedCategories,
                        brand: nextBrands,
                        sort,
                        featured,
                        newArrivals,
                      })}
                      className={`shop-all-filter-option ${isSelected ? 'selected' : ''}`}
                      onClick={() => setOpenMenu(null)}
                    >
                      <span>{brandItem.name}</span>
                      {isSelected ? <span aria-hidden="true">✓</span> : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : null}
      </div>
    </div>
  );
}
