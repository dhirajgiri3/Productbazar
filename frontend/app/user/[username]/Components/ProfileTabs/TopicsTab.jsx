// src/components/ProfileTabs/TopicsTab.jsx

import { motion } from "framer-motion";

const topicColors = [
  "from-blue-500 to-cyan-400",
  "from-violet-500 to-purple-400",
  "from-rose-500 to-pink-400",
  "from-amber-500 to-yellow-400",
  "from-emerald-500 to-green-400",
  "from-indigo-500 to-blue-400",
];

// Helper function to switch tabs
const switchTab = (tabName) => {
  const tabButtons = document.querySelectorAll('nav button');
  const tabButton = Array.from(tabButtons).find(btn => btn.textContent === tabName);
  if (tabButton) tabButton.click();
};

const TopicsTab = ({ topics = [] }) => {
  return (
    <motion.div
      className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-sm border border-gray-100"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <h2 className="text-2xl font-semibold text-gray-900 mb-8 flex items-center gap-2">
        <svg className="w-6 h-6 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
        </svg>
        Topics of Interest
      </h2>
      
      {topics && topics.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {topics.map((topic, index) => {
            const colorClass = topicColors[index % topicColors.length];
            
            return (
              <motion.div
                key={index}
                className={`bg-gradient-to-r ${colorClass} rounded-xl p-6 shadow-md hover:shadow-xl text-white flex items-center justify-between group`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
              >
                <span className="font-medium text-lg">{topic}</span>
                <motion.div
                  className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center"
                  whileHover={{ rotate: 45, scale: 1.1 }}
                  transition={{ duration: 0.2 }}
                >
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </motion.div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="mt-8 flex flex-col items-center justify-center py-12 text-center">
          <div className="w-20 h-20 bg-violet-50 rounded-full flex items-center justify-center mb-4">
            <svg className="w-10 h-10 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No topics added yet</h3>
          <p className="text-gray-500 max-w-sm">
            Add topics you're interested in to help others discover your profile and connect with like-minded creators.
          </p>
          <button 
            onClick={() => switchTab("Edit Profile")}
            className="mt-6 px-5 py-2.5 bg-violet-600 text-white rounded-xl text-sm font-medium hover:bg-violet-700 transition-colors shadow-sm"
          >
            Add Topics
          </button>
        </div>
      )}
    </motion.div>
  );
};

export default TopicsTab;
