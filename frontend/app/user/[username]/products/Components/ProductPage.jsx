"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { makePriorityRequest } from '@/lib/api/api';
import ProductCard from 'Components/Product/ProductCard';
import { useProduct } from '@/lib/contexts/product-context';
import { useAuth } from '@/lib/contexts/auth-context';
import { FiGrid, FiList, FiPackage } from 'react-icons/fi';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import Pagination from 'Components/common/Pagination';

// Metadata for the page
export const generateMetadata = async ({ params }) => {
  try {
    const { username } = params;
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/products/user/username/${username}`, {
      next: { revalidate: 3600 } // Revalidate every hour
    });

    const data = await response.json();

    if (!data.success) {
      return {
        title: 'User Products - Product Bazar',
        description: 'Browse products created by users on Product Bazar.'
      };
    }

    const user = data.user;

    return {
      title: `${user.fullName || user.username}'s Products - Product Bazar`,
      description: `Browse all products created by ${user.fullName || user.username} on Product Bazar.`,
      openGraph: {
        title: `${user.fullName || user.username}'s Products - Product Bazar`,
        description: `Browse all products created by ${user.fullName || user.username} on Product Bazar.`,
        images: user.profilePicture ? [user.profilePicture] : [],
      }
    };
  } catch (error) {
    return {
      title: 'User Products - Product Bazar',
      description: 'Browse products created by users on Product Bazar.'
    };
  }
};

