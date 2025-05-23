"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  HiOutlineOfficeBuilding,
  HiOutlineLightningBolt,
  HiOutlineCurrencyDollar,
  HiOutlineBriefcase,
  HiOutlineDocument,
  HiOutlineGlobe,
  HiOutlineCalendar,
  HiOutlineLocationMarker,
  HiOutlineUserGroup,
  HiOutlineLink,
} from "react-icons/hi";

const RoleFields = ({
  role,
  roleDetails,
  updateRoleDetails,
  isLoading,
  formControlVariants,
}) => {
  // Function to render fields based on selected role
  const renderRoleSpecificFields = () => {
    switch (role) {
      case "startupOwner":
        return (
          <>
            <motion.div
              variants={formControlVariants}
              initial="initial"
              animate="animate"
            >
              <label
                htmlFor="companyName"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Company Name
              </label>
              <div className="relative group">
                <input
                  type="text"
                  id="companyName"
                  placeholder="Enter your company name"
                  className="w-full px-4 py-2.5 pl-10 border rounded-xl text-sm transition-all duration-300 border-gray-200 group-hover:border-violet-300"
                  value={roleDetails.companyName || ""}
                  onChange={(e) =>
                    updateRoleDetails("companyName", e.target.value)
                  }
                  disabled={isLoading}
                />
                <HiOutlineOfficeBuilding className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg group-hover:text-violet-500 transition-colors duration-300" />
              </div>
            </motion.div>

            <motion.div
              variants={formControlVariants}
              initial="initial"
              animate="animate"
            >
              <label
                htmlFor="industry"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Industry
              </label>
              <div className="relative group">
                <input
                  type="text"
                  id="industry"
                  placeholder="e.g. Technology, Healthcare, Education"
                  className="w-full px-4 py-2.5 pl-10 border rounded-xl text-sm transition-all duration-300 border-gray-200 group-hover:border-violet-300"
                  value={roleDetails.industry || ""}
                  onChange={(e) =>
                    updateRoleDetails("industry", e.target.value)
                  }
                  disabled={isLoading}
                />
                <HiOutlineBriefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg group-hover:text-violet-500 transition-colors duration-300" />
              </div>
            </motion.div>

            <motion.div
              variants={formControlVariants}
              initial="initial"
              animate="animate"
            >
              <label
                htmlFor="fundingStage"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Funding Stage
              </label>
              <div className="relative group">
                <select
                  id="fundingStage"
                  className="w-full px-4 py-2.5 pl-10 border border-gray-200 rounded-xl text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all group-hover:border-violet-300"
                  value={roleDetails.fundingStage || "Pre-seed"}
                  onChange={(e) =>
                    updateRoleDetails("fundingStage", e.target.value)
                  }
                  disabled={isLoading}
                >
                  <option value="Pre-seed">Pre-seed</option>
                  <option value="Seed">Seed</option>
                  <option value="Series A">Series A</option>
                  <option value="Series B">Series B</option>
                  <option value="Series C+">Series C+</option>
                  <option value="Bootstrapped">Bootstrapped</option>
                  <option value="Other">Other</option>
                </select>
                <HiOutlineLightningBolt className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg group-hover:text-violet-500 transition-colors duration-300" />
              </div>
            </motion.div>

            <motion.div
              variants={formControlVariants}
              initial="initial"
              animate="animate"
            >
              <label
                htmlFor="companySize"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Company Size
              </label>
              <div className="relative group">
                <select
                  id="companySize"
                  className="w-full px-4 py-2.5 pl-10 border border-gray-200 rounded-xl text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all group-hover:border-violet-300"
                  value={roleDetails.companySize || "1-10"}
                  onChange={(e) =>
                    updateRoleDetails("companySize", e.target.value)
                  }
                  disabled={isLoading}
                >
                  <option value="1-10">1-10 employees</option>
                  <option value="11-50">11-50 employees</option>
                  <option value="51-200">51-200 employees</option>
                  <option value="201-500">201-500 employees</option>
                  <option value="501-1000">501-1000 employees</option>
                  <option value="1000+">1000+ employees</option>
                </select>
                <HiOutlineUserGroup className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg group-hover:text-violet-500 transition-colors duration-300" />
              </div>
            </motion.div>

            <motion.div
              variants={formControlVariants}
              initial="initial"
              animate="animate"
            >
              <label
                htmlFor="website"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Website URL (optional)
              </label>
              <div className="relative group">
                <input
                  type="url"
                  id="website"
                  placeholder="https://example.com"
                  className="w-full px-4 py-2.5 pl-10 border rounded-xl text-sm transition-all duration-300 border-gray-200 group-hover:border-violet-300"
                  value={roleDetails.website || ""}
                  onChange={(e) => updateRoleDetails("website", e.target.value)}
                  disabled={isLoading}
                />
                <HiOutlineLink className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg group-hover:text-violet-500 transition-colors duration-300" />
              </div>
            </motion.div>
          </>
        );

      case "investor":
        return (
          <>
            <motion.div
              variants={formControlVariants}
              initial="initial"
              animate="animate"
            >
              <label
                htmlFor="investorType"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Investor Type
              </label>
              <div className="relative group">
                <select
                  id="investorType"
                  className="w-full px-4 py-2.5 pl-10 border border-gray-200 rounded-xl text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all group-hover:border-violet-300"
                  value={roleDetails.investorType || "Angel Investor"}
                  onChange={(e) =>
                    updateRoleDetails("investorType", e.target.value)
                  }
                  disabled={isLoading}
                >
                  <option value="Angel Investor">Angel Investor</option>
                  <option value="Venture Capitalist">Venture Capitalist</option>
                  <option value="Corporate Investor">Corporate Investor</option>
                  <option value="Individual">Individual</option>
                </select>
                <HiOutlineCurrencyDollar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg group-hover:text-violet-500 transition-colors duration-300" />
              </div>
            </motion.div>

            <motion.div
              variants={formControlVariants}
              initial="initial"
              animate="animate"
            >
              <label
                htmlFor="investmentFocus"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Investment Focus
              </label>
              <div className="relative group">
                <input
                  type="text"
                  id="investmentFocus"
                  placeholder="e.g. Technology, Healthcare (comma separated)"
                  className="w-full px-4 py-2.5 pl-10 border rounded-xl text-sm transition-all duration-300 border-gray-200 group-hover:border-violet-300"
                  value={
                    roleDetails.investmentFocus?.join(", ") || "Technology"
                  }
                  onChange={(e) =>
                    updateRoleDetails(
                      "investmentFocus",
                      e.target.value.split(",").map((item) => item.trim())
                    )
                  }
                  disabled={isLoading}
                />
                <HiOutlineLightningBolt className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg group-hover:text-violet-500 transition-colors duration-300" />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Enter up to 10 focus areas, separated by commas
              </p>
            </motion.div>

            <motion.div
              variants={formControlVariants}
              initial="initial"
              animate="animate"
            >
              <label
                htmlFor="investmentRange"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Investment Range
              </label>
              <div className="grid grid-cols-2 gap-4 mb-2">
                <div className="relative group">
                  <input
                    type="number"
                    id="investmentRangeMin"
                    placeholder="Min amount"
                    className="w-full px-4 py-2.5 pl-10 border rounded-xl text-sm transition-all duration-300 border-gray-200 group-hover:border-violet-300"
                    value={roleDetails.investmentRange?.min || 10000}
                    onChange={(e) =>
                      updateRoleDetails("investmentRange", {
                        ...(roleDetails.investmentRange || {}),
                        min: Number(e.target.value),
                      })
                    }
                    disabled={isLoading}
                    min="0"
                  />
                  <HiOutlineCurrencyDollar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg group-hover:text-violet-500 transition-colors duration-300" />
                </div>
                <div className="relative group">
                  <input
                    type="number"
                    id="investmentRangeMax"
                    placeholder="Max amount"
                    className="w-full px-4 py-2.5 pl-10 border rounded-xl text-sm transition-all duration-300 border-gray-200 group-hover:border-violet-300"
                    value={roleDetails.investmentRange?.max || 50000}
                    onChange={(e) =>
                      updateRoleDetails("investmentRange", {
                        ...(roleDetails.investmentRange || {}),
                        max: Number(e.target.value),
                      })
                    }
                    disabled={isLoading}
                    min="0"
                  />
                  <HiOutlineCurrencyDollar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg group-hover:text-violet-500 transition-colors duration-300" />
                </div>
              </div>
              <div className="relative group">
                <select
                  id="currency"
                  className="w-full px-4 py-2.5 pl-10 border border-gray-200 rounded-xl text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all group-hover:border-violet-300"
                  value={roleDetails.investmentRange?.currency || "USD"}
                  onChange={(e) =>
                    updateRoleDetails("investmentRange", {
                      ...(roleDetails.investmentRange || {}),
                      currency: e.target.value,
                    })
                  }
                  disabled={isLoading}
                >
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                </select>
                <HiOutlineCurrencyDollar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg group-hover:text-violet-500 transition-colors duration-300" />
              </div>
            </motion.div>

            <motion.div
              variants={formControlVariants}
              initial="initial"
              animate="animate"
            >
              <label
                htmlFor="preferredStages"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Preferred Investment Stages
              </label>
              <div className="relative group">
                <select
                  id="preferredStages"
                  className="w-full px-4 py-2.5 pl-10 border border-gray-200 rounded-xl text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all group-hover:border-violet-300"
                  value={roleDetails.preferredStages?.[0] || "Pre-seed"}
                  onChange={(e) =>
                    updateRoleDetails("preferredStages", [e.target.value])
                  }
                  disabled={isLoading}
                >
                  <option value="Pre-seed">Pre-seed</option>
                  <option value="Seed">Seed</option>
                  <option value="Series A">Series A</option>
                  <option value="Series B">Series B</option>
                  <option value="Series C+">Series C+</option>
                  <option value="Growth">Growth</option>
                  <option value="Mature">Mature</option>
                </select>
                <HiOutlineLightningBolt className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg group-hover:text-violet-500 transition-colors duration-300" />
              </div>
            </motion.div>
          </>
        );

      case "agency":
        return (
          <>
            <motion.div
              variants={formControlVariants}
              initial="initial"
              animate="animate"
            >
              <label
                htmlFor="companyName"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Agency Name
              </label>
              <div className="relative group">
                <input
                  type="text"
                  id="companyName"
                  placeholder="Enter your agency name"
                  className="w-full px-4 py-2.5 pl-10 border rounded-xl text-sm transition-all duration-300 border-gray-200 group-hover:border-violet-300"
                  value={roleDetails.companyName || ""}
                  onChange={(e) =>
                    updateRoleDetails("companyName", e.target.value)
                  }
                  disabled={isLoading}
                />
                <HiOutlineOfficeBuilding className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg group-hover:text-violet-500 transition-colors duration-300" />
              </div>
            </motion.div>

            <motion.div
              variants={formControlVariants}
              initial="initial"
              animate="animate"
            >
              <label
                htmlFor="industry"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Industry
              </label>
              <div className="relative group">
                <input
                  type="text"
                  id="industry"
                  placeholder="e.g. Technology, Marketing, Design"
                  className="w-full px-4 py-2.5 pl-10 border rounded-xl text-sm transition-all duration-300 border-gray-200 group-hover:border-violet-300"
                  value={roleDetails.industry || "Technology"}
                  onChange={(e) =>
                    updateRoleDetails("industry", e.target.value)
                  }
                  disabled={isLoading}
                />
                <HiOutlineBriefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg group-hover:text-violet-500 transition-colors duration-300" />
              </div>
            </motion.div>

            <motion.div
              variants={formControlVariants}
              initial="initial"
              animate="animate"
            >
              <label
                htmlFor="services"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Services Offered
              </label>
              <div className="relative group">
                <input
                  type="text"
                  id="services"
                  placeholder="e.g. Consulting, Development, Design (comma separated)"
                  className="w-full px-4 py-2.5 pl-10 border rounded-xl text-sm transition-all duration-300 border-gray-200 group-hover:border-violet-300"
                  value={roleDetails.services?.join(", ") || "Consulting"}
                  onChange={(e) =>
                    updateRoleDetails(
                      "services",
                      e.target.value.split(",").map((item) => item.trim())
                    )
                  }
                  disabled={isLoading}
                />
                <HiOutlineLightningBolt className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg group-hover:text-violet-500 transition-colors duration-300" />
              </div>
            </motion.div>

            <motion.div
              variants={formControlVariants}
              initial="initial"
              animate="animate"
            >
              <label
                htmlFor="companySize"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Company Size
              </label>
              <div className="relative group">
                <select
                  id="companySize"
                  className="w-full px-4 py-2.5 pl-10 border border-gray-200 rounded-xl text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all group-hover:border-violet-300"
                  value={roleDetails.companySize || "1-10"}
                  onChange={(e) =>
                    updateRoleDetails("companySize", e.target.value)
                  }
                  disabled={isLoading}
                >
                  <option value="1-10">1-10 employees</option>
                  <option value="11-50">11-50 employees</option>
                  <option value="51-200">51-200 employees</option>
                  <option value="201-500">201-500 employees</option>
                  <option value="501+">501+ employees</option>
                </select>
                <HiOutlineUserGroup className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg group-hover:text-violet-500 transition-colors duration-300" />
              </div>
            </motion.div>

            <motion.div
              variants={formControlVariants}
              initial="initial"
              animate="animate"
            >
              <label
                htmlFor="website"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Website URL (optional)
              </label>
              <div className="relative group">
                <input
                  type="url"
                  id="website"
                  placeholder="https://example.com"
                  className="w-full px-4 py-2.5 pl-10 border rounded-xl text-sm transition-all duration-300 border-gray-200 group-hover:border-violet-300"
                  value={roleDetails.website || ""}
                  onChange={(e) => updateRoleDetails("website", e.target.value)}
                  disabled={isLoading}
                />
                <HiOutlineLink className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg group-hover:text-violet-500 transition-colors duration-300" />
              </div>
            </motion.div>
          </>
        );

      case "freelancer":
        return (
          <>
            <motion.div
              variants={formControlVariants}
              initial="initial"
              animate="animate"
            >
              <label
                htmlFor="skills"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Skills
              </label>
              <div className="relative group">
                <input
                  type="text"
                  id="skills"
                  placeholder="e.g. JavaScript, React, UI Design (comma separated)"
                  className="w-full px-4 py-2.5 pl-10 border rounded-xl text-sm transition-all duration-300 border-gray-200 group-hover:border-violet-300"
                  value={roleDetails.skills?.join(", ") || "Technology"}
                  onChange={(e) =>
                    updateRoleDetails(
                      "skills",
                      e.target.value.split(",").map((item) => item.trim())
                    )
                  }
                  disabled={isLoading}
                />
                <HiOutlineLightningBolt className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg group-hover:text-violet-500 transition-colors duration-300" />
              </div>
            </motion.div>

            <motion.div
              variants={formControlVariants}
              initial="initial"
              animate="animate"
            >
              <label
                htmlFor="experience"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Experience Level
              </label>
              <div className="relative group">
                <select
                  id="experience"
                  className="w-full px-4 py-2.5 pl-10 border border-gray-200 rounded-xl text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all group-hover:border-violet-300"
                  value={roleDetails.experience || "Intermediate"}
                  onChange={(e) =>
                    updateRoleDetails("experience", e.target.value)
                  }
                  disabled={isLoading}
                >
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                  <option value="Expert">Expert</option>
                </select>
                <HiOutlineDocument className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg group-hover:text-violet-500 transition-colors duration-300" />
              </div>
            </motion.div>

            <motion.div
              variants={formControlVariants}
              initial="initial"
              animate="animate"
            >
              <label
                htmlFor="hourlyRate"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Hourly Rate
              </label>
              <div className="grid grid-cols-2 gap-4">
                <div className="relative group">
                  <input
                    type="number"
                    id="hourlyRateAmount"
                    placeholder="Amount"
                    className="w-full px-4 py-2.5 pl-10 border rounded-xl text-sm transition-all duration-300 border-gray-200 group-hover:border-violet-300"
                    value={roleDetails.hourlyRate?.amount || ""}
                    onChange={(e) =>
                      updateRoleDetails("hourlyRate", {
                        ...(roleDetails.hourlyRate || {}),
                        amount: Number(e.target.value),
                      })
                    }
                    disabled={isLoading}
                    min="0"
                  />
                  <HiOutlineCurrencyDollar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg group-hover:text-violet-500 transition-colors duration-300" />
                </div>
                <div className="relative group">
                  <select
                    id="hourlyRateCurrency"
                    className="w-full px-4 py-2.5 pl-10 border border-gray-200 rounded-xl text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all group-hover:border-violet-300"
                    value={roleDetails.hourlyRate?.currency || "USD"}
                    onChange={(e) =>
                      updateRoleDetails("hourlyRate", {
                        ...(roleDetails.hourlyRate || {}),
                        currency: e.target.value,
                      })
                    }
                    disabled={isLoading}
                  >
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                  </select>
                  <HiOutlineCurrencyDollar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg group-hover:text-violet-500 transition-colors duration-300" />
                </div>
              </div>
            </motion.div>

            <motion.div
              variants={formControlVariants}
              initial="initial"
              animate="animate"
            >
              <label
                htmlFor="availability"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Availability
              </label>
              <div className="relative group">
                <select
                  id="availability"
                  className="w-full px-4 py-2.5 pl-10 border border-gray-200 rounded-xl text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all group-hover:border-violet-300"
                  value={roleDetails.availability || "Flexible"}
                  onChange={(e) =>
                    updateRoleDetails("availability", e.target.value)
                  }
                  disabled={isLoading}
                >
                  <option value="Full-time">Full-time</option>
                  <option value="Part-time">Part-time</option>
                  <option value="Weekends">Weekends</option>
                  <option value="Flexible">Flexible</option>
                </select>
                <HiOutlineCalendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg group-hover:text-violet-500 transition-colors duration-300" />
              </div>
            </motion.div>
          </>
        );

      case "jobseeker":
        return (
          <>
            <motion.div
              variants={formControlVariants}
              initial="initial"
              animate="animate"
            >
              <label
                htmlFor="jobTitle"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Job Title
              </label>
              <div className="relative group">
                <input
                  type="text"
                  id="jobTitle"
                  placeholder="e.g. Software Engineer, Product Designer"
                  className="w-full px-4 py-2.5 pl-10 border rounded-xl text-sm transition-all duration-300 border-gray-200 group-hover:border-violet-300"
                  value={roleDetails.jobTitle || ""}
                  onChange={(e) =>
                    updateRoleDetails("jobTitle", e.target.value)
                  }
                  disabled={isLoading}
                />
                <HiOutlineBriefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg group-hover:text-violet-500 transition-colors duration-300" />
              </div>
            </motion.div>

            <motion.div
              variants={formControlVariants}
              initial="initial"
              animate="animate"
            >
              <label
                htmlFor="experience"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Experience Level
              </label>
              <div className="relative group">
                <select
                  id="experience"
                  className="w-full px-4 py-2.5 pl-10 border border-gray-200 rounded-xl text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all group-hover:border-violet-300"
                  value={roleDetails.experience || "Mid-Level"}
                  onChange={(e) =>
                    updateRoleDetails("experience", e.target.value)
                  }
                  disabled={isLoading}
                >
                  <option value="Entry Level">Entry Level</option>
                  <option value="Junior">Junior</option>
                  <option value="Mid-Level">Mid-Level</option>
                  <option value="Senior">Senior</option>
                  <option value="Executive">Executive</option>
                </select>
                <HiOutlineDocument className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg group-hover:text-violet-500 transition-colors duration-300" />
              </div>
            </motion.div>

            <motion.div
              variants={formControlVariants}
              initial="initial"
              animate="animate"
            >
              <label
                htmlFor="skills"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Skills
              </label>
              <div className="relative group">
                <input
                  type="text"
                  id="skills"
                  placeholder="e.g. JavaScript, Project Management (comma separated)"
                  className="w-full px-4 py-2.5 pl-10 border rounded-xl text-sm transition-all duration-300 border-gray-200 group-hover:border-violet-300"
                  value={roleDetails.skills?.join(", ") || "Communication"}
                  onChange={(e) =>
                    updateRoleDetails(
                      "skills",
                      e.target.value.split(",").map((item) => item.trim())
                    )
                  }
                  disabled={isLoading}
                />
                <HiOutlineLightningBolt className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg group-hover:text-violet-500 transition-colors duration-300" />
              </div>
            </motion.div>

            <motion.div
              variants={formControlVariants}
              initial="initial"
              animate="animate"
            >
              <label
                htmlFor="preferredJobTypes"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Preferred Job Types
              </label>
              <div className="relative group">
                <select
                  id="preferredJobTypes"
                  className="w-full px-4 py-2.5 pl-10 border border-gray-200 rounded-xl text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all group-hover:border-violet-300"
                  value={roleDetails.preferredJobTypes?.[0] || "Full-time"}
                  onChange={(e) =>
                    updateRoleDetails("preferredJobTypes", [e.target.value])
                  }
                  disabled={isLoading}
                >
                  <option value="Full-time">Full-time</option>
                  <option value="Part-time">Part-time</option>
                  <option value="Contract">Contract</option>
                  <option value="Internship">Internship</option>
                  <option value="Remote">Remote</option>
                </select>
                <HiOutlineBriefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg group-hover:text-violet-500 transition-colors duration-300" />
              </div>
            </motion.div>
          </>
        );

      default:
        return null;
    }
  };

  // Only render role-specific fields if the role is not "user"
  return role !== "user" ? (
    <motion.div
      className="space-y-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {renderRoleSpecificFields()}
    </motion.div>
  ) : null;
};

export default RoleFields;
