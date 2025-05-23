"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, Filter, ArrowUpDown, X } from "lucide-react";

const ApplicationFilters = ({ filters, onFilterChange, onSearch, statusCounts }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  // Update search term when filters change
  useEffect(() => {
    setSearchTerm(filters.search || "");
  }, [filters.search]);

  // Handle search submission
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    onSearch(searchTerm);
  };

  // Handle status filter change
  const handleStatusChange = (status) => {
    onFilterChange({ status });
  };

  // Handle sort change
  const handleSortChange = (sortBy, sortOrder) => {
    onFilterChange({ sortBy, sortOrder });
  };

  // Status options with colors
  const statusOptions = [
    { value: "All", label: "All Applications", color: "bg-gray-100 text-gray-800" },
    { value: "Pending", label: "Pending", color: "bg-blue-100 text-blue-800" },
    { value: "Reviewed", label: "Reviewed", color: "bg-purple-100 text-purple-800" },
    { value: "Shortlisted", label: "Shortlisted", color: "bg-green-100 text-green-800" },
    { value: "Rejected", label: "Rejected", color: "bg-red-100 text-red-800" },
    { value: "Hired", label: "Hired", color: "bg-emerald-100 text-emerald-800" },
    { value: "Withdrawn", label: "Withdrawn", color: "bg-gray-100 text-gray-800" },
  ];

  // Sort options
  const sortOptions = [
    { value: "createdAt", label: "Date Applied", order: "desc" },
    { value: "createdAt", label: "Date Applied (Oldest)", order: "asc" },
    { value: "status", label: "Status", order: "asc" },
  ];

  return (
    <div className="border-b border-gray-200">
      <div className="p-4 sm:p-6">
        {/* Search and Filter Controls */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          {/* Search */}
          <form onSubmit={handleSearchSubmit} className="w-full sm:max-w-md">
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search applications..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={18} className="text-gray-400" />
              </div>
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm("");
                    onSearch("");
                  }}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  <X size={18} className="text-gray-400 hover:text-gray-600" />
                </button>
              )}
            </div>
          </form>

          {/* Filter Toggle */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsFiltersOpen(!isFiltersOpen)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Filter size={18} />
              <span>Filters</span>
            </button>

            {/* Sort Dropdown */}
            <div className="relative">
              <button
                type="button"
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <ArrowUpDown size={18} />
                <span className="hidden sm:inline">Sort</span>
              </button>
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg z-10 border border-gray-200 hidden">
                {sortOptions.map((option) => (
                  <button
                    key={`${option.value}-${option.order}`}
                    onClick={() => handleSortChange(option.value, option.order)}
                    className={`w-full text-left px-4 py-2 hover:bg-gray-50 ${
                      filters.sortBy === option.value && filters.sortOrder === option.order
                        ? "bg-violet-50 text-violet-700"
                        : ""
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Expanded Filters */}
        <motion.div
          initial={false}
          animate={{ height: isFiltersOpen ? "auto" : 0, opacity: isFiltersOpen ? 1 : 0 }}
          transition={{ duration: 0.3 }}
          className="overflow-hidden mt-4"
        >
          <div className="pt-4 border-t border-gray-200">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Filter by Status</h3>
            <div className="flex flex-wrap gap-2">
              {statusOptions.map((status) => (
                <button
                  key={status.value}
                  onClick={() => handleStatusChange(status.value)}
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    status.color
                  } ${
                    filters.status === status.value
                      ? "ring-2 ring-offset-1 ring-violet-500"
                      : ""
                  }`}
                >
                  {status.label}
                  {statusCounts[status.value] > 0 && (
                    <span className="ml-1 px-1.5 py-0.5 bg-white bg-opacity-30 rounded-full text-xs">
                      {statusCounts[status.value]}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ApplicationFilters;
