// src/components/profile/ProfileStats.jsx
import { motion } from 'framer-motion';
import { FiPackage, FiBookmark, FiAward, FiActivity } from 'react-icons/fi';
import { statVariants } from '@/lib/utils/ui/animations';

export default function ProfileStats({ productsCount, bookmarks, upvotes, activities }) {
  const stats = [
    { icon: FiPackage, label: 'Products', value: productsCount },
    { icon: FiBookmark, label: 'Bookmarks', value: bookmarks },
    { icon: FiAward, label: 'Upvotes', value: upvotes },
    { icon: FiActivity, label: 'Activities', value: activities },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 mb-6">
      <motion.div
        className="grid grid-cols-2 md:grid-cols-4 gap-3"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            className="bg-white rounded-xl p-4 border border-gray-100 flex items-center gap-3"
            variants={statVariants}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.5 + index * 0.05 }}
            whileHover={{ y: -2, borderColor: '#e9d5ff' }}
          >
            <div className="w-10 h-10 rounded-full bg-violet-50 flex items-center justify-center flex-shrink-0">
              <stat.icon className="w-5 h-5 text-violet-500" />
            </div>
            <div>
              <motion.span
                className="block text-lg font-medium text-gray-900"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 100, delay: 0.6 + index * 0.05 }}
              >
                {stat.value}
              </motion.span>
              <span className="text-xs text-gray-500">{stat.label}</span>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}