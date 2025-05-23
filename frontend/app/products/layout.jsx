export const metadata = {
  title: "Product Bazar | Innovative Marketplace for Startup Success",
  description: "Discover Product Bazar, the premier marketplace connecting startups with essential tools and resources. Find product-market fit, accelerate growth, and achieve startup success with our curated solutions.",
  keywords: [
    "startup marketplace",
    "product-market fit",
    "startup tools",
    "startup resources",
    "startup success",
    "innovation platform",
    "entrepreneurship",
    "tech startups",
  ],
  openGraph: {
    title: "Product Bazar | Empowering Startups to Thrive",
    description: "Join Product Bazar to access cutting-edge tools, connect with industry experts, and propel your startup to new heights.",
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
    <>
      {children}
    </>
  );
}
