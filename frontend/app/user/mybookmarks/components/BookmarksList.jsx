"use client";

import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import {
  FiEye,
  FiClock,
  FiExternalLink,
  FiTag,
  FiCalendar,
  FiStar,
  FiCheck,
  FiBookmark,
} from "react-icons/fi";
import { formatDistanceToNow, format } from "date-fns";
import BookmarkButton from "../../../../Components/UI/Buttons/Bookmark/BookmarkButton";
import { toast } from "react-hot-toast";
import UpvoteButton from "../../../../Components/UI/Buttons/Upvote/UpvoteButton";

const BookmarksList = ({ bookmarks, onRefresh }) => {
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 24,
      },
    },
  };

  // Handle bookmark removal with optimistic update
  const handleRemoveBookmark = () => {
    // Show toast notification
    toast.success("Bookmark removed");

    // Call the refresh function to update the list
    if (onRefresh) {
      onRefresh();
    }
  };

  return (
    <motion.div
      className="space-y-5"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {bookmarks.map((bookmark) => {
        const { product, bookmarkedAt } = bookmark;
        const {
          _id,
          slug,
          name,
          tagline,
          thumbnail,
          views = { count: 0 },
          category,
          tags = [],
          maker,
          status,
          createdAt,
        } = product;

        // Get status badge color
        const getStatusBadge = () => {
          switch (status) {
            case "PUBLISHED":
              return {
                bg: "bg-green-50",
                text: "text-green-700",
                border: "border-green-200",
                icon: <FiCheck size={10} className="mr-1" />,
              };
            case "FEATURED":
              return {
                bg: "bg-yellow-50",
                text: "text-yellow-700",
                border: "border-yellow-200",
                icon: <FiStar size={10} className="mr-1" />,
              };
            default:
              return {
                bg: "bg-gray-50",
                text: "text-gray-700",
                border: "border-gray-200",
                icon: null,
              };
          }
        };

        const statusBadge = getStatusBadge();

        return (
          <Link key={_id} href={`/product/${slug}`} className="block">
            <motion.div
              variants={itemVariants}
              className="group bg-white rounded-xl border border-gray-100 overflow-hidden transition-all duration-300 p-5 hover:shadow-md cursor-pointer"
            >
              <div className="flex flex-col sm:flex-row gap-5">
              {/* Product Image */}
              <div className="block relative w-full sm:w-48 h-36 rounded-lg overflow-hidden flex-shrink-0 transition-all duration-300 cursor-pointer group/image">
                {thumbnail ? (
                  <Image
                    src={thumbnail}
                    alt={name}
                    fill
                    sizes="(max-width: 640px) 100vw, 192px"
                    className="object-cover transition-transform duration-500 group-hover/image:scale-105"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gray-200 flex items-center justify-center">
                    <span className="text-gray-400">No image</span>
                  </div>
                )}

                {/* Status badge */}
                {status && status !== "DRAFT" && (
                  <div
                    className={`absolute top-2 right-2 ${statusBadge.bg} ${statusBadge.text} text-xs px-2 py-1 rounded-full flex items-center border ${statusBadge.border} z-20`}
                  >
                    {statusBadge.icon}
                    <span>
                      {status.charAt(0) + status.slice(1).toLowerCase()}
                    </span>
                  </div>
                )}

                {/* View button on hover */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/image:opacity-100 transition-opacity duration-300 z-20">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      window.location.href = `/product/${slug}`;
                    }}
                    className="bg-white/90 hover:bg-white text-violet-700 font-medium px-3 py-1.5 rounded-full flex items-center transition-all duration-300 transform translate-y-2 group-hover/image:translate-y-0 shadow-md text-sm"
                  >
                    <FiExternalLink size={14} className="mr-1.5" />
                    View
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="flex-grow">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="flex items-center mb-1">
                      <h3 className="text-lg font-semibold text-gray-900 group-hover:text-violet-600 transition-colors">
                        {name}
                      </h3>
                      <div className="flex items-center text-xs text-gray-500 ml-3">
                        <FiClock className="mr-1" size={12} />
                        <span>
                          Bookmarked{" "}
                          {formatDistanceToNow(new Date(bookmarkedAt), {
                            addSuffix: true,
                          })}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {tagline}
                    </p>
                  </div>

                  <div onClick={(e) => e.stopPropagation()}>
                    <BookmarkButton
                      product={product}
                      size="sm"
                      source="bookmarks_page"
                      onSuccess={handleRemoveBookmark}
                      showText={true}
                    />
                  </div>
                </div>

                {/* Category and Tags */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {category && (
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        window.location.href = `/category/${category.slug}`;
                      }}
                      className="text-xs bg-violet-50 text-violet-700 px-2 py-1 rounded-full hover:bg-violet-100 transition-colors border border-violet-100 flex items-center cursor-pointer"
                    >
                      <FiTag size={10} className="mr-1" />
                      {category.name}
                    </div>
                  )}
                  {tags.slice(0, 3).map((tag, index) => (
                    <span
                      key={index}
                      className="text-xs bg-gray-50 text-gray-700 px-2 py-1 rounded-full border border-gray-100 flex items-center"
                    >
                      <FiTag size={10} className="mr-1 text-gray-400" />
                      {tag}
                    </span>
                  ))}
                  {tags.length > 3 && (
                    <span className="text-xs text-gray-500 px-2 py-1">
                      +{tags.length - 3}
                    </span>
                  )}
                </div>

                {/* Stats and Info */}
                <div className="flex flex-wrap justify-between items-center">
                  {/* Stats */}
                  <div className="flex items-center gap-4 mb-2 sm:mb-0">
                    <div className="flex items-center bg-violet-50 text-violet-700 px-2.5 py-1 rounded-lg border border-violet-100" onClick={(e) => e.stopPropagation()}>
                      <UpvoteButton
                        product={product}
                        source="bookmarks_page"
                        size="sm"
                        showCount={true}
                        showText={false}
                      />
                    </div>
                    <div className="flex items-center bg-gray-50 text-gray-700 px-2.5 py-1 rounded-lg border border-gray-100">
                      <FiEye className="mr-1.5" size={14} />
                      <span className="text-sm font-medium">
                        {views?.count || 0}
                      </span>
                    </div>
                    <div className="flex items-center bg-gray-50 text-gray-700 px-2.5 py-1 rounded-lg border border-gray-100" onClick={(e) => e.stopPropagation()}>
                      <BookmarkButton
                        product={product}
                        source="bookmarks_page"
                        showCount={true}
                        showText={false}
                        size="sm"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {/* Maker */}
                    {maker && (
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          window.location.href = `/user/${maker.username || maker._id}`;
                        }}
                        className="flex items-center group/maker cursor-pointer hover:text-violet-700 transition-colors"
                      >
                        <div className="w-6 h-6 rounded-full overflow-hidden mr-2 border border-gray-200">
                          {maker.profilePicture?.url ? (
                            <Image
                              src={maker.profilePicture.url}
                              alt={`${maker.firstName} ${maker.lastName}`}
                              width={24}
                              height={24}
                              className="object-cover w-full h-full"
                              onError={(e) => {
                                e.target.style.display = "none";
                                e.target.parentNode.classList.add(
                                  "bg-gradient-to-br",
                                  "from-violet-500",
                                  "to-indigo-600",
                                  "flex",
                                  "items-center",
                                  "justify-center",
                                  "text-white",
                                  "text-xl",
                                  "font-semibold"
                                );
                                e.target.parentNode.innerText = maker.firstName
                                  ? maker.firstName.charAt(0).toUpperCase()
                                  : "M";
                              }}
                            />
                          ) : (
                            <div className="w-full h-full bg-violet-100 flex items-center justify-center text-xs text-violet-700 font-medium">
                              {maker.firstName?.[0] || ""}
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-medium text-gray-900 group-hover/maker:text-violet-700 transition-colors">
                            {maker.firstName} {maker.lastName}
                          </span>
                          {maker.headline && (
                            <span className="text-xs text-gray-500 line-clamp-1 max-w-[120px]">
                              {maker.headline}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Date */}
                    <div className="flex items-center text-xs text-gray-500">
                      <FiCalendar size={12} className="mr-1" />
                      <span>{format(new Date(createdAt), "MMM d, yyyy")}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
          </Link>
        );
      })}
    </motion.div>
  );
};

export default BookmarksList;
