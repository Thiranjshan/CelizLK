import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import BackButton from '@/components/common/BackButton';

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
    .map((category) => {
      const firstImage = category.products[0]?.images;
      let image = '';

      try {
        const parsed = firstImage ? JSON.parse(firstImage) : [];
        image = Array.isArray(parsed) && typeof parsed[0] === 'string' ? parsed[0] : '';
      } catch {
        image = '';
      }

      return {
        ...category,
        image,
      };
    })
    .filter((category) => category.image);

  const shopAllCard = {
    id: 'shop-all',
    name: 'Shop All',
    slug: 'shop-all',
    href: '/products',
    image: normalizedCategories[0]?.image || '',
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
                {category.image ? <img src={category.image} alt={category.name} loading="lazy" /> : null}
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
