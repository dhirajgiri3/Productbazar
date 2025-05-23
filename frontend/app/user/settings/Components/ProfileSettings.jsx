"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSave, FiCheck, FiX, FiCamera, FiUser, FiMail, FiPhone, FiBriefcase, FiMapPin, FiLink, FiGlobe, FiLinkedin, FiTwitter, FiGithub, FiTag, FiHeart, FiMessageSquare, FiInfo, FiAlertCircle, FiSettings } from 'react-icons/fi';
import { useAuth } from "@/lib/contexts/auth-context";
import { makePriorityRequest } from "@/lib/api/api";
import Image from 'next/image';
import { toast } from 'react-hot-toast';
import clsx from 'clsx';
import RoleDetailsSection from './RoleDetailsSection';
import RoleSelector from './RoleSelector';
import SelectableTagsField from './SelectableTagsField';

// Form Section Component
const FormSection = ({ title, icon: Icon, children }) => {
  return (
    <motion.div
      className="bg-white rounded-lg p-6 border border-gray-100 shadow-sm mb-6"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center mb-4">
        <div className="w-8 h-8 rounded-full bg-violet-50 flex items-center justify-center mr-3">
          <Icon className="w-4 h-4 text-violet-600" />
        </div>
        <h3 className="text-lg font-medium text-gray-800">{title}</h3>
      </div>
      <div className="pl-11">
        {children}
      </div>
    </motion.div>
  );
};

// Form Field Component
const FormField = ({
  label,
  name,
  type = "text",
  value,
  onChange,
  error,
  placeholder = "",
  icon: Icon,
  required = false,
  description = "",
  maxLength,
  options = [],
  disabled = false
}) => {
  return (
    <div className="mb-5">
      <div className="flex justify-between items-start mb-1">
        <label htmlFor={name} className={clsx("block text-sm font-medium text-left", error ? "text-red-600" : "text-gray-700")}>
          {label} {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
        {maxLength && (
          <span className={clsx("text-xs",
            value.length > (maxLength * 0.8) ?
              value.length > maxLength ? "text-red-500" : "text-amber-500"
              : "text-gray-400"
          )}>
            {value.length}/{maxLength}
          </span>
        )}
      </div>

      {description && (
        <p className="text-xs text-gray-500 mb-1.5 text-left">{description}</p>
      )}

      <div className="relative">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Icon className="w-4 h-4 text-gray-400" />
          </div>
        )}

        {type === "textarea" ? (
          <textarea
            id={name}
            name={name}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            maxLength={maxLength}
            disabled={disabled}
            className={clsx(
              "w-full py-2.5 px-3 rounded-md border bg-white focus:outline-none transition-all duration-200 text-sm shadow-sm text-left",
              Icon && "pl-10",
              disabled ? "bg-gray-50 text-gray-500 cursor-not-allowed" : "",
              error
                ? "border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100"
                : "border-gray-200 focus:border-violet-300 focus:ring-2 focus:ring-violet-100 hover:border-gray-300"
            )}
            rows="4"
          />
        ) : type === "checkbox" ? (
          <div className="flex items-start">
            <input
              type="checkbox"
              id={name}
              name={name}
              checked={value}
              onChange={onChange}
              disabled={disabled}
              className={clsx(
                "h-4 w-4 text-violet-600 focus:ring-violet-500 border-gray-300 rounded mt-0.5",
                disabled ? "opacity-60 cursor-not-allowed" : ""
              )}
            />
            <label htmlFor={name} className={clsx("ml-2 block text-sm text-left", disabled ? "text-gray-500" : "text-gray-700")}>
              {placeholder}
            </label>
          </div>
        ) : type === "select" ? (
          <select
            id={name}
            name={name}
            value={value}
            onChange={onChange}
            disabled={disabled}
            className={clsx(
              "w-full py-2.5 px-3 rounded-md border bg-white focus:outline-none transition-all duration-200 text-sm shadow-sm appearance-none text-left",
              Icon && "pl-10",
              disabled ? "bg-gray-50 text-gray-500 cursor-not-allowed" : "",
              error
                ? "border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100"
                : "border-gray-200 focus:border-violet-300 focus:ring-2 focus:ring-violet-100 hover:border-gray-300"
            )}
          >
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        ) : type === "tags" ? (
          <SelectableTagsField
            label=""
            name={name}
            value={value}
            onChange={onChange}
            error={error}
            icon={Icon}
            placeholder={placeholder}
            disabled={disabled}
            presetOptions={name === 'skills' ? commonSkills : name === 'interests' ? commonInterests : []}
          />
        ) : (
          <input
            type={type}
            id={name}
            name={name}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            maxLength={maxLength}
            disabled={disabled}
            className={clsx(
              "w-full py-2.5 px-3 rounded-md border bg-white focus:outline-none transition-all duration-200 text-sm shadow-sm text-left",
              Icon && "pl-10",
              disabled ? "bg-gray-50 text-gray-500 cursor-not-allowed" : "",
              error
                ? "border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100"
                : "border-gray-200 focus:border-violet-300 focus:ring-2 focus:ring-violet-100 hover:border-gray-300"
            )}
          />
        )}
      </div>

      {error && (
        <div className="mt-1.5 flex items-start text-sm text-red-600">
          <FiAlertCircle className="mr-1.5 mt-0.5 flex-shrink-0" size={14} />
          <p className="text-left">{error}</p>
        </div>
      )}
    </div>
  );
};

