// GitHub Copilot: Current Date/Time: 2025-04-20 15:17:05 UTC | User: dhirajgiri3
"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import { Avatar } from "@mui/material"; // Assuming Material UI is used for Avatar
import { FormatTimeAgo } from "@/lib/utils/format-time-ago"; // Verify path
import CommentActions from "./CommentActions"; // Verify path
import CommentForm from "./CommentForm"; // Verify path
import { FaChevronDown, FaChevronRight, FaReply, FaUser } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { BadgeCheck } from "lucide-react"; // Using lucide-react for check badge

// Animation Variants
const commentVariants = {
  initial: { opacity: 0, y: 15 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: "easeOut" }
  },
  exit: {
    opacity: 0,
    height: 0, // Animate height out
    marginBottom: 0, // Animate margin out
    paddingTop: 0,
    paddingBottom: 0,
    transition: { duration: 0.2, ease: "easeIn" }
  }
};

const repliesVariants = {
  hidden: {
    opacity: 0,
    height: 0,
    transition: { duration: 0.2, when: "afterChildren" }
  },
  visible: {
    opacity: 1,
    height: "auto",
    transition: {
      duration: 0.3,
      when: "beforeChildren",
      staggerChildren: 0.05 // Faster stagger
    }
  }
};

// Nested Replies Component
const NestedReplies = ({ replies, parentComment, depth, ...handlers }) => {
  if (!replies || replies.length === 0) return null;

  const indentClass = depth >= 0 ? "pl-5 sm:pl-6" : ""; // Consistent indent from depth 0 onwards

  return (
    <motion.div
      className={`mt-4 ${indentClass} space-y-4 relative`}
      variants={repliesVariants}
      initial="hidden"
      animate="visible"
      exit="hidden"
    >
      {/* Thin vertical line */}
      <div className="absolute left-[18px] top-0 bottom-0 w-px bg-gray-200 -z-10"></div>
      {replies.map((reply) => (
        <CommentItem
          key={reply._id}
          comment={reply}
          parentComment={parentComment} // Pass the immediate parent
          depth={depth + 1}
          isReply={true}
          {...handlers}
        />
      ))}
    </motion.div>
  );
};


