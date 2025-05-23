// GitHub Copilot: Current Date/Time: 2025-04-20 15:17:05 UTC | User: dhirajgiri3
"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/contexts/auth-context";
import { useProduct } from "@/lib/contexts/product-context";
import { useToast } from "@/lib/contexts/toast-context";
import DeleteCommentModal from "../../../../../Components/Modal/Comment/DeleteCommentModal";
import LoginPrompt from "../../../../../Components/common/Auth/LoginPrompt";
import CommentForm from "./Components/CommentForm";
import CommentItem from "./Components/CommentItem"; // Verify path
import { motion, AnimatePresence } from "framer-motion";
import { FaComments, FaLightbulb, FaChevronDown } from "react-icons/fa";
import { useRecommendation } from "@/lib/contexts/recommendation-context";

// --- Helper Components (Defined within CommentSection for encapsulation) ---

// Comment Counter
const CommentCounter = ({ count = 0 }) => {
  return (
    <div className="flex items-center justify-center bg-violet-100 dark:bg-violet-900/50 text-violet-700 dark:text-violet-300 py-0.5 px-2 rounded-full text-xs font-medium">
      {count}
    </div>
  );
};

// Section Header
const SectionHeader = ({ title, count }) => {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-violet-100 dark:bg-violet-500/20 rounded-lg text-violet-500 dark:text-violet-400">
          <FaComments size={20} />
        </div>
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
          {title}
        </h2>
        <CommentCounter count={count} />
      </div>
    </div>
  );
};

// Empty State
const EmptyState = () => {
  return (
    <div className="text-center py-16 bg-gray-50/50 dark:bg-gray-800/30 rounded-xl border border-gray-200/80 dark:border-gray-700/50">
      <div className="mx-auto mb-4 w-12 h-12 flex items-center justify-center rounded-full bg-violet-100 dark:bg-violet-900/40 text-violet-500 dark:text-violet-400">
        <FaLightbulb size={20} />
      </div>
      <h3 className="font-semibold text-base mb-1 text-gray-700 dark:text-gray-200">
        Be the first to comment
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
        Your thoughts matter. Share your feedback or ask a question to get the
        conversation started.
      </p>
    </div>
  );
};

