"use client";

import React from 'react';
import { FiTrendingUp, FiDollarSign, FiUsers, FiGlobe, FiCalendar, FiInfo } from 'react-icons/fi';
import SelectableTagsField from '../SelectableTagsField';

// Common customer types and regions for startups
const customerTypes = [
  "B2B", "B2C", "B2B2C", "Enterprise", "SMBs", "Startups", "Freelancers", "Consumers",
  "Developers", "Designers", "Marketers", "Students", "Teachers", "Healthcare Professionals",
  "Financial Institutions", "Government", "Non-profits", "Retailers", "Manufacturers",
  "Service Providers", "Content Creators", "Influencers", "Remote Workers"
];

const targetRegions = [
  "North America", "United States", "Canada", "Europe", "United Kingdom", "Germany", "France",
  "Spain", "Italy", "Nordics", "Asia", "China", "Japan", "India", "Southeast Asia",
  "Australia", "New Zealand", "Middle East", "Africa", "Latin America", "Brazil", "Mexico",
  "Global", "English-speaking countries", "EU", "APAC", "EMEA", "LATAM"
];

const StartupOwnerForm = ({ formData, handleChange, formErrors, FormField }) => {
  // Options for select fields
  const fundingStageOptions = [
    { value: "Pre-seed", label: "Pre-seed" },
    { value: "Seed", label: "Seed" },
    { value: "Series A", label: "Series A" },
    { value: "Series B", label: "Series B" },
    { value: "Series C+", label: "Series C+" },
    { value: "Bootstrapped", label: "Bootstrapped" },
    { value: "Other", label: "Other" }
  ];

  const companySizeOptions = [
    { value: "1-10", label: "1-10 employees" },
    { value: "11-50", label: "11-50 employees" },
    { value: "51-200", label: "51-200 employees" },
    { value: "201-500", label: "201-500 employees" },
    { value: "501-1000", label: "501-1000 employees" },
    { value: "1000+", label: "1000+ employees" }
  ];

  const businessModelOptions = [
    { value: "SaaS", label: "SaaS" },
    { value: "Marketplace", label: "Marketplace" },
    { value: "E-commerce", label: "E-commerce" },
    { value: "Consumer", label: "Consumer" },
    { value: "Enterprise", label: "Enterprise" },
    { value: "Hardware", label: "Hardware" },
    { value: "Advertising", label: "Advertising" },
    { value: "Subscription", label: "Subscription" },
    { value: "Transactional", label: "Transactional" },
    { value: "Freemium", label: "Freemium" },
    { value: "Other", label: "Other" }
  ];

  // Initialize nested objects if they don't exist
  const safeFormData = {
    ...formData,
    funding: formData.funding || {},
    location: formData.location || {},
    metrics: formData.metrics || {},
    targetMarket: formData.targetMarket || {}
  };

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
        <FormField
          label="Company Name"
          name="companyName"
          value={safeFormData.companyName || ''}
          onChange={handleChange}
          error={formErrors.companyName}
          icon={FiTrendingUp}
          placeholder="Your startup name"
          description="The official name of your startup"
          required
        />

        <FormField
          label="Tagline"
          name="tagline"
          value={safeFormData.tagline || ''}
          onChange={handleChange}
          error={formErrors.tagline}
          icon={FiInfo}
          placeholder="A short, catchy tagline"
          description="A brief slogan that describes your startup (max 150 chars)"
          maxLength={150}
        />

        <FormField
          label="Industry"
          name="industry"
          value={safeFormData.industry || ''}
          onChange={handleChange}
          error={formErrors.industry}
          icon={FiGlobe}
          placeholder="e.g., Technology, Healthcare"
          description="The primary industry your startup operates in"
          required
        />

        <FormField
          label="Year Founded"
          name="yearFounded"
          type="number"
          value={safeFormData.yearFounded || ''}
          onChange={handleChange}
          error={formErrors.yearFounded}
          icon={FiCalendar}
          placeholder="e.g., 2023"
          description="The year your startup was founded"
        />

        <FormField
          label="Funding Stage"
          name="fundingStage"
          type="select"
          value={safeFormData.fundingStage || 'Pre-seed'}
          onChange={handleChange}
          error={formErrors.fundingStage}
          options={fundingStageOptions}
          icon={FiDollarSign}
          description="Your startup's current funding stage"
        />

        <FormField
          label="Company Size"
          name="companySize"
          type="select"
          value={safeFormData.companySize || '1-10'}
          onChange={handleChange}
          error={formErrors.companySize}
          options={companySizeOptions}
          icon={FiUsers}
          description="The number of employees at your startup"
        />

        <FormField
          label="Business Model"
          name="businessModel"
          type="select"
          value={safeFormData.businessModel || 'SaaS'}
          onChange={handleChange}
          error={formErrors.businessModel}
          options={businessModelOptions}
          icon={FiTrendingUp}
          description="Your startup's primary business model"
        />

        <FormField
          label="Website"
          name="website"
          type="url"
          value={safeFormData.website || ''}
          onChange={handleChange}
          error={formErrors.website}
          icon={FiGlobe}
          placeholder="https://yourstartup.com"
          description="Your startup's official website"
        />
      </div>

      <div className="mt-6">
        <FormField
          label="Company Description"
          name="description"
          type="textarea"
          value={safeFormData.description || ''}
          onChange={handleChange}
          error={formErrors.description}
          icon={FiInfo}
          placeholder="Describe your startup, its mission, vision, and what makes it unique..."
          description="A detailed description of your startup (max 2000 chars)"
          maxLength={2000}
        />
      </div>

      <div className="mt-6">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Funding Information</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
          <FormField
            label="Total Raised"
            name="funding.totalRaised.amount"
            type="number"
            value={safeFormData.funding?.totalRaised?.amount || ''}
            onChange={handleChange}
            error={formErrors['funding.totalRaised.amount']}
            icon={FiDollarSign}
            placeholder="e.g., 1000000"
            description="Total funding raised so far (in USD)"
          />

          <FormField
            label="Seeking Investment"
            name="funding.seeking"
            type="checkbox"
            value={safeFormData.funding?.seeking || false}
            onChange={handleChange}
            placeholder="Currently seeking investment"
            description="Check if you're actively looking for investors"
          />

          {safeFormData.funding?.seeking && (
            <FormField
              label="Seeking Amount"
              name="funding.seekingAmount.amount"
              type="number"
              value={safeFormData.funding?.seekingAmount?.amount || ''}
              onChange={handleChange}
              error={formErrors['funding.seekingAmount.amount']}
              icon={FiDollarSign}
              placeholder="e.g., 500000"
              description="Amount you're looking to raise (in USD)"
            />
          )}
        </div>
      </div>

      <div className="mt-6">
        <h4 className="text-sm font-medium text-gray-700 mb-3 text-left">Target Market</h4>
        <div className="grid grid-cols-1 gap-y-4">
          <div className="mb-5">
            <div className="flex justify-between items-start mb-1">
              <label className="block text-sm font-medium text-left text-gray-700">Customer Types</label>
            </div>
            <p className="text-xs text-gray-500 mb-1.5 text-left">Types of customers you target</p>
            <SelectableTagsField
              name="targetMarket.customerTypes"
              value={safeFormData.targetMarket?.customerTypes || []}
              onChange={handleChange}
              error={formErrors['targetMarket.customerTypes']}
              icon={FiUsers}
              placeholder="Add customer type and press Enter"
              presetOptions={customerTypes}
              description="Select from common customer types or add your own"
            />
          </div>

          <div className="mb-5">
            <div className="flex justify-between items-start mb-1">
              <label className="block text-sm font-medium text-left text-gray-700">Target Regions</label>
            </div>
            <p className="text-xs text-gray-500 mb-1.5 text-left">Geographic regions you target</p>
            <SelectableTagsField
              name="targetMarket.regions"
              value={safeFormData.targetMarket?.regions || []}
              onChange={handleChange}
              error={formErrors['targetMarket.regions']}
              icon={FiGlobe}
              placeholder="Add region and press Enter"
              presetOptions={targetRegions}
              description="Select from common regions or add your own"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default StartupOwnerForm;
