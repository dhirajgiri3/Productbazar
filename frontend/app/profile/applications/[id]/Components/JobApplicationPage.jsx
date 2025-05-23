"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  Briefcase,
  Calendar,
  Clock,
  MapPin,
  Building,
  ChevronLeft,
  FileText,
  ExternalLink,
  DollarSign,
  Mail,
  Download,
  Share2,
  User,
  AlertTriangle,
  CheckCircle
} from "lucide-react";
import { format } from "date-fns";
import { useAuth } from "@/lib/contexts/auth-context";
import withAuth from "@/app/auth/RouteProtector/withAuth";
import ApplicationStatusBadge from "../../components/ApplicationStatusBadge";
import LoaderComponent from "../../../../../Components/UI/LoaderComponent";
import WithdrawModal from "../../components/WithdrawModal";
import { makePriorityRequest } from "@/lib/api/api";
import logger from "@/lib/utils/logger";
import { toast } from "react-hot-toast";

const ApplicationDetailPage = () => {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [downloadingResume, setDownloadingResume] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);

  // Fetch application details
  const fetchApplication = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await makePriorityRequest(
        "get",
        `/jobs/applications/${id}`
      );

      if (response.data.status === "success") {
        setApplication(response.data.data.application);
      } else {
        setError("Failed to fetch application details");
      }
    } catch (error) {
      logger.error("Error fetching application details:", error);
      setError("Failed to fetch application details");
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    if (user && id) {
      fetchApplication();
    }
  }, [user, id]);

  // Format date
  const formatDate = (dateString, formatStr = "PPP") => {
    try {
      return format(new Date(dateString), formatStr);
    } catch (error) {
      return "Invalid date";
    }
  };

  // Handle withdraw application
  const handleWithdraw = async () => {
    try {
      const response = await makePriorityRequest(
        "patch",
        `/jobs/applications/${id}/withdraw`
      );

      if (response.data.status === "success") {
        toast.success("Application withdrawn successfully");
        setApplication({ ...application, status: "Withdrawn" });
        setWithdrawModalOpen(false);
      }
    } catch (error) {
      logger.error("Error withdrawing application:", error);
      toast.error("Failed to withdraw application");
    }
  };

  // Handle resume download
  const handleResumeDownload = async () => {
    if (!application?._id) {
      toast.error("Application ID not available");
      return;
    }

    try {
      setDownloadingResume(true);
      setDownloadProgress(0);

      // Get the API URL for downloading the resume
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5004/api/v1';

      // Get filename from resume data or generate one
      const filename = application.resume?.name || `resume-${application._id}.pdf`;

      // Get the access token
      const token = localStorage.getItem('accessToken');
      if (!token) {
        toast.error("Authentication required");
        setDownloadingResume(false);
        return;
      }

      // Create the download URL with token
      const downloadUrl = `${baseUrl}/jobs/applications/${application._id}/resume?token=${encodeURIComponent(token)}`;

      // Use fetch to download the file
      const response = await fetch(downloadUrl);

      if (!response.ok) {
        throw new Error(`Failed to download resume: ${response.statusText}`);
      }

      // Get the blob from the response
      const blob = await response.blob();

      // Create a download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;

      // Append to body, click, and remove
      document.body.appendChild(link);
      link.click();

      // Clean up
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);

      // Show success message
      toast.success("Resume downloaded successfully");

      // Reset state
      setDownloadingResume(false);
      setDownloadProgress(0);
    } catch (error) {
      logger.error("Error downloading resume:", error);
      toast.error("Failed to download resume: " + error.message);
      setDownloadingResume(false);
      setDownloadProgress(0);
    }
  };

  // Page animations
  const pageVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.5 } },
    exit: { opacity: 0, y: 20, transition: { duration: 0.3 } },
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoaderComponent size="large" />
      </div>
    );
  }

  if (error || !application) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Application Not Found</h2>
          <p className="text-gray-600 mb-6">
            The application you're looking for doesn't exist or you don't have permission to view it.
          </p>
          <button
            onClick={() => router.push("/profile/applications")}
            className="bg-violet-600 text-white px-6 py-3 rounded-lg hover:bg-violet-700 transition-colors"
          >
            Back to Applications
          </button>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8"
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => router.push("/profile/applications")}
          className="flex items-center text-violet-600 hover:text-violet-700 mb-6"
        >
          <ChevronLeft size={20} />
          <span>Back to Applications</span>
        </button>

        {/* Application Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Company Logo */}
            <div className="flex-shrink-0">
              <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100 border border-gray-200 flex items-center justify-center">
                {application.job?.company?.logo ? (
                  <Image
                    src={application.job.company.logo}
                    alt={application.job.company.name}
                    width={80}
                    height={80}
                    className="object-contain"
                  />
                ) : (
                  <Building size={32} className="text-gray-400" />
                )}
              </div>
            </div>

            {/* Job Details */}
            <div className="flex-1">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 mb-1">
                    {application.job?.title || "Job Title"}
                  </h1>
                  <div className="text-lg text-gray-600 mb-3">
                    {application.job?.company?.name || "Company Name"}
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-gray-500">
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
                    {application.job?.experienceLevel && (
                      <div className="flex items-center">
                        <Calendar size={16} className="mr-1" />
                        <span>{application.job.experienceLevel}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Status Badge */}
                <div>
                  <ApplicationStatusBadge status={application.status} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Application Details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Column - Application Info */}
          <div className="md:col-span-2 space-y-6">
            {/* Application Timeline */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Application Timeline</h2>
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center mr-3">
                    <Clock size={20} className="text-violet-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">Application Submitted</h3>
                    <p className="text-sm text-gray-500">
                      {formatDate(application.createdAt)}
                    </p>
                  </div>
                </div>

                {application.status !== "Pending" && (
                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                      <User size={20} className="text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">Application {application.status}</h3>
                      <p className="text-sm text-gray-500">
                        {application.updatedAt !== application.createdAt
                          ? formatDate(application.updatedAt)
                          : "Date not available"}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Resume */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Resume</h2>
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-gray-50">
                <div className="flex items-center">
                  <FileText size={24} className="text-gray-400 mr-3" />
                  <div>
                    <p className="font-medium text-gray-900">{application.resume?.name || "Resume"}</p>
                    <p className="text-sm text-gray-500">
                      {application.resume?.fileType || "Document"} •
                      {application.resume?.fileSize
                        ? ` ${Math.round(application.resume.fileSize / 1024)} KB`
                        : ""}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleResumeDownload}
                  disabled={downloadingResume}
                  className={`px-3 py-1.5 text-sm ${downloadingResume ? 'bg-gray-400' : 'bg-violet-600 hover:bg-violet-700'} text-white rounded-lg transition-colors flex items-center`}
                >
                  {downloadingResume ? (
                    <>
                      <div className="h-4 w-4 mr-2">
                        <LoaderComponent size="tiny" color="white" text="" />
                      </div>
                      {downloadProgress > 0 ? `${downloadProgress}%` : 'Downloading...'}
                    </>
                  ) : (
                    <>
                      <Download size={16} className="mr-1" />
                      Download
                    </>
                  )}
                </button>
              </div>
              {/* Preview button for PDFs */}
              {application.resume?.fileType === 'application/pdf' && (
                <div className="mt-3">
                  <button
                    onClick={() => {
                      // Get the API URL for downloading the resume
                      const token = localStorage.getItem('accessToken');
                      if (!token) {
                        toast.error("Authentication required");
                        return;
                      }

                      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5004/api/v1';
                      const previewUrl = `${baseUrl}/jobs/applications/${application._id}/resume?token=${encodeURIComponent(token)}`;

                      // Open in new tab
                      window.open(previewUrl, '_blank');
                    }}
                    className="text-sm text-violet-600 hover:text-violet-800 flex items-center"
                  >
                    <ExternalLink size={14} className="mr-1" />
                    Preview PDF in browser
                  </button>
                </div>
              )}
            </div>

            {/* Cover Letter */}
            {application.coverLetter && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Cover Letter</h2>
                <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                  <p className="text-gray-700 whitespace-pre-wrap">{application.coverLetter}</p>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Actions and Job Info */}
          <div className="space-y-6">
            {/* Application Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Actions</h2>
              <div className="space-y-3">
                {/* View Job button */}
                <a
                  href={`/jobs/${application.job?.slug}`}
                  className="w-full px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors flex items-center justify-center"
                >
                  <Briefcase size={16} className="mr-2" />
                  View Job Posting
                </a>

                {/* Withdraw button - only show for pending or reviewed applications */}
                {["Pending", "Reviewed"].includes(application.status) && (
                  <button
                    onClick={() => setWithdrawModalOpen(true)}
                    className="w-full px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors flex items-center justify-center"
                  >
                    <AlertTriangle size={16} className="mr-2" />
                    Withdraw Application
                  </button>
                )}

                {/* Share button */}
                <button
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({
                        title: `Job Application for ${application.job?.title}`,
                        text: `My job application for ${application.job?.title} at ${application.job?.company?.name}`,
                        url: window.location.href,
                      });
                    } else {
                      navigator.clipboard.writeText(window.location.href);
                      toast.success("Link copied to clipboard!");
                    }
                  }}
                  className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center"
                >
                  <Share2 size={16} className="mr-2" />
                  Share
                </button>
              </div>
            </div>

            {/* Job Details */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Job Details</h2>
              <div className="space-y-4">
                {/* Salary */}
                {application.job?.salary?.isVisible && (
                  <div className="flex items-start">
                    <DollarSign size={20} className="text-gray-400 mr-3 mt-0.5" />
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">Salary</h3>
                      <p className="text-sm text-gray-700">
                        {application.job.salary.min && application.job.salary.max
                          ? `${application.job.salary.currency} ${application.job.salary.min.toLocaleString()} - ${application.job.salary.max.toLocaleString()} / ${application.job.salary.period}`
                          : application.job.salary.min
                          ? `${application.job.salary.currency} ${application.job.salary.min.toLocaleString()} / ${application.job.salary.period}`
                          : "Not specified"}
                      </p>
                    </div>
                  </div>
                )}

                {/* Location Type */}
                {application.job?.locationType && (
                  <div className="flex items-start">
                    <MapPin size={20} className="text-gray-400 mr-3 mt-0.5" />
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">Location Type</h3>
                      <p className="text-sm text-gray-700">{application.job.locationType}</p>
                    </div>
                  </div>
                )}

                {/* Deadline */}
                {application.job?.deadline && (
                  <div className="flex items-start">
                    <Calendar size={20} className="text-gray-400 mr-3 mt-0.5" />
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">Application Deadline</h3>
                      <p className="text-sm text-gray-700">{formatDate(application.job.deadline)}</p>
                    </div>
                  </div>
                )}

                {/* Contact */}
                {application.job?.applicationEmail && (
                  <div className="flex items-start">
                    <Mail size={20} className="text-gray-400 mr-3 mt-0.5" />
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">Contact Email</h3>
                      <a
                        href={`mailto:${application.job.applicationEmail}`}
                        className="text-sm text-violet-600 hover:text-violet-700"
                      >
                        {application.job.applicationEmail}
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Withdraw Confirmation Modal */}
      <WithdrawModal
        isOpen={withdrawModalOpen}
        onClose={() => setWithdrawModalOpen(false)}
        onConfirm={handleWithdraw}
        application={application}
      />
    </motion.div>
  );
};

export default withAuth(ApplicationDetailPage);