// Skeleton Loader
const SkeletonLoader = ({ count = 3 }) => {
  return (
    <div className="space-y-5">
      {[...Array(count)].map((_, i) => (
        <div
          key={i}
          className="bg-white dark:bg-gray-800/50 rounded-lg p-4 animate-pulse"
        >
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-full bg-gray-200 dark:bg-gray-700 flex-shrink-0 mt-1"></div>
            <div className="flex-grow space-y-3 pt-1">
              <div className="flex justify-between">
                <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded-full w-1/4"></div>
                <div className="h-2.5 bg-gray-200 dark:bg-gray-600 rounded-full w-1/6"></div>
              </div>
              <div className="space-y-1.5">
                <div className="h-2.5 bg-gray-200 dark:bg-gray-600/80 rounded-full w-full"></div>
                <div className="h-2.5 bg-gray-200 dark:bg-gray-600/80 rounded-full w-5/6"></div>
              </div>
              <div className="pt-2 flex gap-2">
                <div className="h-5 w-12 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                <div className="h-5 w-16 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Sign-In Prompt
const SignInPrompt = ({ onClick }) => {
  return (
    <div
      onClick={onClick}
      className="p-6 bg-white dark:bg-gray-800/50 rounded-xl text-center border border-gray-200 dark:border-gray-700/60 hover:border-violet-300 dark:hover:border-violet-700 cursor-pointer transition-colors group"
    >
      <div className="flex flex-col items-center py-4">
        <div className="text-violet-500 dark:text-violet-400 mb-3 p-2.5 bg-violet-100 dark:bg-violet-900/40 rounded-full transition-transform group-hover:scale-105">
          <FaComments size={20} />
        </div>
        <p className="font-medium text-gray-800 dark:text-gray-200 mb-1">
          Sign in to join the discussion
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 max-w-xs mx-auto">
          Share your feedback and connect with others.
        </p>
        <button className="bg-violet-500 group-hover:bg-violet-600 text-white px-5 py-2 rounded-lg text-sm font-medium shadow-sm transition-colors">
          Sign In to Comment
        </button>
      </div>
    </div>
  );
};

// Load More Button
const LoadMoreButton = ({ onClick, isLoading }) => {
  return (
    <button
      onClick={onClick}
      className="px-5 py-2 bg-white dark:bg-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg text-sm font-medium text-violet-600 dark:text-violet-300 border border-gray-200 dark:border-gray-700 transition-colors disabled:opacity-60 disabled:pointer-events-none shadow-sm flex items-center justify-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
      disabled={isLoading}
    >
      {isLoading ? (
        <>
          <svg
            className="animate-spin h-4 w-4 text-violet-500"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <span>Loading...</span>
        </>
      ) : (
        <>
          <span>Load More</span>
          <FaChevronDown size={10} />
        </>
      )}
    </button>
  );
};

// --- Main CommentSection Component ---
const CommentSection = ({ productSlug, productId, onCommentCountChange }) => {
  const { user } = useAuth();
  const {
    getComments,
    addComment,
    editComment,
    deleteComment,
    toggleCommentLike,
    addReply,
    editReply,
    deleteReply,
  } = useProduct();
  const { showToast } = useToast();
  const { recordInteraction } = useRecommendation();

  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [activeReplyId, setActiveReplyId] = useState(null);
  const [activeEditId, setActiveEditId] = useState(null);
  const [currentLocation, setCurrentLocation] = useState("");
  const commentSectionRef = useRef(null);

  const [deleteModalState, setDeleteModalState] = useState({
    isOpen: false,
    itemType: null, // 'comment' or 'reply'
    parentId: null, // Only for replies
    itemId: null,
    content: null,
    isLoading: false,
  });

  // Update comment count in parent component
  useEffect(() => {
    if (onCommentCountChange && pagination?.total !== undefined) {
      onCommentCountChange(pagination.total);
    }
  }, [pagination?.total, onCommentCountChange]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setCurrentLocation(window.location.pathname);
    }
  }, []);

  // Fetch initial comments
  useEffect(() => {
    let isMounted = true;
    let controller = new AbortController();

    const loadInitialComments = async () => {
      if (!productSlug) return;
      setLoading(true);

      try {
        const result = await getComments(productSlug, {
          page: 1,
          signal: controller.signal,
        });
        if (isMounted) {
          if (result.success) {
            setComments(result.comments || []);
            setPagination(result.pagination || null);
            setPage(1);
          } else {
            showToast("error", result.message || "Failed to load comments");
            setComments([]);
          }
        }
      } catch (error) {
        if (
          error.name !== "CanceledError" &&
          error.code !== "ERR_CANCELED" &&
          isMounted
        ) {
          console.error("Error fetching comments:", error);
          showToast("error", "An error occurred loading comments");
          setComments([]);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadInitialComments();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [productSlug, getComments, showToast]);

  // Load More Comments
  const loadMoreComments = useCallback(async () => {
    if (!pagination || !pagination.hasNextPage || loadingMore) return;
    const controller = new AbortController();
    setLoadingMore(true);
    const nextPage = page + 1;

    try {
      const result = await getComments(productSlug, {
        page: nextPage,
        signal: controller.signal,
      });
      if (result.success) {
        setComments((prev) => [...prev, ...(result.comments || [])]);
        setPagination(result.pagination || null);
        setPage(nextPage);
      } else {
        showToast("error", result.message || "Failed to load more");
      }
    } catch (error) {
      if (error.name !== "CanceledError" && error.code !== "ERR_CANCELED") {
        console.error("Error fetching more comments:", error);
        showToast("error", "Error loading more comments");
      }
    } finally {
      setLoadingMore(false);
    }
    return () => controller.abort();
  }, [productSlug, page, pagination, loadingMore, getComments, showToast]);

  // Authentication Check
  const requireAuth = useCallback(
    (action) => {
      if (!user) {
        // Show a more informative toast before showing the login prompt
        showToast("info", "Authentication required to participate in discussions. Please log in or create an account to join the conversation.");
        setShowLoginPrompt(true);
        return false;
      }
      setShowLoginPrompt(false);
      // Wrap action in try-catch if it's async and might throw
      try {
        action(); // Assuming action might not always be async
      } catch (error) {
        console.error("Error executing authenticated action:", error);
        // Provide more specific error message
        let errorMessage = "We couldn't complete your request. Please try again.";

        if (error.response) {
          if (error.response.status === 401) {
            errorMessage = "Your session has expired. Please log in again to continue.";
          } else if (error.response.status === 403) {
            errorMessage = "You don't have permission to perform this action. This may be due to account restrictions.";
          } else if (error.response.data?.message) {
            errorMessage = error.response.data.message;
          }
        } else if (error.message) {
          errorMessage = error.message;
        }

        showToast("error", errorMessage);
      }
      return true;
    },
    [user, showToast]
  );

  // CRUD Helpers for State Updates
  const findAndUpdate = (items, targetId, updateFn) => {
    return items.map((item) => {
      if (item._id === targetId) {
        return updateFn(item);
      }
      if (item.replies && item.replies.length > 0) {
        // Recursively update replies
        const updatedReplies = findAndUpdate(item.replies, targetId, updateFn);
        // Only update parent if replies actually changed
        if (updatedReplies !== item.replies) {
          return { ...item, replies: updatedReplies };
        }
      }
      return item;
    });
  };

  const findAndAddReply = (items, parentId, newReply) => {
    return items.map((item) => {
      if (item._id === parentId) {
        // Add rootId to the new reply for easier tracking
        const replyWithRoot = { ...newReply, rootId: item.rootId || item._id };
        return { ...item, replies: [...(item.replies || []), replyWithRoot] };
      }
      if (item.replies && item.replies.length > 0) {
        return {
          ...item,
          replies: findAndAddReply(item.replies, parentId, newReply),
        };
      }
      return item;
    });
  };

  const findAndRemove = (items, targetId) => {
    let foundAndRemoved = false;
    const filteredItems = items.filter((item) => {
      if (item._id === targetId) {
        foundAndRemoved = true;
        return false; // Remove this item
      }
      return true; // Keep this item
    });

    // If removed at this level, return the filtered list
    if (foundAndRemoved) {
      return filteredItems;
    }

    // If not found at this level, recurse into replies
    return items.map((item) => {
      if (item.replies && item.replies.length > 0) {
        const updatedReplies = findAndRemove(item.replies, targetId);
        // If replies changed, return item with updated replies
        if (updatedReplies.length !== item.replies.length) {
          return { ...item, replies: updatedReplies };
        }
      }
      // Otherwise, return the original item
      return item;
    });
  };

  // Check if user owns the comment/reply
  const isUserCommentOwner = (commentOrReply) => {
    return user && commentOrReply.user && commentOrReply.user._id === user._id;
  };

  // --- Action Handlers ---

  // Add Comment
  const handleAddComment = useCallback(
    async (content) => {
      requireAuth(async () => {
        if (!content.trim()) {
          showToast("error", "Comment cannot be empty");
          return;
        }
        setSubmitting(true);
        try {
          const result = await addComment(productSlug, content.trim());
          if (result.success && result.data) {
            setComments((prev) => [result.data, ...prev]); // Add to top
            showToast("success", "Comment added!");
            setPagination((prev) =>
              prev ? { ...prev, total: (prev.total || 0) + 1 } : { total: 1 }
            );
          } else {
            showToast("error", result.message || "Failed to add comment");
          }
        } catch (error) {
          console.error("Error adding comment:", error);
          showToast("error", "Failed to add comment");
        } finally {
          setSubmitting(false);
        }
      });
    },
    [productSlug, requireAuth, addComment, showToast]
  );

  // Start Edit
  const handleStartEdit = useCallback((item) => {
    setActiveEditId(item._id);
    setActiveReplyId(null); // Close reply form
  }, []);

  // Cancel Edit
  const handleCancelEdit = useCallback(() => {
    setActiveEditId(null);
  }, []);

  // Submit Edit (Handles both comments and replies)
  const handleEditSubmit = useCallback(
    async (rootCommentId, itemId, content, isReply) => {
      requireAuth(async () => {
        if (!content.trim()) {
          showToast("error", "Content cannot be empty");
          return;
        }
        setSubmitting(true);
        try {
          const apiCall = isReply ? editReply : editComment;
          // Adjust args based on whether it's a reply or comment
          const args = isReply
            ? [productSlug, rootCommentId, itemId, content.trim()]
            : [productSlug, itemId, content.trim()];

          const result = await apiCall(...args);

          if (result.success && result.data) {
            setComments((prev) =>
              findAndUpdate(prev, itemId, (item) => ({
                ...item, // Keep existing fields like replies
                ...result.data, // Overwrite with updated data (content, updatedAt)
              }))
            );
            showToast("success", "Update successful!");
            handleCancelEdit();
          } else {
            showToast("error", result.message || "Failed to update");
          }
        } catch (error) {
          console.error("Error updating item:", error);
          showToast("error", "Failed to update item");
        } finally {
          setSubmitting(false);
        }
      });
    },
    [
      productSlug,
      requireAuth,
      editComment,
      editReply,
      showToast,
      handleCancelEdit,
    ]
  );

  // Open Delete Confirmation
  const handleDeleteClick = useCallback(
    (parentId, itemId, content, isReply) => {
      setDeleteModalState({
        isOpen: true,
        itemType: isReply ? "reply" : "comment",
        parentId, // Will be null for top-level comments
        itemId,
        content, // Pass content for display in modal
        isLoading: false,
      });
    },
    []
  );

  // Confirm Delete
  const handleDeleteConfirm = useCallback(async () => {
    const { itemType, parentId, itemId } = deleteModalState;
    requireAuth(async () => {
      setDeleteModalState((prev) => ({ ...prev, isLoading: true }));
      try {
        const apiCall = itemType === "reply" ? deleteReply : deleteComment;
        // Adjust args based on item type
        const args =
          itemType === "reply"
            ? [productSlug, parentId, itemId] // Requires parentId for reply deletion
            : [productSlug, itemId];

        const result = await apiCall(...args);

        if (result.success) {
          setComments((prev) => findAndRemove(prev, itemId));
          showToast(
            "success",
            `${itemType === "reply" ? "Reply" : "Comment"} deleted.`
          );
          setPagination((prev) =>
            prev ? { ...prev, total: Math.max(0, (prev.total || 0) - 1) } : null
          );
          setDeleteModalState({
            isOpen: false,
            itemId: null,
            isLoading: false,
          }); // Reset modal state
        } else {
          showToast("error", result.message || "Failed to delete");
          setDeleteModalState((prev) => ({ ...prev, isLoading: false }));
        }
      } catch (error) {
        console.error("Error deleting item:", error);
        showToast("error", "Failed to delete item");
        setDeleteModalState((prev) => ({ ...prev, isLoading: false }));
      }
    });
  }, [
    productSlug,
    deleteModalState,
    requireAuth,
    deleteComment,
    deleteReply,
    showToast,
  ]);

  // Toggle Like
  const handleLike = useCallback(
    async (itemId, isReply, parentId) => {
      requireAuth(async () => {
        // Optimistic update
        setComments((prev) =>
          findAndUpdate(prev, itemId, (item) => ({
            ...item,
            likes: {
              count:
                (item.likes?.count || 0) + (item.likes?.userHasLiked ? -1 : 1),
              userHasLiked: !item.likes?.userHasLiked,
            },
          }))
        );

        try {
          // API call expects itemId, isReply flag, and parentId (only if isReply is true)
          const result = await toggleCommentLike(
            productSlug,
            itemId,
            isReply,
            isReply ? parentId : null
          );

          if (result.success && result.data) {
            // Sync with server state (optional if optimistic is trusted, but safer)
            setComments((prev) =>
              findAndUpdate(prev, itemId, (item) => ({
                ...item,
                likes: {
                  count: result.data.likeCount,
                  userHasLiked: result.data.isLiked,
                },
              }))
            );
            // Record interaction for recommendations
            if (recordInteraction) {
              recordInteraction(
                productId, // Use productId for interaction recording
                result.data.isLiked
                  ? isReply
                    ? "reply_like"
                    : "comment_like"
                  : isReply
                  ? "reply_unlike"
                  : "comment_unlike",
                { commentId: itemId, parentId: parentId }
              );
            }
          } else {
            throw new Error(result.message || "Failed to toggle like");
          }
        } catch (error) {
          console.error("Error toggling like:", error);
          showToast("error", error.message || "Failed to toggle like");
          // Revert optimistic update on error
          setComments((prev) =>
            findAndUpdate(prev, itemId, (item) => ({
              ...item,
              likes: {
                count:
                  (item.likes?.count || 0) +
                  (item.likes?.userHasLiked ? 1 : -1), // Revert the change
                userHasLiked: !item.likes?.userHasLiked, // Toggle back
              },
            }))
          );
        }
      });
    },
    [
      productSlug,
      productId,
      requireAuth,
      toggleCommentLike,
      showToast,
      recordInteraction,
    ]
  );

  // Start Reply
  const handleStartReply = useCallback(
    (targetId, _targetUsername) => {
      requireAuth(() => {
        // Check if replying to own comment/reply (client-side check)
        let targetItem = null;
        const findTarget = (items) => {
          for (const item of items) {
            if (item._id === targetId) return item;
            if (item.replies) {
              const found = findTarget(item.replies);
              if (found) return found;
            }
          }
          return null;
        };
        targetItem = findTarget(comments);

        if (targetItem && isUserCommentOwner(targetItem)) {
          showToast("info", "You cannot reply to yourself.");
          return;
        }

        setActiveReplyId(targetId);
        setActiveEditId(null); // Close edit form
      });
    },
    [requireAuth, comments, isUserCommentOwner, showToast]
  );

  // Cancel Reply
  const handleCancelReply = useCallback(() => {
    setActiveReplyId(null);
  }, []);

  // Submit Reply
  const handleSubmitReply = useCallback(
    async (rootCommentId, parentReplyId, content) => {
      requireAuth(async () => {
        if (!content.trim()) {
          showToast("error", "Reply cannot be empty");
          return;
        }
        setSubmitting(true);
        try {
          // API expects rootCommentId, content, and optional { replyToId: parentReplyId }
          const result = await addReply(
            productSlug,
            rootCommentId,
            content.trim(),
            { replyToId: parentReplyId }
          );

          if (result.success && result.data) {
            // Add reply to the correct parent in the state
            setComments((prev) =>
              findAndAddReply(prev, parentReplyId, result.data)
            );
            showToast("success", "Reply added!");
            handleCancelReply(); // Close the form
            setPagination((prev) =>
              prev ? { ...prev, total: (prev.total || 0) + 1 } : { total: 1 }
            );
            // Record interaction
            if (recordInteraction) {
              recordInteraction(productId, "comment_reply", {
                commentId: parentReplyId,
                rootId: rootCommentId,
              });
            }
          } else {
            // Handle specific backend errors like "cannot reply to own comment"
            if (
              result.message &&
              result.message.includes("Cannot reply to your own")
            ) {
              showToast("info", "You cannot reply to yourself.");
              handleCancelReply(); // Close form if backend rejects
            } else {
              showToast("error", result.message || "Failed to add reply");
            }
          }
        } catch (error) {
          console.error("Error adding reply:", error);
          showToast("error", "Failed to add reply");
        } finally {
          setSubmitting(false);
        }
      });
    },
    [
      productSlug,
      productId,
      requireAuth,
      addReply,
      showToast,
      handleCancelReply,
      recordInteraction,
    ]
  );

  // --- Render ---
  return (
    <div ref={commentSectionRef} className="mt-16 pt-8">
      <SectionHeader
        title="Discussion"
        count={pagination?.total ?? comments.length ?? 0}
      />

      <div className="mb-10">
        {user ? (
          <div className="p-1">
            <CommentForm
              user={user}
              onSubmit={handleAddComment}
              placeholder="Share your thoughts..."
              submitLabel="Post Comment"
              isSubmitting={submitting}
            />
          </div>
        ) : (
          <SignInPrompt onClick={() => setShowLoginPrompt(true)} />
        )}
      </div>

      <div className="space-y-5">
        {loading && comments.length === 0 ? (
          <SkeletonLoader count={3} />
        ) : !loading && comments.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-5">
            <AnimatePresence initial={false}>
              {comments.map((comment) => (
                <CommentItem
                  key={comment._id}
                  comment={comment}
                  depth={0}
                  user={user}
                  onLike={handleLike}
                  onStartReply={handleStartReply}
                  onSubmitReply={handleSubmitReply}
                  onCancelReply={handleCancelReply}
                  onStartEdit={handleStartEdit}
                  onSubmitEdit={handleEditSubmit}
                  onCancelEdit={handleCancelEdit}
                  onDelete={handleDeleteClick} // Pass the function to open the modal
                  activeReplyId={activeReplyId}
                  activeEditId={activeEditId}
                  isSubmitting={submitting}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {pagination && pagination.hasNextPage && (
        <div className="mt-10 flex justify-center">
          <LoadMoreButton onClick={loadMoreComments} isLoading={loadingMore} />
        </div>
      )}

      {/* Modals */}
      <LoginPrompt
        isOpen={showLoginPrompt}
        onClose={() => setShowLoginPrompt(false)}
        message="Join the conversation and interact with this product's community."
        title="Sign in to comment"
        redirectUrl={currentLocation}
      />

      <DeleteCommentModal
        isOpen={deleteModalState.isOpen}
        onClose={() =>
          setDeleteModalState({ isOpen: false, itemId: null, isLoading: false })
        }
        onConfirm={handleDeleteConfirm}
        title={`Delete ${deleteModalState.itemType || "Item"}?`}
        message={`Are you sure you want to permanently delete this ${deleteModalState.itemType}? This action cannot be undone.`}
        content={deleteModalState.content}
        isLoading={deleteModalState.isLoading}
      />
    </div>
  );
};

export default CommentSection;
