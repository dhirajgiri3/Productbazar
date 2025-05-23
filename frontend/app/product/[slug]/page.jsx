// app/product/[slug]/page.jsx
import React from 'react';
import ProductDetailPage from './Page/ProductDetails';

export default async function Page({ params }) {
  const { slug } = await Promise.resolve(params); // Properly await params
  return <ProductDetailPage slug={slug} />;
}