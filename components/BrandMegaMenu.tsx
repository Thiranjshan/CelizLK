import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

interface Brand {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
}

interface BrandMegaMenuProps {
  brands: Brand[];
  onNavigate: () => void;
}

export default function BrandMegaMenu({ brands, onNavigate }: BrandMegaMenuProps) {
  return (
    <div className="mega-menu brand-mega-menu">
      <div className="mega-menu-heading">
        <span className="mega-menu-eyebrow">Shop by Brand</span>
        <p>Shop authentic products from trusted brands</p>
      </div>
      <div className="brand-mega-grid">
        {brands.map((brand) => (
          <Link key={brand.id} href={`/products?brand=${brand.slug}`} className="brand-mega-item" onClick={onNavigate}>
            <span className="brand-mega-logo">
              {brand.logoUrl ? <Image src={brand.logoUrl} alt="" width={48} height={40} /> : <span aria-hidden="true">{brand.name.slice(0, 1)}</span>}
            </span>
            <span>{brand.name}</span>
          </Link>
        ))}
      </div>
      <div className="mega-menu-footer">
        <Link href="/products" className="mega-menu-view-all" onClick={onNavigate}>
          View All Brands <ArrowRight size={15} />
        </Link>
      </div>
    </div>
  );
}
