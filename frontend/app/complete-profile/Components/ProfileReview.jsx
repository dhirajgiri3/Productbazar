"use client";

import React from "react";
import { motion } from "framer-motion";
import { FormStep } from "./FormStep";

// Helper to format values nicely
const formatValue = (value) => {
  if (value === null || value === undefined || value === '') return <span className="text-gray-400 italic">Not provided</span>;
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (Array.isArray(value)) {
    if (value.length === 0) return <span className="text-gray-400 italic">None specified</span>;
     // Handle arrays of objects trying common properties
    if (value.length > 0 && typeof value[0] === 'object') {
      return value.map(item => item?.name || item?.title || item?.label || JSON.stringify(item)).join(', ');
    }
    return value.join(', ');
  }
  if (typeof value === 'object') {
     // Specific object formatting
    if (value.city && value.country) return `${value.city}, ${value.country}`;
    if (value.amount && value.currency) return `${value.amount.toLocaleString()} ${value.currency} ${value.period || ''}`.trim();
    if (value.min || value.max) return `${value.min?.toLocaleString() || '0'} - ${value.max?.toLocaleString() || 'Unlimited'}`;
    // Generic object formatting (fallback)
    return Object.entries(value).filter(([k,v]) => v && !['_id', 'id'].includes(k)).map(([k,v]) => `${k}: ${v}`).join(', ');
  }
  if (typeof value === 'string' && (value.startsWith('http') || value.startsWith('www'))) {
      return <a href={value.startsWith('http') ? value : `https://${value}`} target="_blank" rel="noopener noreferrer" className="text-violet-600 hover:underline break-all">{value}</a>;
  }
  // Add date formatting if needed:
  // if (value instanceof Date) return value.toLocaleDateString();
  // if (typeof value === 'string' && !isNaN(Date.parse(value)) && value.includes('-') && value.length >= 10) {
  //     try { return new Date(value).toLocaleDateString(); } catch { /* ignore */ }
  // }
  return String(value);
};

// Helper to format keys
const formatKey = (key) => key
  .replace(/([A-Z])/g, " $1")
  .replace(/_/g, " ")
  .replace(/^./, (str) => str.toUpperCase());

// Group related fields for better display
const reviewSections = (formData, user, skillTags, interestTags) => {
    const sections = [
        {
            title: "Basic Information",
            icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>,
            fields: {
                "Full Name": `${formData.firstName || ''} ${formData.lastName || ''}`.trim(),
                "Email": formData.email,
                "Phone": formData.phone,
                "Gender": formData.gender,
                "Birth Date": formData.birthDate, // Consider formatting
                "Address": formData.address, // Formatted by formatValue
            }
        },
        {
            title: "Professional Summary",
            icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>,
            fields: {
                "Headline": formData.headline,
                "Company Name": formData.companyName,
                "Role": formData.companyRole,
                "Bio": formData.bio,
                "About": formData.about,
                "Skills": skillTags,
                "Interests": interestTags.map(tag => typeof tag === 'object' ? tag.name : tag), // Extract names if objects
            }
        },

    ];

    // Add Role Specific Section
     if (user.role && user.role !== 'user' && formData.roleDetails?.[user.role]) {
        const roleDetails = formData.roleDetails[user.role];
        // Filter out empty/complex fields we handle elsewhere (like skills/location for some roles)
        const roleFields = Object.entries(roleDetails)
            .filter(([key, value]) => {
                if (key === 'skills' || key === 'location' || key === 'socialLinks' || key === 'portfolio' || key === 'previousInvestments') return false; // Already shown or complex
                if (value === null || value === undefined) return false;
                if (typeof value === 'object' && Object.keys(value).length === 0) return false;
                if (Array.isArray(value) && value.length === 0) return false;
                return true;
            })
            .reduce((acc, [key, value]) => {
                acc[formatKey(key)] = value;
                return acc;
            }, {});

         if(Object.keys(roleFields).length > 0) {
             sections.push({
                title: `${formatKey(user.role)} Details`,
                icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>,
                fields: roleFields
            });
         }
    }

     // Add Social Links Section
     const socialLinks = Object.entries(formData.socialLinks || {})
        .filter(([key, value]) => value)
        .reduce((acc, [key, value]) => {
            acc[formatKey(key)] = value;
            return acc;
        }, {});

    if (Object.keys(socialLinks).length > 0) {
        sections.push({
            title: "Social Links",
            icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>,
            fields: socialLinks
        });
    }

    return sections;
};

