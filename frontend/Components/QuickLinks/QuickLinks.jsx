import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

const SectionWrapper = ({ children, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay }}
  >
    {children}
  </motion.div>
);

const QuickLinkItem = ({ href, icon, label, delay }) => (
  <motion.div variants={itemVariants} whileHover={{ scale: 1.01, x: 3 }}>
    <Link
      href={href}
      className="flex items-center p-3 hover:bg-violet-50 rounded-md transition-all duration-200 group border border-transparent hover:border-violet-200"
    >
      <div className="w-9 h-9 rounded-md border border-gray-100 flex items-center justify-center mr-3 shadow-sm group-hover:shadow-md transition-shadow bg-violet-50">
        {icon}
      </div>
      <span className="text-gray-700 group-hover:text-violet-700 font-medium transition-colors">{label}</span>
      <motion.div
        className="ml-auto text-gray-400 group-hover:text-violet-600 transition-colors"
        animate={{ x: [0, 5, 0] }}
        transition={{ repeat: Infinity, repeatType: "loop", duration: 2, repeatDelay: delay }}
      >
        <ArrowRight size={14} />
      </motion.div>
    </Link>
  </motion.div>
);

const QuickLinks = () => {
  const links = [
    { href: "/products", label: "All Products", icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-violet-500 group-hover:text-violet-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>, delay: 2 },
    { href: "/categories", label: "Browse Categories", icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-violet-500 group-hover:text-violet-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>, delay: 2.5 },
    { href: "/trending", label: "Trending Products", icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-violet-500 group-hover:text-violet-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>, delay: 3 },
    { href: "/new", label: "New Arrivals", icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-violet-500 group-hover:text-violet-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>, delay: 3.5 },
  ];

  const renderQuickLinks = () => (
    <SectionWrapper delay={0.3}>
      <div className="bg-white rounded-xl overflow-hidden border border-gray-100 shadow-sm">
        <div className="p-5 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center">
            <span className="text-violet-600 mr-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </span>
            Quick Navigation
          </h3>
        </div>
        <div className="p-4">
          <motion.div
            className="grid grid-cols-1 gap-3"
            variants={containerVariants}
            initial="hidden"
            animate="show"
          >
            {links.map((link, index) => (
              <QuickLinkItem key={index} {...link} />
            ))}
          </motion.div>
        </div>
      </div>
    </SectionWrapper>
  );

  return (
    <div className="quick-links">
      {renderQuickLinks()}
    </div>
  );
};

export default QuickLinks;
