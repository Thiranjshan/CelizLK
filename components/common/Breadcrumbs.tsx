import Link from 'next/link';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export default function Breadcrumbs({ items, className = '' }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className={`breadcrumb-nav ${className}`.trim()}>
      <ol>
        {items.map((item, index) => {
          const isCurrentPage = index === items.length - 1;

          return (
            <li key={`${item.label}-${index}`}>
              {index > 0 && <span className="breadcrumb-separator" aria-hidden="true">›</span>}
              {item.href && !isCurrentPage ? (
                <Link href={item.href}>{item.label}</Link>
              ) : (
                <span aria-current={isCurrentPage ? 'page' : undefined}>{item.label}</span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
