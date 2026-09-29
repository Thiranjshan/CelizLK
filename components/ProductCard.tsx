'use client';

import Link from 'next/link';
import { ShoppingBag } from 'lucide-react';
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

  const isOutOfStock = product.stockQty <= 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isOutOfStock) {
      addToCart(product, 1);
    }
  };

  return (
    <div className={`product-card ${isOutOfStock ? 'out-of-stock' : ''}`}>
      {/* Badges */}
      <div className="product-card-badges">
        {isOutOfStock ? (
          <span className="product-badge badge-out-of-stock">Sold Out</span>
        ) : (
          <>
            {/* {((product as any).isNewArrival) && (
              <span className="product-badge badge-new">New</span>
            )} */}
            {discountPercent > 0 && (
              <span className="badge badge-cancelled" style={{ background: '#EF4444', color: 'white' }}>
                  Save {discountPercent}%
                </span>
            )}
          </>
        )}
      </div>

      {/* Product Image */}
      <Link href={`/product/${product.slug}`} className="product-image-wrap">
        <img src={mainImage} alt={product.name} loading="lazy" />
      </Link>

      {/* Product Info */}
      <div className="product-info">
        <span className="product-brand">{product.brand?.name || 'Gadget'}</span>
        <Link href={`/product/${product.slug}`} className="product-title" title={product.name}>
          {product.name}
        </Link>

        {/* Price Row */}
        <div className="product-price-row">
          <span className="price-current">
            Rs. {(product.discountPrice ?? product.price).toLocaleString()}
          </span>
          {product.discountPrice && (
            <span className="price-original">
              Rs. {product.price.toLocaleString()}
            </span>
          )}
        </div>

        {/* Add to Cart CTA */}
        <button
          onClick={handleAddToCart}
          className="btn-add-cart"
          disabled={isOutOfStock}
        >
          <ShoppingBag size={15} />
          <span>{isOutOfStock ? 'Out of Stock' : 'Add to Cart'}</span>
        </button>
      </div>
    </div>
  );
}
