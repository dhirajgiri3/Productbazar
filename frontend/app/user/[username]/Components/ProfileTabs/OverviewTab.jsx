"use client";

import React, { useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { 
  FiBookOpen, FiUser, FiTag, FiHeart, FiPackage, 
  FiClock, FiMessageCircle, FiMapPin, FiCheck, FiBriefcase, 
  FiArrowRight, FiLayers, FiGrid 
} from "react-icons/fi";
import ProfileProductCard from "../../../../../Components/Product/ProfileProductCard";

const skillCategories = {
  "development": {
    icon: <FiBookOpen className="w-4 h-4 text-blue-600" />,
    color: "bg-blue-50 text-blue-600 border-blue-100"
  },
  "design": {
    icon: <svg className="w-4 h-4 text-pink-600" fill="currentColor" viewBox="0 0 20 20">
      <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
      <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" />
    </svg>,
    color: "bg-pink-50 text-pink-600 border-pink-100"
  },
  "marketing": {
    icon: <svg className="w-4 h-4 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
      <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
    </svg>,
    color: "bg-orange-50 text-orange-600 border-orange-100"
  },
  "business": {
    icon: <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M10 2a4 4 0 00-4 4v1H5a1 1 0 00-.994.89l-1 9A1 1 0 004 18h12a1 1 0 00.994-1.11l-1-9A1 1 0 0015 7h-1V6a4 4 0 00-4-4zm2 5V6a2 2 0 10-4 0v1h4zm-6 3a1 1 0 112 0 1 1 0 01-2 0zm7-1a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd" />
    </svg>,
    color: "bg-green-50 text-green-600 border-green-100"
  },
  "other": {
    icon: <FiTag className="w-4 h-4 text-gray-600" />,
    color: "bg-gray-50 text-gray-600 border-gray-100"
  }
};

// Custom function to categorize skills
const categorizeSkill = (skill) => {
  const devKeywords = ["javascript", "python", "react", "node", "java", "code", "programming", "typescript", "vue", "angular", "backend", "frontend", "fullstack", "development", "engineering", "software"];
  const designKeywords = ["design", "ux", "ui", "graphic", "illustration", "figma", "sketch", "photoshop", "illustrator", "creative", "art", "typography"];
  const marketingKeywords = ["marketing", "seo", "content", "social media", "advertising", "growth", "brand", "campaign", "analytics", "audience"];
  const businessKeywords = ["business", "strategy", "management", "leadership", "entrepreneurship", "startup", "sales", "operations", "product", "project"];
  
  const skillLower = String(skill).toLowerCase();
  
  if (devKeywords.some(keyword => skillLower.includes(keyword))) return "development";
  if (designKeywords.some(keyword => skillLower.includes(keyword))) return "design";
  if (marketingKeywords.some(keyword => skillLower.includes(keyword))) return "marketing";
  if (businessKeywords.some(keyword => skillLower.includes(keyword))) return "business";
  
  return "other";
};

// Helper to parse interests from different formats
const parseInterests = (interests) => {
  if (!interests || !interests.length) return [];
  
  try {
    if (Array.isArray(interests)) {
      return interests.map(interest => 
        typeof interest === 'string' ? interest : 
        interest?.name ? interest.name : 
        String(interest)
      );
    }
    return [String(interests)];
  } catch (e) {
    console.error("Error parsing interests:", e);
    return [];
  }
};

// Helper to parse skills from different formats
const parseSkills = (skills) => {
  if (!skills || !skills.length) return [];
  try {
    const extractSkills = (item) => {
      if (typeof item !== "string")
        return Array.isArray(item)
          ? item.flatMap(extractSkills)
          : String(item);
      try {
        if (item.includes("[") || item.includes('"')) {
          const parsed = JSON.parse(item);
          return Array.isArray(parsed)
            ? parsed.flatMap(extractSkills)
            : parsed;
        }
        return item;
      } catch {
        return item;
      }
    };
    
    const processedSkills = Array.isArray(skills)
      ? skills.flatMap(extractSkills)
      : [skills];
    return [
      ...new Set(
        processedSkills
          .filter(Boolean)
          .map((s) =>
            typeof s === "string"
              ? s.replace(/^\[|\]$/g, "").replace(/^"|"$/g, "")
              : String(s)
          )
          .filter((s) => s && s !== '""' && !s.startsWith("["))
      ),
    ];
  } catch (e) {
    console.error("Error parsing skills:", e);
    return [];
  }
};

// Helper to format skills for better display
const formatSkillName = (skill) => {
  // Handle common abbreviations and format them properly
  const abbreviations = {
    'js': 'JavaScript',
    'ts': 'TypeScript',
    'ui': 'UI',
    'ux': 'UX',
    'css': 'CSS',
    'html': 'HTML',
    'ai': 'AI',
    'ml': 'Machine Learning',
    'seo': 'SEO',
    'db': 'Database',
    'aws': 'AWS',
    'react': 'React',
    'nextjs': 'Next.js'
  };

  // First clean the skill string
  let formattedSkill = skill.trim();
  
  // Handle abbreviations (case insensitive)
  Object.entries(abbreviations).forEach(([abbr, full]) => {
    // Match the abbreviation as a whole word with word boundaries
    const regex = new RegExp(`\\b${abbr}\\b`, 'i');
    if (regex.test(formattedSkill.toLowerCase())) {
      formattedSkill = formattedSkill.replace(regex, full);
    }
  });
  
  // Capitalize first letter of each word
  formattedSkill = formattedSkill.split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
    
  return formattedSkill;
};

export default function OverviewTab({ user, products = [] }) {
  const featuredProducts = products.slice(0, 3);
  
  const switchTab = useCallback((tabName) => {
    const tabButtons = document.querySelectorAll("nav button");
    const tabButton = Array.from(tabButtons).find(
      (btn) => btn.textContent.includes(tabName)
    );
    if (tabButton) tabButton.click();
  }, []);

  const userSkills = parseSkills(user.skills || []).map(formatSkillName);
  const userInterests = parseInterests(user.interests || []);

  // Group products by category for more structured display
  const productsByCategory = useMemo(() => {
    const categories = {};
    products.forEach(product => {
      const category = product.category?.name || product.category || 'Other';
      if (!categories[category]) {
        categories[category] = [];
      }
      categories[category].push(product);
    });
    return categories;
  }, [products]);

  return (
    <div className="space-y-10">
      {/* About Section - Improved */}
      {user.bio && (
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="space-y-4"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-violet-50 flex items-center justify-center">
              <FiUser className="w-4 h-4 text-violet-600" />
            </div>
            <h2 className="text-lg font-medium text-gray-900">About</h2>
          </div>
          
          <div className="text-gray-600 text-sm leading-relaxed bg-gray-50/50 rounded-xl p-5 border border-gray-100">
            {user.bio}
            
            {user.about && (
              <div className="mt-4 pt-4 border-t border-gray-100 text-gray-600">
                {user.about}
              </div>
            )}
          </div>
        </motion.section>
      )}

      {/* Skills Section - Redesigned */}
      {userSkills.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="space-y-4"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
              <FiTag className="w-4 h-4 text-blue-600" />
            </div>
            <h2 className="text-lg font-medium text-gray-900">Skills</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Development Skills */}
            {userSkills.some(skill => categorizeSkill(skill) === "development") && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="bg-white rounded-xl border border-blue-100 p-4 hover:border-blue-200 transition-colors"
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 rounded-full bg-blue-50 flex items-center justify-center">
                    {skillCategories.development.icon}
                  </div>
                  <h3 className="font-medium text-blue-700 text-sm">Development</h3>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {userSkills
                    .filter(skill => categorizeSkill(skill) === "development")
                    .map((skill, i) => (
                      <motion.span 
                        key={i}
                        className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium"
                        whileHover={{ scale: 1.05, y: -2 }}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.05 }}
                      >
                        {skill}
                      </motion.span>
                    ))
                  }
                </div>
              </motion.div>
            )}

            {/* Design Skills */}
            {userSkills.some(skill => categorizeSkill(skill) === "design") && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className="bg-white rounded-xl border border-pink-100 p-4 hover:border-pink-200 transition-colors"
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 rounded-full bg-pink-50 flex items-center justify-center">
                    {skillCategories.design.icon}
                  </div>
                  <h3 className="font-medium text-pink-700 text-sm">Design</h3>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {userSkills
                    .filter(skill => categorizeSkill(skill) === "design")
                    .map((skill, i) => (
                      <motion.span 
                        key={i}
                        className="px-3 py-1 bg-pink-50 text-pink-700 rounded-full text-xs font-medium"
                        whileHover={{ scale: 1.05, y: -2 }}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.05 }}
                      >
                        {skill}
                      </motion.span>
                    ))
                  }
                </div>
              </motion.div>
            )}

            {/* Marketing Skills */}
            {userSkills.some(skill => categorizeSkill(skill) === "marketing") && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.2 }}
                className="bg-white rounded-xl border border-orange-100 p-4 hover:border-orange-200 transition-colors"
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 rounded-full bg-orange-50 flex items-center justify-center">
                    {skillCategories.marketing.icon}
                  </div>
                  <h3 className="font-medium text-orange-700 text-sm">Marketing</h3>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {userSkills
                    .filter(skill => categorizeSkill(skill) === "marketing")
                    .map((skill, i) => (
                      <motion.span 
                        key={i}
                        className="px-3 py-1 bg-orange-50 text-orange-700 rounded-full text-xs font-medium"
                        whileHover={{ scale: 1.05, y: -2 }}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.05 }}
                      >
                        {skill}
                      </motion.span>
                    ))
                  }
                </div>
              </motion.div>
            )}

            {/* Business Skills */}
            {userSkills.some(skill => categorizeSkill(skill) === "business") && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.3 }}
                className="bg-white rounded-xl border border-green-100 p-4 hover:border-green-200 transition-colors"
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 rounded-full bg-green-50 flex items-center justify-center">
                    {skillCategories.business.icon}
                  </div>
                  <h3 className="font-medium text-green-700 text-sm">Business</h3>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {userSkills
                    .filter(skill => categorizeSkill(skill) === "business")
                    .map((skill, i) => (
                      <motion.span 
                        key={i}
                        className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-medium"
                        whileHover={{ scale: 1.05, y: -2 }}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.05 }}
                      >
                        {skill}
                      </motion.span>
                    ))
                  }
                </div>
              </motion.div>
            )}

            {/* Other Skills */}
            {userSkills.some(skill => categorizeSkill(skill) === "other") && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.4 }}
                className="bg-white rounded-xl border border-gray-100 p-4 hover:border-gray-200 transition-colors"
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 rounded-full bg-gray-50 flex items-center justify-center">
                    {skillCategories.other.icon}
                  </div>
                  <h3 className="font-medium text-gray-700 text-sm">Other Skills</h3>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {userSkills
                    .filter(skill => categorizeSkill(skill) === "other")
                    .map((skill, i) => (
                      <motion.span 
                        key={i}
                        className="px-3 py-1 bg-gray-50 text-gray-700 rounded-full text-xs font-medium"
                        whileHover={{ scale: 1.05, y: -2 }}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.05 }}
                      >
                        {skill}
                      </motion.span>
                    ))
                  }
                </div>
              </motion.div>
            )}
          </div>
        </motion.section>
      )}

      {/* Interests - Redesigned */}
      {userInterests.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="space-y-4"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center">
              <FiHeart className="w-4 h-4 text-red-600" />
            </div>
            <h2 className="text-lg font-medium text-gray-900">Interests</h2>
          </div>
          
          <div className="bg-white rounded-xl border border-red-100 p-5 hover:border-red-200 transition-colors">
            <div className="flex flex-wrap gap-2">
              {userInterests.map((interest, i) => {
                const displayText = typeof interest === 'string' ? interest : 
                  interest?.name ? interest.name : String(interest);
                
                return (
                  <motion.span 
                    key={i}
                    className="px-3 py-1.5 bg-red-50 text-red-700 rounded-full text-xs font-medium"
                    whileHover={{ scale: 1.05, y: -2 }}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.05, duration: 0.2 }}
                  >
                    {displayText}
                  </motion.span>
                );
              })}
            </div>
          </div>
        </motion.section>
      )}

      {/* Products Section - Enhanced */}
      {products.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="space-y-5"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-violet-50 flex items-center justify-center">
                <FiPackage className="w-4 h-4 text-violet-600" />
              </div>
              <h2 className="text-lg font-medium text-gray-900">Featured Products</h2>
            </div>
            
            {products.length > 3 && (
              <motion.button
                whileHover={{ scale: 1.05, x: 3 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => switchTab("Products")}
                className="text-sm text-violet-600 hover:text-violet-700 flex items-center gap-1.5"
              >
                View all <FiArrowRight className="w-3.5 h-3.5" />
              </motion.button>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {featuredProducts.map((product, index) => (
              <motion.div
                key={product._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 + 0.2, duration: 0.4 }}
                className="overflow-hidden"
              >
                <ProfileProductCard 
                  product={product} 
                  minimal={true}
                />
              </motion.div>
            ))}
          </div>
        </motion.section>
      )}

      {/* Availability Section - Improved */}
      {user.availability && (
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          className="space-y-4"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center">
              <FiClock className="w-4 h-4 text-green-600" />
            </div>
            <h2 className="text-lg font-medium text-gray-900">Availability</h2>
          </div>
          
          <div className="bg-green-50/50 rounded-xl border border-green-100 p-5">
            <div className="text-green-800 text-sm leading-relaxed">
              {user.availability}
            </div>
            
            {user.openToWork && (
              <div className="mt-4 pt-4 border-t border-green-100 flex items-center gap-2 text-green-700">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                <span className="text-sm font-medium">Currently open to work opportunities</span>
              </div>
            )}
          </div>
        </motion.section>
      )}

      {/* Location Section - New */}
      {user.address && (
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.5 }}
          className="space-y-4"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center">
              <FiMapPin className="w-4 h-4 text-indigo-600" />
            </div>
            <h2 className="text-lg font-medium text-gray-900">Location</h2>
          </div>
          
          <div className="rounded-xl overflow-hidden border border-indigo-100">
            <div className="bg-indigo-50/50 p-5">
              <div className="text-indigo-800 text-sm leading-relaxed flex items-center gap-2">
                <FiMapPin className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                {typeof user.address === "object"
                  ? `${user.address.city || ""}, ${
                      user.address.country || ""
                    }`
                      .replace(/, $/, "")
                      .replace(/^, /, "")
                  : user.address}
              </div>
            </div>
          </div>
        </motion.section>
      )}

      {/* Work Experience - If Available */}
      {user.experiences && user.experiences.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.6 }}
          className="space-y-4"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center">
              <FiBriefcase className="w-4 h-4 text-amber-600" />
            </div>
            <h2 className="text-lg font-medium text-gray-900">Work Experience</h2>
          </div>
          
          <div className="space-y-4">
            {user.experiences.map((experience, index) => (
              <motion.div 
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
                className="bg-white rounded-xl border border-amber-100 p-5 hover:border-amber-200 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-2">
                  <h3 className="font-medium text-gray-900">{experience.title}</h3>
                  {experience.period && (
                    <span className="text-xs text-gray-500 flex-shrink-0">{experience.period}</span>
                  )}
                </div>
                
                <div className="text-sm text-gray-600 mb-2">
                  {experience.company}
                  {experience.location && (
                    <span className="text-gray-500"> • {experience.location}</span>
                  )}
                </div>
                
                {experience.description && (
                  <p className="text-sm text-gray-600 mt-2">{experience.description}</p>
                )}
              </motion.div>
            ))}
          </div>
        </motion.section>
      )}

      {/* No content state */}
      {!user.bio && !userSkills.length && !userInterests.length && !products.length && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col items-center justify-center py-16 text-center"
        >
          <div className="w-16 h-16 bg-violet-50 rounded-full flex items-center justify-center mb-4">
            <FiUser className="w-8 h-8 text-violet-300" />
          </div>
          <h3 className="text-lg font-medium text-gray-800 mb-2">Profile is empty</h3>
          <p className="text-gray-500 text-sm max-w-sm">
            This user hasn't added any information to their profile yet.
          </p>
        </motion.div>
      )}
    </div>
  );
}