export const ProfileReview = ({
  isActive,
  formData,
  user,
  profileImagePreview,
  skillTags,
  interestTags,
}) => {

    const sections = reviewSections(formData, user, skillTags, interestTags);

    return (
        <FormStep title="Review & Submit" isActive={isActive}>
            <div className="space-y-8">
                {/* Intro Box */}
                <motion.div className="p-6 bg-gradient-to-r from-violet-50 to-indigo-50 rounded-lg border border-violet-100 shadow-sm overflow-hidden relative" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} whileHover={{ boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                    <div className="absolute top-0 right-0 w-24 h-24 bg-violet-200 rounded-full opacity-20 -mr-8 -mt-8"></div>
                    <div className="absolute bottom-0 left-0 w-16 h-16 bg-indigo-200 rounded-full opacity-20 -ml-6 -mb-6"></div>
                    <div className="flex items-start relative z-10">
                        <div className="flex-shrink-0 bg-violet-100 rounded-full p-3 mr-4 shadow-sm">
                           <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                        </div>
                        <div>
                            <h4 className="text-base font-medium text-violet-800 mb-2">Almost there! Review your profile</h4>
                            <p className="text-sm text-violet-700 leading-relaxed">Please check your information below. Use the 'Back' button if you need to make changes.</p>
                             <div className="mt-3 flex items-center text-xs text-violet-600">
                                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"></path></svg>
                                <span>Click "Complete Profile" when ready.</span>
                            </div>
                        </div>
                    </div>
                </motion.div>

                 {/* Profile Image & Name */}
                 <motion.div className="p-6 bg-white rounded-lg border border-gray-200 shadow-sm" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }} whileHover={{ boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                     <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
                         <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100 border-2 border-violet-200 flex-shrink-0 shadow-md">
                           {profileImagePreview ? (
                             <img src={profileImagePreview} alt="Profile" className="w-full h-full object-cover" />
                           ) : (
                               <div className="w-full h-full flex items-center justify-center bg-violet-50 text-violet-300">
                                   <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                               </div>
                           )}
                         </div>
                         <div className="text-center sm:text-left">
                             <h3 className="text-xl font-semibold text-gray-800 mb-1">{formData.firstName} {formData.lastName}</h3>
                             {formData.headline && (
                               <p className="text-sm text-gray-600 mb-2">{formData.headline}</p>
                             )}
                             <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-violet-100 text-violet-800">
                                {user?.role ? formatKey(user.role) : 'User'}
                             </span>
                         </div>
                     </div>
                 </motion.div>

                 {/* Details Sections */}
                 {sections.map((section, index) => (
                    <motion.div
                        key={section.title}
                        className="p-5 bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.2 + index * 0.1 }}
                        whileHover={{ boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                    >
                         <div className="flex items-center mb-4">
                            <div className="h-8 w-8 rounded-md bg-gray-100 flex items-center justify-center mr-3">
                                {section.icon}
                            </div>
                            <h4 className="text-base font-medium text-gray-800">{section.title}</h4>
                        </div>
                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-sm">
                            {Object.entries(section.fields)
                                .filter(([key, value]) => value || typeof value === 'boolean') // Show false booleans, hide empty strings/null/undefined
                                .map(([key, value]) => (
                                    <div key={key}>
                                        <div className="text-xs text-gray-500 mb-1">{formatKey(key)}</div>
                                        <div className="font-medium text-gray-700 break-words whitespace-pre-line">{formatValue(value)}</div>
                                    </div>
                            ))}
                         </div>
                    </motion.div>
                 ))}
            </div>
        </FormStep>
    );
};