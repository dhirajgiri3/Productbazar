"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiSave, FiCheck, FiShield, FiEye, FiEyeOff, FiGlobe, FiLock } from 'react-icons/fi';
import { makePriorityRequest } from "@/lib/api/api";
import { toast } from 'react-hot-toast';

const PrivacySettings = ({ user }) => {
  const [settings, setSettings] = useState({
    profileVisibility: user?.privacySettings?.profileVisibility || 'public',
    activityVisibility: user?.privacySettings?.activityVisibility || 'followers',
    showEmail: user?.privacySettings?.showEmail || false,
    showPhone: user?.privacySettings?.showPhone || false,
    allowTagging: user?.privacySettings?.allowTagging || true,
    allowMentions: user?.privacySettings?.allowMentions || true,
    allowMessaging: user?.privacySettings?.allowMessaging || 'everyone',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSuccessMessage('');

    try {
      await makePriorityRequest('put', '/auth/privacy-settings', {
        privacySettings: settings
      });

      setSuccessMessage('Privacy settings updated successfully');
      toast.success('Privacy settings updated');

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (error) {
      console.error('Error updating privacy settings:', error);
      toast.error(error.response?.data?.message || 'Failed to update privacy settings');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Privacy Settings</h2>
        <span className="px-2 py-1 bg-violet-100 text-violet-800 text-xs font-medium rounded-full">Coming Soon</span>
      </div>

      {successMessage && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 p-3 bg-green-50 text-green-700 rounded-lg flex items-center"
        >
          <FiCheck className="mr-2" />
          {successMessage}
        </motion.div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          {/* Profile Visibility */}
          <div>
            <div className="flex items-center mb-3">
              <FiEye className="text-violet-600 mr-2" />
              <h3 className="text-md font-medium text-gray-700">Profile Visibility</h3>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-3">
                Control who can see your profile information
              </p>

              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="profileVisibility"
                    value="public"
                    checked={settings.profileVisibility === 'public'}
                    onChange={handleChange}
                    className="h-4 w-4 text-violet-600 focus:ring-violet-500 border-gray-300"
                  />
                  <div className="ml-3">
                    <span className="text-sm font-medium text-gray-700">Public</span>
                    <p className="text-xs text-gray-500">Anyone can view your profile</p>
                  </div>
                </label>

                <label className="flex items-center">
                  <input
                    type="radio"
                    name="profileVisibility"
                    value="followers"
                    checked={settings.profileVisibility === 'followers'}
                    onChange={handleChange}
                    className="h-4 w-4 text-violet-600 focus:ring-violet-500 border-gray-300"
                  />
                  <div className="ml-3">
                    <span className="text-sm font-medium text-gray-700">Followers Only</span>
                    <p className="text-xs text-gray-500">Only people who follow you can view your profile</p>
                  </div>
                </label>

                <label className="flex items-center">
                  <input
                    type="radio"
                    name="profileVisibility"
                    value="private"
                    checked={settings.profileVisibility === 'private'}
                    onChange={handleChange}
                    className="h-4 w-4 text-violet-600 focus:ring-violet-500 border-gray-300"
                  />
                  <div className="ml-3">
                    <span className="text-sm font-medium text-gray-700">Private</span>
                    <p className="text-xs text-gray-500">Only you can view your profile</p>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Activity Visibility */}
          <div>
            <div className="flex items-center mb-3">
              <FiGlobe className="text-violet-600 mr-2" />
              <h3 className="text-md font-medium text-gray-700">Activity Visibility</h3>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-3">
                Control who can see your activity (upvotes, comments, etc.)
              </p>

              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="activityVisibility"
                    value="public"
                    checked={settings.activityVisibility === 'public'}
                    onChange={handleChange}
                    className="h-4 w-4 text-violet-600 focus:ring-violet-500 border-gray-300"
                  />
                  <div className="ml-3">
                    <span className="text-sm font-medium text-gray-700">Public</span>
                    <p className="text-xs text-gray-500">Anyone can see your activity</p>
                  </div>
                </label>

                <label className="flex items-center">
                  <input
                    type="radio"
                    name="activityVisibility"
                    value="followers"
                    checked={settings.activityVisibility === 'followers'}
                    onChange={handleChange}
                    className="h-4 w-4 text-violet-600 focus:ring-violet-500 border-gray-300"
                  />
                  <div className="ml-3">
                    <span className="text-sm font-medium text-gray-700">Followers Only</span>
                    <p className="text-xs text-gray-500">Only people who follow you can see your activity</p>
                  </div>
                </label>

                <label className="flex items-center">
                  <input
                    type="radio"
                    name="activityVisibility"
                    value="private"
                    checked={settings.activityVisibility === 'private'}
                    onChange={handleChange}
                    className="h-4 w-4 text-violet-600 focus:ring-violet-500 border-gray-300"
                  />
                  <div className="ml-3">
                    <span className="text-sm font-medium text-gray-700">Private</span>
                    <p className="text-xs text-gray-500">Only you can see your activity</p>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div>
            <div className="flex items-center mb-3">
              <FiLock className="text-violet-600 mr-2" />
              <h3 className="text-md font-medium text-gray-700">Contact Information</h3>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-3">
                Control who can see your contact information
              </p>

              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="showEmail"
                    checked={settings.showEmail}
                    onChange={handleChange}
                    className="h-4 w-4 text-violet-600 focus:ring-violet-500 border-gray-300 rounded"
                  />
                  <span className="ml-3 text-sm text-gray-700">
                    Show my email address on my profile
                  </span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="showPhone"
                    checked={settings.showPhone}
                    onChange={handleChange}
                    className="h-4 w-4 text-violet-600 focus:ring-violet-500 border-gray-300 rounded"
                  />
                  <span className="ml-3 text-sm text-gray-700">
                    Show my phone number on my profile
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Interactions */}
          <div>
            <div className="flex items-center mb-3">
              <FiShield className="text-violet-600 mr-2" />
              <h3 className="text-md font-medium text-gray-700">Interactions</h3>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-3">
                Control how others can interact with you
              </p>

              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="allowTagging"
                    checked={settings.allowTagging}
                    onChange={handleChange}
                    className="h-4 w-4 text-violet-600 focus:ring-violet-500 border-gray-300 rounded"
                  />
                  <span className="ml-3 text-sm text-gray-700">
                    Allow others to tag me in posts
                  </span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="allowMentions"
                    checked={settings.allowMentions}
                    onChange={handleChange}
                    className="h-4 w-4 text-violet-600 focus:ring-violet-500 border-gray-300 rounded"
                  />
                  <span className="ml-3 text-sm text-gray-700">
                    Allow others to mention me in comments
                  </span>
                </label>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Who can send you messages
                  </label>

                  <select
                    name="allowMessaging"
                    value={settings.allowMessaging}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-violet-500"
                  >
                    <option value="everyone">Everyone</option>
                    <option value="followers">Followers Only</option>
                    <option value="nobody">Nobody</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="mt-8 flex justify-end">
          <motion.button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 bg-violet-600 text-white rounded-md hover:bg-violet-700 transition-colors flex items-center"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {isSubmitting ? (
              <span>Saving...</span>
            ) : (
              <>
                <FiSave className="mr-2" />
                Save Settings
              </>
            )}
          </motion.button>
        </div>
      </form>
    </div>
  );
};

export default PrivacySettings;
