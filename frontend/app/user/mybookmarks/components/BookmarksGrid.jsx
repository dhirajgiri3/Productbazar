"use client";

import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import {
  FiEye,
  FiClock,
  FiTag,
  FiExternalLink,
  FiStar,
  FiCheck,
  FiCalendar,
} from "react-icons/fi";
import { formatDistanceToNow, format } from "date-fns";
import BookmarkButton from "../../../../Components/UI/Buttons/Bookmark/BookmarkButton";
import { toast } from "react-hot-toast";
import UpvoteButton from "../../../../Components/UI/Buttons/Upvote/UpvoteButton";

const BookmarksGrid = ({ bookmarks, onRefresh }) => {
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

  return (
    <motion.div
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
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
              className="group bg-white rounded-xl border border-gray-100 overflow-hidden transition-all duration-300 relative hover:shadow-md cursor-pointer"
            >
              {/* Product Image */}
              <div className="block relative h-48 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                {thumbnail ? (
                  <Image
                    src={thumbnail}
                    alt={name}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gray-200 flex items-center justify-center">
                    <span className="text-gray-400">No image</span>
                  </div>
                )}

                {/* Status badge */}
                {status && status !== "DRAFT" && (
                  <div
                    className={`absolute top-3 right-3 ${statusBadge.bg} ${statusBadge.text} text-xs px-2 py-1 rounded-full flex items-center border ${statusBadge.border} z-20`}
                  >
                    {statusBadge.icon}
                    <span>
                      {status.charAt(0) + status.slice(1).toLowerCase()}
                    </span>
                  </div>
                )}

                {/* Bookmark date overlay */}
                <div className="absolute bottom-3 left-3 bg-black/70 text-white text-xs px-2 py-1 rounded-full flex items-center z-20">
                  <FiClock className="mr-1" size={12} />
                  <span>
                    Bookmarked{" "}
                    {formatDistanceToNow(new Date(bookmarkedAt), {
                      addSuffix: true,
                    })}
                  </span>
                </div>

                {/* View button on hover */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      window.location.href = `/product/${slug}`;
                    }}
                    className="bg-white/90 hover:bg-white text-violet-700 font-medium px-4 py-2 rounded-full flex items-center transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 shadow-md"
                  >
                    <FiExternalLink size={16} className="mr-2" />
                    View Details
                  </button>
                </div>
              </div>

            {/* Content */}
            <div className="p-5">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-semibold text-gray-900 transition-colors line-clamp-1 group-hover:text-violet-600">
                  {name}
                </h3>
              </div>

              <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                {tagline}
              </p>

              {/* Category and Tags */}
              <div className="flex flex-wrap gap-1.5 mb-4">
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
                {tags.slice(0, 2).map((tag, index) => (
                  <span
                    key={index}
                    className="text-xs bg-gray-50 text-gray-700 px-2 py-1 rounded-full border border-gray-100 flex items-center"
                  >
                    <FiTag size={10} className="mr-1 text-gray-400" />
                    {tag}
                  </span>
                ))}
                {tags.length > 2 && (
                  <span className="text-xs text-gray-500 px-2 py-1">
                    +{tags.length - 2}
                  </span>
                )}
              </div>

              {/* Stats Row */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="bg-gray-50 rounded-lg p-2 flex flex-col items-center justify-center border border-gray-100" onClick={(e) => e.stopPropagation()}>
                  <UpvoteButton
                    product={product}
                    source="bookmarks_page"
                    showCount={true}
                    showText={true}
                    size="sm"
                  />
                </div>
                <div className="bg-gray-50 rounded-lg p-2 flex flex-col items-center justify-center border border-gray-100" onClick={(e) => e.stopPropagation()}>
                  <span className="text-gray-900 font-semibold">
                    <BookmarkButton
                      product={product}
                      source="bookmarks_page"
                      showCount={true}
                      showText={false}
                      size="sm"
                    />
                  </span>
                </div>
                <div className="bg-gray-50 text-sm rounded-lg p-2 flex items-center justify-center gap-1 border border-gray-100">
                  <FiEye size={14} className="text-gray-900" />
                  <span className="text-gray-900 font-semibold">
                    {views?.count || 0}
                  </span>
                </div>
              </div>

              {/* Footer with Maker and Date */}
              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
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

                <div className="flex items-center text-xs text-gray-500">
                  <FiCalendar size={12} className="mr-1" />
                  <span>{format(new Date(createdAt), "MMM d, yyyy")}</span>
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

export default BookmarksGrid;
