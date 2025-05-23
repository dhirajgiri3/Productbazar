// src/components/ProfileTabs/SocialTab.jsx

import { motion } from "framer-motion";
import { useState, useEffect } from "react";

const SocialTab = ({ social }) => {
  const [socialData, setSocialData] = useState({});
  
  // Process and normalize the social data on component mount
  useEffect(() => {
    // Safety check - ensure social is an object
    const socialObj = social && typeof social === 'object' ? social : {};
    
    // Convert any string URLs to proper objects with normalized property names
    const processedData = {};
    
    // Handle various possible formats
    if (socialObj.facebook) processedData.facebook = socialObj.facebook;
    if (socialObj.twitter) processedData.twitter = socialObj.twitter;
    if (socialObj.linkedin) processedData.linkedin = socialObj.linkedin;
    if (socialObj.instagram) processedData.instagram = socialObj.instagram;
    if (socialObj.github) processedData.github = socialObj.github;
    if (socialObj.website) processedData.website = socialObj.website;

    // Additional checks for alternative property names
    if (socialObj.Facebook) processedData.facebook = socialObj.Facebook;
    if (socialObj.Twitter) processedData.twitter = socialObj.Twitter;
    if (socialObj.LinkedIn) processedData.linkedin = socialObj.LinkedIn;
    if (socialObj.Instagram) processedData.instagram = socialObj.Instagram;
    if (socialObj.GitHub) processedData.github = socialObj.GitHub;
    if (socialObj.Website) processedData.website = socialObj.Website;
    
    setSocialData(processedData);
  }, [social]);

  // Create the platforms array from normalized data
  const socialPlatforms = [
    { name: "Facebook", url: socialData.facebook, color: "text-blue-600" },
    { name: "Twitter", url: socialData.twitter, color: "text-blue-400" },
    { name: "LinkedIn", url: socialData.linkedin, color: "text-blue-700" },
    { name: "Instagram", url: socialData.instagram, color: "text-pink-500" },
    { name: "GitHub", url: socialData.github, color: "text-gray-800" },
    { name: "Website", url: socialData.website, color: "text-violet-500" },
  ];

  // Check if there are any social links to display
  const hasSocialLinks = socialPlatforms.some(platform => !!platform.url);

  return (
    <motion.div
      className="bg-white/80 backdrop-blur rounded-2xl p-8 border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <h2 className="text-2xl font-medium text-gray-900 mb-8">Connect</h2>
      <div className="flex flex-col space-y-5">
        {!hasSocialLinks ? (
          <p className="text-gray-500 text-center py-4">No social links available</p>
        ) : (
          socialPlatforms.map(
            (platform, index) =>
              platform.url && (
                <motion.a
                  key={index}
                  href={platform.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center space-x-4 p-4 rounded-xl hover:bg-blue-50/50 transition-all duration-300"
                  whileHover={{ x: 4 }}
                >
                  <span className={`w-5 h-5 ${platform.color}`}>
                    {/* Icons for social platforms */}
                    {platform.name === "Facebook" && (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M22.675 0h-21.35C.595 0 0 .594 0 1.325v21.351C0 23.406.595 24 1.325 24h11.495v-9.294H9.691v-3.622h3.129V8.413c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.466.099 2.797.143v3.24l-1.918.001c-1.504 0-1.796.715-1.796 1.763v2.313h3.587l-.467 3.622h-3.12V24h6.116C23.406 24 24 23.406 24 22.676V1.325C24 .594 23.406 0 22.675 0z" />
                      </svg>
                    )}
                    {platform.name === "Twitter" && (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M23.954 4.569c-.885.392-1.83.656-2.825.775 1.014-.611 1.794-1.574 2.163-2.723-.949.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-2.723 0-4.928 2.205-4.928 4.928 0 .39.045.765.127 1.124C7.691 8.094 4.066 6.13 1.64 3.161c-.427.722-.666 1.561-.666 2.475 0 1.708.87 3.213 2.188 4.096-.807-.026-1.566-.248-2.229-.616v.061c0 2.385 1.693 4.374 3.946 4.827-.413.111-.849.171-1.296.171-.314 0-.615-.03-.916-.086.631 1.953 2.445 3.377 4.6 3.419-1.68 1.319-3.809 2.105-6.102 2.105-.39 0-.779-.023-1.17-.067 2.179 1.397 4.768 2.213 7.557 2.213 9.054 0 14-7.496 14-13.986 0-.21 0-.423-.015-.634.961-.689 1.8-1.56 2.46-2.548l-.047-.02z" />
                      </svg>
                    )}
                    {platform.name === "LinkedIn" && (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.327-.024-3.037-1.849-3.037-1.851 0-2.135 1.445-2.135 2.939v5.666h-3.554V9h3.414v1.561h.05c.476-.9 1.637-1.849 3.37-1.849 3.602 0 4.267 2.37 4.267 5.455v6.284zm-14.308-13.201c-1.144 0-2.07-.927-2.07-2.07 0-1.144.927-2.07 2.07-2.07s2.07.927 2.07 2.07c0 1.143-.927 2.07-2.07 2.07zm1.777 13.201h-3.554V9h3.554v11.452zM22.225 0H1.771C.792 0 0 .771 0 1.723v20.555C0 23.229.792 24 1.771 24h20.451C23.2 24 24 23.229 24 22.278V1.723C24 .771 23.2 0 22.225 0z" />
                      </svg>
                    )}
                    {platform.name === "Instagram" && (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                      </svg>
                    )}
                    {platform.name === "GitHub" && (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M12 0C5.373 0 0 5.373 0 12a12.002 12.002 0 008.205 11.387c.6.111.82-.261.82-.577v-2.234c-3.338.726-4.033-1.61-4.033-1.61-.546-1.387-1.333-1.756-1.333-1.756-1.089-.744.083-.729.083-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.834 2.809 1.304 3.495.997.108-.775.418-1.305.762-1.605-2.665-.304-5.466-1.332-5.466-5.93 0-1.31.468-2.38 1.235-3.22-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.3 1.23a11.52 11.52 0 013.003-.404c1.02.005 2.045.138 3.003.404 2.29-1.552 3.297-1.23 3.297-1.23.653 1.652.242 2.873.118 3.176.77.84 1.234 1.91 1.234 3.22 0 4.61-2.804 5.625-5.475 5.92.43.372.823 1.102.823 2.222v3.293c0 .319.218.694.825.576A12.005 12.005 0 0024 12c0-6.627-5.373-12-12-12z" />
                      </svg>
                    )}
                    {platform.name === "Website" && (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M12 2C6.486 2 2 6.486 2 12s4.486 10 10 10 10-4.486 10-10S17.514 2 12 2zm7.931 9h-2.764a14.67 14.67 0 0 0-.496-2.995c1.404.54 2.589 1.617 3.26 2.995zm-3.56-3.93c-.486-.731-1.084-1.346-1.773-1.799A8.04 8.04 0 0 1 16.37 7.07zm-9.481 3.93H4.069c.67-1.378 1.856-2.455 3.26-2.995A14.67 14.67 0 0 0 6.833 11zm5.881 8.834A8.034 8.034 0 0 1 4 12c0-.085.006-.168.009-.253h3.392a16.709 16.709 0 0 0 0 3.669c.246 1.461.648 2.781 1.183 3.905.249.525.527.99.83 1.417zM12 21a8.063 8.063 0 0 1-2.848-.516C8.549 18.7 8 16.366 8 14s.549-4.7 1.152-6.484A8.06 8.06 0 0 1 12 7c1.33 0 2.56.382 3.623 1.011.596 1.784 1.145 4.118 1.145 6.484s-.549 4.7-1.152 6.484A8.063 8.063 0 0 1 12 21zm0-5a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm6.891 1.409c.59-1.324.992-2.85 1.001-4.409h3.099c-.082 2.325-.962 4.439-2.371 6.021a11.59 11.59 0 0 1-1.729-1.612zM4.009 13h3.099c.01 1.559.411 3.085 1.001 4.409-.738.657-1.73 1.197-1.729 1.612-1.409-1.582-2.289-3.696-2.371-6.021zm14.83-6.743A8.025 8.025 0 0 1 20 12c0 .086-.006.168-.009.254h-3.392a16.709 16.709 0 0 0 0-3.669 15.095 15.095 0 0 0-1.183-3.905c-.249-.525-.527-.99-.83-1.417A7.981 7.981 0 0 1 18.839 6.257z" />
                      </svg>
                    )}
                  </span>
                  <span className="text-gray-600 group-hover:text-gray-900 transition-colors">
                    {platform.name}
                  </span>
                </motion.a>
              )
          )
        )}
      </div>
    </motion.div>
  );
};

export default SocialTab;