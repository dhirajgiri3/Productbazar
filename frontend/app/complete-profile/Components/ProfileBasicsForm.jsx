"use client";

import React from "react";
import { FormStep } from "./FormStep"; // Assuming FormStep is still needed
import { FormField } from "./ProfileFormComponents";
import ProfileImageUpload from "./ProfileImageUpload";

export const ProfileBasicsForm = ({
  isActive,
  formData,
  handleChange,
  formErrors,
  user,
  profileImagePreview,
  imageLoading,
  handleProfileImageChange,
  fileInputRef,
  currentStep,
}) => {
  return (
    <>
      {/* Step 1: Basic Information - Improved UI/UX */}
      <FormStep title="Basic Information" isActive={isActive && currentStep === 1}>
        <div className="space-y-8">
          <div className="bg-violet-50 rounded-lg p-4 border border-violet-100">
            <p className="text-sm text-violet-700 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Please provide your basic information to get started. This helps us personalize your experience.
            </p>
          </div>

          {/* Profile Image Section */}
          <div className="bg-white rounded-lg p-5 border border-gray-100 shadow-sm flex flex-col items-center">
            <h4 className="text-sm font-medium text-gray-800 mb-4 self-start flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Profile Picture
            </h4>
            <ProfileImageUpload
              ref={fileInputRef}
              profileImagePreview={profileImagePreview}
              imageLoading={imageLoading}
              handleProfileImageChange={handleProfileImageChange}
              disabled={false}
              user={user}
            />
          </div>

          {/* Contact Information Section */}
          <div className="bg-white rounded-lg p-5 border border-gray-100 shadow-sm">
            <h4 className="text-sm font-medium text-gray-800 mb-4 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
              </svg>
              Contact Information
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
              <FormField
                name="firstName"
                label="First Name"
                type="text"
                required
                value={formData.firstName}
                placeholder="First Name"
                onChange={handleChange}
                error={formErrors.firstName}
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>}
              />
              <FormField
                name="lastName"
                label="Last Name"
                type="text"
                required
                value={formData.lastName}
                placeholder="Last Name"
                onChange={handleChange}
                error={formErrors.lastName}
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="relative">
                <FormField
                  name="email"
                  label="Email"
                  type="email"
                  required={!formData.phone}
                  value={formData.email}
                  onChange={handleChange}
                  error={formErrors.email}
                  placeholder={user?.isEmailVerified ? "" : "your@email.com"}
                  disabled={user?.isEmailVerified}
                  icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>}
                />
                {user?.isEmailVerified && (
                  <div className="absolute top-0 right-0 mt-1 mr-2 flex items-center text-green-600 text-xs pointer-events-none bg-green-50 px-2 py-0.5 rounded-full border border-green-100">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Verified
                  </div>
                )}
              </div>

              <div className="relative">
                <FormField
                  name="phone"
                  label="Phone"
                  type="tel"
                  required={!formData.email}
                  value={formData.phone}
                  onChange={handleChange}
                  error={formErrors.phone}
                  placeholder={user?.isPhoneVerified ? "" : "e.g., +12025550123"}
                  disabled={user?.isPhoneVerified}
                  icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>}
                />
                {user?.isPhoneVerified && (
                  <div className="absolute top-0 right-0 mt-1 mr-2 flex items-center text-green-600 text-xs pointer-events-none bg-green-50 px-2 py-0.5 rounded-full border border-green-100">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Verified
                  </div>
                )}
              </div>
            </div>

            {formErrors.contact && (
              <div className="mt-3 bg-red-50 p-2 rounded-md border border-red-100">
                <p className="text-red-600 text-xs flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  {formErrors.contact}
                </p>
              </div>
            )}
          </div>
        </div>
      </FormStep>

      {/* Step 2: Personal Information - Improved UI/UX */}
      <FormStep title="Personal Information" isActive={isActive && currentStep === 2}>
        <div className="space-y-8">
          <div className="bg-violet-50 rounded-lg p-4 border border-violet-100">
            <p className="text-sm text-violet-700 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Personalize your experience with these details. This information helps us tailor your experience.
            </p>
          </div>

          {/* Personal Details Section */}
          <div className="bg-white rounded-lg p-5 border border-gray-100 shadow-sm">
            <h4 className="text-sm font-medium text-gray-800 mb-4 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Personal Details
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <FormField
                name="gender"
                label="Gender"
                type="select"
                value={formData.gender}
                onChange={handleChange}
                error={formErrors.gender}
                options={[
                  { value: "", label: "Select..." },
                  { value: "male", label: "Male" },
                  { value: "female", label: "Female" },
                  { value: "other", label: "Other" },
                  { value: "prefer_not_to_say", label: "Prefer not to say" },
                ]}
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>}
              />
              <FormField
                name="birthDate"
                label="Birth Date"
                type="date"
                value={formData.birthDate}
                onChange={handleChange}
                error={formErrors.birthDate}
                placeholder="YYYY-MM-DD"
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>}
              />
            </div>
          </div>

          {/* Location Section */}
          <div className="bg-white rounded-lg p-5 border border-gray-100 shadow-sm">
            <h4 className="text-sm font-medium text-gray-800 mb-4 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Location
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <FormField
                name="address.country"
                label="Country"
                type="text"
                value={formData.address?.country}
                placeholder="Country"
                onChange={handleChange}
                error={formErrors["address.country"]}
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>}
              />
              <FormField
                name="address.city"
                label="City"
                type="text"
                value={formData.address?.city}
                placeholder="City"
                onChange={handleChange}
                error={formErrors["address.city"]}
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>}
              />
            </div>
            <div className="mt-4">
              <FormField
                name="address.street"
                label="Street Address (Optional)"
                type="text"
                value={formData.address?.street}
                placeholder="Street Address"
                onChange={handleChange}
                error={formErrors["address.street"]}
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                </svg>}
              />
            </div>
          </div>

          {/* About Section */}
          <div className="bg-white rounded-lg p-5 border border-gray-100 shadow-sm">
            <h4 className="text-sm font-medium text-gray-800 mb-4 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
              </svg>
              About You
            </h4>
            <FormField
              name="about"
              label="Tell us about yourself (Optional)"
              type="textarea"
              value={formData.about}
              onChange={handleChange}
              error={formErrors.about}
              placeholder="Share a brief introduction about yourself, your interests, or anything you'd like others to know..."
              icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h7" />
              </svg>}
            />
          </div>
        </div>
      </FormStep>
    </>
  );
};