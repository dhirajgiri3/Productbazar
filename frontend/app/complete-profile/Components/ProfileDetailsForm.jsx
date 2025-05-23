"use client";

import React from "react";
import { FormStep } from "./FormStep";
import { FormField, TagInput } from "./ProfileFormComponents";

export const ProfileDetailsForm = ({
  isActive,
  formData,
  handleChange,
  formErrors,
  skillTags,
  interestTags,
  skillInput,
  setSkillInput,
  interestInput,
  setInterestInput,
  handleTagInput,
  removeTag,
  addPredefinedTag,
  predefinedOptions,
  currentStep,
}) => {
  return (
    <>
      {/* Step 3: Professional Information */}
      <FormStep title="Professional Information" isActive={isActive && currentStep === 3}>
        <div className="space-y-6">
          <p className="text-sm text-gray-500 italic">
            Add your professional details, skills and interests.
          </p>
          <FormField
            name="headline"
            label="Professional Headline"
            type="text"
            value={formData.headline}
            placeholder="e.g., CEO at X Company, Software Developer at Y"
            onChange={handleChange}
            error={formErrors.headline}
            maxLength={100}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              name="companyName"
              label="Company Name (Optional)"
              type="text"
              value={formData.companyName}
              placeholder="Company Name"
              onChange={handleChange}
              error={formErrors.companyName}
            />
            <FormField
              name="companyRole"
              label="Your Role (Optional)"
              type="text"
              value={formData.companyRole}
              placeholder="Your Role"
              onChange={handleChange}
              error={formErrors.companyRole}
            />
          </div>
          <TagInput
            type="skills"
            label="Skills"
            tags={skillTags}
            inputValue={skillInput}
            onInputChange={(e) => setSkillInput(e.target.value)}
            onInputKeyDown={(e) => handleTagInput(e, "skills")}
            onRemoveTag={removeTag}
            onAddPredefined={addPredefinedTag}
            predefinedOptions={predefinedOptions.skills}
            placeholder={skillTags.length === 0 ? "Add skills..." : "Add more skills..."}
          />
           <TagInput
            type="interests"
            label="Interests"
            tags={interestTags}
            inputValue={interestInput}
            onInputChange={(e) => setInterestInput(e.target.value)}
            onInputKeyDown={(e) => handleTagInput(e, "interests")}
            onRemoveTag={removeTag}
            onAddPredefined={addPredefinedTag}
            predefinedOptions={predefinedOptions.interests}
            placeholder={interestTags.length === 0 ? "Add interests..." : "Add more interests..."}
          />
          <FormField
            name="bio"
            label="Short Bio (Optional)"
            type="textarea"
            value={formData.bio}
            onChange={handleChange}
            error={formErrors.bio}
            placeholder="A brief intro about your professional background (max 500 chars)"
          />
        </div>
      </FormStep>

      {/* Step 4: Social Links */}
      <FormStep title="Social Links" isActive={isActive && currentStep === 4}>
        <div className="space-y-6">
          <p className="text-sm text-gray-500 italic">
            Connect your social profiles (optional).
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              name="socialLinks.linkedin"
              label="LinkedIn"
              type="url"
              value={formData.socialLinks?.linkedin}
              onChange={handleChange}
              error={formErrors["socialLinks.linkedin"]}
              placeholder="https://linkedin.com/in/..."
            />
            <FormField
              name="socialLinks.twitter"
              label="Twitter / X"
              type="url"
              value={formData.socialLinks?.twitter}
              onChange={handleChange}
              error={formErrors["socialLinks.twitter"]}
              placeholder="https://x.com/..."
            />
             <FormField
              name="socialLinks.github"
              label="GitHub"
              type="url"
              value={formData.socialLinks?.github}
              onChange={handleChange}
              error={formErrors["socialLinks.github"]}
              placeholder="https://github.com/..."
            />
            <FormField
              name="socialLinks.website"
              label="Personal Website / Portfolio"
              type="url"
              value={formData.socialLinks?.website}
              onChange={handleChange}
              error={formErrors["socialLinks.website"]}
              placeholder="https://yourwebsite.com"
            />
             <FormField
              name="socialLinks.facebook"
              label="Facebook (Optional)"
              type="url"
              value={formData.socialLinks?.facebook}
              onChange={handleChange}
              error={formErrors["socialLinks.facebook"]}
              placeholder="https://facebook.com/..."
            />
             <FormField
              name="socialLinks.instagram"
              label="Instagram (Optional)"
              type="url"
              value={formData.socialLinks?.instagram}
              onChange={handleChange}
              error={formErrors["socialLinks.instagram"]}
              placeholder="https://instagram.com/..."
            />
          </div>
        </div>
      </FormStep>
    </>
  );
};