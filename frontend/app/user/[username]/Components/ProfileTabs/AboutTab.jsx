// src/components/ProfileTabs/AboutTab.jsx

import { motion } from "framer-motion";

// Helper function to switch tabs
const switchTab = (tabName) => {
  const tabButtons = document.querySelectorAll('nav button');
  const tabButton = Array.from(tabButtons).find(btn => btn.textContent === tabName);
  if (tabButton) tabButton.click();
};

const AboutTab = ({ about }) => {
  return (
    <motion.div
      className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-sm border border-gray-100"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <h2 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
        <svg className="w-6 h-6 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
        About
      </h2>
      
      {about ? (
        <div className="prose prose-violet max-w-none text-gray-600 leading-relaxed">
          {about.split('\n').map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>
      ) : (
        <div className="bg-gray-50/50 rounded-xl p-8 text-center">
          <div className="w-16 h-16 bg-violet-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No description provided yet</h3>
          <p className="text-gray-500 max-w-md mx-auto">
            Share your story, experience, and background to help others get to know you better.
          </p>
          <button 
            onClick={() => switchTab("Edit Profile")}
            className="mt-6 px-5 py-2.5 bg-violet-600 text-white rounded-xl text-sm font-medium hover:bg-violet-700 transition-colors shadow-sm"
          >
            Add About Information
          </button>
        </div>
      )}
    </motion.div>
  );
};

export default AboutTab;