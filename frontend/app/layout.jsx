import { Inter } from 'next/font/google';
import './globals.css';
import StyledComponentsRegistry from '../lib/registry';
import GlobalStyle from '../styles/global';
import { AuthProvider } from '../lib/contexts/auth-context';
import { Toaster } from 'react-hot-toast';
import { ToastProvider } from '../lib/contexts/toast-context';
import { CategoryProvider } from '../lib/contexts/category-context';
import { ProductProvider } from '../lib/contexts/product-context';
import { ProjectProvider } from '../lib/contexts/project-context';
import { RecommendationProvider } from '../lib/contexts/recommendation-context';
import { SocketProvider } from '../lib/contexts/socket-context';
import { ViewProvider } from '../lib/contexts/view-context';
import { ThemeProvider } from '../lib/contexts/theme-context';
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import Header from 'Components/Header/Header';
import Footer from 'Components/Footer/Footer';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Product Bazar | Innovative Marketplace for Startup Success',
  description:
    'Discover Product Bazar, the premier marketplace connecting startups with essential tools and resources. Find product-market fit, accelerate growth, and achieve startup success with our curated solutions.',
  keywords:
    'product marketplace, product-market fit, startup tools, startup resources, innovation platform, entrepreneurship, tech startups',
  openGraph: {
    title: 'Product Bazar | Empowering Startups to Thrive',
    description:
      'Join Product Bazar to access cutting-edge tools, connect with industry experts, and propel your startup to new heights.',
    url: 'https://productbazar.com',
    type: 'website',
    images: [
      {
        url: 'https://productbazar.com/og-image.jpg',
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
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="canonical" href="https://productbazar.com" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#ffffff" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        {/* <link rel="manifest" href="/manifest.json" /> */}
      </head>
      <body className={inter.className} suppressHydrationWarning>
        <ToastProvider>
          <StyledComponentsRegistry>
            <NextThemesProvider attribute="class" defaultTheme="system" enableSystem>
              <ThemeProvider>
                <AuthProvider>
                  <ProductProvider>
                    <ProjectProvider>
                      <CategoryProvider>
                        <RecommendationProvider>
                          <SocketProvider>
                            <ViewProvider>
                                <GlobalStyle />
                                <Header />
                                {children}
                                <Footer />
                                <Toaster />
                            </ViewProvider>
                          </SocketProvider>
                        </RecommendationProvider>
                      </CategoryProvider>
                    </ProjectProvider>
                  </ProductProvider>
                </AuthProvider>
              </ThemeProvider>
            </NextThemesProvider>
          </StyledComponentsRegistry>
        </ToastProvider>
      </body>
    </html>
  );
}
