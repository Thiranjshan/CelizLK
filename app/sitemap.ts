import type { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma';

const siteUrl = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.SITE_URL ||
  (process.env.NODE_ENV === 'production' ? 'https://celiz.lk' : 'http://localhost:3000')
).replace(/\/$/, '');

export const dynamic = 'force-dynamic';

function buildStaticRoutes(): MetadataRoute.Sitemap {
  return [
    '',
    '/about',
    '/contact',
    '/faq',
    '/delivery-information',
    '/privacy-policy',
    '/refund-policy',
    '/terms-and-conditions',
    '/warranty',
    '/products',
  ].map((path) => ({
    url: `${siteUrl}${path}`,
    lastModified: new Date(),
    changeFrequency: path === '' || path === '/products' ? 'daily' : 'weekly',
    priority: path === '' ? 1 : path === '/products' ? 0.9 : 0.7,
  }));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes = buildStaticRoutes();

  try {
    const [categories, brands, products] = await Promise.all([
      prisma.category.findMany({
        select: {
          slug: true,
          createdAt: true,
        },
        orderBy: { name: 'asc' },
      }),
      prisma.brand.findMany({
        where: { isActive: true },
        select: {
          slug: true,
          updatedAt: true,
        },
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      }),
      prisma.product.findMany({
        where: { isActive: true },
        select: {
          slug: true,
          updatedAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const categoryRoutes: MetadataRoute.Sitemap = categories.map((category) => ({
      url: `${siteUrl}/category/${category.slug}`,
      lastModified: category.createdAt,
      changeFrequency: 'daily',
      priority: 0.8,
    }));

    const brandRoutes: MetadataRoute.Sitemap = brands.map((brand) => ({
      url: `${siteUrl}/products?brand=${brand.slug}`,
      lastModified: brand.updatedAt,
      changeFrequency: 'weekly',
      priority: 0.7,
    }));

    const productRoutes: MetadataRoute.Sitemap = products.map((product) => ({
      url: `${siteUrl}/product/${product.slug}`,
      lastModified: product.updatedAt,
      changeFrequency: 'weekly',
      priority: 0.8,
    }));

    return [...staticRoutes, ...categoryRoutes, ...brandRoutes, ...productRoutes];
  } catch (error) {
    console.warn('Sitemap generation fell back to static routes because the database is unavailable.', error);
    return staticRoutes;
  }
}
