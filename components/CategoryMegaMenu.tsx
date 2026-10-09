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
    </div>
  );
}
