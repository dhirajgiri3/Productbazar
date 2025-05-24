"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/contexts/auth-context";
import withAuth from "@/app/auth/RouteProtector/withAuth";
import ApplicationsList from "./components/ApplicationsList";
import ApplicationFilters from "./components/ApplicationFilters";
import EmptyState from "Components/common/EmptyState";
import LoaderComponent from "Components/UI/LoaderComponent";
import { makePriorityRequest } from "@/lib/api/api";
import logger from "@/lib/utils/logger";

const ApplicationsPage = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    status: "All",
    search: "",
    sortBy: "createdAt",
    sortOrder: "desc",
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });
  const [statusCounts, setStatusCounts] = useState({
    All: 0,
    Pending: 0,
    Reviewed: 0,
    Shortlisted: 0,
    Rejected: 0,
    Hired: 0,
    Withdrawn: 0,
  });

  // Fetch applications with filters and pagination
  const fetchApplications = async () => {
    try {
      setLoading(true);
      setError(null);

      const queryParams = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        ...(filters.status !== "All" && { status: filters.status }),
        ...(filters.search && { search: filters.search }),
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
      });

      const response = await makePriorityRequest(
        "get",
        `/jobs/user/applications?${queryParams.toString()}`
      );

      if (response.data.status === "success") {
        setApplications(response.data.data.applications);
        setPagination(response.data.data.pagination);
        setStatusCounts(response.data.data.statusCounts);
      } else {
        setError("Failed to fetch applications");
      }
    } catch (error) {
      logger.error("Error fetching applications:", error);
      setError("Failed to fetch applications");
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    if (user) {
      fetchApplications();
    }
  }, [user, filters.status, filters.sortBy, filters.sortOrder, pagination.page]);

  // Handle filter changes
  const handleFilterChange = (newFilters) => {
    setFilters({ ...filters, ...newFilters });
    setPagination({ ...pagination, page: 1 }); // Reset to first page on filter change
  };

  // Handle search
  const handleSearch = (searchTerm) => {
    setFilters({ ...filters, search: searchTerm });
    setPagination({ ...pagination, page: 1 }); // Reset to first page on search
  };

  // Handle pagination
  const handlePageChange = (newPage) => {
    setPagination({ ...pagination, page: newPage });
  };

  // Handle application withdrawal
  const handleWithdraw = async (applicationId) => {
    try {
      const response = await makePriorityRequest(
        "patch",
        `/jobs/applications/${applicationId}/withdraw`
      );

      if (response.data.status === "success") {
        // Update the application in the list
        setApplications(
          applications.map((app) =>
            app._id === applicationId
              ? { ...app, status: "Withdrawn" }
              : app
          )
        );

        // Update status counts
        setStatusCounts({
          ...statusCounts,
          Withdrawn: (statusCounts.Withdrawn || 0) + 1,
          [response.data.data.application.status]: statusCounts[response.data.data.application.status] - 1,
        });
      }
    } catch (error) {
      logger.error("Error withdrawing application:", error);
    }
  };

  // Page animations
  const pageVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.5 } },
    exit: { opacity: 0, y: 20, transition: { duration: 0.3 } },
  };

  return (
    <motion.div
      className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8"
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Job Applications</h1>
          <p className="mt-2 text-gray-600">
            Track and manage all your job applications in one place
          </p>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          {/* Filters */}
          <ApplicationFilters
            filters={filters}
            onFilterChange={handleFilterChange}
            onSearch={handleSearch}
            statusCounts={statusCounts}
          />

          {/* Applications List */}
          {loading ? (
            <div className="p-12 flex justify-center">
              <LoaderComponent size="medium" />
            </div>
          ) : error ? (
            <div className="p-12 text-center">
              <p className="text-red-500">{error}</p>
              <button
                onClick={fetchApplications}
                className="mt-4 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : applications.length === 0 ? (
            <EmptyState
              title="No applications found"
              description={
                filters.status !== "All" || filters.search
                  ? "Try changing your filters or search term"
                  : "You haven't applied to any jobs yet"
              }
              action={{
                label: "Browse Jobs",
                onClick: () => router.push("/jobs"),
              }}
              icon="📝"
            />
          ) : (
            <ApplicationsList
              applications={applications}
              onWithdraw={handleWithdraw}
              pagination={pagination}
              onPageChange={handlePageChange}
            />
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default withAuth(ApplicationsPage);
