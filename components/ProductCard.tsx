'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ShoppingBag, ArrowRight } from 'lucide-react';
import { Product } from '@/lib/types';
import { useStore } from '@/lib/store';

interface ProductCardProps {
  product: Product;
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

  return (
    <div className="product-card">
      {discountPercent > 0 && (
        <span className="product-badge-discount">-{discountPercent}% OFF</span>
      )}

      <Link href={`/product/${product.slug}`} className="product-image-wrap">
        <img src={mainImage} alt={product.name} loading="lazy" />
      </Link>

      <div className="product-info">
        <span className="product-brand">{product.brand}</span>
        <Link href={`/product/${product.slug}`} className="product-title">
          {product.name}
        </Link>

        <div className="product-price-row">
          <span className="price-current">
            LKR {(product.discountPrice ?? product.price).toLocaleString()}
          </span>
          {product.discountPrice && (
            <span className="price-original">
              LKR {product.price.toLocaleString()}
            </span>
          )}
        </div>

        <button
          onClick={() => addToCart(product, 1)}
          className="btn-add-cart"
        >
          <ShoppingBag size={16} />
          <span>Add to Cart</span>
        </button>
      </div>
    </div>
  );
}
