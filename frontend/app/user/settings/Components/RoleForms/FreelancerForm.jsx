"use client";

import React from 'react';
import { FiBriefcase, FiDollarSign, FiClock, FiTag, FiAward, FiGlobe } from 'react-icons/fi';
import SelectableTagsField from '../SelectableTagsField';

// Common skills and specializations for freelancers
const freelancerSkills = [
  "JavaScript", "React", "Node.js", "Python", "Java", "PHP", "Ruby", "Swift",
  "HTML/CSS", "UI/UX Design", "Graphic Design", "Content Writing", "SEO", "Digital Marketing",
  "WordPress", "Shopify", "Mobile Development", "Web Development", "Data Analysis",
  "Video Editing", "Animation", "3D Modeling", "Voice Over", "Translation",
  "Copywriting", "Technical Writing", "Virtual Assistant", "Customer Service",
  "Social Media Management", "Email Marketing", "Project Management", "Consulting"
];

const freelancerSpecializations = [
  "Frontend Development", "Backend Development", "Full Stack Development", "Mobile App Development",
  "E-commerce Development", "CMS Development", "UI Design", "UX Design", "Brand Identity",
  "Logo Design", "Illustration", "Motion Graphics", "Content Strategy", "Blog Writing",
  "Technical Documentation", "Market Research", "Data Visualization", "Business Analysis",
  "Financial Analysis", "Legal Consulting", "HR Consulting", "IT Support", "DevOps",
  "Cloud Architecture", "Database Administration", "Network Security", "Quality Assurance"
];

const preferredIndustries = [
  "Technology", "E-commerce", "Healthcare", "Education", "Finance", "Real Estate",
  "Travel", "Food & Beverage", "Entertainment", "Media", "Non-profit", "Manufacturing",
  "Retail", "Automotive", "Energy", "Agriculture", "Construction", "Logistics",
  "Telecommunications", "Pharmaceuticals", "Consulting", "Legal", "Government"
];

