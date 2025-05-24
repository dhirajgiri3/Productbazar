"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/contexts/auth-context";
import { useJob } from "@/lib/contexts/job-context";
import JobEditForm from "./JobEditForm";
import LoaderComponent from "Components/UI/LoaderComponent";

export default function EditJobPage() {
  const { jobId } = useParams();
  const { user, authLoading, isInitialized } = useAuth();
  const { getJobById, loading: jobLoading, error, setError } = useJob();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (authLoading || !isInitialized) {
      return;
    }

    const checkPermissionsAndFetchJob = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!user) {
          toast.error("Please log in to edit a job", { icon: '🔑' });
          router.push(`/auth/login?redirect=/user/myjobs/edit/${jobId}`);
          return;
        }

        // Check if user has permission to post jobs
        if (user.roleCapabilities && !user.roleCapabilities.canPostJobs) {
          toast.error("Your account type doesn't have permission to edit jobs", { icon: '🚫' });
          router.push("/user/myjobs");
          return;
        }

        // Fetch job details
        const jobData = await getJobById(jobId);
        
        if (!jobData) {
          setError("Job not found");
          return;
        }

        // Check if user is the job poster
        if (jobData.poster.toString() !== user._id.toString() && user.role !== "admin") {
          toast.error("You don't have permission to edit this job", { icon: '🚫' });
          router.push("/user/myjobs");
          return;
        }

        setJob(jobData);
      } catch (err) {
        console.error("Error fetching job:", err);
        setError("Failed to load job details");
        toast.error("Failed to load job details");
      } finally {
        setLoading(false);
      }
    };

    checkPermissionsAndFetchJob();
  }, [jobId, user, router, authLoading, isInitialized, getJobById, setError]);

  if (loading || authLoading || !isInitialized || jobLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoaderComponent size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.push("/user/myjobs")}
            className="bg-violet-600 text-white px-6 py-3 rounded-lg hover:bg-violet-700 transition-colors"
          >
            Back to My Jobs
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white py-12 px-4">
      <motion.div
        className="max-w-5xl mx-auto"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {job ? (
          <JobEditForm job={job} />
        ) : (
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Job Not Found</h2>
            <p className="text-gray-600 mb-6">The job you're trying to edit could not be found.</p>
            <button
              onClick={() => router.push("/user/myjobs")}
              className="bg-violet-600 text-white px-6 py-3 rounded-lg hover:bg-violet-700 transition-colors"
            >
              Back to My Jobs
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
