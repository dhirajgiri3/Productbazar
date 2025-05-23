// UpvoteButton.jsx
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
 * A circular SVG upvote icon component.
 * Changes appearance based on the upvoted state.
 */
const CircularUpvoteIcon = ({ isUpvoted, size = "md", className = "" }) => {
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
      <polygon
        points="12 6 5 15 19 15"
        fill={isUpvoted ? "currentColor" : "none"}
      />
    </svg>
  );
};

/**
 * A circular button component for upvoting/downvoting a product.
 * Features optimistic UI, loading/disabled states, auth checks,
 * owner restrictions, real-time updates, and interaction recording.
 */
const UpvoteButton = ({
  product,
  slug,
  hasUpvoted: initialHasUpvoted,
  upvoteCount: initialUpvoteCount,
  size = "md",
  source = "unknown",
  onSuccess,
  className = "",
  showCount = true,
  disabled = false,
}) => {
  // --- Hooks ---
  const { toggleUpvote } = useProduct();
  const { isAuthenticated, user } = useAuth();
  const { showToast } = useToast();
  const { recordInteraction } = useRecommendation();

  // --- Identifiers ---
  const productSlug = slug || product?.slug;
  const productId = product?._id;

  // --- State ---
  const [isUpvoted, setIsUpvoted] = useState(false);
  const [count, setCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const isMounted = useRef(true);

  // --- Derived State ---
  const isOwner = Boolean(
    isAuthenticated &&
    user &&
    product &&
    (user._id === product.maker || user._id === product?.maker?._id)
  );
  const isDisabled = disabled || isLoading || isOwner || isProcessing || !productSlug;

  // --- Initialization ---
  const getInitialUpvoted = useCallback(() => {
    if (initialHasUpvoted !== undefined) return initialHasUpvoted;
    return product?.userInteractions?.hasUpvoted ?? product?.upvoted ?? false;
  }, [product, initialHasUpvoted]);

  const getInitialCount = useCallback(() => {
    if (initialUpvoteCount !== undefined) return initialUpvoteCount;
    return product?.upvoteCount ?? 0;
  }, [product, initialUpvoteCount]);

  useEffect(() => {
    isMounted.current = true;
    setIsUpvoted(getInitialUpvoted());
    setCount(getInitialCount());

    if (productId && productSlug) {
      addProductToMapping({ _id: productId, slug: productSlug });
    }

    if (!productSlug) {
      logger.warn("UpvoteButton initialized without a 'slug' or 'product.slug'.", { component: "UpvoteButton" });
    }

    return () => {
      isMounted.current = false;
    };
  }, [getInitialUpvoted, getInitialCount, productId, productSlug]);

  // --- Real-time Updates via Event Bus and Socket ---
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

    const handleUpvoteUpdate = (data) => {
      // Check if this event is for our product
      const isRelevantProduct =
        (currentProductSlug && data.slug === currentProductSlug) ||
        (currentProductId && data.productId === currentProductId);

      if (!isRelevantProduct || !isMounted.current) return;

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

      // Determine if we should update the upvoted state
      // Case 1: Direct upvoted state is provided
      if (data.upvoted !== undefined) {
        setIsUpvoted(prevState => {
          if (data.upvoted !== prevState) {
            return data.upvoted;
          }
          return prevState;
        });
      }
      // Case 2: Current user's action is provided
      else if (isCurrentUserAction && data.action) {
        const newUpvotedState = data.action === "add";
        setIsUpvoted(prevState => {
          if (newUpvotedState !== prevState) {
            return newUpvotedState;
          }
          return prevState;
        });
      }
    };

    const handleProductUpdate = (data) => {
      // Check if this event is for our product
      const isRelevantProduct =
        (currentProductSlug && data.slug === currentProductSlug) ||
        (currentProductId && data.productId === currentProductId);

      if (!isRelevantProduct || !data.updates || !isMounted.current) return;

      const updates = data.updates;

      // Update count if it changed
      if (updates.upvoteCount !== undefined) {
        setCount(prevCount => {
          if (updates.upvoteCount !== prevCount) {
            return updates.upvoteCount;
          }
          return prevCount;
        });
      }

      // Update upvoted state if it changed
      if (updates.upvoted !== undefined) {
        setIsUpvoted(prevState => {
          if (updates.upvoted !== prevState) {
            return updates.upvoted;
          }
          return prevState;
        });
      }
    };

    // Handle direct socket upvote events
    const handleSocketUpvoteEvent = (data) => {
      // Check if this event is for our product
      const isRelevantProduct = (currentProductId && data.productId === currentProductId);

      if (!isRelevantProduct || !isMounted.current) return;

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

      // Update upvoted state if this is the current user's action
      if (isCurrentUserAction && data.action) {
        const newUpvotedState = data.action === "add";
        setIsUpvoted(prevState => {
          if (newUpvotedState !== prevState) {
            return newUpvotedState;
          }
          return prevState;
        });
      }
    };

    // Subscribe to events
    const unsubscribeUpvote = eventBus.subscribe(EVENT_TYPES.UPVOTE_UPDATED, handleUpvoteUpdate);
    const unsubscribeProduct = eventBus.subscribe(EVENT_TYPES.PRODUCT_UPDATED, handleProductUpdate);

    // Subscribe to socket events if socket is available
    if (socket && socket.on) {
      socket.on('product:upvote', handleSocketUpvoteEvent);
    }

    return () => {
      unsubscribeUpvote();
      unsubscribeProduct();

      // Unsubscribe from socket events if socket is available
      if (socket && socket.off) {
        socket.off('product:upvote', handleSocketUpvoteEvent);
      }
    };

  }, [productSlug, productId, user?._id]); // Removed count and isUpvoted from dependencies

  // --- Action Handler ---
  const handleUpvote = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!productSlug) {
      showToast("error", "Cannot upvote: Product information is missing.");
      logger.error("Upvote failed: Missing productSlug.", { component: "UpvoteButton" });
      return;
    }
    if (!isAuthenticated) {
      showToast("info", "Authentication required to upvote. Please log in or create an account to show your support for this product.");
      return;
    }
    if (isOwner) {
      showToast("info", "As the creator of this product, you cannot upvote your own work. This helps maintain fair ratings.");
      return;
    }
    if (isLoading || isProcessing) {
      return;
    }

    setIsLoading(true);
    setIsProcessing(true);

    const previousState = { isUpvoted, count };
    setIsUpvoted(!isUpvoted);
    setCount((prev) => (isUpvoted ? Math.max(0, prev - 1) : prev + 1));

    try {
      const result = await toggleUpvote(productSlug);

      if (!isMounted.current) return;

      if (!result || !result.success) {
        setIsUpvoted(previousState.isUpvoted);
        setCount(previousState.count);
        showToast("error", result?.message || "Failed to update upvote. Please try again.");
        logger.warn("Upvote API call failed or returned unsuccessful.", { slug: productSlug, result });
        return;
      }

      const serverCount = result.upvoteCount ?? result.count ?? (previousState.isUpvoted ? previousState.count - 1 : previousState.count + 1);
      const serverUpvotedState = result.upvoted ?? !previousState.isUpvoted;

      if (serverCount !== count) setCount(serverCount);
      if (serverUpvotedState !== isUpvoted) setIsUpvoted(serverUpvotedState);

      recordInteraction?.(
        productSlug,
        serverUpvotedState ? "upvote" : "remove_upvote",
        { source, previousInteraction: previousState.isUpvoted ? "upvoted" : "none" }
      ).catch((err) => logger.error(`Failed to record interaction: ${err}`, { productSlug }));

      onSuccess?.({ ...result, count: serverCount, upvoted: serverUpvotedState });

    } catch (error) {
      logger.error(`Upvote action threw an error for slug ${productSlug}:`, { error });
      if (isMounted.current) {
        setIsUpvoted(previousState.isUpvoted);
        setCount(previousState.count);
      }
      // Provide more specific error message based on error type
      let errorMessage = "We couldn't process your upvote at this time. Please try again later.";

      if (error.response) {
        // Handle specific HTTP error codes
        if (error.response.status === 401) {
          errorMessage = "Your session has expired. Please log in again to upvote this product.";
        } else if (error.response.status === 403) {
          errorMessage = "You don't have permission to upvote this product. This may be due to account restrictions.";
        } else if (error.response.status === 429) {
          errorMessage = "You've reached the maximum number of interactions. Please try again later.";
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
        }, 250);
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
  const buttonStateClasses = isUpvoted
    ? "bg-violet-100 text-violet-700 border-violet-300 hover:bg-violet-200 hover:border-violet-400 shadow-sm"
    : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50 hover:text-gray-800 hover:border-gray-400";

  // Classes for disabled/loading states
  const disabledClasses = isDisabled ? "opacity-60 cursor-not-allowed" : "";
  const loadingClasses = isLoading ? "opacity-80 cursor-wait" : "";

  // Classes for the count display
  const countSizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  };
  const countColorClasses = isUpvoted ? "text-violet-800" : "text-gray-700";

  // Tooltip text based on state
  const buttonTitle = isOwner
    ? "As the creator of this product, you cannot upvote your own work. This helps maintain fair ratings."
    : isDisabled && !isOwner
    ? "Upvote button is disabled"
    : isUpvoted
    ? "Remove upvote"
    : "Upvote this product";

  // Animation classes for the button
  const animationClasses = "transform transition-transform duration-150 active:scale-95";

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <button
        type="button"
        onClick={handleUpvote}
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
        `}
        title={buttonTitle}
        aria-pressed={isUpvoted}
        aria-label={
          isOwner
            ? "Cannot upvote own product"
            : isUpvoted
            ? `Remove upvote for ${product?.name || "product"}`
            : `Upvote ${product?.name || "product"}`
        }
      >
        <CircularUpvoteIcon
          isUpvoted={isUpvoted}
          size={size}
        />
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

export default UpvoteButton;