"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { FiSave, FiCheck, FiBell, FiMail, FiSmartphone } from "react-icons/fi";
import { makePriorityRequest } from "@/lib/api/api";
import { toast } from "react-hot-toast";

const NotificationSettings = ({ user }) => {
  const [settings, setSettings] = useState({
    emailNotifications: {
      productUpdates:
        user?.notificationPreferences?.emailNotifications?.productUpdates ??
        true,
      newFollowers:
        user?.notificationPreferences?.emailNotifications?.newFollowers ?? true,
      comments:
        user?.notificationPreferences?.emailNotifications?.comments ?? true,
      mentions:
        user?.notificationPreferences?.emailNotifications?.mentions ?? true,
      upvotes:
        user?.notificationPreferences?.emailNotifications?.upvotes ?? true,
      newsletter:
        user?.notificationPreferences?.emailNotifications?.newsletter ?? true,
    },
    pushNotifications: {
      productUpdates:
        user?.notificationPreferences?.pushNotifications?.productUpdates ??
        true,
      newFollowers:
        user?.notificationPreferences?.pushNotifications?.newFollowers ?? true,
      comments:
        user?.notificationPreferences?.pushNotifications?.comments ?? true,
      mentions:
        user?.notificationPreferences?.pushNotifications?.mentions ?? true,
      upvotes:
        user?.notificationPreferences?.pushNotifications?.upvotes ?? true,
    },
    smsNotifications: {
      securityAlerts:
        user?.notificationPreferences?.smsNotifications?.securityAlerts ?? true,
      accountUpdates:
        user?.notificationPreferences?.smsNotifications?.accountUpdates ??
        false,
    },
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const handleToggle = (category, setting) => {
    setSettings((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [setting]: !prev[category][setting],
      },
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSuccessMessage("");

    try {
      await makePriorityRequest("put", "/auth/notification-preferences", {
        notificationPreferences: settings,
      });

      setSuccessMessage("Notification preferences updated successfully");
      toast.success("Notification preferences updated");

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage("");
      }, 3000);
    } catch (error) {
      console.error("Error updating notification preferences:", error);
      toast.error(
        error.response?.data?.message ||
          "Failed to update notification preferences"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const NotificationToggle = ({ category, setting, label, icon }) => (
    <div className="flex items-center justify-between py-3 border-b border-gray-100">
      <div className="flex items-center">
        {icon}
        <span className="ml-3 text-gray-700">{label}</span>
      </div>
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          className="sr-only peer"
          checked={settings[category][setting]}
          onChange={() => handleToggle(category, setting)}
        />
        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-violet-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-violet-600"></div>
      </label>
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-800">
          Notification Settings
        </h2>
        <span className="px-2 py-1 bg-violet-100 text-violet-800 text-xs font-medium rounded-full">
          Coming Soon
        </span>
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
        <div className="space-y-8">
          {/* Email Notifications */}
          <div>
            <div className="flex items-center mb-4">
              <FiMail className="text-violet-600 mr-2" />
              <h3 className="text-md font-medium text-gray-700">
                Email Notifications
              </h3>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <NotificationToggle
                category="emailNotifications"
                setting="productUpdates"
                label="Product updates and announcements"
                icon={<FiBell size={18} className="text-gray-500" />}
              />

              <NotificationToggle
                category="emailNotifications"
                setting="newFollowers"
                label="New followers"
                icon={<FiBell size={18} className="text-gray-500" />}
              />

              <NotificationToggle
                category="emailNotifications"
                setting="comments"
                label="Comments on your products"
                icon={<FiBell size={18} className="text-gray-500" />}
              />

              <NotificationToggle
                category="emailNotifications"
                setting="mentions"
                label="Mentions and tags"
                icon={<FiBell size={18} className="text-gray-500" />}
              />

              <NotificationToggle
                category="emailNotifications"
                setting="upvotes"
                label="Upvotes on your products"
                icon={<FiBell size={18} className="text-gray-500" />}
              />

              <NotificationToggle
                category="emailNotifications"
                setting="newsletter"
                label="Weekly newsletter"
                icon={<FiBell size={18} className="text-gray-500" />}
              />
            </div>
          </div>

          {/* Push Notifications */}
          <div>
            <div className="flex items-center mb-4">
              <FiBell className="text-violet-600 mr-2" />
              <h3 className="text-md font-medium text-gray-700">
                Push Notifications
              </h3>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <NotificationToggle
                category="pushNotifications"
                setting="productUpdates"
                label="Product updates and announcements"
                icon={<FiBell size={18} className="text-gray-500" />}
              />

              <NotificationToggle
                category="pushNotifications"
                setting="newFollowers"
                label="New followers"
                icon={<FiBell size={18} className="text-gray-500" />}
              />

              <NotificationToggle
                category="pushNotifications"
                setting="comments"
                label="Comments on your products"
                icon={<FiBell size={18} className="text-gray-500" />}
              />

              <NotificationToggle
                category="pushNotifications"
                setting="mentions"
                label="Mentions and tags"
                icon={<FiBell size={18} className="text-gray-500" />}
              />

              <NotificationToggle
                category="pushNotifications"
                setting="upvotes"
                label="Upvotes on your products"
                icon={<FiBell size={18} className="text-gray-500" />}
              />
            </div>
          </div>

          {/* SMS Notifications */}
          <div>
            <div className="flex items-center mb-4">
              <FiSmartphone className="text-violet-600 mr-2" />
              <h3 className="text-md font-medium text-gray-700">
                SMS Notifications
              </h3>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <NotificationToggle
                category="smsNotifications"
                setting="securityAlerts"
                label="Security alerts"
                icon={<FiBell size={18} className="text-gray-500" />}
              />

              <NotificationToggle
                category="smsNotifications"
                setting="accountUpdates"
                label="Account updates"
                icon={<FiBell size={18} className="text-gray-500" />}
              />
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
                Save Preferences
              </>
            )}
          </motion.button>
        </div>
      </form>
    </div>
  );
};

export default NotificationSettings;
