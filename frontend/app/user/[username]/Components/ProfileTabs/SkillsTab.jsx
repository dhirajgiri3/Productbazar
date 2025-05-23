// src/components/ProfileTabs/SkillsTab.jsx

import { motion } from "framer-motion";

// Skill categories with icons
const skillCategories = {
  "programming": {
    icon: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
      </svg>
    ),
    color: "bg-blue-50 text-blue-600 border-blue-100"
  },
  "design": {
    icon: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
        <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
        <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" />
      </svg>
    ),
    color: "bg-pink-50 text-pink-600 border-pink-100"
  },
  "marketing": {
    icon: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
        <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
      </svg>
    ),
    color: "bg-orange-50 text-orange-600 border-orange-100"
  },
  "business": {
    icon: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
        <path d="M2 13.692V16a2 2 0 002 2h12a2 2 0 002-2v-2.308A24.974 24.974 0 0110 15c-2.796 0-5.487-.46-8-1.308z" />
      </svg>
    ),
    color: "bg-green-50 text-green-600 border-green-100"
  },
  "other": {
    icon: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
        <path d="M10 3.5a1.5 1.5 0 013 0V4a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-.5a1.5 1.5 0 000 3h.5a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-.5a1.5 1.5 0 00-3 0v.5a1 1 0 01-1 1H6a1 1 0 01-1-1v-3a1 1 0 00-1-1h-.5a1.5 1.5 0 010-3H4a1 1 0 001-1V6a1 1 0 011-1h3a1 1 0 001-1v-.5z" />
      </svg>
    ),
    color: "bg-violet-50 text-violet-600 border-violet-100"
  }
};

// Helper function to categorize skills
const categorizeSkill = (skill) => {
  const lowerSkill = skill.toLowerCase();
  
  if (/javascript|react|vue|angular|node|python|java|c\+\+|ruby|php|html|css|sql|mongodb|express|django|flutter|swift|kotlin/.test(lowerSkill)) {
    return "programming";
  }
  
  if (/figma|sketch|design|ui|ux|photoshop|illustrator|indesign|animation|graphic|wireframe|prototype/.test(lowerSkill)) {
    return "design";
  }
  
  if (/marketing|seo|social media|content|analytics|advertising|growth|copywriting|branding|email|campaign/.test(lowerSkill)) {
    return "marketing";
  }
  
  if (/business|management|strategy|leadership|planning|finance|accounting|sales|negotiation|startup|entrepreneurship/.test(lowerSkill)) {
    return "business";
  }
  
  return "other";
};

const SkillsTab = ({ skills = [] }) => {
  return (
    <motion.div
      className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-sm border border-gray-100"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <h2 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
        <svg className="w-6 h-6 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
        Skills & Expertise
      </h2>
      
      {skills && skills.length > 0 ? (
        <div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Programming Skills */}
            {skills.some(skill => categorizeSkill(skill) === "programming") && (
              <motion.div
                className="col-span-1"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
                    {skillCategories.programming.icon}
                  </div>
                  <h3 className="font-medium text-blue-600">Programming</h3>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {skills.filter(skill => categorizeSkill(skill) === "programming").map((skill, i) => (
                    <motion.span 
                      key={i}
                      className={`px-3 py-1 border ${skillCategories.programming.color} rounded-full text-xs font-medium`}
                      whileHover={{ scale: 1.05 }}
                    >
                      {skill}
                    </motion.span>
                  ))}
                </div>
              </motion.div>
            )}
            {/* Design Skills */}
            {skills.some(skill => categorizeSkill(skill) === "design") && (
              <motion.div
                className="col-span-1"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.2 }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-full bg-pink-50 flex items-center justify-center">
                    {skillCategories.design.icon}
                  </div>
                  <h3 className="font-medium text-pink-600">Design</h3>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {skills.filter(skill => categorizeSkill(skill) === "design").map((skill, i) => (
                    <motion.span 
                      key={i}
                      className={`px-3 py-1 border ${skillCategories.design.color} rounded-full text-xs font-medium`}
                      whileHover={{ scale: 1.05 }}
                    >
                      {skill}
                    </motion.span>
                  ))}
                </div>
              </motion.div>
            )}
            {/* Marketing Skills */}
            {skills.some(skill => categorizeSkill(skill) === "marketing") && (
              <motion.div
                className="col-span-1"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.3 }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center">
                    {skillCategories.marketing.icon}
                  </div>
                  <h3 className="font-medium text-orange-600">Marketing</h3>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {skills.filter(skill => categorizeSkill(skill) === "marketing").map((skill, i) => (
                    <motion.span 
                      key={i}
                      className={`px-3 py-1 border ${skillCategories.marketing.color} rounded-full text-xs font-medium`}
                      whileHover={{ scale: 1.05 }}
                    >
                      {skill}
                    </motion.span>
                  ))}
                </div>
              </motion.div>
            )}
            {/* Business Skills */}
            {skills.some(skill => categorizeSkill(skill) === "business") && (
              <motion.div
                className="col-span-1"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.4 }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center">
                    {skillCategories.business.icon}
                  </div>
                  <h3 className="font-medium text-green-600">Business</h3>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {skills.filter(skill => categorizeSkill(skill) === "business").map((skill, i) => (
                    <motion.span 
                      key={i}
                      className={`px-3 py-1 border ${skillCategories.business.color} rounded-full text-xs font-medium`}
                      whileHover={{ scale: 1.05 }}
                    >
                      {skill}
                    </motion.span>
                  ))}
                </div>
              </motion.div>
            )}
            {/* Other Skills */}
            {skills.some(skill => categorizeSkill(skill) === "other") && (
              <motion.div
                className="col-span-1"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.5 }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-full bg-violet-50 flex items-center justify-center">
                    {skillCategories.other.icon}
                  </div>
                  <h3 className="font-medium text-violet-600">Other</h3>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {skills.filter(skill => categorizeSkill(skill) === "other").map((skill, i) => (
                    <motion.span 
                      key={i}
                      className={`px-3 py-1 border ${skillCategories.other.color} rounded-full text-xs font-medium`}
                      whileHover={{ scale: 1.05 }}
                    >
                      {skill}
                    </motion.span>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        </div>
      ) : (
        <p className="text-gray-500">No skills listed.</p>
      )}
    </motion.div>
  );
};

export default SkillsTab;