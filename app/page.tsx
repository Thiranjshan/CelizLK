import { prisma } from "@/lib/prisma";
import HeroCarousel from "@/components/home/HeroCarousel";
import ProductCarousel from "@/components/home/ProductCarousel";
import CategoryBentoGrid from "@/components/home/CategoryBentoGrid";
import FeaturedEditorialSection from "@/components/home/FeaturedEditorialSection";
import AssurancesSection from "@/components/home/AssurancesSection";
import TrustedBrandsSection from "@/components/home/TrustedBrandsSection";
import { parseProductImages } from "@/lib/product-images";

export const revalidate = 60; // ISR revalidate every 60 seconds

export default async function HomePage() {
  // 1. Fetch Hero Banners from Database
  const banners = await prisma.heroBanner.findMany({
    where: { isActive: true },
    orderBy: { order: "asc" },
    select: {
      id: true,
      imageUrl: true,
    },
  });

  const carouselSlides = banners.map((banner) => ({
    id: banner.id,
    image: banner.imageUrl,
  }));

  // 2. Fetch Categories from DB
  const dbCategories = await prisma.category.findMany({
    where: { parentId: null },
    orderBy: { name: "asc" },
    include: {
      products: {
        where: { isActive: true },
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { images: true },
      },
    },
  });

  const categories = dbCategories.map((cat) => {
    return {
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      image: cat.imageUrl || parseProductImages(cat.products[0]?.images ?? "")[0],
      description: cat.description,
    };
  });

  // 3. Fetch New Arrivals (marked isNewArrival: true)
  const rawNewArrivals = await prisma.product.findMany({
    where: { isNewArrival: true, isActive: true },
    take: 10,
    include: { category: true, brandRecord: true },
  });

  const newArrivals = rawNewArrivals.map((p) => ({
    ...p,
    brand: p.brandRecord,
    images: JSON.parse(p.images),
    specs: p.specs,
    createdAt: p.createdAt.toISOString(),
  }));

  // 4. Fetch Featured Products (marked isFeatured: true)
  const rawFeaturedProducts = await prisma.product.findMany({
    where: { isFeatured: true, isActive: true },
    take: 8,
    include: { category: true, brandRecord: true },
  });

  const featuredProducts = rawFeaturedProducts.map((p) => ({
    ...p,
    brand: p.brandRecord,
    images: JSON.parse(p.images),
    specs: p.specs,
    createdAt: p.createdAt.toISOString(),
  }));

  const trustedBrands = await prisma.brand.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });

  return (
    <div style={{ background: "var(--bg-main)", position: "relative" }}>
      {/* Hero Carousel Banner Section */}
      <HeroCarousel slides={carouselSlides} />

      <div className="container" style={{ position: "relative" }}>
        {/* Ambient Glow */}
        <div className="ambient-glow" aria-hidden="true" />

        {/* 1. ections Bento Grid Section */}
        <CategoryBentoGrid categories={categories} />

        {/* 2. New Arrivals Product Carousel Section */}
        <ProductCarousel
          title="New Arrivals"
          eyebrow="Freshly Curated"
          subtitle="The latest pieces to join our edit, selected for better performance and considered design."
          viewAllHref="/products?newArrivals=true"
          products={newArrivals}
          ctaLabel="More New Arrivals?"
        />

        {/* 3. Genuine products. Trusted brands. Section */}
        <TrustedBrandsSection brands={trustedBrands} />

        {/* 4. Featured Products Editorial 2-Column Showcase */}
        <FeaturedEditorialSection products={featuredProducts} />

        {/* 5. Assurances Section (100% Genuine, Islandwide Delivery, Trusted Support, Secure Payments) */}
        <AssurancesSection />
      </div>
    </div>
  );
}
