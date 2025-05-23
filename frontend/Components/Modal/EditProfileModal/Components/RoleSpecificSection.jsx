"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/contexts/auth-context";
import { FiBriefcase, FiDollarSign, FiUsers, FiTrendingUp, FiMapPin, FiInfo, FiSettings } from "react-icons/fi";
import api from "@/lib/api/api";
import logger from "@/lib/utils/logger";

const RoleSpecificSection = ({ formData, setFormData, setHasUnsavedChanges }) => {
  const { user, refreshUserData } = useAuth();
  const [activeSection, setActiveSection] = useState("main");
  const [secondaryRoles, setSecondaryRoles] = useState([]);
  const [availableRoles, setAvailableRoles] = useState([]);
  const [selectedRole, setSelectedRole] = useState("");
  const [isAddingRole, setIsAddingRole] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [roleError, setRoleError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setHasUnsavedChanges(true);
  };

  const handleArrayChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value.split(",").map(item => item.trim()) }));
    setHasUnsavedChanges(true);
  };

  // Initialize secondary roles
  useEffect(() => {
    if (user) {
      // Set secondary roles from user data
      setSecondaryRoles(user.secondaryRoles || []);

      // Set available roles (excluding primary role and existing secondary roles)
      const allRoles = [
        { id: 'startupOwner', label: 'Startup Owner' },
        { id: 'investor', label: 'Investor' },
        { id: 'agency', label: 'Agency' },
        { id: 'freelancer', label: 'Freelancer' },
        { id: 'jobseeker', label: 'Job Seeker' },
        { id: 'maker', label: 'Maker' }
      ];

      const available = allRoles.filter(role =>
        role.id !== user.role && !(user.secondaryRoles || []).includes(role.id)
      );

      setAvailableRoles(available);
    }
  }, [user]);

  const renderStartupFields = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Company Name</label>
        <div className="relative flex items-center">
          <FiBriefcase className="absolute left-3 text-gray-400 w-5 h-5" />
          <input
            type="text"
            name="companyName"
            value={formData.companyName}
            onChange={handleChange}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            placeholder="Your company name"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Company Website</label>
        <div className="relative flex items-center">
          <FiTrendingUp className="absolute left-3 text-gray-400 w-5 h-5" />
          <input
            type="url"
            name="companyWebsite"
            value={formData.companyWebsite}
            onChange={handleChange}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            placeholder="https://example.com"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Funding Stage</label>
        <select
          name="fundingStage"
          value={formData.fundingStage}
          onChange={handleChange}
          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent"
        >
          {["Pre-seed", "Seed", "Series A", "Series B", "Series C+", "Bootstrapped", "Other"].map((stage) => (
            <option key={stage} value={stage}>{stage}</option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Company Size</label>
        <select
          name="companySize"
          value={formData.companySize}
          onChange={handleChange}
          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent"
        >
          {["1-10", "11-50", "51-200", "201-500", "501-1000", "1000+"].map((size) => (
            <option key={size} value={size}>{size}</option>
          ))}
        </select>
      </div>

      <div className="md:col-span-2 space-y-2">
        <label className="text-sm font-medium text-gray-700">Company Description</label>
        <textarea
          name="companyDescription"
          value={formData.companyDescription}
          onChange={handleChange}
          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent"
          rows="4"
          placeholder="Brief description of your company..."
        />
      </div>
    </div>
  );

  const renderFreelancerFields = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Skills (comma-separated)</label>
        <input
          type="text"
          value={formData.skills?.join(", ")}
          onChange={(e) => handleArrayChange("skills", e.target.value)}
          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent"
          placeholder="e.g., Web Design, UI/UX, React"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Role Title</label>
        <div className="relative flex items-center">
          <FiBriefcase className="absolute left-3 text-gray-400 w-5 h-5" />
          <input
            type="text"
            name="companyRole"
            value={formData.companyRole}
            onChange={handleChange}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            placeholder="e.g., Frontend Developer"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Open to Work</label>
        <select
          name="openToWork"
          value={formData.openToWork}
          onChange={handleChange}
          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent"
        >
          <option value={true}>Yes</option>
          <option value={false}>No</option>
        </select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Experience</label>
        <select
          name="experience"
          value={formData.experience}
          onChange={handleChange}
          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent"
        >
          {["Entry Level", "Junior", "Mid-Level", "Senior", "Expert"].map((level) => (
            <option key={level} value={level}>{level}</option>
          ))}
        </select>
      </div>

      <div className="md:col-span-2 space-y-2">
        <label className="text-sm font-medium text-gray-700">About Your Services</label>
        <textarea
          name="about"
          value={formData.about}
          onChange={handleChange}
          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent"
          rows="4"
          placeholder="Describe your services and expertise..."
        />
      </div>
    </div>
  );

  const renderInvestorFields = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Investor Type</label>
        <select
          name="investorType"
          value={formData.investorType}
          onChange={handleChange}
          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent"
        >
          {["Angel Investor", "Venture Capital", "Private Equity", "Corporate Investor", "Individual"].map((type) => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Investment Focus</label>
        <div className="relative flex items-center">
          <FiDollarSign className="absolute left-3 text-gray-400 w-5 h-5" />
          <input
            type="text"
            name="industry"
            value={formData.industry}
            onChange={handleChange}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            placeholder="e.g., SaaS, FinTech"
          />
        </div>
      </div>

      <div className="md:col-span-2 space-y-2">
        <label className="text-sm font-medium text-gray-700">About Your Investment Strategy</label>
        <textarea
          name="about"
          value={formData.about}
          onChange={handleChange}
          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent"
          rows="4"
          placeholder="Describe your investment strategy and interests..."
        />
      </div>
    </div>
  );

  // Handle adding a secondary role
  const handleAddSecondaryRole = async () => {
    if (!selectedRole) return;

    setIsSubmitting(true);
    setRoleError("");

    try {
      // Add the selected role to secondary roles
      const updatedSecondaryRoles = [...secondaryRoles, selectedRole];

      const response = await api.put('/auth/profile', {
        secondaryRoles: updatedSecondaryRoles
      });

      if (response.data.status === 'success') {
        // Update local state
        setSecondaryRoles(updatedSecondaryRoles);

        // Update available roles
        setAvailableRoles(availableRoles.filter(role => role.id !== selectedRole));

        // Reset form
        setSelectedRole("");
        setIsAddingRole(false);

        // Refresh user data to get updated capabilities
        await refreshUserData();

        // Update form data
        setFormData(prev => ({
          ...prev,
          secondaryRoles: updatedSecondaryRoles
        }));

        setHasUnsavedChanges(true);
      } else {
        setRoleError(response.data.message || "Failed to add role");
      }
    } catch (err) {
      logger.error("Error adding secondary role:", err);
      setRoleError(err.response?.data?.message || "Failed to add role");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle removing a secondary role
  const handleRemoveSecondaryRole = async (roleId) => {
    setIsSubmitting(true);
    setRoleError("");

    try {
      // Remove the role from secondary roles
      const updatedSecondaryRoles = secondaryRoles.filter(role => role !== roleId);

      const response = await api.put('/auth/profile', {
        secondaryRoles: updatedSecondaryRoles
      });

      if (response.data.status === 'success') {
        // Update local state
        setSecondaryRoles(updatedSecondaryRoles);

        // Update available roles
        const roleToAdd = [
          { id: 'startupOwner', label: 'Startup Owner' },
          { id: 'investor', label: 'Investor' },
          { id: 'agency', label: 'Agency' },
          { id: 'freelancer', label: 'Freelancer' },
          { id: 'jobseeker', label: 'Job Seeker' },
          { id: 'maker', label: 'Maker' }
        ].find(r => r.id === roleId);

        if (roleToAdd) {
          setAvailableRoles([...availableRoles, roleToAdd]);
        }

        // Refresh user data to get updated capabilities
        await refreshUserData();

        // Update form data
        setFormData(prev => ({
          ...prev,
          secondaryRoles: updatedSecondaryRoles
        }));

        setHasUnsavedChanges(true);
      } else {
        setRoleError(response.data.message || "Failed to remove role");
      }
    } catch (err) {
      logger.error("Error removing secondary role:", err);
      setRoleError(err.response?.data?.message || "Failed to remove role");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper function to get label for a role ID
  const getRoleLabel = (roleId) => {
    const roleLabels = {
      startupOwner: "Startup Owner",
      investor: "Investor",
      agency: "Agency",
      freelancer: "Freelancer",
      jobseeker: "Job Seeker",
      maker: "Maker",
      user: "Regular User",
      admin: "Administrator"
    };

    return roleLabels[roleId] || roleId;
  };

  // Render secondary roles section
  const renderSecondaryRolesSection = () => (
    <div className="mb-6 p-4 bg-gray-50 rounded-lg">
      <div className="flex justify-between items-center mb-4">
        <h4 className="text-md font-medium text-gray-800">Secondary Roles</h4>
        {!isAddingRole && availableRoles.length > 0 && (
          <button
            type="button"
            onClick={() => setIsAddingRole(true)}
            className="text-sm flex items-center text-violet-600 hover:text-violet-700"
            disabled={isSubmitting}
          >
            <FiUsers className="mr-1" /> Add Role
          </button>
        )}
      </div>

      {roleError && (
        <div className="mb-4 p-2 bg-red-50 text-red-600 text-sm rounded">
          {roleError}
        </div>
      )}

      {secondaryRoles.length > 0 ? (
        <div className="flex flex-wrap gap-2 mb-4">
          {secondaryRoles.map(role => (
            <div
              key={role}
              className="p-2 bg-blue-50 rounded text-blue-800 flex items-center"
            >
              {getRoleLabel(role)}
              <button
                type="button"
                onClick={() => handleRemoveSecondaryRole(role)}
                className="ml-2 text-blue-500 hover:text-blue-700"
                disabled={isSubmitting}
              >
                {isSubmitting ? "..." : "×"}
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-500 mb-4">
          You don't have any secondary roles. Adding secondary roles gives you additional capabilities.
        </p>
      )}

      {isAddingRole && (
        <div className="border-t pt-3 mt-3">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select a role to add:
          </label>
          <div className="flex flex-wrap gap-2 mb-3">
            {availableRoles.map(role => (
              <button
                type="button"
                key={role.id}
                onClick={() => setSelectedRole(role.id)}
                className={`px-3 py-2 rounded-lg text-sm ${
                  selectedRole === role.id
                    ? 'bg-violet-100 text-violet-800 border border-violet-300'
                    : 'bg-gray-100 text-gray-800 border border-gray-200 hover:bg-gray-200'
                }`}
              >
                {role.label}
              </button>
            ))}
          </div>
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => {
                setIsAddingRole(false);
                setSelectedRole("");
              }}
              className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleAddSecondaryRole}
              className="px-3 py-1 text-sm bg-violet-600 text-white rounded hover:bg-violet-700 flex items-center"
              disabled={!selectedRole || isSubmitting}
            >
              {isSubmitting ? "Adding..." : "Add Role"}
            </button>
          </div>
        </div>
      )}
    </div>
  );

  const renderFields = () => {
    switch (user?.role) {
      case "startupOwner":
        return renderStartupFields();
      case "freelancer":
      case "jobseeker":
        return renderFreelancerFields();
      case "investor":
        return renderInvestorFields();
      default:
        return (
          <div className="text-center text-gray-500 py-8">
            <FiBriefcase className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-lg font-medium">No additional fields required</p>
            <p className="text-sm mt-2">You can update your basic information in the other sections.</p>
          </div>
        );
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"
    >
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-violet-50 rounded-xl">
            <FiBriefcase className="w-5 h-5 text-violet-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">
            {user?.role ? `${user.role.charAt(0).toUpperCase() + user.role.slice(1)} Details` : "Role Details"}
          </h3>
        </div>

        {(user?.role === "freelancer" || user?.role === "jobseeker" || user?.role === "investor" || user?.role === "startupOwner") && (
          <div className="text-sm p-4 bg-amber-50 border border-amber-100 rounded-lg text-amber-700 mb-4">
            <p>
              <strong>Note:</strong> Changing your email or phone number will require re-verification of that contact method.
            </p>
          </div>
        )}

        <AnimatePresence>
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            {/* Secondary Roles Section */}
            {renderSecondaryRolesSection()}

            {/* Role-specific fields */}
            {renderFields()}
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default RoleSpecificSection;