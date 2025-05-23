"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Briefcase,
  MapPin,
  Clock,
  DollarSign,
  Calendar,
  Users,
  Building,
  ExternalLink,
  Mail,
  Share2,
  ChevronLeft,
  CheckCircle,
  XCircle,
  Upload,
  FileText,
  Paperclip,
  AlertCircle
} from "lucide-react";
import { useAuth } from "@/lib/contexts/auth-context";
import { makePriorityRequest } from "@/lib/api/api";
import logger from "@/lib/utils/logger";
import LoaderComponent from "Components/UI/LoaderComponent";
import { toast } from "react-hot-toast";
import Link from "next/link";

export default function JobDetailPage({ slug }) {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [applying, setApplying] = useState(false);
  const [resume, setResume] = useState(null);
  const [coverLetter, setCoverLetter] = useState("");
  const [showApplyForm, setShowApplyForm] = useState(false);
  const [applicationSubmitted, setApplicationSubmitted] = useState(false);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [showStickyApply, setShowStickyApply] = useState(false);

  // Track scroll position for sticky apply button
  useEffect(() => {
    const handleScroll = () => {
      setScrollPosition(window.scrollY);
      setShowStickyApply(window.scrollY > 400);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const fetchJob = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await makePriorityRequest('get', `/jobs/${slug}`);

      if (response.data.status === "success") {
        setJob(response.data.data.job);
        // Set page title
        document.title = `${response.data.data.job.title} at ${response.data.data.job.company?.name || 'Company'} | ProductBazar`;
      } else {
        setError("Failed to fetch job details");
      }
    } catch (error) {
      if (error.name === 'CanceledError' || error.code === 'ERR_CANCELED') {
        logger.warn(`Request for job ${slug} was canceled, retrying...`);
        setTimeout(() => {
          fetchJob();
        }, 500);
        return;
      }

      logger.error(`Error fetching job ${slug}:`, error);
      setError("Failed to fetch job details");
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    if (slug) {
      fetchJob();
    }
  }, [slug, fetchJob]);

  const formatSalary = (salary) => {
    if (!salary || (!salary.min && !salary.max)) return "Not specified";

    const formatNumber = (num) =>
      new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: salary.currency || 'USD',
        maximumFractionDigits: 0
      }).format(num);

    if (salary.min && salary.max) {
      return `${formatNumber(salary.min)} - ${formatNumber(salary.max)} ${salary.period || 'Yearly'}`;
    } else if (salary.min) {
      return `From ${formatNumber(salary.min)} ${salary.period || 'Yearly'}`;
    } else if (salary.max) {
      return `Up to ${formatNumber(salary.max)} ${salary.period || 'Yearly'}`;
    }

    return "Not specified";
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Not specified";

    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  };

  const timeSincePosting = (dateString) => {
    if (!dateString) return "";
    
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return "Today";
    if (diffInDays === 1) return "Yesterday";
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} months ago`;
    return `${Math.floor(diffInDays / 365)} years ago`;
  };

  const handleApplyButtonClick = () => {
    if (!isAuthenticated()) {
      toast.error("Please log in to apply for this job");
      router.push(`/auth/login?redirect=/jobs/${slug}`);
      return;
    }

    if (!user.roleCapabilities?.canApplyToJobs) {
      toast.error("Your account type doesn't have permission to apply for jobs");
      return;
    }

    setShowApplyForm(!showApplyForm);
    
    if (!showApplyForm) {
      // Scroll to the form smoothly
      setTimeout(() => {
        document.getElementById('application-form')?.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }, 100);
    }
  };

  const handleApply = async (e) => {
    e.preventDefault();

    if (!isAuthenticated()) {
      toast.error("Please log in to apply for this job");
      router.push(`/auth/login?redirect=/jobs/${slug}`);
      return;
    }

    if (!user.roleCapabilities?.canApplyToJobs) {
      toast.error("Your account type doesn't have permission to apply for jobs");
      return;
    }

    if (!resume) {
      toast.error("Please upload your resume");
      return;
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(resume.type)) {
      toast.error("Please upload a valid resume file (PDF, DOC, or DOCX)");
      logger.warn(`Invalid resume file type: ${resume.type}`);
      return;
    }

    logger.info(`Resume file type: ${resume.type}, size: ${resume.size} bytes`);

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (resume.size > maxSize) {
      toast.error("Resume file size must be less than 5MB");
      logger.warn(`Resume file size exceeds maximum allowed (${maxSize/1024/1024}MB)`);
      return;
    }

    try {
      setApplying(true);
      const toastId = toast.loading("Submitting your application...");

      const formData = new FormData();
      formData.append("resume", resume);
      
      logger.info(`Appending resume to FormData: ${resume.name} (${resume.type}, ${resume.size} bytes)`);

      // Add data field with JSON string for additional fields
      const jsonData = {
        coverLetter: coverLetter.trim(),
        resumeInfo: {
          name: resume.name,
          type: resume.type,
          size: resume.size
        }
      };

      formData.append("data", JSON.stringify(jsonData));
      logger.info('FormData prepared successfully');

      logger.info(`Sending job application to: /jobs/${job._id}/apply`);
      const response = await makePriorityRequest('post', `/jobs/${job._id}/apply`, {
        data: formData,
        headers: {
          "Content-Type": "multipart/form-data",
          "Accept": "application/json"
        },
        isFormData: true,
        timeout: 30000 // Increase timeout for file uploads
      });

      logger.info('Job application API response received');

      if (response.data.status === "success") {
        toast.dismiss(toastId);
        toast.success("Application submitted successfully!");
        setApplicationSubmitted(true);
        setShowApplyForm(false);
        setCoverLetter("");
        setResume(null);
        
        // Scroll to success message
        setTimeout(() => {
          document.getElementById('success-message')?.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
          });
        }, 100);
      } else {
        toast.dismiss(toastId);
        toast.error(response.data.message || "Failed to submit application");
      }
    } catch (error) {
      toast.dismiss();
      logger.error("Error applying for job:", error);

      // Handle different error types
      if (error.name === 'CanceledError' || error.code === 'ERR_CANCELED') {
        logger.warn(`Application request for job ${job._id} was canceled, retrying...`);
        setTimeout(() => {
          handleApply(e);
        }, 500);
        return;
      }

      const errorMessage = error.response?.data?.message || "Failed to submit application";
      toast.error(errorMessage);
    } finally {
      setApplying(false);
    }
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: job.title,
          text: `Check out this job: ${job.title} at ${job.company?.name}`,
          url: window.location.href,
        });
        logger.info(`Shared job ${job._id} using Web Share API`);
      } else {
        // Fallback to copying to clipboard
        await navigator.clipboard.writeText(window.location.href);
        toast.success("Link copied to clipboard!");
        logger.info(`Copied job ${job._id} link to clipboard`);
      }
    } catch (error) {
      // Ignore user cancellation errors
      if (error.name === 'AbortError') {
        logger.info('User canceled sharing');
        return;
      }

      logger.error("Error sharing job:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <LoaderComponent size="large" />
          <p className="mt-4 text-gray-600">Loading job details...</p>
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={32} className="text-gray-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Job Not Found</h2>
          <p className="text-gray-600 mb-6">
            The job you're looking for doesn't exist or has been removed.
          </p>
          <Link
            href="/jobs"
            className="inline-flex items-center justify-center bg-violet-600 text-white px-6 py-3 rounded-lg hover:bg-violet-700 transition-colors"
          >
            <Briefcase size={18} className="mr-2" />
            Browse All Jobs
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-8 pb-16">
      {/* Sticky Apply Button */}
      <AnimatePresence>
        {showStickyApply && !applicationSubmitted && (
          <motion.div 
            className="fixed bottom-0 left-0 right-0 bg-white shadow-lg border-t border-gray-200 py-3 px-4 z-50"
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            transition={{ duration: 0.3 }}
          >
            <div className="max-w-5xl mx-auto flex items-center justify-between">
              <div className="flex-1 truncate pr-4">
                <h3 className="text-base font-medium text-gray-900 truncate">{job.title}</h3>
                <p className="text-sm text-gray-500 truncate">{job.company?.name}</p>
              </div>
              <button
                onClick={handleApplyButtonClick}
                className="flex-shrink-0 bg-violet-600 text-white px-6 py-2 rounded-lg hover:bg-violet-700 transition-colors flex items-center justify-center gap-2"
              >
                <Briefcase size={16} />
                Apply Now
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-5xl mx-auto px-4">
        {/* Breadcrumbs and Back Button */}
        <motion.div 
          className="mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex flex-wrap items-center text-sm text-gray-500 mb-2">
            <Link href="/" className="hover:text-violet-600">Home</Link>
            <span className="mx-2">›</span>
            <Link href="/jobs" className="hover:text-violet-600">Jobs</Link>
            <span className="mx-2">›</span>
            <span className="text-gray-900">{job.title}</span>
          </div>
          <button
            onClick={() => router.push("/jobs")}
            className="flex items-center text-gray-600 hover:text-violet-700 transition-colors"
          >
            <ChevronLeft size={18} className="mr-1" />
            Back to Jobs
          </button>
        </motion.div>

        {/* Success Message */}
        {applicationSubmitted && (
          <motion.div
            id="success-message"
            className="bg-green-50 border border-green-100 rounded-xl p-8 mb-8 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={32} className="text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Application Submitted!</h2>
            <p className="text-gray-600 mb-6">
              Your application for <span className="font-semibold">{job.title}</span> at <span className="font-semibold">{job.company?.name}</span> has been successfully submitted.
            </p>
            <p className="text-gray-500 text-sm mb-6">
              The employer will review your application and contact you if they're interested. You can check the status of your applications in your profile.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/jobs"
                className="px-6 py-3 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Browse More Jobs
              </Link>
              <Link
                href="/profile/applications"
                className="px-6 py-3 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors"
              >
                View My Applications
              </Link>
            </div>
          </motion.div>
        )}

        {/* Job Header */}
        <motion.div
          className="bg-white rounded-xl shadow-sm p-8 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex flex-col md:flex-row gap-6">
            {/* Company Logo */}
            <div className="flex-shrink-0 flex items-center justify-center">
              <div className="w-20 h-20 bg-gray-100 rounded-xl flex items-center justify-center overflow-hidden border border-gray-200">
                {job.company?.logo ? (
                  <img
                    src={job.company.logo}
                    alt={`${job.company.name} logo`}
                    className="w-full h-full object-contain p-2"
                  />
                ) : (
                  <Building size={32} className="text-gray-400" />
                )}
              </div>
            </div>

            {/* Job Title and Company */}
            <div className="flex-1">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="flex items-center">
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">{job.title}</h1>
                    <span className="ml-3 px-3 py-1 rounded-full text-xs font-medium bg-violet-100 text-violet-800">
                      {job.jobType || "Full-Time"}
                    </span>
                  </div>
                  <div className="flex items-center text-gray-600 mb-2">
                    <Building size={16} className="mr-1 text-gray-500" />
                    <span className="mr-3">{job.company?.name || "Company"}</span>
                    <MapPin size={16} className="mr-1 text-gray-500" />
                    <span>{job.location || job.locationType || "Location not specified"}</span>
                  </div>
                </div>
                <div className="mt-4 md:mt-0">
                  <span className="text-sm text-gray-500 flex items-center">
                    <Clock size={14} className="mr-1.5" />
                    Posted {timeSincePosting(job.createdAt)}
                  </span>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center bg-gray-50 p-3 rounded-lg">
                  <DollarSign className="h-5 w-5 text-violet-600 mr-2" />
                  <div>
                    <h3 className="text-xs text-gray-500">Salary</h3>
                    <p className="font-medium">{formatSalary(job.salary)}</p>
                  </div>
                </div>
                <div className="flex items-center bg-gray-50 p-3 rounded-lg">
                  <Users className="h-5 w-5 text-violet-600 mr-2" />
                  <div>
                    <h3 className="text-xs text-gray-500">Experience</h3>
                    <p className="font-medium">{job.experienceLevel || "Not specified"}</p>
                  </div>
                </div>
              </div>

              {/* Apply and Share Buttons */}
              <div className="flex flex-wrap gap-4 mt-6">
                {applicationSubmitted ? (
                  <button
                    className="bg-green-100 text-green-800 border border-green-200 px-6 py-3 rounded-lg flex items-center justify-center gap-2 cursor-default"
                    disabled
                  >
                    <CheckCircle size={18} />
                    Application Submitted
                  </button>
                ) : (
                  <button
                    onClick={handleApplyButtonClick}
                    className="bg-violet-600 text-white px-6 py-3 rounded-lg hover:bg-violet-700 shadow-md hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2"
                  >
                    <Briefcase size={18} />
                    Apply Now
                  </button>
                )}
                <button
                  onClick={handleShare}
                  className="bg-white text-gray-700 border border-gray-300 px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                >
                  <Share2 size={18} />
                  Share
                </button>
                {job.applicationUrl && (
                  <a
                    href={job.applicationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-white text-blue-600 border border-blue-200 px-6 py-3 rounded-lg hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
                  >
                    <ExternalLink size={18} />
                    Apply on Website
                  </a>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Application Form */}
        <AnimatePresence>
          {showApplyForm && (
            <motion.div
              id="application-form"
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 mb-8"
              initial={{ opacity: 0, height: 0, marginBottom: 0 }}
              animate={{ opacity: 1, height: "auto", marginBottom: 32 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              transition={{ duration: 0.3 }}
            >
              <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
                <FileText size={20} className="mr-2 text-violet-600" />
                Apply for {job.title}
              </h2>
              <form onSubmit={handleApply} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Resume/CV*
                  </label>
                  <div className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${resume ? 'border-green-300 bg-green-50' : 'border-gray-300 hover:border-violet-300 hover:bg-violet-50'}`}>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setResume(e.target.files[0]);
                        }
                      }}
                      className="hidden"
                      id="resume-upload"
                    />
                    <label
                      htmlFor="resume-upload"
                      className="cursor-pointer flex flex-col items-center"
                    >
                      {resume ? (
                        <>
                          <CheckCircle size={24} className="mb-2 text-green-500" />
                          <div className="flex items-center">
                            <span className="text-green-700 font-medium mr-2">{resume.name}</span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setResume(null);
                              }}
                              className="text-red-500 hover:text-red-700 text-sm"
                            >
                              (Remove)
                            </button>
                          </div>
                          <span className="text-xs text-gray-500 mt-1">
                            {(resume.size / (1024 * 1024)).toFixed(2)} MB
                          </span>
                        </>
                      ) : (
                        <>
                          <Upload size={24} className="mb-2 text-violet-500" />
                          <span className="text-gray-700">
                            Click to upload your resume (PDF, DOC, DOCX)
                          </span>
                          <span className="text-xs text-gray-500 mt-1">
                            Max file size: 5MB
                          </span>
                        </>
                      )}
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cover Letter (Optional)
                  </label>
                  <div className="relative">
                    <textarea
                      value={coverLetter}
                      onChange={(e) => setCoverLetter(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-all"
                      rows={6}
                      placeholder="Tell us why you're a good fit for this position..."
                    />
                    <div className="absolute bottom-2 right-2 text-xs text-gray-500">
                      {coverLetter.length} characters
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    A good cover letter can significantly increase your chances of getting an interview.
                  </p>
                </div>

                <div className="bg-gray-50 -mx-8 -mb-8 px-8 py-4 mt-8 border-t border-gray-200 flex flex-col sm:flex-row justify-end gap-4">
                  <button
                    type="button"
                    onClick={() => setShowApplyForm(false)}
                    className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors order-2 sm:order-1"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={applying || !resume}
                    className="bg-violet-600 text-white px-6 py-3 rounded-lg hover:bg-violet-700 disabled:bg-gray-400 transition-colors flex items-center justify-center gap-2 order-1 sm:order-2"
                  >
                    {applying ? (
                      <>
                        <div className="w-5 h-5 border-t-2 border-r-2 border-white rounded-full animate-spin mr-2"></div>
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Paperclip size={18} />
                        Submit Application
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Job Details */}
          <motion.div
            className="md:col-span-2 space-y-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            {/* Job Description */}
            <div className="bg-white rounded-xl shadow-sm p-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
                <FileText size={20} className="mr-2 text-violet-600" />
                Job Description
              </h2>
              <div
                className="prose max-w-none text-gray-700"
                dangerouslySetInnerHTML={{ __html: job.description }}
              />
            </div>

            {/* Requirements */}
            <div className="bg-white rounded-xl shadow-sm p-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
                <CheckCircle size={20} className="mr-2 text-violet-600" />
                Requirements
              </h2>
              <ul className="space-y-3 text-gray-700">
                {job.requirements && job.requirements.length > 0 
                  ? job.requirements.map((requirement, index) => (
                    <li key={index} className="flex items-start">
                      <CheckCircle size={16} className="text-green-500 mr-3 mt-1 flex-shrink-0" />
                      <span>{requirement}</span>
                    </li>
                  ))
                  : (
                    <li dangerouslySetInnerHTML={{ __html: `<ul><li>Vulnero sustineo cometes tui repellendus.</li><li>Tum ventito ultio arbor cognatus.</li><li>Utrimque tyrannus animi paens decerno.</li><li>Calco cedo custodia varietas repellat.</li></ul>` }} />
                  )
                }
              </ul>
            </div>

            {/* Responsibilities */}
            <div className="bg-white rounded-xl shadow-sm p-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
                <Briefcase size={20} className="mr-2 text-violet-600" />
                Responsibilities
              </h2>
              <ul className="space-y-3 text-gray-700">
                {job.responsibilities && job.responsibilities.length > 0 
                  ? job.responsibilities.map((responsibility, index) => (
                    <li key={index} className="flex items-start">
                      <CheckCircle size={16} className="text-green-500 mr-3 mt-1 flex-shrink-0" />
                      <span>{responsibility}</span>
                    </li>
                  ))
                  : (
                    <li dangerouslySetInnerHTML={{ __html: `<ul><li>Vulnero sustineo cometes tui repellendus.</li><li>Tum ventito ultio arbor cognatus.</li><li>Utrimque tyrannus animi paens decerno.</li><li>Calco cedo custodia varietas repellat.</li></ul>` }} />
                  )
                }
              </ul>
            </div>

            {/* Application Instructions */}
            <div className="bg-white rounded-xl shadow-sm p-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
                <FileText size={20} className="mr-2 text-violet-600" />
                Application Instructions
              </h2>
              <div className="text-gray-700">
                {job.applicationInstructions ? (
                  <p>{job.applicationInstructions}</p>
                ) : (
                  <div dangerouslySetInnerHTML={{ __html: `<p>Apparatus cubitum deserunt advenio pecco in vicinus aeger vulnero. Rem tenuis sordeo repellat assumenda texo incidunt perferendis. Caelum cohibeo ambitus valens aliqua absum facere explicabo vapulus. Defetiscor velut valde varietas altus capto dedecor dolore. Demulceo versus angelus attero astrum ipsam uxor demonstro. Consuasor censura bos cupiditas cui.</p>` }} />
                )}
              </div>
            </div>

            {/* Benefits */}
            {job.benefits && job.benefits.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm p-8">
                <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
                  <CheckCircle size={20} className="mr-2 text-violet-600" />
                  Benefits
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {job.benefits.map((benefit, index) => (
                    <div 
                      key={index} 
                      className="flex items-center bg-green-50 p-3 rounded-lg border border-green-100"
                    >
                      <CheckCircle size={16} className="text-green-500 mr-3 flex-shrink-0" />
                      <span className="text-green-800">{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>

          {/* Sidebar */}
          <motion.div
            className="space-y-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            {/* Job Overview */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <FileText size={18} className="mr-2 text-violet-600" />
                Job Overview
              </h2>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <Briefcase size={18} className="text-violet-600 mr-3 mt-0.5" />
                  <div>
                    <span className="block text-sm text-gray-500">Job Type</span>
                    <span className="font-medium">{job.jobType || "Not specified"}</span>
                  </div>
                </li>
                <li className="flex items-start">
                  <MapPin size={18} className="text-violet-600 mr-3 mt-0.5" />
                  <div>
                    <span className="block text-sm text-gray-500">Location Type</span>
                    <span className="font-medium">{job.locationType || "Not specified"}</span>
                  </div>
                </li>
                <li className="flex items-start">
                  <Users size={18} className="text-violet-600 mr-3 mt-0.5" />
                  <div>
                    <span className="block text-sm text-gray-500">Experience Level</span>
                    <span className="font-medium">{job.experienceLevel || "Not specified"}</span>
                  </div>
                </li>
                {job.salary?.isVisible && (
                  <li className="flex items-start">
                    <DollarSign size={18} className="text-violet-600 mr-3 mt-0.5" />
                    <div>
                      <span className="block text-sm text-gray-500">Salary</span>
                      <span className="font-medium">{formatSalary(job.salary)}</span>
                    </div>
                  </li>
                )}
                {job.deadline && (
                  <li className="flex items-start">
                    <Calendar size={18} className="text-violet-600 mr-3 mt-0.5" />
                    <div>
                      <span className="block text-sm text-gray-500">Application Deadline</span>
                      <span className="font-medium">{formatDate(job.deadline)}</span>
                    </div>
                  </li>
                )}
              </ul>
            </div>

            {/* Skills */}
            {job.skills && job.skills.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <Briefcase size={18} className="mr-2 text-violet-600" />
                  Required Skills
                </h2>
                <div className="flex flex-wrap gap-2">
                  {job.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="bg-violet-50 text-violet-700 px-3 py-1.5 rounded-full text-sm font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Company Information */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <Building size={18} className="mr-2 text-violet-600" />
                About the Company
              </h2>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <Building size={18} className="text-violet-600 mr-3 mt-0.5" />
                  <div>
                    <span className="block text-sm text-gray-500">Company Name</span>
                    <span className="font-medium">{job.company?.name || "Not specified"}</span>
                  </div>
                </li>
                {job.company?.industry && (
                  <li className="flex items-start">
                    <Briefcase size={18} className="text-violet-600 mr-3 mt-0.5" />
                    <div>
                      <span className="block text-sm text-gray-500">Industry</span>
                      <span className="font-medium">{job.company.industry}</span>
                    </div>
                  </li>
                )}
                {job.company?.size && (
                  <li className="flex items-start">
                    <Users size={18} className="text-violet-600 mr-3 mt-0.5" />
                    <div>
                      <span className="block text-sm text-gray-500">Company Size</span>
                      <span className="font-medium">{job.company.size}</span>
                    </div>
                  </li>
                )}
                {job.company?.website && (
                  <li className="flex items-start">
                    <ExternalLink size={18} className="text-violet-600 mr-3 mt-0.5" />
                    <div>
                      <span className="block text-sm text-gray-500">Website</span>
                      <a
                        href={job.company.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-violet-600 hover:underline"
                      >
                        Visit Website
                      </a>
                    </div>
                  </li>
                )}
              </ul>
              
              {/* Company description - if available */}
              {job.company?.description && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-sm text-gray-600">{job.company.description}</p>
                </div>
              )}
            </div>

            {/* Contact Information */}
            {job.applicationEmail && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <Mail size={18} className="mr-2 text-violet-600" />
                  Contact Information
                </h2>
                <div>
                  <a
                    href={`mailto:${job.applicationEmail}?subject=Application for ${job.title}`}
                    className="w-full bg-blue-50 text-blue-700 border border-blue-100 px-4 py-3 rounded-lg hover:bg-blue-100 transition-colors flex items-center justify-center gap-2 mt-2"
                  >
                    <Mail size={18} />
                    {job.applicationEmail}
                  </a>
                </div>
              </div>
            )}

            {/* Similar Jobs - Placeholder */}
            <div className="bg-white rounded-xl shadow-sm p-6 border-t-4 border-violet-500">
              <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <Briefcase size={18} className="mr-2 text-violet-600" />
                Similar Jobs
              </h2>
              <div className="text-center py-4">
                <p className="text-gray-500 text-sm">Looking for similar opportunities?</p>
                <Link
                  href="/jobs"
                  className="mt-3 inline-flex items-center text-violet-600 hover:text-violet-700"
                >
                  Browse all jobs
                  <ChevronLeft size={16} className="ml-1 rotate-180" />
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}