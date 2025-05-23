"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useProduct } from "@/lib/contexts/product-context";
import { useAuth } from "@/lib/contexts/auth-context";
import { useToast } from "@/lib/contexts/toast-context";
import { useRecommendation } from "@/lib/contexts/recommendation-context";
import { addProductToMapping } from "@/lib/utils/product/product-mapping-utils";
import eventBus, { EVENT_TYPES } from "@/lib/utils/event-bus";
import logger from "@/lib/utils/logger";

/**
 * A bookmark icon component.
 * Changes appearance based on the bookmarked state.
 */
const BookmarkIcon = ({ isBookmarked, size = "md", className = "" }) => {
  // Size definitions
  const sizeMap = {
    sm: { width: 16, height: 16, strokeWidth: 1.5 },
    md: { width: 20, height: 20, strokeWidth: 1.5 },
    lg: { width: 24, height: 24, strokeWidth: 1.5 },
  };

  const { width, height, strokeWidth } = sizeMap[size] || sizeMap.md;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={width}
      height={height}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`${className} transition-all duration-200`}
      aria-hidden="true"
    >
      <path
        d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"
        fill={isBookmarked ? "currentColor" : "none"}
      />
    </svg>
  );
};

/**
 * A button component for bookmarking a product.
 * Features optimistic UI, loading/disabled states, auth checks,
 * owner restrictions, real-time updates, and interaction recording.
 */