function UserProductsPage() {
  const { username } = useParams();
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const { toggleUpvote, toggleBookmark } = useProduct();

  const [products, setProducts] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('grid');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0
  });
  const [meta, setMeta] = useState({
    totalProducts: 0,
    publishedProducts: 0,
    isOwnerView: false
  });

  // Fetch products by username
  const fetchProductsByUsername = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);

      const response = await makePriorityRequest('get', `/products/user/username/${username}`, {
        params: {
          page,
          limit: pagination.limit
        }
      });

      if (response.data.success) {
        setProducts(response.data.data);
        setUser(response.data.user);
        setMeta(response.data.meta || {});
        setPagination({
          ...pagination,
          page,
          total: response.data.meta?.totalProducts || 0,
          totalPages: Math.ceil((response.data.meta?.totalProducts || 0) / pagination.limit)
        });
      } else {
        setError(response.data.message || 'Failed to fetch products');
      }
    } catch (err) {
      console.error('Error fetching products:', err);
      if (err.response?.status === 404) {
        notFound();
      } else {
        setError(err.message || 'An error occurred while fetching products');
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle page change
  const handlePageChange = (newPage) => {
    if (newPage !== pagination.page) {
      fetchProductsByUsername(newPage);
    }
  };

  // Toggle view mode between grid and list
  const toggleViewMode = () => {
    setViewMode(viewMode === 'grid' ? 'list' : 'grid');
  };

  // Handle upvote
  const handleUpvote = async (productId) => {
    if (!currentUser) return;

    try {
      const product = products.find(p => p._id === productId);
      if (!product) return;

      await toggleUpvote(product.slug);

      // Update local state
      setProducts(prevProducts =>
        prevProducts.map(p => {
          if (p._id === productId) {
            const hasUpvoted = !p.userInteractions?.hasUpvoted;
            const upvoteCount = hasUpvoted
              ? (p.upvoteCount || 0) + 1
              : Math.max((p.upvoteCount || 0) - 1, 0);

            return {
              ...p,
              upvoteCount,
              upvotes: {
                ...p.upvotes,
                count: upvoteCount,
                userHasUpvoted: hasUpvoted
              },
              userInteractions: {
                ...p.userInteractions,
                hasUpvoted
              }
            };
          }
          return p;
        })
      );
    } catch (err) {
      console.error('Error upvoting product:', err);
    }
  };

  // Handle bookmark
  const handleBookmark = async (productId) => {
    if (!currentUser) return;

    try {
      const product = products.find(p => p._id === productId);
      if (!product) return;

      await toggleBookmark(product.slug);

      // Update local state
      setProducts(prevProducts =>
        prevProducts.map(p => {
          if (p._id === productId) {
            const hasBookmarked = !p.userInteractions?.hasBookmarked;
            const bookmarkCount = hasBookmarked
              ? (p.bookmarkCount || 0) + 1
              : Math.max((p.bookmarkCount || 0) - 1, 0);

            return {
              ...p,
              bookmarkCount,
              bookmarks: {
                ...p.bookmarks,
                count: bookmarkCount,
                userHasBookmarked: hasBookmarked
              },
              userInteractions: {
                ...p.userInteractions,
                hasBookmarked
              }
            };
          }
          return p;
        })
      );
    } catch (err) {
      console.error('Error bookmarking product:', err);
    }
  };

  // Initial data fetch
  useEffect(() => {
    if (!username) {
      console.error("Username parameter is undefined");
      // Redirect to a fallback page or refresh user data
      if (currentUser?._id) {
        router.push(`/user/profile/${currentUser._id}`);
      } else {
        router.push('/app');
      }
      return;
    }

    fetchProductsByUsername(1);
  }, [username, currentUser, router]);

  // Loading state
  if (loading && !products.length) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <div className="w-16 h-16 border-4 border-purple-100 border-t-purple-500 rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600">Loading products...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !products.length) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
          <div className="bg-red-50 p-6 rounded-lg">
            <FiPackage className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Error Loading Products</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => fetchProductsByUsername(1)}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* User Profile Header */}
      {user && (
        <div className="mb-8 flex flex-col md:flex-row items-center md:items-start gap-6">
          <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-purple-100">
            <Image
              src={user.profilePicture || '/images/default-avatar.png'}
              alt={user.fullName || user.username}
              fill
              className="object-cover"
            />
          </div>
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">{user.fullName || user.username}'s Products</h1>
            {user.bio && <p className="text-gray-600 mt-2">{user.bio}</p>}
            <div className="mt-3 flex flex-wrap gap-2 justify-center md:justify-start">
              <Link href={`/user/${username}`} className="text-purple-600 hover:text-purple-800 text-sm font-medium">
                View Profile
              </Link>
              {meta.isOwnerView && (
                <Link href="/dashboard/products" className="text-purple-600 hover:text-purple-800 text-sm font-medium">
                  Manage Products
                </Link>
              )}
            </div>
          </div>
          <div className="flex flex-col items-center md:items-end gap-2">
            <div className="flex items-center gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-800">{meta.totalProducts || 0}</p>
                <p className="text-sm text-gray-500">Total Products</p>
              </div>
              {meta.isOwnerView && meta.totalProducts !== meta.publishedProducts && (
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-800">{meta.publishedProducts || 0}</p>
                  <p className="text-sm text-gray-500">Published</p>
                </div>
              )}
            </div>
            <div className="flex items-center mt-2">
              <button
                onClick={toggleViewMode}
                className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
              >
                {viewMode === 'grid' ? (
                  <>
                    <FiList className="w-4 h-4" />
                    <span>List View</span>
                  </>
                ) : (
                  <>
                    <FiGrid className="w-4 h-4" />
                    <span>Grid View</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Products Grid/List */}
      {products.length > 0 ? (
        <div className={`grid ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1'} gap-6`}>
          {products.map((product) => (
            <ProductCard
              key={product._id}
              product={product}
              viewMode={viewMode}
              onUpvote={() => handleUpvote(product._id)}
              onBookmark={() => handleBookmark(product._id)}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <FiPackage className="w-16 h-16 text-gray-300 mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">No Products Found</h2>
          <p className="text-gray-600 max-w-md">
            {user?.fullName || username} hasn't published any products yet.
          </p>
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="mt-12">
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      )}
    </div>
  );
}

export default UserProductsPage;