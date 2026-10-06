import type { Metadata } from 'next';
import { Oxygen } from 'next/font/google';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ToastContainer from '@/components/ToastContainer';
import AuthBootstrap from '@/components/AuthBootstrap';
import WhatsAppButton from '@/components/WhaatsAppBtton';
import { getStoreSettings } from '@/lib/store-settings';

const oxygen = Oxygen({
  subsets: ['latin'],
  weight: ['300', '400', '700'],
  variable: '--font-oxygen',
  display: 'swap',
});

export const dynamic = "force-dynamic";
export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getStoreSettings();

  return {
    title: settings.website.title,
    description: settings.website.metaDescription,
    keywords: [settings.business.storeName, 'tech gadgets Sri Lanka', 'wireless earbuds', 'fast chargers', 'power bank Sri Lanka', 'smartwatch Sri Lanka'],
    openGraph: {
      title: settings.business.storeName,
      description: settings.website.metaDescription,
      type: 'website',
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={oxygen.variable}>
      <body>
        <AuthBootstrap />
        <Header />
        <main style={{ flex: 1 }}>
          {children}
        </main>
        <WhatsAppButton />
        <Footer />
        <ToastContainer />
      </body>
    </html>
  );
}
