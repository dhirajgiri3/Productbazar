"use client";

import React from 'react';
import { FiDollarSign, FiTarget, FiTrendingUp, FiGlobe, FiClock } from 'react-icons/fi';
import SelectableTagsField from '../SelectableTagsField';

// Common investment criteria for investors
const investmentStages = [
  "Pre-seed", "Seed", "Series A", "Series B", "Series C+", "Growth", "Mature"
];

const investmentIndustries = [
  "Technology", "Software", "SaaS", "Fintech", "Healthtech", "Edtech", "E-commerce",
  "Marketplace", "Consumer", "Enterprise", "AI/ML", "Blockchain", "Crypto", "Clean Energy",
  "Climate Tech", "Biotech", "Medtech", "Hardware", "IoT", "Robotics", "AR/VR",
  "Gaming", "Media", "Entertainment", "Food & Beverage", "Real Estate", "Transportation",
  "Logistics", "Manufacturing", "Retail", "B2B", "B2C", "D2C", "Mobile"
];

const investmentTechnologies = [
  "Artificial Intelligence", "Machine Learning", "Deep Learning", "Natural Language Processing",
  "Computer Vision", "Blockchain", "Cryptocurrency", "Web3", "Cloud Computing", "Edge Computing",
  "Big Data", "Data Analytics", "IoT", "5G", "Robotics", "Automation", "AR/VR", "3D Printing",
  "Quantum Computing", "Biotechnology", "Genomics", "CRISPR", "Clean Energy", "Battery Technology",
  "Solar", "Wind", "Fusion", "Cybersecurity", "Fintech", "Insurtech", "Regtech", "Proptech"
];

const investmentGeographies = [
  "North America", "United States", "Canada", "Europe", "United Kingdom", "Germany", "France",
  "Spain", "Italy", "Nordics", "Asia", "China", "Japan", "India", "Southeast Asia",
  "Australia", "New Zealand", "Middle East", "Africa", "Latin America", "Brazil", "Mexico",
  "Global", "English-speaking countries", "EU", "APAC", "EMEA", "LATAM"
];