const BookmarkButton = ({
  product, // The full product object is preferred
  slug, // Can be provided as an alternative if product object is minimal
  hasBookmarked: initialHasBookmarked, // Explicit prop to override initial state
  bookmarkCount: initialBookmarkCount, // Explicit prop to override initial count
  size = "md", // 'sm', 'md', 'lg'
  source = "unknown", // Context where the button is used
  onSuccess, // Callback function on successful toggle: (result: { success: boolean, bookmarked: boolean, count: number }) => void
  className = "", // Additional CSS classes for the container div
  showCount = true, // Whether to display the bookmark count
  showText = false, // Whether to show "Save" / "Saved" text
  disabled = false, // Explicitly disable the button
}) => {
  // Determine product slug
  const productSlug = slug || product?.slug;
  const productId = product?._id;

  // Hooks
  const { toggleBookmark, productCache } = useProduct();
  const { isAuthenticated, user } = useAuth();
  const { showToast } = useToast();
  const { recordInteraction } = useRecommendation();

  // State
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [count, setCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false); // For API call in progress
  const [isProcessing, setIsProcessing] = useState(false); // Debounce rapid clicks

  // Ref to track mounted state
  const isMounted = useRef(true);

  // Check if the current user is the maker/owner of the product
  const isOwner = user && product && (user._id === product.maker || user._id === product?.maker?._id);


  // --- Initial State Calculation ---
   const getInitialBookmarked = useCallback(() => {
    if (!product && initialHasBookmarked === undefined) return false; // No data
    if (initialHasBookmarked !== undefined) return initialHasBookmarked;
    if (product?.userInteractions?.hasBookmarked !== undefined) return product.userInteractions.hasBookmarked;
    if (product?.bookmarks?.userHasBookmarked !== undefined) return product.bookmarks.userHasBookmarked;
    if (product?.bookmarked !== undefined) return product.bookmarked;
    return false;
  }, [product, initialHasBookmarked]);

  const getInitialCount = useCallback(() => {
    if (!product && initialBookmarkCount === undefined) return 0; // No data
    if (initialBookmarkCount !== undefined) return initialBookmarkCount;
    // Prioritize direct count field (expected from API)
    if (product?.bookmarkCount !== undefined && typeof product.bookmarkCount === 'number') return product.bookmarkCount;
    // Fallback to nested structure (older cache/data)
    if (product?.bookmarks?.count !== undefined && typeof product.bookmarks.count === 'number') return product.bookmarks.count;
    return 0;
  }, [product, initialBookmarkCount]);

  // Effect to initialize state when component mounts or product changes
  useEffect(() => {
    setIsBookmarked(getInitialBookmarked());
    setCount(getInitialCount());
  }, [getInitialBookmarked, getInitialCount]);

  // Effect to update state if props/product data change *after* initial mount
  useEffect(() => {
    const newBookmarked = getInitialBookmarked();
    const newCount = getInitialCount();

    if (isBookmarked !== newBookmarked) {
       logger.debug(`BookmarkButton: Prop/Product update changed bookmarked state for ${productSlug}`, { old: isBookmarked, new: newBookmarked });
       setIsBookmarked(newBookmarked);
    }
    if (count !== newCount) {
       logger.debug(`BookmarkButton: Prop/Product update changed count for ${productSlug}`, { old: count, new: newCount });
       setCount(newCount);
    }

     // Add product to mapping for socket updates if available
     if (productId && productSlug) {
        addProductToMapping({ _id: productId, slug: productSlug });
     }

  }, [
    product?.userInteractions?.hasBookmarked,
    product?.bookmarks?.userHasBookmarked,
    product?.bookmarked,
    product?.bookmarkCount,
    product?.bookmarks?.count,
    initialHasBookmarked,
    initialBookmarkCount,
    productSlug,
    productId,
    getInitialCount,
    getInitialBookmarked
  ]);

  // Effect for Mounted Ref
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Effect to listen for global bookmark events from EventBus and Socket
  useEffect(() => {
    if (!productSlug && !productId) {
      return;
    }

    // Get the socket instance
    const socket = window.socket;

    // Create stable references to current state values
    // This prevents the effect from re-running when these values change
    const currentProductId = productId;
    const currentProductSlug = productSlug;
    const currentUserId = user?._id;

    const handleBookmarkUpdate = (data) => {
      // Check if this event is for our product
      const isForThisProduct =
        (currentProductSlug && data.slug === currentProductSlug) ||
        (currentProductId && data.productId === currentProductId);

      if (!isForThisProduct || !isMounted.current) return;

      // Update count if it changed
      if (data.count !== undefined) {
        setCount(prevCount => {
          if (data.count !== prevCount) {
            return data.count;
          }
          return prevCount;
        });
      }

      // Get current user ID from user object or localStorage
      const userId = currentUserId || localStorage.getItem('userId');
      const isCurrentUserAction = data.userId === userId;

      // Determine if we should update the bookmarked state
      // Case 1: Direct bookmarked state is provided
      if (data.bookmarked !== undefined) {
        setIsBookmarked(prevState => {
          if (data.bookmarked !== prevState) {
            return data.bookmarked;
          }
          return prevState;
        });
      }
      // Case 2: Current user's action is provided
      else if (isCurrentUserAction && data.action) {
        const newBookmarkedState = data.action === 'add';
        setIsBookmarked(prevState => {
          if (newBookmarkedState !== prevState) {
            return newBookmarkedState;
          }
          return prevState;
        });
      }
    };

    const handleProductUpdate = (data) => {
      // Check if this event is for our product
      const isForThisProduct =
        (currentProductSlug && data.slug === currentProductSlug) ||
        (currentProductId && data.productId === currentProductId);

      if (!isForThisProduct || !data.updates || !isMounted.current) return;

      const updates = data.updates;

      // Update count if it changed
      if (updates.bookmarkCount !== undefined) {
        setCount(prevCount => {
          if (updates.bookmarkCount !== prevCount) {
            return updates.bookmarkCount;
          }
          return prevCount;
        });
      }

      // Update bookmarked state if it changed
      if (updates.bookmarked !== undefined) {
        setIsBookmarked(prevState => {
          if (updates.bookmarked !== prevState) {
            return updates.bookmarked;
          }
          return prevState;
        });
      }
    };

    // Handle direct socket bookmark events
    const handleSocketBookmarkEvent = (data) => {
      // Check if this event is for our product
      const isForThisProduct = (currentProductId && data.productId === currentProductId);

      if (!isForThisProduct || !isMounted.current) return;

      // Update count if it changed
      if (data.count !== undefined) {
        setCount(prevCount => {
          if (data.count !== prevCount) {
            return data.count;
          }
          return prevCount;
        });
      }

      // Get current user ID from user object or localStorage
      const userId = currentUserId || localStorage.getItem('userId');
      const isCurrentUserAction = data.userId === userId;

      // Update bookmarked state if this is the current user's action
      if (isCurrentUserAction && data.action) {
        const newBookmarkedState = data.action === 'add';
        setIsBookmarked(prevState => {
          if (newBookmarkedState !== prevState) {
            return newBookmarkedState;
          }
          return prevState;
        });
      }
    };

    // Subscribe to events
    const unsubscribeBookmark = eventBus.subscribe(EVENT_TYPES.BOOKMARK_UPDATED, handleBookmarkUpdate);
    const unsubscribeProduct = eventBus.subscribe(EVENT_TYPES.PRODUCT_UPDATED, handleProductUpdate);

    // Subscribe to socket events if socket is available
    if (socket && socket.on) {
      socket.on('product:bookmark', handleSocketBookmarkEvent);
    }

    return () => {
      unsubscribeBookmark();
      unsubscribeProduct();

      // Unsubscribe from socket events if socket is available
      if (socket && socket.off) {
        socket.off('product:bookmark', handleSocketBookmarkEvent);
      }
    };

  }, [productSlug, productId, user?._id]); // Removed count and isBookmarked from dependencies

  // Effect to check for updates in the global product cache
  useEffect(() => {
    if (!productSlug || !isMounted.current) return;
    const cachedProduct = productCache[productSlug];

    if (cachedProduct) {
      // Determine count from cache
      const cachedCount = cachedProduct.bookmarkCount ?? cachedProduct.bookmarks?.count ?? count;
      if (cachedCount !== count) {
         logger.debug(`BookmarkButton: Cache update changed count for ${productSlug}`, { old: count, new: cachedCount });
         setCount(cachedCount);
      }

      // Determine bookmarked state from cache
      const cachedBookmarkedState =
        cachedProduct.bookmarked ??
        cachedProduct.bookmarks?.userHasBookmarked ??
        cachedProduct.userInteractions?.hasBookmarked ??
        isBookmarked;

      if (cachedBookmarkedState !== isBookmarked) {
         logger.debug(`BookmarkButton: Cache update changed bookmarked state for ${productSlug}`, { old: isBookmarked, new: cachedBookmarkedState });
         setIsBookmarked(cachedBookmarkedState);
      }
    }
  }, [productSlug, productCache, count, isBookmarked]);


  // Handle bookmark action
  const handleBookmark = async (e) => {
    e.preventDefault();
    e.stopPropagation();

     if (!productSlug) {
       logger.error("BookmarkButton: Cannot toggle bookmark without product slug.");
       showToast("error", "Cannot perform action: Product identifier missing.");
       return;
     }

    if (!isAuthenticated) {
      showToast("info", "Authentication required to save products. Please log in or create an account to build your collection.");
      return;
    }
    if (isOwner) {
      showToast("info", "As the creator of this product, you cannot bookmark your own work. This helps maintain fair recommendations.");
      return;
    }
    if (isLoading || isProcessing) return;

    setIsLoading(true);
    setIsProcessing(true);

    // Optimistic UI update
    const previousState = isBookmarked;
    const previousCount = count;
    setIsBookmarked(!isBookmarked);
    setCount(prev => isBookmarked ? Math.max(0, prev - 1) : prev + 1);

    try {
      // Call API via context
      const result = await toggleBookmark(productSlug);

      if (!result.success) {
        // Revert optimistic update on failure
         if (isMounted.current) {
             setIsBookmarked(previousState);
             setCount(previousCount);
         }
        showToast("error", result.message || "Failed to update bookmark");
        logger.warn(`Bookmark failed for ${productSlug}: ${result.message}`);
        return; // Exit early
      }

      // --- Sync with server state ---
      const serverCount = result.bookmarkCount ?? result.count ?? count; // Prioritize specific field
      const serverBookmarkedState = result.bookmarked ?? !previousState;

      if (isMounted.current) {
          if(serverCount !== count) setCount(serverCount);
          if(serverBookmarkedState !== isBookmarked) setIsBookmarked(serverBookmarkedState);
      }
       // ---

      // Record interaction for recommendations (fire and forget)
      if (recordInteraction) {
         recordInteraction(productSlug, serverBookmarkedState ? "bookmark" : "remove_bookmark", {
            source,
            previousInteraction: previousState ? "bookmarked" : "none",
         }).catch(err => logger.error(`Failed to record bookmark interaction for ${productSlug}:`, err));
      }

      // Call success callback if provided
      if (onSuccess) {
        onSuccess({ ...result, count: serverCount, bookmarked: serverBookmarkedState });
      }

      // Show success toast (optional)
      // showToast("success", serverBookmarkedState ? "Product saved!" : "Bookmark removed");

    } catch (error) {
      logger.error(`Error toggling bookmark for ${productSlug}:`, error);
      // Revert optimistic update on error
      if (isMounted.current) {
          setIsBookmarked(previousState);
          setCount(previousCount);
      }

      // Provide more specific error message based on error type
      let errorMessage = "We couldn't save this product to your collection. Please try again later.";

      if (error.response) {
        // Handle specific HTTP error codes
        if (error.response.status === 401) {
          errorMessage = "Your session has expired. Please log in again to save this product.";
        } else if (error.response.status === 403) {
          errorMessage = "You don't have permission to save this product. This may be due to account restrictions.";
        } else if (error.response.status === 429) {
          errorMessage = "You've reached the maximum number of saved items. Please remove some items and try again.";
        } else if (error.response.status === 409) {
          errorMessage = "This product is already in your collection.";
        } else if (error.response.data?.message) {
          errorMessage = error.response.data.message;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }

      showToast("error", errorMessage);
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
        setTimeout(() => {
          if (isMounted.current) setIsProcessing(false);
        }, 300);
      }
    }
  };

  // --- Dynamic Styling ---
  // Size-specific classes for the button
  const buttonSizeClasses = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-12 w-12",
  };

  // Button state styling
  const buttonStateClasses = isBookmarked
    ? "bg-violet-100 text-violet-700 border-violet-300 hover:bg-violet-200 hover:border-violet-400 shadow-sm"
    : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50 hover:text-gray-800 hover:border-gray-400";

  // Classes for disabled/loading states
  const isDisabled = disabled || isLoading || isOwner || isProcessing || !productSlug;
  const disabledClasses = isDisabled ? "opacity-60 cursor-not-allowed" : "";
  const loadingClasses = isLoading ? "opacity-80 cursor-wait" : "";

  // Classes for the count display
  const countSizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  };
  const countColorClasses = isBookmarked ? "text-violet-800" : "text-gray-700";

  // Text classes for when showText is true
  const textClasses = {
    sm: "text-xs ml-1",
    md: "text-sm ml-1.5",
    lg: "text-sm ml-1.5",
  };

  // Tooltip text based on state
  const buttonTitle = isOwner
    ? "As the creator of this product, you cannot bookmark your own work. This helps maintain fair recommendations."
    : isDisabled && !isOwner
    ? "Bookmark button is disabled"
    : isBookmarked
    ? "Remove from saved"
    : "Save for later";

  // Animation classes for the button
  const animationClasses = "transform transition-transform duration-150 active:scale-95";

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <button
        type="button"
        onClick={handleBookmark}
        disabled={isDisabled}
        className={`
          rounded-full
          flex items-center justify-center
          border
          ${buttonSizeClasses[size] || buttonSizeClasses.md}
          ${buttonStateClasses}
          ${disabledClasses}
          ${loadingClasses}
          ${animationClasses}
          focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-violet-400
          transition-all duration-200 ease-in-out
          ${showText ? 'px-3 rounded-lg w-auto' : ''}
        `}
        title={buttonTitle}
        aria-pressed={isBookmarked}
        aria-label={
          isOwner
            ? "Cannot bookmark own product"
            : isBookmarked
            ? `Remove bookmark for ${product?.name || "product"}`
            : `Bookmark ${product?.name || "product"}`
        }
      >
        <BookmarkIcon
          isBookmarked={isBookmarked}
          size={size}
        />
        {showText && (
          <span className={textClasses[size] || textClasses.md}>
            {isBookmarked ? 'Saved' : 'Save'}
          </span>
        )}
      </button>

      {showCount && (
        <span
          className={`font-semibold tabular-nums ${countColorClasses} ${countSizeClasses[size] || countSizeClasses.md}`}
          aria-live="polite"
          aria-atomic="true"
        >
          {count >= 1000 ? `${(count / 1000).toFixed(1)}k` : count}
        </span>
      )}
    </div>
  );
};

export default BookmarkButton;