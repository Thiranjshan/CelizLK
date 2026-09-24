import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import BackButton from '@/components/common/BackButton';

export const revalidate = 30;

export default async function BrandsPage() {
  const brands = await prisma.brand.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
  });

  return (
    <div className="container shop-all-page">
      <BackButton label="Back" />

      <div className="collection-heading">
        <h1>All Brands</h1>
        <p>Explore trusted brands and certified products for your next purchase.</p>
      </div>

      <div className="browse-grid">
        {brands.map((brand) => (
          <Link key={brand.id} href={`/brand/${brand.slug}`} className="browse-card browse-brand-card">
            {brand.logoUrl ? (
              <span className="browse-card-media">
                <img src={brand.logoUrl} alt={brand.name} loading="lazy" />
              </span>
            ) : (
              <span className="browse-card-meta">
                <strong>{brand.name}</strong>
              </span>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
