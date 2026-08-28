import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

interface NavCategory {
  name: string;
  href: string;
}

interface CategoryMegaMenuProps {
  categories: NavCategory[];
  onNavigate: () => void;
}

export default function CategoryMegaMenu({ categories, onNavigate }: CategoryMegaMenuProps) {
  const groups = [
    { title: 'Collections', items: categories.filter((category) => category.name !== 'Deals') },
    { title: 'Offers', items: categories.filter((category) => category.name === 'Deals') },
  ].filter((group) => group.items.length > 0);

  return (
    <div className="mega-menu category-mega-menu">
      <div className="mega-menu-heading">
        <span className="mega-menu-eyebrow">Shop by Category</span>
        <p>Explore our collections</p>
      </div>
      <div className="category-mega-grid">
        {groups.map((group) => (
          <section className="category-group" key={group.title}>
            <h3 className="category-group-title">{group.title}</h3>
            <ul>
              {group.items.map((category) => (
                <li key={category.href}>
                  <Link href={category.href} onClick={onNavigate}>{category.name}</Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
      <div className="mega-menu-footer">
        <Link href="/products" className="mega-menu-view-all" onClick={onNavigate}>
          View All Categories <ArrowRight size={15} />
        </Link>
      </div>
    </div>
  );
}
