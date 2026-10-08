'use client';

import Link from 'next/link';
import { ShoppingBag } from 'lucide-react';
import { Product } from '@/lib/types';
import { useStore } from '@/lib/store';

interface ProductCardProps {
  product: Product;
}

function PlusIcon() {
  return (
    <svg aria-hidden="true" width="16" height="16" fill="none" viewBox="0 0 16 16">
      <path
        d="M8 3v10M3 8h10"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.6"
      />
    </svg>
  );
}

export default function ProductCard({ product }: ProductCardProps) {
  const addToCart = useStore((state) => state.addToCart);

  const images = Array.isArray(product.images)
    ? product.images
    : typeof product.images === 'string'
    ? JSON.parse(product.images)
    : [];

  const mainImage = images[0] || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=800&auto=format&fit=crop';
  
  const discountPercent = product.discountPrice
    ? Math.round(((product.price - product.discountPrice) / product.price) * 100)
    : 0;

  const isOutOfStock = product.stockQty <= 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isOutOfStock) {
      addToCart(product, 1);
    }
  };

  return (
    <article className={`product-card ${isOutOfStock ? 'out-of-stock' : ''}`}>
      {/* Product Image & Floating Action */}
      <Link href={`/product/${product.slug}`} className="product-image-wrap">
        <img src={mainImage} alt={product.name} loading="lazy" />

        {/* Badges */}
        <div className="product-card-badges">
          {isOutOfStock ? (
            <span className="product-badge badge-out-of-stock">Sold Out</span>
          ) : (
            <>
              {discountPercent > 0 ? (
                <span className="product-badge badge-sale">
                  Save {discountPercent}%
                </span>
              ) : (product as { isNewArrival?: boolean }).isNewArrival ? (
                <span className="product-badge">New</span>
              ) : null}
            </>
          )}
        </div>

        {/* Floating Add-to-Cart Action Button */}
        <button
          onClick={handleAddToCart}
          className="product-floating-action-btn"
          disabled={isOutOfStock}
          aria-label={isOutOfStock ? 'Out of stock' : `Add ${product.name} to cart`}
          title={isOutOfStock ? 'Out of stock' : 'Add to cart'}
        >
          <PlusIcon />
        </button>
      </Link>

      {/* Product Info */}
      <div className="product-info">
        <div className="product-info-left">
          <span className="product-brand">
            {product.brand?.name || product.category?.name || 'Curated'}
          </span>
          <Link href={`/product/${product.slug}`} className="product-title" title={product.name}>
            {product.name}
          </Link>
        </div>

        <div className="product-price-col">
          <p className="product-price-current">
            Rs. {(product.discountPrice ?? product.price).toLocaleString()}
          </p>
          {product.discountPrice && (
            <p className="product-price-original">
              Rs. {product.price.toLocaleString()}
            </p>
          )}
        </div>
      </div>
    </article>
  );
}
