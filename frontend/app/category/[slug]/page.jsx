import CategoryPageClient from './Components/CategoryPage';

export const metadata = {
  title: 'Category Products | Product Bazar',
  description: 'Browse products by category on Product Bazar',
};

export default function CategoryPage({ params }) {
  return <CategoryPageClient slug={params.slug} />;
}