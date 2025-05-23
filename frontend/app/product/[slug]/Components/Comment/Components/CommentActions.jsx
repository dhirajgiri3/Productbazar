"use client";

import React, { useState, useRef, useEffect } from 'react';
import { FaHeart, FaRegHeart, FaReply, FaEdit, FaTrash, FaEllipsisH } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

// Enhanced button animations with more fluid transitions
const iconButtonVariants = {
  initial: { scale: 1 },
  hover: { scale: 1.05, transition: { type: "spring", stiffness: 400, damping: 10 } },
  tap: { scale: 0.95, transition: { duration: 0.1 } }
};

// Enhanced dropdown animation
const dropdownVariants = {
  hidden: { opacity: 0, y: -5, scale: 0.95, pointerEvents: "none" },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    pointerEvents: "auto",
    transition: {
      type: "spring",
      stiffness: 500,
      damping: 30
    }
  }
};

const ActionButton = ({
  icon: Icon,
  label,
  count,
  active = false,
  colorClass = 'text-gray-500 hover:text-violet-500',
  activeColorClass = 'text-violet-500',
  onClick,
  ariaLabel,
  disabled = false
}) => {
  return (
    <motion.button
      onClick={onClick}
      className={`flex items-center gap-1.5 text-xs font-medium rounded-full px-3 py-1.5 transition-all ${active ? activeColorClass : colorClass} hover:bg-violet-100 disabled:opacity-50 disabled:pointer-events-none focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2`}
      variants={iconButtonVariants}
      initial="initial"
      whileHover={!disabled && "hover"}
      whileTap={!disabled && "tap"}
      aria-label={ariaLabel}
      disabled={disabled}
    >
      <Icon size={14} className={active ? "animate-heartbeat" : ""} />
      {label && <span>{label}</span>}
      {count !== undefined && count > 0 && (
        <span className={`font-semibold ${active ? 'text-violet-600' : 'text-gray-700'}`}>
          {count > 999 ? `${(count / 1000).toFixed(1)}k` : count}
        </span>
      )}
    </motion.button>
  );
};

const CommentActions = ({ comment, user, onLike, onReply, onEdit, onDelete, depth, canReply }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const isOwner = user && (comment.user?._id === user._id || user.role === 'admin');
  const maxDepthReached = depth >= 4;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };

    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') setMenuOpen(false);
      });
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleClickOutside);
    };
  }, [menuOpen]);

  return (
    <div className="flex items-center flex-wrap gap-1 mt-2">
      {/* Like button with enhanced animation */}
      <ActionButton
        icon={comment.likes?.userHasLiked ? FaHeart : FaRegHeart}
        count={comment.likes?.count || 0}
        active={comment.likes?.userHasLiked}
        activeColorClass="text-red-500"
        colorClass="text-gray-500 hover:text-red-500"
        onClick={onLike}
        ariaLabel={comment.likes?.userHasLiked ? 'Unlike comment' : 'Like comment'}
      />

      {/* Reply button with clearer guidance */}
      {canReply && !maxDepthReached && (
        <ActionButton
          icon={FaReply}
          label="Reply"
          onClick={onReply}
          ariaLabel="Reply to comment"
        />
      )}

      {/* Better accessibility for dropdown menu */}
      {isOwner && (
        <div className="relative inline-block" ref={menuRef}>
          <motion.button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-2 rounded-full text-gray-500 hover:bg-violet-100 hover:text-violet-700 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2"
            variants={iconButtonVariants}
            initial="initial"
            whileHover="hover"
            whileTap="tap"
            aria-label="Comment options"
            aria-expanded={menuOpen}
          >
            <FaEllipsisH size={14} />
          </motion.button>

          <AnimatePresence>
            {menuOpen && (
              <motion.div
                initial="hidden"
                animate="visible"
                exit="hidden"
                variants={dropdownVariants}
                className="absolute right-0 mt-1 w-36 origin-top-right rounded-lg shadow-md bg-white ring-1 ring-black/5 focus:outline-none z-10"
                role="menu"
                aria-orientation="vertical"
                aria-labelledby="options-menu"
              >
                <div className="py-1 divide-y divide-gray-100">
                  {/* Edit option with enhanced feedback */}
                  <button
                    onClick={() => {
                      onEdit();
                      setMenuOpen(false);
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-violet-50 hover:text-violet-700 transition-all"
                    role="menuitem"
                  >
                    <FaEdit size={12} className="text-violet-500" />
                    <span>Edit</span>
                  </button>

                  {/* Delete option with warning color */}
                  <button
                    onClick={() => {
                      onDelete();
                      setMenuOpen(false);
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 transition-all"
                    role="menuitem"
                  >
                    <FaTrash size={12} />
                    <span>Delete</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default CommentActions;