const InvestorForm = ({ formData, handleChange, formErrors, FormField }) => {
  // Options for select fields
  const investorTypeOptions = [
    { value: "Angel Investor", label: "Angel Investor" },
    { value: "Venture Capitalist", label: "Venture Capitalist" },
    { value: "Corporate Investor", label: "Corporate Investor" },
    { value: "Individual", label: "Individual" },
    { value: "Family Office", label: "Family Office" },
    { value: "Seed Fund", label: "Seed Fund" },
    { value: "Accelerator", label: "Accelerator" }
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

  const marketSizeOptions = [
    { value: "Small", label: "Small" },
    { value: "Medium", label: "Medium" },
    { value: "Large", label: "Large" },
    { value: "Any", label: "Any" }
  ];

  const availabilityOptions = [
    { value: "Limited", label: "Limited" },
    { value: "Moderate", label: "Moderate" },
    { value: "Open", label: "Open" },
    { value: "By Referral Only", label: "By Referral Only" }
  ];

  const contactMethodOptions = [
    { value: "Email", label: "Email" },
    { value: "Phone", label: "Phone" },
    { value: "Introduction", label: "Introduction" },
    { value: "Platform", label: "Platform" },
    { value: "Other", label: "Other" }
  ];

  const stageOptions = [
    { value: "Pre-seed", label: "Pre-seed" },
    { value: "Seed", label: "Seed" },
    { value: "Series A", label: "Series A" },
    { value: "Series B", label: "Series B" },
    { value: "Series C+", label: "Series C+" },
    { value: "Growth", label: "Growth" },
    { value: "Mature", label: "Mature" }
  ];

  // Initialize nested objects if they don't exist
  const safeFormData = {
    ...formData,
    investmentRange: formData.investmentRange || {},
    investmentCriteria: formData.investmentCriteria || {},
    contactPreferences: formData.contactPreferences || {},
    location: formData.location || {}
  };

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
        <FormField
          label="Investor Type"
          name="investorType"
          type="select"
          value={safeFormData.investorType || 'Angel Investor'}
          onChange={handleChange}
          error={formErrors.investorType}
          options={investorTypeOptions}
          icon={FiDollarSign}
          description="The type of investor you are"
          required
        />

        <FormField
          label="Company Name"
          name="companyName"
          value={safeFormData.companyName || ''}
          onChange={handleChange}
          error={formErrors.companyName}
          icon={FiTrendingUp}
          placeholder="Your investment firm or 'Individual Investor'"
          description="Your investment firm name (if applicable)"
        />

        <FormField
          label="Industry Focus"
          name="industry"
          value={safeFormData.industry || ''}
          onChange={handleChange}
          error={formErrors.industry}
          icon={FiGlobe}
          placeholder="e.g., Technology, Healthcare"
          description="Your primary industry focus"
        />

        <FormField
          label="Website"
          name="website"
          type="url"
          value={safeFormData.website || ''}
          onChange={handleChange}
          error={formErrors.website}
          icon={FiGlobe}
          placeholder="https://yourwebsite.com"
          description="Your investment firm's website (if applicable)"
        />
      </div>

      <div className="mt-6">
        <h4 className="text-sm font-medium text-gray-700 mb-3 text-left">Investment Parameters</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
          <FormField
            label="Minimum Investment"
            name="investmentRange.min"
            type="number"
            value={safeFormData.investmentRange?.min || ''}
            onChange={handleChange}
            error={formErrors['investmentRange.min']}
            icon={FiDollarSign}
            placeholder="e.g., 10000"
            description="Minimum investment amount"
          />

          <FormField
            label="Maximum Investment"
            name="investmentRange.max"
            type="number"
            value={safeFormData.investmentRange?.max || ''}
            onChange={handleChange}
            error={formErrors['investmentRange.max']}
            icon={FiDollarSign}
            placeholder="e.g., 50000"
            description="Maximum investment amount"
          />

          <FormField
            label="Currency"
            name="investmentRange.currency"
            type="select"
            value={safeFormData.investmentRange?.currency || 'USD'}
            onChange={handleChange}
            error={formErrors['investmentRange.currency']}
            options={currencyOptions}
            icon={FiDollarSign}
            description="Currency for investment amounts"
          />

          <FormField
            label="Preferred Deal Size"
            name="investmentRange.preferredDealSize"
            type="number"
            value={safeFormData.investmentRange?.preferredDealSize || ''}
            onChange={handleChange}
            error={formErrors['investmentRange.preferredDealSize']}
            icon={FiDollarSign}
            placeholder="e.g., 25000"
            description="Your ideal investment amount"
          />
        </div>
      </div>

      <div className="mt-6">
        <h4 className="text-sm font-medium text-gray-700 mb-3 text-left">Investment Criteria</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
          <div className="mb-5">
            <div className="flex justify-between items-start mb-1">
              <label className="block text-sm font-medium text-left text-gray-700">Preferred Stages</label>
            </div>
            <p className="text-xs text-gray-500 mb-1.5 text-left">Investment stages you prefer</p>
            <SelectableTagsField
              name="preferredStages"
              value={safeFormData.preferredStages || []}
              onChange={handleChange}
              error={formErrors.preferredStages}
              icon={FiTrendingUp}
              placeholder="Add stage and press Enter"
              presetOptions={investmentStages}
              description="Select from common investment stages or add your own"
            />
          </div>

          <div className="mb-5">
            <div className="flex justify-between items-start mb-1">
              <label className="block text-sm font-medium text-left text-gray-700">Target Industries</label>
            </div>
            <p className="text-xs text-gray-500 mb-1.5 text-left">Industries you invest in</p>
            <SelectableTagsField
              name="investmentCriteria.industries"
              value={safeFormData.investmentCriteria?.industries || []}
              onChange={handleChange}
              error={formErrors['investmentCriteria.industries']}
              icon={FiTarget}
              placeholder="Add industry and press Enter"
              presetOptions={investmentIndustries}
              description="Select from common industries or add your own"
            />
          </div>

          <div className="mb-5">
            <div className="flex justify-between items-start mb-1">
              <label className="block text-sm font-medium text-left text-gray-700">Target Technologies</label>
            </div>
            <p className="text-xs text-gray-500 mb-1.5 text-left">Technologies you're interested in</p>
            <SelectableTagsField
              name="investmentCriteria.technologies"
              value={safeFormData.investmentCriteria?.technologies || []}
              onChange={handleChange}
              error={formErrors['investmentCriteria.technologies']}
              icon={FiTarget}
              placeholder="Add technology and press Enter"
              presetOptions={investmentTechnologies}
              description="Select from common technologies or add your own"
            />
          </div>

          <div className="mb-5">
            <div className="flex justify-between items-start mb-1">
              <label className="block text-sm font-medium text-left text-gray-700">Target Geographies</label>
            </div>
            <p className="text-xs text-gray-500 mb-1.5 text-left">Regions you invest in</p>
            <SelectableTagsField
              name="investmentCriteria.geographies"
              value={safeFormData.investmentCriteria?.geographies || []}
              onChange={handleChange}
              error={formErrors['investmentCriteria.geographies']}
              icon={FiGlobe}
              placeholder="Add geography and press Enter"
              presetOptions={investmentGeographies}
              description="Select from common regions or add your own"
            />
          </div>

          <FormField
            label="Market Size Preference"
            name="investmentCriteria.marketSize"
            type="select"
            value={safeFormData.investmentCriteria?.marketSize || 'Any'}
            onChange={handleChange}
            error={formErrors['investmentCriteria.marketSize']}
            options={marketSizeOptions}
            icon={FiTarget}
            description="Your preferred target market size"
          />
        </div>
      </div>

      <div className="mt-6">
        <h4 className="text-sm font-medium text-gray-700 mb-3 text-left">Investment Thesis</h4>
        <FormField
          label="Investment Thesis"
          name="investmentThesis"
          type="textarea"
          value={safeFormData.investmentThesis || ''}
          onChange={handleChange}
          error={formErrors.investmentThesis}
          icon={FiTarget}
          placeholder="Describe your investment philosophy, what you look for in startups, and your value-add as an investor..."
          description="Your investment philosophy and approach (max 2000 chars)"
          maxLength={2000}
        />
      </div>

      <div className="mt-6">
        <h4 className="text-sm font-medium text-gray-700 mb-3 text-left">Availability & Contact</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
          <FormField
            label="Availability"
            name="availability"
            type="select"
            value={safeFormData.availability || 'Moderate'}
            onChange={handleChange}
            error={formErrors.availability}
            options={availabilityOptions}
            icon={FiClock}
            description="Your availability for meetings with founders"
          />

          <FormField
            label="Preferred Contact Method"
            name="contactPreferences.method"
            type="select"
            value={safeFormData.contactPreferences?.method || 'Email'}
            onChange={handleChange}
            error={formErrors['contactPreferences.method']}
            options={contactMethodOptions}
            icon={FiClock}
            description="How founders should contact you"
          />

          <FormField
            label="Contact Notes"
            name="contactPreferences.notes"
            value={safeFormData.contactPreferences?.notes || ''}
            onChange={handleChange}
            error={formErrors['contactPreferences.notes']}
            icon={FiClock}
            placeholder="e.g., Prefer intro from mutual connection"
            description="Additional notes about contacting you"
          />
        </div>
      </div>
    </div>
  );
};

export default InvestorForm;
