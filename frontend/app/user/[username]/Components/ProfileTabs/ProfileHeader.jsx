// src/components/profile/ProfileHeader.jsx
import Image from 'next/image';
import { motion } from 'framer-motion';
import { FiExternalLink, FiEdit3, FiMapPin, FiMail, FiLink } from 'react-icons/fi';
import { headerVariants } from '@/lib/utils/ui/animations';

export default function ProfileHeader({ user, isOwnProfile, onEdit }) {
  return (
    <div>
      {/* Banner */}
      <motion.div
        className="relative h-48 md:h-64 overflow-hidden z-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-violet-500 via-violet-600 to-violet-700" />
        <motion.div
          className="absolute inset-0 bg-[url('/Assets/Image/ProfileBg.png')] bg-cover bg-center opacity-80"
          initial={{ scale: 1.05 }}
          animate={{ scale: 1 }}
          transition={{ duration: 2.5 }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/50 to-white" />
      </motion.div>

      {/* Profile Info */}
      <div className="relative -mt-20 px-4 mb-8">
        <div className="max-w-4xl mx-auto">
          <motion.div
            variants={headerVariants}
            initial="hidden"
            animate="visible"
            className="bg-white rounded-xl shadow-sm p-6"
          >
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
              {/* Profile Image */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="relative"
              >
                <div className="relative w-24 h-24 md:w-28 md:h-28">
                  <div className="w-full h-full rounded-full overflow-hidden ring-2 ring-violet-100">
                    <Image
                      src={user.profilePicture?.url || '/Assets/Image/Profile.png'}
                      alt={`${user.firstName} ${user.lastName}`}
                      fill
                      priority
                      style={{ objectFit: 'cover' }}
                      className="rounded-full"
                    />
                  </div>
                  {isOwnProfile && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={onEdit}
                      className="absolute -bottom-1 -right-1 bg-violet-500 p-1.5 rounded-full text-white shadow-sm"
                      aria-label="Edit Profile"
                    >
                      <FiEdit3 className="w-3 h-3" />
                    </motion.button>
                  )}
                </div>
              </motion.div>

              {/* User Info */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="flex-grow text-center md:text-left space-y-3"
              >
                <div className="flex flex-col md:flex-row md:items-center gap-2">
                  <h1 className="text-xl font-medium text-gray-800">
                    {user.firstName} {user.lastName}
                  </h1>
                  <div className="flex flex-wrap justify-center md:justify-start gap-2">
                    {user.role && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-violet-50 text-violet-600">
                        {user.role === 'freelancer' ? 'Freelancer' : user.role === 'jobseeker' ? 'Job Seeker' : user.role}
                      </span>
                    )}
                    {user.openToWork && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-600">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1 animate-pulse"></span>
                        Open to Work
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-gray-500 text-sm">
                  {user.headline || (user.companyRole || user.role === 'freelancer' ? 'Freelancer' : user.role === 'jobseeker' ? 'Looking for Opportunities' : 'Product Enthusiast')}
                </p>
                {user.bio && (
                  <p className="text-gray-500 text-sm max-w-2xl line-clamp-2">{user.bio}</p>
                )}
                <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 justify-center md:justify-start">
                  {user.address && (user.address.city || user.address.country) && (
                    <span className="flex items-center gap-1">
                      <FiMapPin className="w-3 h-3 text-gray-400" />
                      {`${user.address.city || ''}, ${user.address.country || ''}`.replace(/, $/, '').replace(/^, /, '')}
                    </span>
                  )}
                  {user.preferredContact && (
                    <span className="flex items-center gap-1">
                      <FiMail className="w-3 h-3 text-gray-400" />
                      {user.preferredContact}
                    </span>
                  )}
                  {user.socialLinks?.website && (
                    <a
                      href={user.socialLinks.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-violet-600 hover:text-violet-700 transition-colors"
                    >
                      <FiLink className="w-3 h-3" />
                      Website
                    </a>
                  )}
                </div>
              </motion.div>

              {/* Action Buttons */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="flex flex-col gap-2"
              >
                {isOwnProfile && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onEdit}
                    className="px-3 py-1.5 bg-violet-500 text-white rounded-md text-sm font-medium hover:bg-violet-600 transition-colors flex items-center gap-1.5 whitespace-nowrap"
                  >
                    <FiEdit3 className="w-3.5 h-3.5" />
                    Edit Profile
                  </motion.button>
                )}
                {user.socialLinks?.website && (
                  <motion.a
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    href={user.socialLinks.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 border border-gray-200 text-gray-600 rounded-md text-sm font-medium hover:bg-gray-50 transition-colors flex items-center gap-1.5 whitespace-nowrap"
                  >
                    <FiExternalLink className="w-3.5 h-3.5" />
                    Visit Site
                  </motion.a>
                )}
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}