// Common skills and interests for presets
const commonSkills = [
  "JavaScript", "React", "Node.js", "Python", "Java", "C++", "C#", "PHP", "Ruby", "Swift",
  "Kotlin", "Go", "Rust", "TypeScript", "HTML", "CSS", "SQL", "MongoDB", "Firebase", "AWS",
  "Azure", "Google Cloud", "Docker", "Kubernetes", "DevOps", "UI/UX Design", "Graphic Design",
  "Product Management", "Project Management", "Digital Marketing", "SEO", "Content Writing",
  "Data Analysis", "Machine Learning", "AI", "Blockchain", "Mobile Development", "Game Development",
  "Quality Assurance", "Testing", "Cybersecurity", "Network Administration", "System Administration",
  "Database Administration", "Business Analysis", "Scrum", "Agile", "Leadership", "Communication",
  "Problem Solving", "Critical Thinking", "Teamwork", "Time Management", "Adaptability"
];

const commonInterests = [
  "Technology", "Programming", "Web Development", "Mobile Apps", "AI", "Machine Learning",
  "Data Science", "Blockchain", "Cryptocurrency", "Startups", "Entrepreneurship", "Innovation",
  "Design", "UX/UI", "Digital Marketing", "E-commerce", "SaaS", "Cloud Computing", "IoT",
  "Cybersecurity", "Fintech", "Healthtech", "Edtech", "Gaming", "AR/VR", "Robotics",
  "Sustainability", "Clean Energy", "Climate Tech", "Space Technology", "Biotechnology",
  "Remote Work", "Future of Work", "Digital Nomad", "Personal Development", "Productivity",
  "Leadership", "Business Strategy", "Investing", "Venture Capital", "Open Source",
  "Community Building", "Social Impact", "Diversity & Inclusion", "Ethics in Tech"
];

