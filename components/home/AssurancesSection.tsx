'use client';

function AssuranceIcon({ icon }: { icon: string }) {
  const paths: Record<string, React.ReactNode> = {
    seal: (
      <>
        <path d="M8 2.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Z" />
        <path d="m5.8 9.2-.5 4.3L8 12l2.7 1.5-.5-4.3" />
      </>
    ),
    delivery: (
      <>
        <path d="M2 4h7v7H2zM9 6h2.5L14 8.5V11H9z" />
        <path d="M5 12.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3ZM12 12.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z" />
      </>
    ),
    support: (
      <>
        <path d="M2.5 9V7a5.5 5.5 0 0 1 11 0v2" />
        <path d="M4.5 8H3.3A1.3 1.3 0 0 0 2 9.3v1.4A1.3 1.3 0 0 0 3.3 12h1.2ZM11.5 8h1.2A1.3 1.3 0 0 1 14 9.3v1.4a1.3 1.3 0 0 1-1.3 1.3h-1.2Z" />
      </>
    ),
    lock: (
      <>
        <path d="M3 7h10v7H3z" />
        <path d="M5.5 7V4.8a2.5 2.5 0 0 1 5 0V7" />
      </>
    ),
  };

  return (
    <svg
      aria-hidden="true"
      width="24"
      height="24"
      fill="none"
      viewBox="0 0 16 16"
      className="homepage-assurance-icon"
    >
      <g
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.25"
      >
        {paths[icon]}
      </g>
    </svg>
  );
}

const assurances = [
  {
    icon: 'seal',
    title: '100% Genuine',
    description: 'Original products with warranty',
  },
  {
    icon: 'delivery',
    title: 'Islandwide Delivery',
    description: 'Fast and secure courier service',
  },
  {
    icon: 'support',
    title: 'Trusted Support',
    description: 'WhatsApp and phone assistance',
  },
  {
    icon: 'lock',
    title: 'Secure Payments',
    description: 'Multiple safe payment options',
  },
];

export default function AssurancesSection() {
  return (
    <section className="homepage-assurances-container" aria-label="Our assurances">
      <div className="homepage-assurances-grid">
        {assurances.map((item) => (
          <div className="homepage-assurance-item" key={item.title}>
            <AssuranceIcon icon={item.icon} />
            <div>
              <h4 className="homepage-assurance-title">{item.title}</h4>
              <p className="homepage-assurance-desc">{item.description}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
