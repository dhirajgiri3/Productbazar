// app/product/[slug]/page.jsx
import React from 'react';
import ProductDetailPage from './Page/ProductDetails';

export default function Page({ params }) {
  const { slug } = params; // Access slug directly from params
  return <ProductDetailPage slug={slug} />;
}