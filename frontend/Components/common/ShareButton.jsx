"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiShare2,
  FiX,
  FiTwitter,
  FiFacebook,
  FiLinkedin,
  FiMail,
  FiCopy,
  FiCheck,
} from "react-icons/fi";
import { WhatsApp } from "@mui/icons-material";

const ShareButton = ({
  url,
  title = "",
  description = "",
  buttonSize = "md",
  iconOnly = true,
  position = "right",
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const menuRef = useRef(null);

  // Default to current URL if none provided
  const shareUrl =
    url || (typeof window !== "undefined" ? window.location.href : "");

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuRef]);

  // Handle sharing to various platforms
  const handleShare = (platform) => {
    let shareLink;

    switch (platform) {
      case "twitter":
        shareLink = `https://twitter.com/intent/tweet?url=${encodeURIComponent(
          shareUrl
        )}&text=${encodeURIComponent(title)}`;
        break;
      case "facebook":
        shareLink = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
          shareUrl
        )}`;
        break;
      case "linkedin":
        shareLink = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
          shareUrl
        )}`;
        break;
      case "whatsapp":
        shareLink = `https://wa.me/?text=${encodeURIComponent(
          `${title} ${shareUrl}`
        )}`;
        break;
      case "email":
        shareLink = `mailto:?subject=${encodeURIComponent(
          title
        )}&body=${encodeURIComponent(`${description}\n\n${shareUrl}`)}`;
        break;
      default:
        return;
    }

    window.open(shareLink, "_blank", "noopener,noreferrer");
  };

  // Copy URL to clipboard
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy: ", err);
    }
  };

  // Variants for animations
  const menuVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 10 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        duration: 0.2,
        ease: "easeOut",
      },
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      y: 10,
      transition: {
        duration: 0.15,
        ease: "easeIn",
      },
    },
  };

  // Button size classes
  const buttonSizeClasses = {
    sm: "p-1.5",
    md: "p-2",
    lg: "p-3",
  };

  return (
    <div className="relative" ref={menuRef}>
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={`rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 ${
          buttonSizeClasses[buttonSize] || buttonSizeClasses.md
        } transition-colors flex items-center gap-2 ${className}`}
        aria-label="Share"
        title="Share"
      >
        <FiShare2 className="w-5 h-5" />
        {!iconOnly && <span>Share</span>}
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={menuVariants}
            className={`absolute ${
              position === "left" ? "left-0" : "right-0"
            } mt-2 p-2 bg-white rounded-xl shadow-lg border border-gray-200 w-56 z-50`}
          >
            <div className="flex justify-between items-center mb-2 px-2">
              <h3 className="text-sm font-medium text-gray-700">Share</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
                aria-label="Close share menu"
              >
                <FiX size={16} />
              </button>
            </div>

            {/* Share options */}
            <div className="space-y-1">
              <ShareOption
                icon={<FiTwitter className="text-[#1DA1F2]" />}
                label="Twitter"
                onClick={() => handleShare("twitter")}
              />
              <ShareOption
                icon={<FiFacebook className="text-[#1877F2]" />}
                label="Facebook"
                onClick={() => handleShare("facebook")}
              />
              <ShareOption
                icon={<FiLinkedin className="text-[#0A66C2]" />}
                label="LinkedIn"
                onClick={() => handleShare("linkedin")}
              />
              <ShareOption
                icon={<WhatsApp className="text-[#25D366]" />}
                label="WhatsApp"
                onClick={() => handleShare("whatsapp")}
              />
              <ShareOption
                icon={<FiMail className="text-gray-600" />}
                label="Email"
                onClick={() => handleShare("email")}
              />

              <div className="border-t border-gray-100 my-2"></div>

              <ShareOption
                icon={
                  copied ? (
                    <FiCheck className="text-green-500" />
                  ) : (
                    <FiCopy className="text-gray-600" />
                  )
                }
                label={copied ? "Copied!" : "Copy link"}
                onClick={copyToClipboard}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Helper component for share options
const ShareOption = ({ icon, label, onClick }) => (
  <motion.button
    whileHover={{ backgroundColor: "rgba(0, 0, 0, 0.05)" }}
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
  >
    {icon}
    <span>{label}</span>
  </motion.button>
);

export default ShareButton;
