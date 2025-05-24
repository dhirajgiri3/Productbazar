import CategoryPageClient from './Components/CategoryPage';

export const metadata = {
  title: 'Category Products | Product Bazar',
  description: 'Browse products by category on Product Bazar',
};

export default async function CategoryPage({ params }) {
  const { slug } = await params;
  return <CategoryPageClient slug={slug} />;
}