const FreelancerForm = ({ formData, handleChange, formErrors, FormField }) => {
  // Options for select fields
  const experienceLevelOptions = [
    { value: "Beginner", label: "Beginner" },
    { value: "Intermediate", label: "Intermediate" },
    { value: "Advanced", label: "Advanced" },
    { value: "Expert", label: "Expert" }
  ];

  const availabilityOptions = [
    { value: "Full-time", label: "Full-time" },
    { value: "Part-time", label: "Part-time" },
    { value: "Weekends", label: "Weekends" },
    { value: "Flexible", label: "Flexible" }
  ];

  const projectSizeOptions = [
    { value: "Small", label: "Small" },
    { value: "Medium", label: "Medium" },
    { value: "Large", label: "Large" },
    { value: "Enterprise", label: "Enterprise" },
    { value: "Any", label: "Any" }
  ];

  const currencyOptions = [
    { value: "USD", label: "USD ($)" },
    { value: "EUR", label: "EUR (€)" },
    { value: "GBP", label: "GBP (£)" },
    { value: "INR", label: "INR (₹)" },
    { value: "CAD", label: "CAD ($)" },
    { value: "AUD", label: "AUD ($)" },
    { value: "JPY", label: "JPY (¥)" },
    { value: "CNY", label: "CNY (¥)" }
  ];

  // Initialize nested objects if they don't exist
  const safeFormData = {
    ...formData,
    hourlyRate: formData.hourlyRate || {},
    fixedProjectRate: formData.fixedProjectRate || {},
    workPreferences: formData.workPreferences || {}
  };

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
        <div className="mb-5">
          <div className="flex justify-between items-start mb-1">
            <label className="block text-sm font-medium text-left text-gray-700">Skills</label>
          </div>
          <p className="text-xs text-gray-500 mb-1.5 text-left">Your primary skills</p>
          <SelectableTagsField
            name="skills"
            value={safeFormData.skills || []}
            onChange={handleChange}
            error={formErrors.skills}
            placeholder="Add skill and press Enter"
            icon={FiTag}
            presetOptions={freelancerSkills}
            description="Select from common skills or add your own"
          />
        </div>

        <div className="mb-5">
          <div className="flex justify-between items-start mb-1">
            <label className="block text-sm font-medium text-left text-gray-700">Specializations</label>
          </div>
          <p className="text-xs text-gray-500 mb-1.5 text-left">Your specific areas of expertise</p>
          <SelectableTagsField
            name="specializations"
            value={safeFormData.specializations || []}
            onChange={handleChange}
            error={formErrors.specializations}
            placeholder="Add specialization and press Enter"
            icon={FiTag}
            presetOptions={freelancerSpecializations}
            description="Select from common specializations or add your own"
          />
        </div>

        <FormField
          label="Experience Level"
          name="experience"
          type="select"
          value={safeFormData.experience || 'Intermediate'}
          onChange={handleChange}
          error={formErrors.experience}
          options={experienceLevelOptions}
          icon={FiAward}
          description="Your overall experience level"
        />

        <FormField
          label="Years of Experience"
          name="yearsOfExperience"
          type="number"
          value={safeFormData.yearsOfExperience || ''}
          onChange={handleChange}
          error={formErrors.yearsOfExperience}
          icon={FiClock}
          placeholder="e.g., 5"
          description="Number of years of professional experience"
        />
      </div>

      <div className="mt-6">
        <h4 className="text-sm font-medium text-gray-700 mb-3 text-left">Rates & Availability</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
          <FormField
            label="Hourly Rate"
            name="hourlyRate.amount"
            type="number"
            value={safeFormData.hourlyRate?.amount || ''}
            onChange={handleChange}
            error={formErrors['hourlyRate.amount']}
            icon={FiDollarSign}
            placeholder="e.g., 50"
            description="Your hourly rate"
          />

          <FormField
            label="Hourly Rate Currency"
            name="hourlyRate.currency"
            type="select"
            value={safeFormData.hourlyRate?.currency || 'USD'}
            onChange={handleChange}
            error={formErrors['hourlyRate.currency']}
            options={currencyOptions}
            icon={FiDollarSign}
            description="Currency for your hourly rate"
          />

          <FormField
            label="Minimum Project Rate"
            name="fixedProjectRate.minimum"
            type="number"
            value={safeFormData.fixedProjectRate?.minimum || ''}
            onChange={handleChange}
            error={formErrors['fixedProjectRate.minimum']}
            icon={FiDollarSign}
            placeholder="e.g., 500"
            description="Your minimum rate for fixed-price projects"
          />

          <FormField
            label="Project Rate Currency"
            name="fixedProjectRate.currency"
            type="select"
            value={safeFormData.fixedProjectRate?.currency || 'USD'}
            onChange={handleChange}
            error={formErrors['fixedProjectRate.currency']}
            options={currencyOptions}
            icon={FiDollarSign}
            description="Currency for your project rate"
          />

          <FormField
            label="Availability"
            name="availability"
            type="select"
            value={safeFormData.availability || 'Flexible'}
            onChange={handleChange}
            error={formErrors.availability}
            options={availabilityOptions}
            icon={FiClock}
            description="Your current availability for work"
          />

          <FormField
            label="Hours Per Week"
            name="workPreferences.availableHoursPerWeek"
            type="number"
            value={safeFormData.workPreferences?.availableHoursPerWeek || ''}
            onChange={handleChange}
            error={formErrors['workPreferences.availableHoursPerWeek']}
            icon={FiClock}
            placeholder="e.g., 40"
            description="Hours available per week"
          />
        </div>
      </div>

      <div className="mt-6">
        <h4 className="text-sm font-medium text-gray-700 mb-3 text-left">Work Preferences</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
          <FormField
            label=""
            name="workPreferences.remoteOnly"
            type="checkbox"
            value={safeFormData.workPreferences?.remoteOnly || false}
            onChange={handleChange}
            placeholder="Remote work only"
            description="Check if you only accept remote work"
          />

          <FormField
            label="Preferred Project Size"
            name="workPreferences.projectSize"
            type="select"
            value={safeFormData.workPreferences?.projectSize || 'Any'}
            onChange={handleChange}
            error={formErrors['workPreferences.projectSize']}
            options={projectSizeOptions}
            icon={FiBriefcase}
            description="Your preferred project size"
          />

          <FormField
            label="Preferred Client Types"
            name="workPreferences.preferredClients"
            type="tags"
            value={safeFormData.workPreferences?.preferredClients || []}
            onChange={handleChange}
            error={formErrors['workPreferences.preferredClients']}
            icon={FiBriefcase}
            placeholder="Add client type and press Enter"
            description="Types of clients you prefer to work with"
          />

          <div className="mb-5">
            <div className="flex justify-between items-start mb-1">
              <label className="block text-sm font-medium text-left text-gray-700">Preferred Industries</label>
            </div>
            <p className="text-xs text-gray-500 mb-1.5 text-left">Industries you prefer to work in</p>
            <SelectableTagsField
              name="workPreferences.preferredIndustries"
              value={safeFormData.workPreferences?.preferredIndustries || []}
              onChange={handleChange}
              error={formErrors['workPreferences.preferredIndustries']}
              icon={FiGlobe}
              placeholder="Add industry and press Enter"
              presetOptions={preferredIndustries}
              description="Select from common industries or add your own"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default FreelancerForm;
