import { Prisma } from '@prisma/client';
import { parseProductImages } from '@/lib/product-images';

export { parseProductImages } from '@/lib/product-images';
import { prisma } from '@/lib/prisma';
import type { Brand, Product } from '@/lib/types';

export interface ProductSearchResult extends Product {
  brand?: Brand | null;
  images: string[];
}

interface ProductSearchRow extends Omit<ProductSearchResult, 'images' | 'brand' | 'createdAt'> {
  images: string;
  createdAt: Date;
  joinedBrandId: string | null;
  joinedBrandName: string | null;
  joinedBrandSlug: string | null;
  joinedBrandLogoUrl: string | null;
  joinedBrandIsActive: boolean | null;
  joinedBrandSortOrder: number | null;
}

interface ProductSearchQueries {
  query: string;
  products: Prisma.Sql;
  count: Prisma.Sql;
}

interface ProductSearchOptions {
  limit?: number;
  offset?: number;
}

export function normalizeProductSearchQuery(value: string | null): string {
  return (value ?? '').trim().slice(0, 60);
}

export function escapeLikeWildcards(value: string): string {
  return value.replace(/[\\%_]/g, '\\$&');
}

export function buildProductSearchQueries(
  value: string | null,
  { limit = 12, offset = 0 }: ProductSearchOptions = {},
): ProductSearchQueries | null {
  const query = normalizeProductSearchQuery(value);
  if (query.length < 2) return null;

  const escapedQuery = escapeLikeWildcards(query);
  const containsPattern = `%${escapedQuery}%`;
  const prefixPattern = `${escapedQuery}%`;
  const where = Prisma.sql`
    WHERE p."isActive" = TRUE
      AND (
        p."name" ILIKE ${containsPattern} ESCAPE E'\\\\'
        OR p."name" % ${query}
        OR p."description" ILIKE ${containsPattern} ESCAPE E'\\\\'
        OR b."name" ILIKE ${containsPattern} ESCAPE E'\\\\'
      )
  `;

  return {
    query,
    products: Prisma.sql`
      SELECT
        p."id",
        p."name",
        p."slug",
        p."description",
        p."price",
        p."discountPrice",
        p."stockQty",
        p."categoryId",
        p."brandId",
        p."images",
        p."specs",
        p."seoTitle",
        p."seoDescription",
        p."isActive",
        p."isFeatured",
        p."createdAt",
        b."id" AS "joinedBrandId",
        b."name" AS "joinedBrandName",
        b."slug" AS "joinedBrandSlug",
        b."logoUrl" AS "joinedBrandLogoUrl",
        b."isActive" AS "joinedBrandIsActive",
        b."sortOrder" AS "joinedBrandSortOrder"
      FROM "Product" AS p
      LEFT JOIN "Brand" AS b ON b."id" = p."brandId"
      ${where}
      ORDER BY
        CASE
          WHEN p."name" ILIKE ${prefixPattern} ESCAPE E'\\\\' THEN 0
          WHEN p."name" ILIKE ${containsPattern} ESCAPE E'\\\\' OR p."name" % ${query} THEN 1
          ELSE 2
        END ASC,
        similarity(p."name", ${query}) DESC,
        CASE WHEN p."name" ILIKE ${containsPattern} ESCAPE E'\\\\' THEN 0 ELSE 1 END ASC,
        p."createdAt" DESC
      LIMIT ${Math.max(1, Math.trunc(limit))}
      OFFSET ${Math.max(0, Math.trunc(offset))}
    `,
    count: Prisma.sql`
      SELECT COUNT(*)::int AS "total"
      FROM "Product" AS p
      LEFT JOIN "Brand" AS b ON b."id" = p."brandId"
      ${where}
    `,
  };
}

export async function searchProducts(
  value: string | null,
  options: ProductSearchOptions = {},
): Promise<{ products: ProductSearchResult[]; total: number; query: string; failed: boolean }> {
  const queries = buildProductSearchQueries(value, options);
  const query = queries?.query ?? normalizeProductSearchQuery(value);
  if (!queries) return { products: [], total: 0, query, failed: false };

  try {
    const [rows, counts] = await Promise.all([
      prisma.$queryRaw<ProductSearchRow[]>(queries.products),
      prisma.$queryRaw<{ total: number }[]>(queries.count),
    ]);

    return {
      products: rows.map(({ images, createdAt, joinedBrandId, joinedBrandName, joinedBrandSlug, joinedBrandLogoUrl, joinedBrandIsActive, joinedBrandSortOrder, ...product }) => ({
        ...product,
        createdAt: createdAt.toISOString(),
        images: parseProductImages(images),
        brand: joinedBrandId && joinedBrandName && joinedBrandSlug !== null
          ? {
              id: joinedBrandId,
              name: joinedBrandName,
              slug: joinedBrandSlug,
              logoUrl: joinedBrandLogoUrl,
              isActive: joinedBrandIsActive ?? false,
              sortOrder: joinedBrandSortOrder ?? 0,
            }
          : null,
      })),
      total: counts[0]?.total ?? 0,
      query,
      failed: false,
    };
  } catch (error) {
    console.error('Error searching products:', error);
    return { products: [], total: 0, query, failed: true };
  }
}

export function getFirstProductImage(images: string): string | null {
  return parseProductImages(images)[0] ?? null;
}
