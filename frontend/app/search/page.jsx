// /Users/dhirajgiri/Desktop/ProductBazar/pb/frontend/app/search/page.jsx
import React from 'react';
import SearchPage from './Components/SearchPage';

// Making this a server component by using 'use server'
export const dynamic = 'force-dynamic';

export default function Search({ searchParams }) {
  // Extract relevant search parameters with default values
  const query = searchParams?.query || '';
  const category = searchParams?.category || 'all'; // Align with client-side 'activeTab'
  const page = parseInt(searchParams?.page, 10) || 1;
  const limit = parseInt(searchParams?.limit, 10) || 10; // Consistent with client-side limit
  
  // Prepare normalized params to pass to the SearchPage component
  const normalizedParams = {
    query,
    category,
    page,
    limit,
  };
  
  return (
    <SearchPage searchParams={normalizedParams} />
  );
}