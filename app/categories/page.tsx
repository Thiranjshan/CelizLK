import Link from 'next/link';
import Image from 'next/image';
import { prisma } from '@/lib/prisma';
import BackButton from '@/components/common/BackButton';
import { parseProductImages } from '@/lib/product-images';

export const revalidate = 30;

export default async function CategoriesPage() {
  const categories = await prisma.category.findMany({
    orderBy: { name: 'asc' },
    include: {
      products: {
        where: { isActive: true },
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: { images: true },
      },
    },
  });

  const normalizedCategories = categories
    .map((category) => ({
      ...category,
      image: category.imageUrl || parseProductImages(category.products[0]?.images ?? '')[0] || '',
    }));

  const shopAllCard = {
    id: 'shop-all',
    name: 'Shop All',
    slug: 'shop-all',
    href: '/products',
    image: '/images/shop-all-feature.png',
  };

  const categoryCards = [shopAllCard, ...normalizedCategories.map((category) => ({
    id: category.id,
    name: category.name,
    slug: category.slug,
    href: `/category/${category.slug}`,
    image: category.image,
  }))];

  return (
    <div className="container shop-all-page">
      <BackButton label="Back" />

      <div className="collection-heading">
        <h1>All Categories</h1>
        <p>Browse the latest tech categories across Celiz LK.</p>
      </div>

      <div className="browse-grid">
        {categoryCards.map((category) => {
          const isShopAll = category.id === 'shop-all';

          return (
            <Link
              key={category.id}
              href={category.href}
              className={`browse-card browse-category-card ${isShopAll ? 'browse-special-card' : ''}`}
            >
              <span className="browse-card-media">
                {category.image && (
                  <Image
                    src={category.image}
                    alt={category.name}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    unoptimized
                  />
                )}
              </span>
              <span className="browse-card-overlay">
                <strong className="browse-card-title">{category.name}</strong>
                {!isShopAll ? <small>{category.slug === 'shop-all' ? '' : 'Shop now'}</small> : null}
              </span>
            </Link>
            
          );
        })}
      </div>
    </div>
  );
}
