'use client';

import { useState } from 'react';
import Image from 'next/image';

const ProfilePicture = ({
  user,
  size = 32,
  showStatus = false,
  className = "",
  showBorder = true,
  priority = false,
  variant = 'default', // 'default', 'premium', 'minimal'
  statusColor = 'green',
  onClick,
  'aria-label': ariaLabel
}) => {
  const [imgError, setImgError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Generate profile picture URL
  const getImageUrl = () => {
    if (!user || imgError) {
      const name = user ? `${user.firstName || 'User'} ${user.lastName || ''}` : 'Guest';
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(
        name
      )}&background=gradient&color=fff&size=${size * 2}&format=png&rounded=true&bold=true&length=2`;
    }

    const profileUrl =
      user.profilePicture?.url ||
      (typeof user.profilePicture === 'string' ? user.profilePicture : '') ||
      user.googleProfile?.profilePicture || 
      '';

    return profileUrl && profileUrl !== '/Assets/Image/Profile.png' ? profileUrl : null;
  };

  // Generate initials
  const getInitials = () =>
    `${user?.firstName?.[0] || 'U'}${user?.lastName?.[0] || ''}`.toUpperCase();

  // Get variant styles
  const getVariantStyles = () => {
    switch (variant) {
      case 'premium':
        return {
          border: showBorder ? 'ring-2 ring-amber-400/30' : '',
          initialsBackground: 'bg-gradient-to-br from-amber-500 to-orange-600',
          statusRing: 'ring-2 ring-amber-100'
        };
      case 'minimal':
        return {
          border: showBorder ? 'ring-1 ring-gray-300/50' : '',
          initialsBackground: 'bg-gradient-to-br from-gray-500 to-gray-600',
          statusRing: 'ring-2 ring-gray-100'
        };
      default:
        return {
          border: showBorder ? 'ring-2 ring-violet-400/30' : '',
          initialsBackground: 'bg-gradient-to-br from-violet-500 to-purple-600',
          statusRing: 'ring-2 ring-violet-100'
        };
    }
  };

  const imageUrl = getImageUrl();
  const initials = getInitials();
  const variantStyles = getVariantStyles();

  // Status indicator size calculation
  const statusSize = Math.max(8, Math.min(size * 0.25, 16));
  const statusOffset = Math.max(2, size * 0.05);

  // Determine if we should show image or initials
  const showImage = imageUrl && !imgError;

  return (
    <div
      className={`relative inline-block ${className}`}
      style={{ width: size, height: size }}
      onClick={onClick}
      role={onClick ? "button" : "img"}
      tabIndex={onClick ? 0 : -1}
      aria-label={ariaLabel || `${user?.firstName || 'User'}'s profile picture`}
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick(e);
        }
      }}
    >
      {/* Main profile picture container */}
      <div
        className={`
          ${variantStyles.border}
          rounded-full
          overflow-hidden
          transition-opacity
          duration-150
          ${onClick ? 'focus-within:ring-2 focus-within:ring-violet-500 focus-within:ring-offset-2' : ''}
        `}
        style={{ width: size, height: size }}
      >
        {showImage ? (
          <div className="relative w-full h-full">
            {/* Loading state */}
            {isLoading && (
              <div className="absolute inset-0 bg-gray-200 animate-pulse rounded-full" />
            )}

            {/* Profile Image */}
            <Image
              src={imageUrl}
              alt={`${user?.firstName || 'User'}'s profile`}
              width={size}
              height={size}
              className={`
                rounded-full
                object-cover
                w-full
                h-full
                transition-opacity
                duration-150
                ${isLoading ? 'opacity-0' : 'opacity-100'}
              `}
              onLoad={() => setIsLoading(false)}
              onError={() => {
                setImgError(true);
                setIsLoading(false);
              }}
              priority={priority}
              unoptimized={imageUrl.includes('ui-avatars.com')}
            />
          </div>
        ) : (
          /* Initials fallback */
          <div
            className={`
              rounded-full
              flex
              items-center
              justify-center
              text-white
              font-semibold
              select-none
              ${variantStyles.initialsBackground}
              w-full
              h-full
            `}
            style={{ fontSize: Math.max(size * 0.35, 12) }}
          >
            {initials}
          </div>
        )}
      </div>

      {/* Status indicator */}
      {showStatus && (
        <div
          className={`
            absolute
            bg-${statusColor}-500
            ${variantStyles.statusRing}
            rounded-full
          `}
          style={{
            width: statusSize,
            height: statusSize,
            bottom: -statusOffset,
            right: -statusOffset,
          }}
          aria-hidden="true"
        />
      )}
    </div>
  );
};

export default ProfilePicture;
