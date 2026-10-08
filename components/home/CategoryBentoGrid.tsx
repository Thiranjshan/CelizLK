'use client';

import Link from 'next/link';
import Image from 'next/image';

export interface CategoryData {
  id: string;
  name: string;
  slug: string;
  image?: string;
  description: string | null;
}

interface CategoryBentoGridProps {
  categories: CategoryData[];
}

function ArrowIcon() {
  return (
    <svg
      aria-hidden="true"
      width="16"
      height="16"
      fill="none"
      viewBox="0 0 16 16"
    >
      <path
        d="M3 8h9M8.5 4.5 12 8l-3.5 3.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function getCardLayoutClass(index: number, count: number) {
  const remainingCards = count % 3;

  if (remainingCards === 1 && index === count - 1) return 'bento-col-12';
  if (remainingCards === 2 && index >= count - 2) return 'bento-col-6';
  return index % 3 === 0 ? 'bento-col-7' : 'bento-col-5';
}

export default function CategoryBentoGrid({ categories }: CategoryBentoGridProps) {
  if (!categories.length) return null;

  return (
    <section className="homepage-category-section" id="collections">
      {/* Centered Dual-Style Section Heading */}
      <div className="homepage-section-heading">
        <p className="homepage-section-eyebrow">
          <span className="eyebrow-accent-line" />
          Curated Technology
          <span className="eyebrow-accent-line" />
        </p>
        <h2 className="homepage-section-title">
          <span className="title-lead">Explore</span>{' '}
          <span className="title-serif-accent">Collections.</span>
        </h2>
        <p className="homepage-section-desc">
          Considered essentials where refined design meets everyday performance. Explore technology selected to look as good as it works.
        </p>
      </div>

      {/* Asymmetric Editorial Bento Grid */}
      <div className="homepage-bento-grid">
        {categories.map((category, index) => (
          <Link
            key={category.id}
            href={`/category/${category.slug}`}
            className={`bento-category-card ${getCardLayoutClass(index, categories.length)}`}
          >
            {/* Background Image with Zoom */}
            {category.image && (
              <Image
                src={category.image}
                alt=""
                fill
                sizes="(max-width: 768px) 100vw, 60vw"
                className="bento-category-card-img"
                unoptimized
              />
            )}
            {/* Multi-Stop Gradient Overlay */}
            <div className="bento-category-card-overlay" />

            {/* Top Row: Eyebrow + Serif Number */}
            <div className="bento-category-top-row">
            </div>

            {/* Bottom Row: Title + Description + Round Arrow Button */}
            <div className="bento-category-bottom-row">
              <div>
                <h3 className="bento-category-title">{category.name}</h3>
                {category.description && <p className="bento-category-desc">{category.description}</p>}
              </div>
              <span className="bento-category-arrow-btn" aria-hidden="true">
                <ArrowIcon />
              </span>
            </div>
          </Link>
        ))}
      </div>

      {/* "More to Discover" Complete Edit Banner */}
      <div className="complete-edit-banner" id="all-categories">
        <div>
          <p className="complete-edit-eyebrow">The complete edit</p>
          <h3 className="complete-edit-title">More to discover.</h3>
        </div>
        <Link href="/categories" className="complete-edit-action-btn">
          <span>More Categories?</span>
          <span className="complete-edit-arrow-badge">
            <ArrowIcon />
          </span>
        </Link>
      </div>
    </section>
  );
}
