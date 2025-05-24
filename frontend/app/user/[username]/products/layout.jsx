import { ProductProvider } from "@/lib/contexts/product-context";

export async function generateMetadata({ params }) {
  const { username } = await params;
  let title = `${username}'s Products - Product Bazar`;

  return {
    title: title.trim(),
    description: `View and manage ${username}'s products on Product Bazar.`,
    keywords: "user products, product management, Product Bazar",
  };
}

export default function UserProductsLayout({ children }) {
  return (
    <div className="bg-gradient-to-b from-gray-50 to-white">
      <div className="products-container mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-screen">
        <ProductProvider>{children}</ProductProvider>
      </div>
    </div>
  );
}
