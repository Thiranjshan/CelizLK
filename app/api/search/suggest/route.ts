import { getFirstProductImage, searchProducts } from '@/lib/product-search';

const cacheHeaders = {
  'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=120',
};

export async function GET(request: Request) {
  const searchParams = new URL(request.url).searchParams;
  const result = await searchProducts(searchParams.get('q'), { limit: 8 });
  const products = result.products.map(({ images, ...product }) => ({
    ...product,
    image: getFirstProductImage(JSON.stringify(images)),
  }));

  return Response.json(
    { products, error: result.failed || undefined },
    { headers: result.failed ? { 'Cache-Control': 'no-store' } : cacheHeaders },
  );
}