// Main CommentItem Component
const CommentItem = ({
  comment,
  parentComment = null, // Immediate parent
  depth = 0,
  isReply = false,
  user,
  onLike,
  onStartReply,
  onSubmitReply,
  onCancelReply,
  onStartEdit,
  onSubmitEdit,
  onCancelEdit,
  onDelete,
  activeReplyId,
  activeEditId,
  isSubmitting,
}) => {
  const [showReplies, setShowReplies] = useState(depth < 1); // Auto-expand only top-level replies
  const commentRef = useRef(null);

  const isReplying = activeReplyId === comment._id;
  const isEditing = activeEditId === comment._id;
  // Determine the root comment's ID. If this is a reply, use parent's rootId or parent's _id. If top-level, use own _id.
  const rootCommentId = isReply ? (parentComment?.rootId || parentComment?._id) : comment._id;


  const isOwnComment = user && comment.user && user._id === comment.user._id;
  const isAdmin = user && user.role === 'admin';
  const isMaker = comment.user?.isMaker || false; // Assuming this flag exists on the comment's user object

  useEffect(() => {
    if ((isReplying || isEditing) && commentRef.current) {
      setTimeout(() => {
        commentRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    }
  }, [isReplying, isEditing]);

  const handleToggleReplies = useCallback(() => {
    setShowReplies((prev) => !prev);
  }, []);

  const handleLike = useCallback(() => {
    // Pass immediate parent's ID if it's a reply
    onLike(comment._id, isReply, parentComment?._id || null);
  }, [onLike, comment._id, isReply, parentComment]);

  const handleStartReply = useCallback(() => {
    if (isOwnComment) return;
    onStartReply(comment._id, comment.user?.fullName || "User");
  }, [onStartReply, comment._id, comment.user?.fullName, isOwnComment]);

  const handleStartEdit = useCallback(() => {
    onStartEdit(comment);
  }, [onStartEdit, comment]);

  const handleDelete = useCallback(() => {
    // Pass immediate parent's ID if it's a reply
    onDelete(parentComment?._id || null, comment._id, comment.content, isReply);
  }, [onDelete, parentComment?._id, comment._id, comment.content, isReply]);

  const handleSubmitLocalReply = useCallback(
    (content) => {
      // Pass rootId and the ID of the comment being replied to (comment._id)
      onSubmitReply(rootCommentId, comment._id, content);
    },
    [onSubmitReply, rootCommentId, comment._id]
  );

  const handleSubmitLocalEdit = useCallback(
    (content) => {
      // Pass rootId (if it's a reply), the item's own ID, content, and isReply flag
      onSubmitEdit(isReply ? rootCommentId : null, comment._id, content, isReply);
    },
    [onSubmitEdit, comment._id, rootCommentId, isReply]
  );


  const hasNestedReplies = comment.replies && comment.replies.length > 0;
  const replyTargetName = comment.replyingToUser?.fullName || "";
  const avatarSize = 36; // Consistent size
  const backgroundClass = "bg-white"; // Keep consistent background

  return (
    <motion.div
      ref={commentRef}
      layout
      variants={commentVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className={`${backgroundClass} rounded-lg p-4 transition-colors duration-200 hover:bg-gray-50/50 relative ${
        isEditing ? "ring-2 ring-violet-300" : ""
      } ${isReplying ? "ring-1 ring-violet-200" : ""}`}
      id={`comment-${comment._id}`}
    >
      <div className="flex gap-3">
        {/* Avatar */}
        <div className="relative flex-shrink-0 mt-1">
          <Avatar
            src={comment.user?.profilePicture?.url}
            alt={comment.user?.fullName || "User"}
            sx={{
              width: avatarSize,
              height: avatarSize,
              bgcolor: 'secondary.light', // Consistent bg
              fontSize: '0.875rem'
            }}
            className={`flex-shrink-0 ${isMaker ? "ring-1 ring-offset-1 ring-violet-400" : ""}`}
          >
            {comment.user?.firstName?.charAt(0) || <FaUser size={16}/>}
          </Avatar>
          {(isMaker || isAdmin) && (
             <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-px">
               <BadgeCheck
                 size={14}
                 className={isAdmin ? "text-blue-500" : "text-violet-500"}
               />
             </div>
          )}
        </div>

        {/* Main Content Area */}
        <div className="flex-grow min-w-0">
          {/* User Info */}
          <div className="flex justify-between items-center flex-wrap gap-x-2 mb-1">
            <div className="flex items-center gap-2">
               <h4 className="font-medium text-sm text-gray-800">
                 {comment.user?.fullName || "Anonymous User"}
               </h4>
               {isMaker && (
                 <span className="text-[10px] font-medium py-0.5 px-1.5 bg-violet-100 text-violet-700 rounded">
                   Maker
                 </span>
               )}
               {isAdmin && !isMaker && (
                 <span className="text-[10px] font-medium py-0.5 px-1.5 bg-blue-100 text-blue-700 rounded">
                   Admin
                 </span>
               )}
            </div>
            <span className="text-xs text-gray-500 flex-shrink-0 whitespace-nowrap">
              {FormatTimeAgo(comment.createdAt)}
              {comment.createdAt !== comment.updatedAt && (
                <span className="italic ml-1.5 opacity-70">(edited)</span>
              )}
            </span>
          </div>

          {/* Replying To Indicator */}
          {isReply && replyTargetName && (
             <div className="text-xs font-normal text-gray-500 mb-1.5 inline-flex items-center bg-gray-100 px-1.5 py-0.5 rounded">
               <FaReply className="inline mr-1 transform scale-x-[-1]" size={9} />
               Replying to @{replyTargetName.split(" ")[0]}
             </div>
          )}

          {/* Content / Edit Form */}
          <div className="mt-1">
            {isEditing ? (
              <CommentForm
                user={user}
                onSubmit={handleSubmitLocalEdit}
                initialContent={comment.content}
                onCancel={onCancelEdit}
                isSubmitting={isSubmitting}
                submitLabel="Save Edit"
                placeholder={isReply ? "Edit reply..." : "Edit comment..."}
                autoFocus={true}
                maxLength={isReply ? 500 : 1000}
              />
            ) : (
              <div
                className="prose prose-sm prose-p:my-0 max-w-none text-gray-700 leading-relaxed whitespace-pre-line break-words"
                // Add dangerouslySetInnerHTML={{ __html: sanitizedHtml }} here if rendering markdown safely
              >
                {comment.content}
              </div>
            )}
          </div>

          {/* Actions */}
          {!isEditing && (
            <CommentActions
              comment={comment}
              user={user}
              onLike={handleLike}
              onReply={handleStartReply}
              onEdit={handleStartEdit}
              onDelete={handleDelete}
              depth={depth}
              canReply={!isOwnComment && depth < 4} // Limit reply depth
            />
          )}

          {/* Replies Toggle */}
          {hasNestedReplies && !isEditing && (
            <motion.button
              onClick={handleToggleReplies}
              className="mt-3 flex items-center gap-1 text-xs font-medium text-violet-600 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 rounded"
              aria-expanded={showReplies}
              aria-controls={`replies-${comment._id}`}
            >
              <motion.div animate={{ rotate: showReplies ? 0 : -90 }} transition={{ duration: 0.2 }}>
                <FaChevronDown size={9} />
              </motion.div>
              <span>
                {comment.replies.length}{" "}
                {comment.replies.length === 1 ? "reply" : "replies"}
              </span>
            </motion.button>
          )}
        </div>
      </div> {/* End main flex container */}

      {/* Reply Form Container */}
      <AnimatePresence>
        {isReplying && (
          <motion.div
            key="reply-form"
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: "auto", marginTop: "1rem" }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 35 }}
            className="pl-5 sm:pl-6" // Indent reply form
          >
            {/* Pass rootCommentId correctly */}
            <CommentForm
              user={user}
              onSubmit={handleSubmitLocalReply}
              onCancel={onCancelReply}
              isSubmitting={isSubmitting}
              submitLabel="Post Reply"
              placeholder={`Replying to ${comment.user?.fullName || "User"}...`}
              autoFocus={true}
              maxLength={500}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Nested Replies Container */}
      <AnimatePresence initial={false}>
        {showReplies && hasNestedReplies && !isEditing && (
           <div id={`replies-${comment._id}`}>
             <NestedReplies
               replies={comment.replies}
               parentComment={comment} // Current comment is parent for next level
               depth={depth} // Current depth
               user={user}
               onLike={onLike}
               onStartReply={onStartReply}
               onSubmitReply={onSubmitReply}
               onCancelReply={onCancelReply}
               onStartEdit={onStartEdit}
               onSubmitEdit={onSubmitEdit}
               onCancelEdit={onCancelEdit}
               onDelete={onDelete} // Pass onDelete correctly
               activeReplyId={activeReplyId}
               activeEditId={activeEditId}
               isSubmitting={isSubmitting}
             />
           </div>
        )}
      </AnimatePresence>

    </motion.div>
  );
};

export default CommentItem;