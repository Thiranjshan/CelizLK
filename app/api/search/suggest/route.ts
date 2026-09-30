import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import {
  escapeLikeWildcards,
  getFirstProductImage,
  normalizeProductSearchQuery,
} from '@/lib/product-search';

interface ProductSuggestionRow {
  id: string;
  name: string;
  slug: string;
  price: number;
  discountPrice: number | null;
  images: string;
}

const cacheHeaders = {
  'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=120',
};

export async function GET(request: Request) {
  const searchParams = new URL(request.url).searchParams;
  const query = normalizeProductSearchQuery(searchParams.get('q'));

  if (query.length < 2) {
    return Response.json({ products: [] }, { headers: cacheHeaders });
  }

  const escapedQuery = escapeLikeWildcards(query);
  const containsPattern = `%${escapedQuery}%`;
  const prefixPattern = `${escapedQuery}%`;

  try {
    const rows = await prisma.$queryRaw<ProductSuggestionRow[]>(Prisma.sql`
      SELECT p."id", p."name", p."slug", p."price", p."discountPrice", p."images"
      FROM "Product" AS p
      LEFT JOIN "Brand" AS b ON b."id" = p."brandId"
      WHERE p."isActive" = TRUE
        AND (
          p."name" ILIKE ${containsPattern} ESCAPE E'\\\\'
          OR p."name" % ${query}
          OR p."description" ILIKE ${containsPattern} ESCAPE E'\\\\'
          OR b."name" ILIKE ${containsPattern} ESCAPE E'\\\\'
        )
      ORDER BY
        CASE
          WHEN p."name" ILIKE ${prefixPattern} ESCAPE E'\\\\' THEN 0
          WHEN p."name" ILIKE ${containsPattern} ESCAPE E'\\\\' OR p."name" % ${query} THEN 1
          ELSE 2
        END ASC,
        similarity(p."name", ${query}) DESC,
        p."createdAt" DESC
      LIMIT 8
    `);

    const products = rows.map(({ images, ...product }) => ({
      ...product,
      image: getFirstProductImage(images),
    }));

    return Response.json({ products }, { headers: cacheHeaders });
  } catch (error) {
    console.error('Error loading product suggestions:', error);
    return Response.json({ products: [] }, { headers: { 'Cache-Control': 'no-store' } });
  }
}
