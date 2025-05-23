"use client";

import React from 'react';
import { FiUsers, FiBriefcase, FiGlobe, FiTag, FiAward } from 'react-icons/fi';
import SelectableTagsField from '../SelectableTagsField';

// Common service categories for agencies
const serviceCategories = [
  "Web Development", "Mobile Development", "UI/UX Design", "Graphic Design", "Digital Marketing",
  "SEO", "Content Marketing", "Social Media Marketing", "Email Marketing", "PPC Advertising",
  "Branding", "Logo Design", "Video Production", "Animation", "Photography",
  "Copywriting", "Content Creation", "Software Development", "App Development", "E-commerce Development",
  "CMS Development", "Consulting", "Strategy", "Business Analysis", "Market Research",
  "Data Analysis", "IT Support", "Cloud Services", "Cybersecurity", "DevOps"
];

const AgencyForm = ({ formData, handleChange, formErrors, FormField }) => {
  // Options for select fields
  const companySizeOptions = [
    { value: "1-10", label: "1-10 employees" },
    { value: "11-50", label: "11-50 employees" },
    { value: "51-200", label: "51-200 employees" },
    { value: "201-500", label: "201-500 employees" },
    { value: "501+", label: "501+ employees" }
  ];

  const expertiseLevelOptions = [
    { value: "Beginner", label: "Beginner" },
    { value: "Intermediate", label: "Intermediate" },
    { value: "Advanced", label: "Advanced" },
    { value: "Expert", label: "Expert" }
  ];

  // Initialize services array if it doesn't exist
  const safeFormData = {
    ...formData,
    services: formData.services || [],
    location: formData.location || {}
  };

  // Handle adding a new service
  const handleAddService = () => {
    const newServices = [...safeFormData.services, {
      name: '',
      category: '',
      description: '',
      expertise: 'Advanced'
    }];

    handleChange({
      target: {
        name: 'services',
        value: newServices
      }
    });
  };

  // Handle removing a service
  const handleRemoveService = (index) => {
    const newServices = [...safeFormData.services];
    newServices.splice(index, 1);

    handleChange({
      target: {
        name: 'services',
        value: newServices
      }
    });
  };

  // Handle service field change
  const handleServiceChange = (index, field, value) => {
    const newServices = [...safeFormData.services];
    newServices[index][field] = value;

    handleChange({
      target: {
        name: 'services',
        value: newServices
      }
    });
  };

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
        <FormField
          label="Agency Name"
          name="companyName"
          value={safeFormData.companyName || ''}
          onChange={handleChange}
          error={formErrors.companyName}
          icon={FiBriefcase}
          placeholder="Your agency name"
          description="The official name of your agency"
          required
        />

        <FormField
          label="Industry"
          name="industry"
          value={safeFormData.industry || ''}
          onChange={handleChange}
          error={formErrors.industry}
          icon={FiGlobe}
          placeholder="e.g., Digital Marketing, Software Development"
          description="The primary industry your agency operates in"
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
          description="The number of employees at your agency"
        />

        <FormField
          label="Website"
          name="website"
          type="url"
          value={safeFormData.website || ''}
          onChange={handleChange}
          error={formErrors.website}
          icon={FiGlobe}
          placeholder="https://youragency.com"
          description="Your agency's official website"
        />
      </div>

      <div className="mt-6">
        <h4 className="text-sm font-medium text-gray-700 mb-3 text-left">Location</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
          <FormField
            label="Country"
            name="location.country"
            value={safeFormData.location?.country || ''}
            onChange={handleChange}
            error={formErrors['location.country']}
            icon={FiGlobe}
            placeholder="e.g., United States"
            description="Country where your agency is based"
          />

          <FormField
            label="City"
            name="location.city"
            value={safeFormData.location?.city || ''}
            onChange={handleChange}
            error={formErrors['location.city']}
            icon={FiGlobe}
            placeholder="e.g., New York"
            description="City where your agency is based"
          />

          <FormField
            label="Region"
            name="location.region"
            value={safeFormData.location?.region || ''}
            onChange={handleChange}
            error={formErrors['location.region']}
            icon={FiGlobe}
            placeholder="e.g., North America"
            description="Region where your agency operates"
          />
        </div>
      </div>

      <div className="mt-6">
        <div className="flex justify-between items-center mb-3">
          <h4 className="text-sm font-medium text-gray-700 text-left">Services Offered</h4>
          <button
            type="button"
            onClick={handleAddService}
            className="px-3 py-1 text-xs bg-violet-50 text-violet-700 rounded-md hover:bg-violet-100 transition-colors flex items-center"
          >
            <span className="mr-1">+</span> Add Service
          </button>
        </div>

        {safeFormData.services.length === 0 ? (
          <div className="text-center py-4 bg-gray-50 rounded-md text-gray-500 text-sm">
            No services added yet. Click "Add Service" to get started.
          </div>
        ) : (
          <div className="space-y-4">
            {safeFormData.services.map((service, index) => (
              <div key={index} className="p-4 border border-gray-200 rounded-md bg-gray-50">
                <div className="flex justify-between items-center mb-3">
                  <h5 className="text-sm font-medium text-gray-700">Service #{index + 1}</h5>
                  <button
                    type="button"
                    onClick={() => handleRemoveService(index)}
                    className="text-red-500 hover:text-red-700 text-xs"
                  >
                    Remove
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3">
                  <div className="md:col-span-2">
                    <FormField
                      label="Service Name"
                      name={`services[${index}].name`}
                      value={service.name || ''}
                      onChange={(e) => handleServiceChange(index, 'name', e.target.value)}
                      error={formErrors[`services[${index}].name`]}
                      icon={FiTag}
                      placeholder="e.g., Web Development"
                      description="Name of the service you offer"
                    />
                  </div>

                  <div className="mb-5">
                    <div className="flex justify-between items-start mb-1">
                      <label className="block text-sm font-medium text-left text-gray-700">Category</label>
                    </div>
                    <p className="text-xs text-gray-500 mb-1.5 text-left">Category this service belongs to</p>
                    <SelectableTagsField
                      name={`services[${index}].category`}
                      value={service.category ? [service.category] : []}
                      onChange={(e) => {
                        const newValue = e.target.value;
                        handleServiceChange(index, 'category', newValue.length > 0 ? newValue[0] : '');
                      }}
                      error={formErrors[`services[${index}].category`]}
                      icon={FiTag}
                      placeholder="Select or enter a category"
                      presetOptions={serviceCategories}
                      description="Select from common categories or add your own"
                    />
                  </div>

                  <FormField
                    label="Expertise Level"
                    name={`services[${index}].expertise`}
                    type="select"
                    value={service.expertise || 'Advanced'}
                    onChange={(e) => handleServiceChange(index, 'expertise', e.target.value)}
                    error={formErrors[`services[${index}].expertise`]}
                    options={expertiseLevelOptions}
                    icon={FiAward}
                    description="Your level of expertise in this service"
                  />

                  <div className="md:col-span-2">
                    <FormField
                      label="Description"
                      name={`services[${index}].description`}
                      type="textarea"
                      value={service.description || ''}
                      onChange={(e) => handleServiceChange(index, 'description', e.target.value)}
                      error={formErrors[`services[${index}].description`]}
                      icon={FiTag}
                      placeholder="Describe this service in detail..."
                      description="Detailed description of the service (max 500 chars)"
                      maxLength={500}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AgencyForm;
