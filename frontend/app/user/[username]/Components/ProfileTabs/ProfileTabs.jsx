// src/components/profile/ProfileTabs.jsx
import { motion } from 'framer-motion';
import { FiGrid, FiPackage, FiActivity, FiAward } from 'react-icons/fi';
import { tabVariants } from '@/lib/utils/ui/animations';

export default function ProfileTabs({ activeTab, setActiveTab }) {
  const tabs = [
    { name: 'Overview', icon: FiGrid },
    { name: 'Products', icon: FiPackage },
    { name: 'Activity', icon: FiActivity },
    { name: 'Upvotes', icon: FiAward },
  ];

  return (
    <nav className="sticky top-0 z-10 bg-white/90 backdrop-blur-sm border-b border-gray-100 mb-6">
      <div className="max-w-4xl mx-auto px-4">
        <motion.div
          variants={tabVariants}
          initial="hidden"
          animate="visible"
          className="flex space-x-1 overflow-x-auto hide-scrollbar py-3"
        >
          {tabs.map((tab, index) => {
            const isActive = activeTab === tab.name;
            return (
              <motion.button
                key={tab.name}
                onClick={() => setActiveTab(tab.name)}
                className={`py-2 px-4 text-sm font-medium whitespace-nowrap relative rounded-md transition-colors flex items-center gap-2 ${
                  isActive ? 'text-violet-700 bg-violet-50' : 'text-gray-600 hover:text-violet-600 hover:bg-gray-50'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + index * 0.05, type: 'spring', stiffness: 300, damping: 25 }}
              >
                <tab.icon className={`w-4 h-4 ${isActive ? 'text-violet-600' : 'text-gray-400'}`} />
                {tab.name}
                {isActive && (
                  <motion.div
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-violet-500"
                    layoutId="activeTabIndicator"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
              </motion.button>
            );
          })}
        </motion.div>
      </div>
    </nav>
  );
}