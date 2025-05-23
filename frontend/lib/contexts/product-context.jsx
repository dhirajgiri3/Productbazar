"use client";

import React, { createContext, useState, useCallback, useContext, useEffect } from "react";
import { useRouter } from "next/navigation"; // Corrected import for App Router
import { useAuth } from "./auth-context"; // Assuming auth-context is in the same directory
import logger from "../utils/logger"; // Adjust path as needed
import { getSocket } from "../utils/socket"; // Adjust path as needed
import { addProductToMapping, addProductsToMapping, getIdFromSlug, getSlugFromId } from "../utils/product/product-mapping-utils"; // Adjust path
import eventBus, { EVENT_TYPES } from "../utils/event-bus"; // Adjust path
import api from "../api/api"; // Import API client for comment functions

// Import Server Actions
import {
  serverGetProductBySlug,
  serverGetAllProducts,
  serverValidateProductUrl,
  serverCreateProduct,
  serverUpdateProduct,
  serverDeleteProduct,
  serverGetComments,
} from "@/lib/actions/product.server"; // Adjust path

// Helper function to convert data URL to Blob (client-side only)
const dataURLtoBlob = (dataURL) => {
  const arr = dataURL.split(',');
  if (arr.length < 2 || !arr[0].match(/:(.*?);/)) {
    throw new Error("Invalid Data URL");
  }
  const mime = arr[0].match(/:(.*?);/)[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
};

const ProductContext = createContext();

export const useProduct = () => {
  const context = useContext(ProductContext);
  if (!context) {
    throw new Error("useProduct must be used within a ProductProvider");
  }
  return context;
};

export const ProductProvider = ({ children }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentProduct, setCurrentProduct] = useState(null);
  const [productCache, setProductCache] = useState({}); // Client-side cache
  const router = useRouter();

  const clearError = () => setError(null);

  // --- Socket Event Handlers ---
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleUpvoteEvent = (data) => {
      if (!data.productId || data.count === undefined) return;
      const slug = getSlugFromId(data.productId);
      if (slug) {
        logger.info(`Socket: Updating product ${slug} (upvote):`, data);
        updateProductInCache(slug, {
          upvoteCount: data.count,
          upvotes: { count: data.count, userHasUpvoted: currentProduct?.upvotes?.userHasUpvoted } // Preserve user's own upvote state
        });
      }
    };

    const handleBookmarkEvent = (data) => {
      if (!data.productId || data.count === undefined) return;
      const slug = getSlugFromId(data.productId);
      if (slug) {
        logger.info(`Socket: Updating product ${slug} (bookmark):`, data);
        updateProductInCache(slug, {
          bookmarkCount: data.count,
          bookmarks: { count: data.count, userHasBookmarked: currentProduct?.bookmarks?.userHasBookmarked } // Preserve user's own bookmark state
        });
      }
    };

    socket.on('product:upvote', handleUpvoteEvent);
    socket.on('product:bookmark', handleBookmarkEvent);

    return () => {
      socket.off('product:upvote', handleUpvoteEvent);
      socket.off('product:bookmark', handleBookmarkEvent);
    };
  }, [currentProduct]); // Add currentProduct to dependencies if its state is used in handlers

  // --- Data Fetching (using Server Actions) ---
  const getProductBySlug = useCallback(async (slug, bypassCache = false) => {
    if (!slug) return null;
    setLoading(true);
    setError(null);

    if (!bypassCache && productCache[slug]) {
      logger.info(`Using client-cached product for ${slug}`);
      setCurrentProduct(productCache[slug]);
      setLoading(false);
      return productCache[slug];
    }
    // Check in-memory currentProduct as a fallback (though productCache should be primary)
    if (!bypassCache && currentProduct && currentProduct.slug === slug) {
        logger.info(`Using in-memory currentProduct for ${slug}`);
        setLoading(false);
        return currentProduct;
    }

    try {
      const result = await serverGetProductBySlug(slug, bypassCache);
      if (!result.success || !result.data) {
        throw new Error(result.message || "Failed to fetch product");
      }

      const productData = result.data;
      const userInteractionsFromResponse = result.userInteractions || {};

      const hasUpvoted = userInteractionsFromResponse.hasUpvoted ?? productData.upvotes?.userHasUpvoted ?? false;
      const hasBookmarked = userInteractionsFromResponse.hasBookmarked ?? productData.bookmarks?.userHasBookmarked ?? false;
      const upvoteCount = productData.upvoteCount ?? productData.upvotes?.count ?? 0;
      const bookmarkCount = productData.bookmarkCount ?? productData.bookmarks?.count ?? 0;

      const normalizedProduct = {
        ...productData,
        upvoted: hasUpvoted,
        bookmarked: hasBookmarked,
        upvoteCount: upvoteCount,
        bookmarkCount: bookmarkCount,
        upvotes: { ...productData.upvotes, count: upvoteCount, userHasUpvoted: hasUpvoted },
        bookmarks: { ...productData.bookmarks, count: bookmarkCount, userHasBookmarked: hasBookmarked },
        userInteractions: { ...userInteractionsFromResponse, hasUpvoted, hasBookmarked },
      };

      if (normalizedProduct._id && normalizedProduct.slug) {
        addProductToMapping(normalizedProduct);
      }
      updateProductInCache(normalizedProduct.slug, normalizedProduct); // Update client cache
      setCurrentProduct(normalizedProduct);
      return normalizedProduct;
    } catch (err) {
      logger.error(`Error in getProductBySlug for ${slug}:`, err);
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [productCache, currentProduct]); // Added productCache to dependencies

  const getAllProducts = useCallback(
    async (options = {}) => {
      setLoading(true);
      setError(null);
      try {
        const result = await serverGetAllProducts(options);
        if (!result.success) {
          throw new Error(result.message || "Failed to fetch products");
        }
        // Assuming serverGetAllProducts returns { products: [], pagination: {} }
        // And products are already normalized if needed by the server action
        const products = (result.data || []).filter(p => p && p._id);
        addProductsToMapping(products); // For socket updates

        // Optionally, update the client-side cache with these products
        setProductCache(prevCache => {
          const newCache = { ...prevCache };
          products.forEach(p => {
            if (p.slug) newCache[p.slug] = p;
          });
          return newCache;
        });

        return { products, pagination: result.pagination };
      } catch (err) {
        logger.error("Error in getAllProducts:", err);
        setError(err.message);
        return { products: [], pagination: null };
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const validateProductUrl = useCallback(async (url) => {
    setLoading(true); // Optional: set loading state for this specific action
    setError(null);
    try {
      const result = await serverValidateProductUrl(url);
      if (!result.success) {
        throw new Error(result.message || "Failed to validate URL");
      }
      return result.data; // { isValid: boolean, metadata: {...} } or similar
    } catch (err) {
      logger.error("Error in validateProductUrl:", err);
      setError(err.message); // Set context error or handle locally
      return null;
    } finally {
      setLoading(false); // Optional: clear loading state
    }
  }, []);


  // --- Data Mutation (using Server Actions and client-side updates) ---

  const createProduct = async (productData) => {
    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      Object.entries(productData).forEach(([key, value]) => {
        if (value === undefined || value === null) return;

        if (key === "thumbnail" && value instanceof File) {
          formData.append(key, value);
        } else if (key === "galleryImages" && Array.isArray(value)) {
          value.forEach((file, index) => {
            if (file instanceof File) {
              formData.append(`galleryImages[${index}]`, file);
            } else if (typeof file === 'string' && file.startsWith("data:")) { // Base64 gallery image
              try {
                const blob = dataURLtoBlob(file);
                formData.append(`galleryImages[${index}]`, blob, `gallery_${index}.jpg`);
              } catch (e) { logger.error("Failed to convert base64 gallery image for create:", e); }
            }
          });
        } else if (key === "thumbnail" && typeof value === "string" && value.startsWith("data:")) { // Base64 thumbnail
            try {
                const blob = dataURLtoBlob(value);
                formData.append("thumbnail", blob, "thumbnail.jpg");
            } catch (e) { logger.error("Failed to convert base64 thumbnail for create:", e); }
        } else if (typeof value === "object" && !(value instanceof File)) {
          formData.append(key, JSON.stringify(value));
        } else if (Array.isArray(value)) {
            formData.append(key, value.join(","));
        }
         else {
          formData.append(key, value);
        }
      });

      logger.info("Client: Creating product with FormData keys:", [...formData.keys()]);

      const result = await serverCreateProduct(formData); // Server action handles FormData
      if (!result.success || !result.data) {
        throw new Error(result.message || "Failed to create product");
      }
      const createdProduct = result.data;

      // Gallery images might be handled differently if serverCreateProduct doesn't return them updated
      // For now, assume createdProduct includes gallery if processed by server.
      // If not, a separate call to uploadGalleryImages might be needed here.

      if (createdProduct && createdProduct.slug) {
        addProductToMapping(createdProduct);
        updateProductInCache(createdProduct.slug, createdProduct);
        // Optionally, navigate or update UI
      }
      return createdProduct;
    } catch (err) {
      logger.error("Error in createProduct:", err);
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateProduct = useCallback(
    async (slug, productData) => {
      setLoading(true);
      setError(null);
      try {
        const formData = new FormData();

        Object.entries(productData).forEach(([key, value]) => {
          if (value === undefined) return;

          if (key === "thumbnail" && value instanceof File) {
            formData.append(key, value);
          } else if (key === "thumbnail" && typeof value === "string" && value.startsWith("data:")) {
             try {
                const blob = dataURLtoBlob(value);
                formData.append("thumbnail", blob, "thumbnail.jpg");
             } catch (e) { logger.error("Failed to convert base64 thumbnail for update:", e); }
          } else if (key === "gallery" && Array.isArray(value)) {
            // Separate gallery files to be handled by a dedicated upload function if serverUpdateProduct doesn't handle them
            // Or, if serverUpdateProduct *can* handle them, append them to formData
            // For this example, let's assume serverUpdateProduct can take gallery files.
            value.forEach((file, index) => {
              if (file instanceof File) {
                formData.append(`gallery[${index}]`, file);
              } else if (typeof file === 'string' && file.startsWith("data:")) { // Base64 gallery image
                  try {
                    const blob = dataURLtoBlob(file);
                    formData.append(`gallery[${index}]`, blob, `gallery_${index}.jpg`);
                  } catch (e) { logger.error("Failed to convert base64 gallery image for update:", e); }
              } else if (typeof file === 'object' && file.url) { // Existing image object
                // If you need to send existing image URLs, stringify them or handle as per API
                // formData.append(`gallery[${index}]`, JSON.stringify(file));
              }
            });
          } else if (typeof value === "object" && !(value instanceof File)) {
            formData.append(key, JSON.stringify(value));
          } else if (Array.isArray(value)) {
            formData.append(key, value.join(","));
          } else {
            formData.append(key, value);
          }
        });

        logger.info(`Client: Updating product ${slug} with FormData keys:`, [...formData.keys()]);

        const result = await serverUpdateProduct(slug, formData); // Server action handles FormData
        if (!result.success || !result.data) {
          throw new Error(result.message || "Failed to update product");
        }

        const updatedProductData = result.data; // This is the product object
        const newSlug = result.newSlug || updatedProductData.slug || slug;
        const slugChanged = result.slugChanged || false;
        const productId = updatedProductData._id || getIdFromSlug(slug);


        // Client-side cache management
        if (slugChanged && newSlug !== slug) {
          clearProductFromLocalCache(slug); // Clear old slug from various caches
          setProductCache(prev => {
            const newCache = {...prev};
            delete newCache[slug];
            return newCache;
          });
        }
        clearProductFromLocalCache(newSlug); // Always clear new slug
        updateProductInCache(newSlug, updatedProductData);

        if (currentProduct && (currentProduct.slug === slug || currentProduct._id === productId)) {
          setCurrentProduct(updatedProductData);
        }

        eventBus.publish(EVENT_TYPES.PRODUCT_UPDATED, {
          oldSlug: slug, newSlug, slugChanged, productId, product: updatedProductData, timestamp: Date.now()
        });

        return { success: true, data: updatedProductData, newSlug, slugChanged }; // Return the structure expected by components
      } catch (err) {
        logger.error(`Error in updateProduct for ${slug}:`, err);
        setError(err.message);
        return { success: false, message: err.message };
      } finally {
        setLoading(false);
      }
    },
    [currentProduct]
  );


  const deleteProduct = useCallback(
    async (slug) => {
      setLoading(true);
      setError(null);
      try {
        const result = await serverDeleteProduct(slug);
        if (!result.success) {
          throw new Error(result.message || "Failed to delete product");
        }

        const productId = result.productId || getIdFromSlug(slug); // serverDeleteProduct might return productId
        const wasAlreadyDeleted = result.wasAlreadyDeleted || false;

        processProductDeletion(slug, productId, wasAlreadyDeleted);
        return true;
      } catch (err) {
        // Special handling for 404s if server action doesn't explicitly return wasAlreadyDeleted
        if (err.message.includes("404") || (err.error && err.error.status === 404)) {
           logger.warn(`Product ${slug} not found during delete. Assuming already deleted by server.`);
           processProductDeletion(slug, getIdFromSlug(slug), true);
           return true; // Still a "successful" outcome from client perspective
        }
        logger.error(`Error in deleteProduct for ${slug}:`, err);
        setError(err.message);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [router, currentProduct] // currentProduct needed for processProductDeletion
  );

  const processProductDeletion = useCallback((slug, productId, wasAlreadyDeleted = false) => {
    clearProductFromLocalCache(slug);
    setProductCache(prevCache => {
      const newCache = { ...prevCache };
      if (newCache[slug]) delete newCache[slug];
      return newCache;
    });

    if (currentProduct && (currentProduct.slug === slug || currentProduct._id === productId)) {
      setCurrentProduct(null);
    }

    eventBus.publish(EVENT_TYPES.PRODUCT_DELETED, { slug, productId, wasAlreadyDeleted, timestamp: Date.now() });

    // Only navigate if not already part of a page that handles this (e.g. product list)
    // Consider if navigation is always desired or should be conditional
    if (router.pathname === `/product/${slug}` || router.asPath === `/product/${slug}`) { // Check current route
        router.push("/products");
    }
    return true;
  }, [currentProduct, router]);


  // --- Client-Side Cache and State Management ---
  const updateProductInCache = (slugOrId, updates) => {
    if (!slugOrId || !updates) return;
    let slug = slugOrId;
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(slugOrId);

    if (isObjectId) {
      slug = getSlugFromId(slugOrId);
      if (!slug) {
        logger.warn(`Cannot update product cache: No slug found for ID ${slugOrId}`);
        return;
      }
    }

    setProductCache(prevCache => {
      const prevProduct = prevCache[slug] || {};
      // Synchronize fields carefully
      const updated = { ...prevProduct, ...updates };

      // Ensure interaction consistency
      const hasUpvoted = updates.upvoted ?? updates.upvotes?.userHasUpvoted ?? prevProduct.upvoted ?? prevProduct.upvotes?.userHasUpvoted ?? false;
      const hasBookmarked = updates.bookmarked ?? updates.bookmarks?.userHasBookmarked ?? prevProduct.bookmarked ?? prevProduct.bookmarks?.userHasBookmarked ?? false;
      const upvoteCount = updates.upvoteCount ?? updates.upvotes?.count ?? prevProduct.upvoteCount ?? prevProduct.upvotes?.count ?? 0;
      const bookmarkCount = updates.bookmarkCount ?? updates.bookmarks?.count ?? prevProduct.bookmarkCount ?? prevProduct.bookmarks?.count ?? 0;

      updated.upvoted = hasUpvoted;
      updated.bookmarked = hasBookmarked;
      updated.upvoteCount = upvoteCount;
      updated.bookmarkCount = bookmarkCount;
      updated.upvotes = { ...(prevProduct.upvotes || {}), ...updates.upvotes, count: upvoteCount, userHasUpvoted: hasUpvoted };
      updated.bookmarks = { ...(prevProduct.bookmarks || {}), ...updates.bookmarks, count: bookmarkCount, userHasBookmarked: hasBookmarked };

      // Also update userInteractions if it exists
      if (prevProduct.userInteractions || updates.userInteractions) {
        updated.userInteractions = { ...(prevProduct.userInteractions || {}), ...updates.userInteractions, hasUpvoted, hasBookmarked };
      }

      // Ensure the product has a slug property
      if (!updated.slug) {
        updated.slug = slug;
      }

      // If the product has an ID, update the mapping
      if (updated._id && updated.slug) {
        addProductToMapping(updated);
      }

      return { ...prevCache, [slug]: updated };
    });

    if (currentProduct && (currentProduct.slug === slug || currentProduct._id === slugOrId)) {
      setCurrentProduct(prev => {
        const prevProduct = prev || {};
         // Synchronize fields carefully
        const updated = { ...prevProduct, ...updates };

        const hasUpvoted = updates.upvoted ?? updates.upvotes?.userHasUpvoted ?? prevProduct.upvoted ?? prevProduct.upvotes?.userHasUpvoted ?? false;
        const hasBookmarked = updates.bookmarked ?? updates.bookmarks?.userHasBookmarked ?? prevProduct.bookmarked ?? prevProduct.bookmarks?.userHasBookmarked ?? false;
        const upvoteCount = updates.upvoteCount ?? updates.upvotes?.count ?? prevProduct.upvoteCount ?? prevProduct.upvotes?.count ?? 0;
        const bookmarkCount = updates.bookmarkCount ?? updates.bookmarks?.count ?? prevProduct.bookmarkCount ?? prevProduct.bookmarks?.count ?? 0;

        updated.upvoted = hasUpvoted;
        updated.bookmarked = hasBookmarked;
        updated.upvoteCount = upvoteCount;
        updated.bookmarkCount = bookmarkCount;
        updated.upvotes = { ...(prevProduct.upvotes || {}), ...updates.upvotes, count: upvoteCount, userHasUpvoted: hasUpvoted };
        updated.bookmarks = { ...(prevProduct.bookmarks || {}), ...updates.bookmarks, count: bookmarkCount, userHasBookmarked: hasBookmarked };

        if (prevProduct.userInteractions || updates.userInteractions) {
            updated.userInteractions = { ...(prevProduct.userInteractions || {}), ...updates.userInteractions, hasUpvoted, hasBookmarked };
        }

        // Ensure the product has a slug property
        if (!updated.slug) {
          updated.slug = slug;
        }

        // If the product has an ID, update the mapping
        if (updated._id && updated.slug) {
          addProductToMapping(updated);
        }

        return updated;
      });
    }
  };

  // Clear product from local storage and potentially browser cache (client-side)
  const clearProductFromLocalCache = (slug) => {
    logger.info(`Clearing local cache for product slug: ${slug}`);
    // Example: localStorage.removeItem(`product_${slug}`);
    // This function might need to be more comprehensive based on how/where you cache
    // For now, it's a placeholder for more specific cache clearing logic.
    // The main client-side cache `productCache` is handled by setProductCache.
  };

  // --- Client-Side Actions (Interactions like upvote/bookmark) ---
  // These still call the API directly but then update client state optimistically or based on response.
  // They should ideally also be server actions if they modify backend state directly without complex client logic.
  // For now, keeping them as client-side calls to your existing API endpoints.

  const toggleUpvote = useCallback(async (slug) => {
    if (!user) {
      // Handle not logged in: redirect to login or show message
      router.push("/auth/login"); // Example
      return { success: false, message: "User not authenticated" };
    }

    // First, try to get the product from cache or current product
    let productToUpdate = currentProduct?.slug === slug ? currentProduct : productCache[slug];

    // If product is not in cache, try to fetch it
    if (!productToUpdate) {
      logger.warn(`Product with slug ${slug} not found in currentProduct or cache for toggleUpvote. Attempting to fetch.`);
      try {
        // Fetch the product
        const fetchedProduct = await getProductBySlug(slug, true); // true to bypass cache
        if (fetchedProduct) {
          productToUpdate = fetchedProduct;
          // Ensure it's added to the mapping for future socket updates
          if (productToUpdate._id && productToUpdate.slug) {
            addProductToMapping(productToUpdate);
          }
        }
      } catch (fetchError) {
        logger.error(`Failed to fetch product with slug ${slug} for toggleUpvote:`, fetchError);
      }
    }

    // If we still don't have the product, create a minimal product object to allow upvoting
    if (!productToUpdate) {
      logger.warn(`Creating minimal product object for slug ${slug} to allow upvoting.`);
      productToUpdate = {
        slug: slug,
        upvoted: false,
        upvoteCount: 0,
        upvotes: {
          userHasUpvoted: false,
          count: 0
        }
      };

      // Add to cache to prevent future issues
      updateProductInCache(slug, productToUpdate);
    }

    const originalUpvotedState = productToUpdate.upvoted || productToUpdate.upvotes?.userHasUpvoted || false;
    const originalUpvoteCount = productToUpdate.upvoteCount || productToUpdate.upvotes?.count || 0;

    // Optimistic UI update
    updateProductInCache(slug, {
      upvoted: !originalUpvotedState,
      upvoteCount: originalUpvotedState ? Math.max(0, originalUpvoteCount - 1) : originalUpvoteCount + 1,
      upvotes: {
        userHasUpvoted: !originalUpvotedState,
        count: originalUpvotedState ? Math.max(0, originalUpvoteCount - 1) : originalUpvoteCount + 1,
      }
    });

    try {
      // Make the API call for upvoting
      const response = await api.post(`/products/${slug}/upvote`);
      if (!response.data.success) {
        throw new Error(response.data.message || "Failed to toggle upvote");
      }

      // API returns the new state, update cache with source of truth
      const responseData = response.data.data;

      // If the API returned a product object, add it to the mapping
      if (responseData.product && responseData.product._id && responseData.product.slug) {
        addProductToMapping(responseData.product);
      }

      updateProductInCache(slug, {
        upvoted: responseData.userHasUpvoted,
        upvoteCount: responseData.count,
        upvotes: {
          userHasUpvoted: responseData.userHasUpvoted,
          count: responseData.count,
        }
      });

      return { success: true, ...responseData };
    } catch (err) {
      logger.error(`Error toggling upvote for ${slug}:`, err);
      // Revert optimistic update on error
      updateProductInCache(slug, {
        upvoted: originalUpvotedState,
        upvoteCount: originalUpvoteCount,
        upvotes: {
          userHasUpvoted: originalUpvotedState,
          count: originalUpvoteCount,
        }
      });
      setError(err.message);
      return { success: false, message: err.message };
    }
  }, [user, currentProduct, productCache, router, getProductBySlug]); // Added getProductBySlug

  const toggleBookmark = useCallback(async (slug) => {
    if (!user) {
      router.push("/auth/login");
      return { success: false, message: "User not authenticated" };
    }

    // First, try to get the product from cache or current product
    let productToUpdate = currentProduct?.slug === slug ? currentProduct : productCache[slug];

    // If product is not in cache, try to fetch it
    if (!productToUpdate) {
      logger.warn(`Product with slug ${slug} not found in currentProduct or cache for toggleBookmark. Attempting to fetch.`);
      try {
        // Fetch the product
        const fetchedProduct = await getProductBySlug(slug, true); // true to bypass cache
        if (fetchedProduct) {
          productToUpdate = fetchedProduct;
          // Ensure it's added to the mapping for future socket updates
          if (productToUpdate._id && productToUpdate.slug) {
            addProductToMapping(productToUpdate);
          }
        }
      } catch (fetchError) {
        logger.error(`Failed to fetch product with slug ${slug} for toggleBookmark:`, fetchError);
      }
    }

    // If we still don't have the product, create a minimal product object to allow bookmarking
    if (!productToUpdate) {
      logger.warn(`Creating minimal product object for slug ${slug} to allow bookmarking.`);
      productToUpdate = {
        slug: slug,
        bookmarked: false,
        bookmarkCount: 0,
        bookmarks: {
          userHasBookmarked: false,
          count: 0
        }
      };

      // Add to cache to prevent future issues
      updateProductInCache(slug, productToUpdate);
    }

    const originalBookmarkedState = productToUpdate.bookmarked || productToUpdate.bookmarks?.userHasBookmarked || false;
    const originalBookmarkCount = productToUpdate.bookmarkCount || productToUpdate.bookmarks?.count || 0;

    // Optimistic UI update
    updateProductInCache(slug, {
      bookmarked: !originalBookmarkedState,
      bookmarkCount: originalBookmarkedState ? Math.max(0, originalBookmarkCount - 1) : originalBookmarkCount + 1,
      bookmarks: {
        userHasBookmarked: !originalBookmarkedState,
        count: originalBookmarkedState ? Math.max(0, originalBookmarkCount - 1) : originalBookmarkCount + 1,
      }
    });

    try {
      // Make the API call for bookmarking
      const response = await api.post(`/products/${slug}/bookmark`);
      if (!response.data.success) {
        throw new Error(response.data.message || "Failed to toggle bookmark");
      }

      // API returns the new state, update cache with source of truth
      const responseData = response.data.data;

      // If the API returned a product object, add it to the mapping
      if (responseData.product && responseData.product._id && responseData.product.slug) {
        addProductToMapping(responseData.product);
      }

      updateProductInCache(slug, {
        bookmarked: responseData.userHasBookmarked,
        bookmarkCount: responseData.count,
        bookmarks: {
          userHasBookmarked: responseData.userHasBookmarked,
          count: responseData.count,
        }
      });

      return { success: true, ...responseData };
    } catch (err) {
      logger.error(`Error toggling bookmark for ${slug}:`, err);
      // Revert optimistic update
      updateProductInCache(slug, {
        bookmarked: originalBookmarkedState,
        bookmarkCount: originalBookmarkCount,
        bookmarks: {
          userHasBookmarked: originalBookmarkedState,
          count: originalBookmarkCount,
        }
      });
      setError(err.message);
      return { success: false, message: err.message };
    }
  }, [user, currentProduct, productCache, router, getProductBySlug]); // Added getProductBySlug

  // Get comments for a product
  const getComments = useCallback(async (slug, options = {}) => {
    if (!slug) {
      logger.error("getComments called without slug");
      return { success: false, message: "Product slug is required", comments: [] };
    }

    try {
      const result = await serverGetComments(slug, options);
      return result; // Pass through the result from the server action
    } catch (err) {
      logger.error(`Error in getComments for ${slug}:`, err);
      return {
        success: false,
        message: err.message || "Error fetching comments",
        comments: []
      };
    }
  }, []);

  // Add a comment to a product
  const addComment = useCallback(async (slug, content) => {
    if (!user) {
      return { success: false, message: "You must be logged in to comment" };
    }
    if (!slug) {
      return { success: false, message: "Product slug is required" };
    }

    try {
      const response = await api.post(`/products/${slug}/comments`, { content });

      if (!response.data.success) {
        throw new Error(response.data.message || "Failed to add comment");
      }

      return {
        success: true,
        data: response.data.data, // The newly created comment
        message: "Comment added successfully"
      };
    } catch (err) {
      logger.error(`Error adding comment to ${slug}:`, err);
      return {
        success: false,
        message: err.message || "Error adding comment"
      };
    }
  }, [user]);

  // Edit a comment
  const editComment = useCallback(async (slug, commentId, content) => {
    if (!user) {
      return { success: false, message: "You must be logged in to edit comments" };
    }
    if (!slug || !commentId) {
      return { success: false, message: "Product slug and comment ID are required" };
    }

    try {
      const response = await api.put(`/products/${slug}/comments/${commentId}`, { content });

      if (!response.data.success) {
        throw new Error(response.data.message || "Failed to edit comment");
      }

      return {
        success: true,
        data: response.data.data, // The updated comment
        message: "Comment updated successfully"
      };
    } catch (err) {
      logger.error(`Error editing comment ${commentId} on ${slug}:`, err);
      return {
        success: false,
        message: err.message || "Error editing comment"
      };
    }
  }, [user]);

  // Delete a comment
  const deleteComment = useCallback(async (slug, commentId) => {
    if (!user) {
      return { success: false, message: "You must be logged in to delete comments" };
    }
    if (!slug || !commentId) {
      return { success: false, message: "Product slug and comment ID are required" };
    }

    try {
      const response = await api.delete(`/products/${slug}/comments/${commentId}`);

      if (!response.data.success) {
        throw new Error(response.data.message || "Failed to delete comment");
      }

      return {
        success: true,
        data: { commentId }, // Return the deleted comment ID
        message: "Comment deleted successfully"
      };
    } catch (err) {
      logger.error(`Error deleting comment ${commentId} on ${slug}:`, err);
      return {
        success: false,
        message: err.message || "Error deleting comment"
      };
    }
  }, [user]);

  // Toggle like on a comment
  const toggleCommentLike = useCallback(async (slug, commentId, isReply, parentId) => {
    if (!user) {
      return { success: false, message: "You must be logged in to like comments" };
    }
    if (!slug || !commentId) {
      return { success: false, message: "Product slug and comment ID are required" };
    }

    try {
      const endpoint = isReply
        ? `/products/${slug}/comments/${parentId}/replies/${commentId}/like`
        : `/products/${slug}/comments/${commentId}/like`;

      const response = await api.post(endpoint);

      if (!response.data.success) {
        throw new Error(response.data.message || "Failed to toggle like");
      }

      return {
        success: true,
        data: {
          commentId,
          isLiked: response.data.data.isLiked,
          likeCount: response.data.data.likeCount
        },
        message: response.data.data.isLiked ? "Comment liked" : "Comment unliked"
      };
    } catch (err) {
      logger.error(`Error toggling like on comment ${commentId} on ${slug}:`, err);
      return {
        success: false,
        message: err.message || "Error toggling like"
      };
    }
  }, [user]);

  // Add a reply to a comment
  const addReply = useCallback(async (slug, commentId, content, options = {}) => {
    if (!user) {
      return { success: false, message: "You must be logged in to reply" };
    }
    if (!slug || !commentId) {
      return { success: false, message: "Product slug and comment ID are required" };
    }

    try {
      const response = await api.post(`/products/${slug}/comments/${commentId}/replies`, {
        content,
        replyToId: options.replyToId // Optional ID of the reply this is responding to
      });

      if (!response.data.success) {
        throw new Error(response.data.message || "Failed to add reply");
      }

      return {
        success: true,
        data: response.data.data, // The newly created reply
        message: "Reply added successfully"
      };
    } catch (err) {
      logger.error(`Error adding reply to comment ${commentId} on ${slug}:`, err);
      return {
        success: false,
        message: err.message || "Error adding reply"
      };
    }
  }, [user]);

  // Edit a reply
  const editReply = useCallback(async (slug, commentId, replyId, content) => {
    if (!user) {
      return { success: false, message: "You must be logged in to edit replies" };
    }
    if (!slug || !commentId || !replyId) {
      return { success: false, message: "Product slug, comment ID, and reply ID are required" };
    }

    try {
      const response = await api.put(`/products/${slug}/comments/${commentId}/replies/${replyId}`, { content });

      if (!response.data.success) {
        throw new Error(response.data.message || "Failed to edit reply");
      }

      return {
        success: true,
        data: response.data.data, // The updated reply
        message: "Reply updated successfully"
      };
    } catch (err) {
      logger.error(`Error editing reply ${replyId} on comment ${commentId} on ${slug}:`, err);
      return {
        success: false,
        message: err.message || "Error editing reply"
      };
    }
  }, [user]);

  // Delete a reply
  const deleteReply = useCallback(async (slug, commentId, replyId) => {
    if (!user) {
      return { success: false, message: "You must be logged in to delete replies" };
    }
    if (!slug || !commentId || !replyId) {
      return { success: false, message: "Product slug, comment ID, and reply ID are required" };
    }

    try {
      const response = await api.delete(`/products/${slug}/comments/${commentId}/replies/${replyId}`);

      if (!response.data.success) {
        throw new Error(response.data.message || "Failed to delete reply");
      }

      return {
        success: true,
        data: { replyId }, // Return the deleted reply ID
        message: "Reply deleted successfully"
      };
    } catch (err) {
      logger.error(`Error deleting reply ${replyId} on comment ${commentId} on ${slug}:`, err);
      return {
        success: false,
        message: err.message || "Error deleting reply"
      };
    }
  }, [user]);

  // --- Value provided by Context ---
  const value = {
    loading,
    error,
    clearError,
    currentProduct,
    setCurrentProduct, // Allow direct setting if needed, e.g., from SSR page props
    productCache,      // Expose cache for direct access if necessary
    getProductBySlug,
    getAllProducts,
    validateProductUrl,
    createProduct,
    updateProduct,
    deleteProduct,
    toggleUpvote,
    toggleBookmark,
    updateProductInCache, // Expose for external updates if needed (e.g. from other contexts or direct server data)

    // Comment-related functions
    getComments,
    addComment,
    editComment,
    deleteComment,
    toggleCommentLike,
    addReply,
    editReply,
    deleteReply,
  };

  return <ProductContext.Provider value={value}>{children}</ProductContext.Provider>;
};