const ProfileSettings = ({ user }) => {
  const { refreshUserData } = useAuth();
  // Transform interests from array of objects to array of strings for the form
  const transformInterests = (interests) => {
    if (!interests || !Array.isArray(interests)) return [];
    return interests.map(interest => {
      return typeof interest === 'object' ? interest.name : interest;
    });
  };

  // Transform interests from array of strings to array of objects for the API
  const transformInterestsForApi = (interests) => {
    if (!interests || !Array.isArray(interests)) return [];
    return interests.map(interest => {
      return typeof interest === 'object' ? interest : { name: interest, strength: 5 };
    });
  };

  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    bio: user?.bio || '',
    headline: user?.headline || '',
    about: user?.about || '',
    preferredContact: user?.preferredContact || '',
    skills: user?.skills || [],
    interests: transformInterests(user?.interests),
    gender: user?.gender || '',
    address: {
      street: user?.address?.street || '',
      city: user?.address?.city || '',
      country: user?.address?.country || ''
    },
    openToWork: user?.openToWork || false,
    companyName: user?.companyName || '',
    companyRole: user?.companyRole || '',
    companyWebsite: user?.companyWebsite || '',
    companySize: user?.companySize || '1-10',
    industry: user?.industry || '',
    fundingStage: user?.fundingStage || 'Pre-seed',
    socialLinks: {
      website: user?.socialLinks?.website || '',
      linkedin: user?.socialLinks?.linkedin || '',
      twitter: user?.socialLinks?.twitter || '',
      github: user?.socialLinks?.github || ''
    }
  });

  // Options for select fields
  const genderOptions = [
    { value: "", label: "Select Gender" },
    { value: "male", label: "Male" },
    { value: "female", label: "Female" },
    { value: "other", label: "Other" }
  ];

  const companySizeOptions = [
    { value: "1-10", label: "1-10 employees" },
    { value: "11-50", label: "11-50 employees" },
    { value: "51-200", label: "51-200 employees" },
    { value: "201-500", label: "201-500 employees" },
    { value: "501-1000", label: "501-1000 employees" },
    { value: "1000+", label: "1000+ employees" }
  ];

  const fundingStageOptions = [
    { value: "Pre-seed", label: "Pre-seed" },
    { value: "Seed", label: "Seed" },
    { value: "Series A", label: "Series A" },
    { value: "Series B", label: "Series B" },
    { value: "Series C+", label: "Series C+" },
    { value: "Bootstrapped", label: "Bootstrapped" },
    { value: "Other", label: "Other" }
  ];

  const [profileImage, setProfileImage] = useState(null);
  const [profileImagePreview, setProfileImagePreview] = useState(user?.profilePicture?.url || null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: type === 'checkbox' ? checked : value
        }
      }));
    } else {
      // Handle arrays (skills, interests) and other fields
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked :
                Array.isArray(prev[name]) && Array.isArray(value) ? value :
                value
      }));
    }

    // Clear errors for the field that was just changed
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = {...prev};
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfileImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Required fields
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';

    // Email validation
    if (formData.email) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = 'Please enter a valid email address';
      }
    } else {
      // Either email or phone is required
      if (!formData.phone) {
        newErrors.email = 'Either email or phone is required';
        newErrors.phone = 'Either email or phone is required';
      }
    }

    // Phone validation
    if (formData.phone) {
      if (!/^\+?[0-9]{10,15}$/.test(formData.phone.replace(/\s/g, ''))) {
        newErrors.phone = 'Please enter a valid phone number with country code';
      }
    } else {
      // Already checked above in email validation
    }

    // URL validations
    const urlFields = [
      { path: 'companyWebsite', label: 'Company website' },
      { path: 'socialLinks.website', label: 'Personal website' },
      { path: 'socialLinks.linkedin', label: 'LinkedIn URL' },
      { path: 'socialLinks.twitter', label: 'Twitter URL' },
      { path: 'socialLinks.github', label: 'GitHub URL' }
    ];

    const urlRegex = /^(https?:\/\/)?([\w\d-]+\.)+[\w-]+([\/\w\d-._~:?#[\]@!$&'()*+,;=]*)?$/;

    urlFields.forEach(({ path, label }) => {
      const value = path.includes('.')
        ? formData[path.split('.')[0]][path.split('.')[1]]
        : formData[path];

      if (value && !urlRegex.test(value)) {
        if (path.includes('.')) {
          newErrors[path] = `Please enter a valid ${label}`;
        } else {
          newErrors[path] = `Please enter a valid ${label}`;
        }
      }
    });

    // Headline length validation
    if (formData.headline && formData.headline.length > 100) {
      newErrors.headline = 'Headline must be 100 characters or less';
    }

    // Bio length validation
    if (formData.bio && formData.bio.length > 500) {
      newErrors.bio = 'Bio must be 500 characters or less';
    }

    // About length validation
    if (formData.about && formData.about.length > 2000) {
      newErrors.about = 'About section must be 2000 characters or less';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);
    setSuccessMessage('');

    try {
      // Prepare form data for API
      const formDataForApi = { ...formData };

      // Transform interests from array of strings to array of objects for the API
      formDataForApi.interests = transformInterestsForApi(formData.interests);

      // First update profile data
      const profileResponse = await makePriorityRequest('put', '/auth/profile', formDataForApi);

      // Then upload profile image if changed
      if (profileImage) {
        const imageFormData = new FormData();
        imageFormData.append('profileImage', profileImage);

        await makePriorityRequest('post', '/auth/update-profile', imageFormData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
      }

      // Refresh user data in context
      await refreshUserData();

      // Dispatch profile updated event
      window.dispatchEvent(new CustomEvent('profile:updated', {
        detail: { user: profileResponse.data.data.user }
      }));

      // Show success message with animation
      setSuccessMessage('Profile updated successfully');

      // Only show toast if there's no success message displayed in the UI
      if (!successMessage) {
        toast.success('Profile updated successfully');
      }

      // Clear success message after 5 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 5000);
    } catch (error) {
      console.error('Error updating profile:', error);

      // Handle validation errors
      if (error.response?.data?.errors) {
        const newErrors = error.response.data.errors;
        setErrors(newErrors);

        // Scroll to the first error
        const firstErrorField = Object.keys(newErrors)[0];
        const element = document.getElementById(firstErrorField);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          element.focus();
        }
      } else {
        toast.error(error.response?.data?.message || 'Failed to update profile');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header with decorative elements */}
      <motion.div
        className="relative mb-8 pb-4 border-b border-gray-100"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-violet-50 rounded-full opacity-20 -mr-16 -mt-16 z-0"></div>
        <div className="relative z-10">
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">Profile Settings</h2>
          <p className="text-gray-500 text-sm">Update your personal information and how others see you on ProductBazar</p>
        </div>
      </motion.div>

      {/* Role Selector */}
      <RoleSelector user={user} refreshUserData={refreshUserData} />

      {/* Success Message */}
      <AnimatePresence>
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-6 p-4 bg-green-50 text-green-700 rounded-lg flex items-center border border-green-100 shadow-sm"
          >
            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center mr-3">
              <FiCheck className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <p className="font-medium">{successMessage}</p>
              <p className="text-sm text-green-600 opacity-80">Your profile has been updated successfully.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit}>
        {/* Profile Image Section */}
        <FormSection title="Profile Picture" icon={FiUser}>
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="relative">
              <div className="w-28 h-28 rounded-full overflow-hidden bg-gray-100 border-4 border-white shadow-md">
                {profileImagePreview ? (
                  <Image
                    src={profileImagePreview}
                    alt="Profile"
                    width={112}
                    height={112}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-400">
                    <FiUser size={36} />
                  </div>
                )}
              </div>
              <motion.label
                htmlFor="profile-image"
                className="absolute bottom-0 right-0 bg-violet-600 text-white p-2 rounded-full cursor-pointer hover:bg-violet-700 transition-colors shadow-md"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <FiCamera size={16} />
              </motion.label>
              <input
                type="file"
                id="profile-image"
                accept="image/*"
                className="hidden"
                onChange={handleImageChange}
              />
            </div>
            <div className="text-center sm:text-left">
              <h4 className="text-sm font-medium text-gray-800 mb-1">Profile Photo</h4>
              <p className="text-xs text-gray-500 mb-3 max-w-xs">Upload a clear photo to help others recognize you. A professional headshot works best.</p>
              <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                <motion.label
                  htmlFor="profile-image"
                  className="px-3 py-1.5 text-xs font-medium text-violet-700 bg-violet-50 rounded-md cursor-pointer hover:bg-violet-100 transition-colors border border-violet-100 flex items-center"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <FiCamera className="mr-1.5" size={12} />
                  Upload New Photo
                </motion.label>
              </div>
            </div>
          </div>
        </FormSection>

        {/* Basic Information Section */}
        <FormSection title="Basic Information" icon={FiUser}>
          <div className="bg-violet-50 rounded-lg p-4 border border-violet-100 mb-6">
            <p className="text-sm text-violet-700 flex items-center">
              <FiInfo className="mr-2 flex-shrink-0" />
              Your basic information helps others identify you on ProductBazar. First name and last name are required, and you must provide either an email or phone number.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            <FormField
              label="First Name"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              error={errors.firstName}
              icon={FiUser}
              required
              placeholder="Your first name"
              description="Your first name as you'd like it to appear on your profile"
            />
            <FormField
              label="Last Name"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              error={errors.lastName}
              icon={FiUser}
              required
              placeholder="Your last name"
              description="Your last name as you'd like it to appear on your profile"
            />
            <FormField
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              error={errors.email}
              icon={FiMail}
              required
              placeholder="your.email@example.com"
              description={user?.isEmailVerified ? "Your email is verified" : "This email will be used for account notifications"}
            />
            <FormField
              label="Phone Number"
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleChange}
              error={errors.phone}
              placeholder="+1234567890"
              icon={FiPhone}
              description={user?.isPhoneVerified ? "Your phone number is verified" : "Include country code (e.g., +1 for US)"}
            />
            <FormField
              label="Gender"
              name="gender"
              type="select"
              value={formData.gender}
              onChange={handleChange}
              error={errors.gender}
              options={genderOptions}
              icon={FiUser}
              description="This information is optional and private"
            />
            <FormField
              label="Preferred Contact Method"
              name="preferredContact"
              value={formData.preferredContact}
              onChange={handleChange}
              error={errors.preferredContact}
              icon={FiMessageSquare}
              placeholder="e.g., Email, LinkedIn, Phone"
              description="How would you prefer others to contact you?"
            />
          </div>
        </FormSection>

        {/* Professional Information Section */}
        <FormSection title="Professional Profile" icon={FiBriefcase}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            <div className="md:col-span-2">
              <FormField
                label="Professional Headline"
                name="headline"
                value={formData.headline}
                onChange={handleChange}
                error={errors.headline}
                placeholder="e.g., Senior Developer at Tech Co."
                icon={FiBriefcase}
                description="A short professional headline that appears under your name"
                maxLength={100}
              />
            </div>
            <div className="md:col-span-2">
              <FormField
                label="Bio"
                name="bio"
                type="textarea"
                value={formData.bio}
                onChange={handleChange}
                error={errors.bio}
                placeholder="Tell others about yourself, your expertise, and what you're passionate about..."
                icon={FiUser}
                description="A brief bio that appears on your profile (max 500 characters)"
                maxLength={500}
              />
            </div>
            <div className="md:col-span-2">
              <FormField
                label="About"
                name="about"
                type="textarea"
                value={formData.about}
                onChange={handleChange}
                error={errors.about}
                placeholder="Share more detailed information about your background, experience, and interests..."
                icon={FiInfo}
                description="A more detailed description about yourself (max 2000 characters)"
                maxLength={2000}
              />
            </div>
            <div className="md:col-span-2">
              <div className="mb-5">
                <div className="flex justify-between items-start mb-1">
                  <label className="block text-sm font-medium text-left text-gray-700">Skills</label>
                </div>
                <p className="text-xs text-gray-500 mb-1.5 text-left">Add skills that showcase your expertise</p>
                <SelectableTagsField
                  name="skills"
                  value={formData.skills}
                  onChange={handleChange}
                  error={errors.skills}
                  placeholder="Add a skill and press Enter"
                  icon={FiTag}
                  presetOptions={commonSkills}
                  description="Select from common skills or add your own"
                />
              </div>
            </div>
            <div className="md:col-span-2">
              <div className="mb-5">
                <div className="flex justify-between items-start mb-1">
                  <label className="block text-sm font-medium text-left text-gray-700">Interests</label>
                </div>
                <p className="text-xs text-gray-500 mb-1.5 text-left">Add topics you're interested in</p>
                <SelectableTagsField
                  name="interests"
                  value={formData.interests}
                  onChange={handleChange}
                  error={errors.interests}
                  placeholder="Add an interest and press Enter"
                  icon={FiHeart}
                  presetOptions={commonInterests}
                  description="Select from common interests or add your own"
                />
              </div>
            </div>
            <div className="md:col-span-2 mt-2">
              <FormField
                label=""
                name="openToWork"
                type="checkbox"
                value={formData.openToWork}
                onChange={handleChange}
                placeholder="I am open to work opportunities"
                description="When enabled, this will be visible on your profile"
              />
            </div>
          </div>
        </FormSection>

        {/* Company Information Section */}
        <FormSection title="Company Information" icon={FiBriefcase}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            <FormField
              label="Company Name"
              name="companyName"
              value={formData.companyName}
              onChange={handleChange}
              error={errors.companyName}
              icon={FiBriefcase}
              placeholder="Your company or organization name"
              description="The name of your current company or organization"
            />
            <FormField
              label="Job Title"
              name="companyRole"
              value={formData.companyRole}
              onChange={handleChange}
              error={errors.companyRole}
              icon={FiBriefcase}
              placeholder="Your job title or role"
              description="Your current position or role at the company"
            />
            <FormField
              label="Industry"
              name="industry"
              value={formData.industry}
              onChange={handleChange}
              error={errors.industry}
              icon={FiBriefcase}
              placeholder="e.g., Technology, Healthcare, Finance"
              description="The industry your company operates in"
            />
            <FormField
              label="Company Size"
              name="companySize"
              type="select"
              value={formData.companySize}
              onChange={handleChange}
              error={errors.companySize}
              options={companySizeOptions}
              icon={FiBriefcase}
              description="The approximate size of your company"
            />
            <div className="md:col-span-2">
              <FormField
                label="Company Website"
                name="companyWebsite"
                type="url"
                value={formData.companyWebsite}
                onChange={handleChange}
                error={errors.companyWebsite}
                icon={FiGlobe}
                placeholder="https://example.com"
                description="The official website of your company"
              />
            </div>
            {user?.role === "startupOwner" && (
              <FormField
                label="Funding Stage"
                name="fundingStage"
                type="select"
                value={formData.fundingStage}
                onChange={handleChange}
                error={errors.fundingStage}
                options={fundingStageOptions}
                icon={FiBriefcase}
                description="The current funding stage of your startup"
              />
            )}
          </div>
        </FormSection>

        {/* Location Section */}
        <FormSection title="Location" icon={FiMapPin}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            <FormField
              label="Country"
              name="address.country"
              value={formData.address.country}
              onChange={handleChange}
              error={errors["address.country"]}
              icon={FiMapPin}
              placeholder="Your country"
              description="The country where you're currently based"
            />
            <FormField
              label="City"
              name="address.city"
              value={formData.address.city}
              onChange={handleChange}
              error={errors["address.city"]}
              icon={FiMapPin}
              placeholder="Your city"
              description="The city where you're currently based"
            />
            <div className="md:col-span-2">
              <FormField
                label="Street Address"
                name="address.street"
                value={formData.address.street}
                onChange={handleChange}
                error={errors["address.street"]}
                icon={FiMapPin}
                placeholder="Your street address (optional)"
                description="This information is private and won't be shown publicly"
              />
            </div>
          </div>
        </FormSection>

        {/* Social Links Section */}
        <FormSection title="Social Links" icon={FiLink}>
          <div className="bg-violet-50 rounded-lg p-4 border border-violet-100 mb-6">
            <p className="text-sm text-violet-700 flex items-center">
              <FiInfo className="mr-2 flex-shrink-0" />
              Connect your professional profiles to enhance your ProductBazar presence. These links will be visible on your public profile.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            <FormField
              label="Personal Website"
              name="socialLinks.website"
              type="url"
              value={formData.socialLinks.website}
              onChange={handleChange}
              error={errors["socialLinks.website"]}
              icon={FiGlobe}
              placeholder="https://yourwebsite.com"
              description="Your personal website or portfolio"
            />
            <FormField
              label="LinkedIn"
              name="socialLinks.linkedin"
              type="url"
              value={formData.socialLinks.linkedin}
              onChange={handleChange}
              error={errors["socialLinks.linkedin"]}
              icon={FiLinkedin}
              placeholder="https://linkedin.com/in/username"
              description="Your LinkedIn profile URL"
            />
            <FormField
              label="Twitter"
              name="socialLinks.twitter"
              type="url"
              value={formData.socialLinks.twitter}
              onChange={handleChange}
              error={errors["socialLinks.twitter"]}
              icon={FiTwitter}
              placeholder="https://twitter.com/username"
              description="Your Twitter profile URL"
            />
            <FormField
              label="GitHub"
              name="socialLinks.github"
              type="url"
              value={formData.socialLinks.github}
              onChange={handleChange}
              error={errors["socialLinks.github"]}
              icon={FiGithub}
              placeholder="https://github.com/username"
              description="Your GitHub profile URL"
            />
          </div>
        </FormSection>

        {/* Role-Specific Details Section */}
        {user?.role && user.role !== 'user' && user.role !== 'admin' && (
          <RoleDetailsSection
            user={user}
            FormSection={FormSection}
            FormField={FormField}
          />
        )}

        {/* Submit Button */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-gray-100 pt-6">
          <div className="text-sm text-gray-500 flex items-center">
            <FiInfo className="mr-2 text-violet-500" />
            All changes will be saved to your profile immediately
          </div>

          <motion.button
            type="submit"
            disabled={isSubmitting}
            className={clsx(
              "px-6 py-3 rounded-lg text-white text-sm font-medium flex items-center shadow-sm",
              isSubmitting
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-violet-600 hover:bg-violet-700 transition-colors"
            )}
            whileHover={isSubmitting ? {} : { scale: 1.02, y: -1 }}
            whileTap={isSubmitting ? {} : { scale: 0.98 }}
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin mr-2"></div>
                <span>Saving Profile...</span>
              </>
            ) : (
              <>
                <FiSave className="mr-2" />
                Save Profile
              </>
            )}
          </motion.button>
        </div>
      </form>
    </div>
  );
};

export default ProfileSettings;
