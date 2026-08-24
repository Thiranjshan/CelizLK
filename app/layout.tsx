import type { Metadata } from 'next';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ToastContainer from '@/components/ToastContainer';
import AuthBootstrap from '@/components/AuthBootstrap';

export const metadata: Metadata = {
  title: 'Celiz LK — Online Tech Gadgets Store Sri Lanka',
  description: 'Shop authentic wireless earbuds, GaN fast chargers, power banks, and smartwatches in Sri Lanka with fast islandwide delivery.',
  keywords: ['Celiz LK', 'tech gadgets Sri Lanka', 'wireless earbuds', 'fast chargers', 'power bank Sri Lanka', 'smartwatch Sri Lanka'],
  openGraph: {
    title: 'Celiz LK — Your Trusted Gadget Partner',
    description: 'Authentic tech gadgets, accessories, fast chargers & Bluetooth audio in Sri Lanka.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AuthBootstrap />
        <Header />
        <main style={{ flex: 1 }}>
          {children}
        </main>
        <Footer />
        <ToastContainer />
      </body>
    </html>
  );
}
