"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  Briefcase,
  Calendar,
  Clock,
  MapPin,
  Building,
  ChevronRight,
  FileText,
  ExternalLink,
  AlertCircle
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import ApplicationStatusBadge from "./ApplicationStatusBadge";
import Pagination from "Components/common/Pagination";
import WithdrawModal from "./WithdrawModal";

const ApplicationsList = ({ applications, onWithdraw, pagination, onPageChange }) => {
  const router = useRouter();
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState(null);

  // Format date
  const formatDate = (dateString) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch (error) {
      return "Invalid date";
    }
  };

  // Handle view application
  const handleViewApplication = (applicationId) => {
    router.push(`/profile/applications/${applicationId}`);
  };

  // Handle withdraw application
  const handleWithdrawClick = (application) => {
    setSelectedApplication(application);
    setWithdrawModalOpen(true);
  };

  // Confirm withdrawal
  const confirmWithdraw = () => {
    if (selectedApplication) {
      onWithdraw(selectedApplication._id);
      setWithdrawModalOpen(false);
    }
  };

  // Animation variants
  const listVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  };

  return (
    <div>
      <motion.div
        variants={listVariants}
        initial="hidden"
        animate="show"
        className="divide-y divide-gray-200"
      >
        {applications.map((application) => (
          <motion.div
            key={application._id}
            variants={itemVariants}
            className="p-4 sm:p-6 hover:bg-gray-50 transition-colors"
          >
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Company Logo */}
              <div className="flex-shrink-0">
                <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 border border-gray-200 flex items-center justify-center">
                  {application.job?.company?.logo ? (
                    <Image
                      src={application.job.company.logo}
                      alt={application.job.company.name}
                      width={64}
                      height={64}
                      className="object-contain"
                    />
                  ) : (
                    <Building size={24} className="text-gray-400" />
                  )}
                </div>
              </div>

              {/* Application Details */}
              <div className="flex-1">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {application.job?.title || "Job Title"}
                    </h3>
                    <div className="text-sm text-gray-600 mb-2">
                      {application.job?.company?.name || "Company Name"}
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-gray-500 mb-3">
                      {application.job?.location && (
                        <div className="flex items-center">
                          <MapPin size={16} className="mr-1" />
                          <span>{application.job.location}</span>
                        </div>
                      )}
                      {application.job?.jobType && (
                        <div className="flex items-center">
                          <Briefcase size={16} className="mr-1" />
                          <span>{application.job.jobType}</span>
                        </div>
                      )}
                      <div className="flex items-center">
                        <Clock size={16} className="mr-1" />
                        <span>Applied {formatDate(application.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="flex flex-col items-end gap-2">
                    <ApplicationStatusBadge status={application.status} />

                    {application.status === "Pending" && (
                      <div className="text-xs text-gray-500 flex items-center">
                        <Clock size={12} className="mr-1" />
                        <span>Awaiting review</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Resume and Actions */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mt-3 pt-3 border-t border-gray-100">
                  <div className="flex items-center text-sm text-gray-600">
                    <FileText size={16} className="mr-1" />
                    <span className="truncate max-w-xs">
                      {application.resume?.name || "Resume"}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mt-3 sm:mt-0">
                    {/* Withdraw button - only show for pending or reviewed applications */}
                    {["Pending", "Reviewed"].includes(application.status) && (
                      <button
                        onClick={() => handleWithdrawClick(application)}
                        className="px-3 py-1.5 text-sm border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                      >
                        Withdraw
                      </button>
                    )}

                    {/* View Details button */}
                    <button
                      onClick={() => handleViewApplication(application._id)}
                      className="px-3 py-1.5 text-sm bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors flex items-center"
                    >
                      View Details
                      <ChevronRight size={16} className="ml-1" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="p-4 border-t border-gray-200">
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.pages}
            onPageChange={onPageChange}
          />
        </div>
      )}

      {/* Withdraw Confirmation Modal */}
      <WithdrawModal
        isOpen={withdrawModalOpen}
        onClose={() => setWithdrawModalOpen(false)}
        onConfirm={confirmWithdraw}
        application={selectedApplication}
      />
    </div>
  );
};

export default ApplicationsList;
