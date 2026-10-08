import Link from "next/link";
import { prisma } from "@/lib/prisma";
import HeroCarousel from "@/components/home/HeroCarousel";
import ProductCarousel from "@/components/home/ProductCarousel";
import CategoryBentoGrid from "@/components/home/CategoryBentoGrid";
import FeaturedEditorialSection from "@/components/home/FeaturedEditorialSection";
import AssurancesSection from "@/components/home/AssurancesSection";
import { parseProductImages } from "@/lib/product-images";
import Image from "next/image";

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
    take: 6,
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
    <div style={{ background: "#000000", position: "relative" }}>
      {/* Hero Carousel Banner Section */}
      <HeroCarousel slides={carouselSlides} />

      <div className="container" style={{ position: "relative" }}>
        {/* Ambient Glow */}
        <div className="ambient-glow" aria-hidden="true" />

        {/* 1. Explore Collections Bento Grid Section */}
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
        <section
          style={{
            border: "1px solid rgba(255, 255, 255, 0.1)",
            borderRadius: "1.75rem",
            padding: "2.5rem 3rem",
            margin: "4.5rem 0",
            background: "#141416",
            boxShadow: "0 20px 50px rgba(0, 0, 0, 0.5)",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1.2fr 2.5fr",
              gap: "3rem",
              alignItems: "center",
            }}
            className="brands-trust-layout"
          >
            <div>
              <p
                style={{
                  fontSize: "0.68rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.2em",
                  color: "var(--color-champagne)",
                  fontWeight: 600,
                  marginBottom: "0.5rem",
                }}
              >
                Authentic Partners
              </p>
              <h3
                style={{
                  fontFamily: "var(--font-serif)",
                  fontSize: "clamp(1.75rem, 2.5vw, 2.2rem)",
                  fontWeight: 400,
                  color: "#FFFFFF",
                  lineHeight: 1.15,
                  letterSpacing: "-0.02em",
                }}
              >
                Genuine products.
                <br />
                <span style={{ fontStyle: "italic", color: "var(--color-champagne)" }}>
                  Trusted brands.
                </span>
              </h3>

              <p
                style={{
                  fontSize: "0.875rem",
                  color: "rgba(255, 255, 255, 0.55)",
                  marginTop: "0.85rem",
                  lineHeight: 1.6,
                }}
              >
                We carefully source genuine products directly from authorized brands,
                giving you complete confidence to shop with Celiz LK.
              </p>
            </div>

            {/* Right side - Logo Reel */}
            <div className="brands-logo-reel">
              <div className="brands-logo-track">
                <div className="brands-logo-group">
                  {trustedBrands.map((brand) => (
                    <Link
                      key={brand.id}
                      href={`/products?brand=${brand.slug}`}
                      aria-label={`Shop ${brand.name}`}
                    >
                      {brand.logoUrl ? (
                        <Image
                          src={brand.logoUrl}
                          alt={brand.name}
                          width={90}
                          height={50}
                        />
                      ) : (
                        <span
                          style={{
                            width: 90,
                            textAlign: "center",
                            fontWeight: 700,
                            color: "#FFFFFF",
                          }}
                        >
                          {brand.name}
                        </span>
                      )}
                    </Link>
                  ))}
                </div>
                <div className="brands-logo-group" aria-hidden="true">
                  {trustedBrands.map((brand) => (
                    <Link
                      key={brand.id}
                      href={`/products?brand=${brand.slug}`}
                      tabIndex={-1}
                      aria-hidden="true"
                    >
                      {brand.logoUrl ? (
                        <Image
                          src={brand.logoUrl}
                          alt=""
                          width={90}
                          height={50}
                        />
                      ) : (
                        <span
                          style={{
                            width: 90,
                            textAlign: "center",
                            fontWeight: 700,
                            color: "#FFFFFF",
                          }}
                        >
                          {brand.name}
                        </span>
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 4. Featured Products Editorial 2-Column Showcase */}
        <FeaturedEditorialSection products={featuredProducts} />

        {/* 5. Assurances Section (100% Genuine, Islandwide Delivery, Trusted Support, Secure Payments) */}
        <AssurancesSection />
      </div>
    </div>
  );
}
