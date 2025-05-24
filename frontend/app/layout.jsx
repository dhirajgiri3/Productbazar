import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Product Bazar | Innovative Marketplace for Startup Success',
  description:
    'Discover Product Bazar, the premier marketplace connecting startups with essential tools and resources. Find product-market fit, accelerate growth, and achieve startup success with our curated solutions.',
  keywords:
    'product marketplace, product-market fit, startup tools, startup resources, innovation platform, entrepreneurship, tech startups',
  authors: [{ name: 'Product Bazar Team' }],
  creator: 'Product Bazar',
  publisher: 'Product Bazar',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://productbazar.com'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Product Bazar | Empowering Startups to Thrive',
    description:
      'Join Product Bazar to access cutting-edge tools, connect with industry experts, and propel your startup to new heights.',
    url: 'https://productbazar.com',
    siteName: 'Product Bazar',
    type: 'website',
    locale: 'en_US',
    images: [
      {
        url: '/Assets/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Product Bazar - Startup Marketplace',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@ProductBazar',
    creator: '@ProductBazar',
    title: 'Product Bazar | Innovative Marketplace for Startup Success',
    description: 'Discover Product Bazar, the premier marketplace connecting startups with essential tools and resources.',
    images: ['/Assets/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code',
    yandex: 'your-yandex-verification-code',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Prevent browser extension hydration issues
              (function() {
                if (typeof window !== 'undefined') {
                  // Remove extension attributes immediately
                  const cleanupExtensions = () => {
                    document.querySelectorAll('[bis_skin_checked]').forEach(el => {
                      el.removeAttribute('bis_skin_checked');
                    });
                  };

                  // Clean on DOM ready
                  if (document.readyState === 'loading') {
                    document.addEventListener('DOMContentLoaded', cleanupExtensions);
                  } else {
                    cleanupExtensions();
                  }
                }
              })();
            `
          }}
        />
      </head>
      <body className={`${inter.className} antialiased`} suppressHydrationWarning>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
