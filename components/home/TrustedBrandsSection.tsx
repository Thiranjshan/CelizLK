import Link from 'next/link';

interface TrustedBrand {
  id: string;
  name: string;
  slug: string;
}

interface TrustedBrandsSectionProps {
  brands: TrustedBrand[];
}

export default function TrustedBrandsSection({ brands }: TrustedBrandsSectionProps) {
  return (
    <section className="homepage-trusted-brands-section">
      <div className="brands-trust-layout">
        <div className="brands-trust-copy">
          <p className="brands-trust-eyebrow">Authentic Partners</p>
          <h3 className="brands-trust-title">
            Genuine products.
            <br />
            <span>Trusted brands.</span>
          </h3>
          <p className="brands-trust-description">
            We carefully source genuine products directly from authorized brands,
            giving you complete confidence to shop with Celiz LK.
          </p>
        </div>

        <div className="brands-name-reel" role="region" aria-label="Shop trusted brands">
          <div className="brands-name-track">
            <div className="brands-name-group">
              {brands.map((brand) => (
                <Link
                  key={brand.id}
                  href={`/products?brand=${brand.slug}`}
                  aria-label={`Shop ${brand.name}`}
                >
                  {brand.name}
                </Link>
              ))}
            </div>
            {brands.length > 0 && (
              <div className="brands-name-group" aria-hidden="true">
                {brands.map((brand) => (
                  <Link
                    key={`duplicate-${brand.id}`}
                    href={`/products?brand=${brand.slug}`}
                    tabIndex={-1}
                  >
                    {brand.name}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
