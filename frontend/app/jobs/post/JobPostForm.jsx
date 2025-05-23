"use client";

import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";
import {
  Briefcase,
  MapPin,
  Clock,
  DollarSign,
  Calendar,
  Users,
  CheckCircle,
  Upload,
  X,
  Image as ImageIcon,
  AlertCircle,
  Info,
  Loader2,
  FileText,
  ListChecks,
  Award,
  Heart,
  ChevronRight
} from "lucide-react";
import { useDropzone } from "react-dropzone";
import { useAuth } from "@/lib/contexts/auth-context";
import api from "@/lib/api/api";
import logger from "@/lib/utils/logger";
import RichTextEditor from "./components/RichTextEditor";
import SkillsInput from "./components/SkillsInput";
import JobPostHeader from "./components/JobPostHeader";

const JobPostForm = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [companyLogo, setCompanyLogo] = useState(null);
  const [formComplete, setFormComplete] = useState(false);
  const [createdJobSlug, setCreatedJobSlug] = useState(null);
  const [activeSection, setActiveSection] = useState(0);
  
  // Sections for progress tracking
  const sections = [
    { name: "Job Basics", icon: <Briefcase size={16} /> },
    { name: "Company", icon: <Users size={16} /> },
    { name: "Job Details", icon: <FileText size={16} /> },
    { name: "Salary", icon: <DollarSign size={16} /> },
    { name: "Application", icon: <Clock size={16} /> }
  ];

  // Helper function to process rich text content
  const processRichTextContent = (htmlContent) => {
    if (!htmlContent) return [];

    // Convert HTML to plain text list items
    return htmlContent.split("<p>").filter(p => p.trim()).map(p => {
      return p.replace(/<\/p>/g, "").replace(/<br\/?>/g, "").replace(/&nbsp;/g, " ").trim();
    }).filter(Boolean);
  };

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, dirtyFields },
    watch,
    trigger,
  } = useForm({
    defaultValues: {
      title: "",
      company: {
        name: user?.companyName || "",
        size: user?.companySize || "",
        industry: user?.industry || "",
        website: user?.companyWebsite || "",
      },
      location: "",
      locationType: "Remote",
      jobType: "Full-time",
      description: "",
      requirements: "",
      responsibilities: "",
      skills: "",
      experienceLevel: "Mid-Level",
      salary: {
        min: "",
        max: "",
        currency: "USD",
        period: "Yearly",
        isVisible: true,
      },
      applicationUrl: "",
      applicationEmail: user?.email || "",
      applicationInstructions: "",
      benefits: "",
      deadline: "",
      status: "Published",
    },
    mode: "onChange",
  });

  // Calculate progress for progress bar
  const formValues = watch();
  const calculateProgress = () => {
    const totalFields = Object.keys(formValues).length;
    const filledFields = Object.keys(dirtyFields).length;
    return Math.min(Math.round((filledFields / totalFields) * 100), 100);
  };

  const { getRootProps, getInputProps } = useDropzone({
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.svg', '.webp']
    },
    multiple: false,
    onDrop: (files) => {
      if (files[0]) {
        setCompanyLogo(files[0]);
      }
    },
  });

  const onSubmit = async (data) => {
    try {
      setIsSubmitting(true);

      // Format data for submission
      const formattedData = {
        ...data,
        // Convert HTML content to appropriate format
        description: data.description || "",
        requirements: processRichTextContent(data.requirements),
        responsibilities: processRichTextContent(data.responsibilities),
        skills: data.skills.split(",").map(skill => skill.trim()).filter(Boolean),
        benefits: processRichTextContent(data.benefits),
        applicationInstructions: data.applicationInstructions || "",
      };

      // Create FormData for file upload
      const formData = new FormData();

      // Add JSON data
      formData.append("data", JSON.stringify(formattedData));

      // Add company logo if exists
      if (companyLogo) {
        formData.append("logo", companyLogo);
      }

      const response = await api.post("/jobs", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.data.status === "success") {
        setCreatedJobSlug(response.data.data.job.slug);
        setFormComplete(true);
        toast.success("Job posted successfully!");
      } else {
        toast.error(response.data.message || "Failed to post job");
      }
    } catch (error) {
      logger.error("Error posting job:", error);
      toast.error(error.response?.data?.message || "Failed to post job");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (formComplete) {
    return (
      <AnimatePresence mode="wait">
        <div className="max-w-4xl mx-auto py-10">
          <motion.div
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 max-w-md mx-auto text-center"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            key="job-post-success"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
              className="w-20 h-20 mx-auto bg-emerald-50 rounded-full flex items-center justify-center mb-6"
            >
              <CheckCircle size={32} className="text-emerald-500" />
            </motion.div>
            <h1 className="text-2xl font-bold text-gray-900 mb-3">Job Posted!</h1>
            <p className="text-gray-600 mb-8 text-sm">
              Your job has been posted successfully and is now visible to potential candidates.
            </p>
            <div className="flex flex-col space-y-3">
              <motion.button
                onClick={() => router.push(`/jobs/${createdJobSlug}`)}
                className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                <Briefcase size={16} />
                View Job Posting
              </motion.button>
              <motion.button
                onClick={() => router.push("/jobs")}
                className="text-gray-700 px-5 py-2.5 rounded-lg hover:bg-gray-50 transition-colors border border-gray-200 flex items-center justify-center gap-2 text-sm font-medium"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                <Users size={16} />
                Browse All Jobs
              </motion.button>
            </div>
          </motion.div>
        </div>
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence mode="wait">
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-0">
        <JobPostHeader />
        
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-sm font-medium text-gray-700">Your progress</h2>
            <span className="text-xs text-gray-500">{calculateProgress()}% complete</span>
          </div>
          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-indigo-600 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${calculateProgress()}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          
          {/* Section Indicators */}
          <div className="mt-6 flex justify-between">
            {sections.map((section, index) => (
              <button
                key={index}
                onClick={() => {
                  trigger();
                  setActiveSection(index);
                }}
                className={`flex flex-col items-center transition-all duration-300 group ${
                  activeSection === index ? "text-indigo-600" : "text-gray-400 hover:text-gray-700"
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 transition-all duration-300 ${
                  activeSection === index 
                    ? "bg-indigo-50 text-indigo-600 ring-2 ring-indigo-100" 
                    : "bg-gray-50 group-hover:bg-gray-100"
                }`}>
                  {section.icon}
                </div>
                <span className="text-xs font-medium">{section.name}</span>
              </button>
            ))}
          </div>
        </div>

        <motion.div
          className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          key="job-post-form"
        >
          <form onSubmit={handleSubmit(onSubmit)} className="divide-y divide-gray-100">
            {/* Job Basics Section */}
            <div className={`p-6 transition-all duration-300 ${activeSection === 0 ? 'block' : 'hidden'}`}>
              <h2 className="text-lg font-medium text-gray-800 flex items-center pb-4 mb-5 border-b border-gray-100">
                <Briefcase className="mr-2 text-indigo-500" size={20} />
                Job Basics
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Job Title <span className="text-red-500 ml-1">*</span>
                  </label>
                  <input
                    {...register("title", { required: "Job title is required" })}
                    className={`w-full px-4 py-2.5 text-sm border rounded-lg focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-all duration-200 ${
                      errors.title ? "border-red-300 bg-red-50" : "border-gray-200 hover:border-indigo-300"
                    }`}
                    placeholder="e.g. Senior Frontend Developer"
                  />
                  {errors.title && (
                    <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle size={12} />
                      {errors.title.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Experience Level
                  </label>
                  <select
                    {...register("experienceLevel")}
                    className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-all duration-200 hover:border-indigo-300 appearance-none bg-white bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIiIGhlaWdodD0iOCIgdmlld0JveD0iMCAwIDEyIDgiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxwYXRoIGQ9Ik02IDcuNUwwLjgwMzg0OSAyLjVMMTEuMTk2MiAyLjVMNiA3LjVaIiBmaWxsPSIjNkI3MjgwIi8+Cjwvc3ZnPgo=')] bg-[center_right_1rem] bg-no-repeat"
                  >
                    <option value="Entry Level">Entry Level</option>
                    <option value="Junior">Junior</option>
                    <option value="Mid-Level">Mid-Level</option>
                    <option value="Senior">Senior</option>
                    <option value="Executive">Executive</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Job Type
                  </label>
                  <select
                    {...register("jobType")}
                    className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-all duration-200 hover:border-indigo-300 appearance-none bg-white bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIiIGhlaWdodD0iOCIgdmlld0JveD0iMCAwIDEyIDgiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxwYXRoIGQ9Ik02IDcuNUwwLjgwMzg0OSAyLjVMMTEuMTk2MiAyLjVMNiA3LjVaIiBmaWxsPSIjNkI3MjgwIi8+Cjwvc3ZnPgo=')] bg-[center_right_1rem] bg-no-repeat"
                  >
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Contract">Contract</option>
                    <option value="Freelance">Freelance</option>
                    <option value="Internship">Internship</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Location Type
                  </label>
                  <select
                    {...register("locationType")}
                    className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-all duration-200 hover:border-indigo-300 appearance-none bg-white bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIiIGhlaWdodD0iOCIgdmlld0JveD0iMCAwIDEyIDgiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxwYXRoIGQ9Ik02IDcuNUwwLjgwMzg0OSAyLjVMMTEuMTk2MiAyLjVMNiA3LjVaIiBmaWxsPSIjNkI3MjgwIi8+Cjwvc3ZnPgo=')] bg-[center_right_1rem] bg-no-repeat"
                  >
                    <option value="Remote">Remote</option>
                    <option value="On-site">On-site</option>
                    <option value="Hybrid">Hybrid</option>
                    <option value="Flexible">Flexible</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Location
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-2.5 text-gray-400" size={16} />
                    <input
                      {...register("location")}
                      className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-all duration-200 hover:border-indigo-300"
                      placeholder="e.g. San Francisco, CA (or Remote)"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Application Deadline
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-2.5 text-gray-400" size={16} />
                    <input
                      type="date"
                      {...register("deadline")}
                      className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-all duration-200 hover:border-indigo-300"
                    />
                  </div>
                </div>
              </div>
              
              <div className="mt-6 text-right">
                <motion.button 
                  type="button"
                  onClick={() => {
                    trigger("title");
                    if (!errors.title) setActiveSection(1);
                  }}
                  className="inline-flex items-center gap-1 bg-gray-50 hover:bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  Next: Company Info
                  <ChevronRight size={16} />
                </motion.button>
              </div>
            </div>

            {/* Company Information */}
            <div className={`p-6 transition-all duration-300 ${activeSection === 1 ? 'block' : 'hidden'}`}>
              <h2 className="text-lg font-medium text-gray-800 flex items-center pb-4 mb-5 border-b border-gray-100">
                <Users className="mr-2 text-indigo-500" size={20} />
                Company Information
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Company Name <span className="text-red-500 ml-1">*</span>
                  </label>
                  <input
                    {...register("company.name", { required: "Company name is required" })}
                    className={`w-full px-4 py-2.5 text-sm border rounded-lg focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-all duration-200 ${
                      errors.company?.name ? "border-red-300 bg-red-50" : "border-gray-200 hover:border-indigo-300"
                    }`}
                    placeholder="e.g. Acme Inc."
                  />
                  {errors.company?.name && (
                    <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle size={12} />
                      {errors.company.name.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Industry
                  </label>
                  <input
                    {...register("company.industry")}
                    className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-all duration-200 hover:border-indigo-300"
                    placeholder="e.g. Technology, Healthcare, Finance"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Company Size
                  </label>
                  <select
                    {...register("company.size")}
                    className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-all duration-200 hover:border-indigo-300 appearance-none bg-white bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIiIGhlaWdodD0iOCIgdmlld0JveD0iMCAwIDEyIDgiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxwYXRoIGQ9Ik02IDcuNUwwLjgwMzg0OSAyLjVMMTEuMTk2MiAyLjVMNiA3LjVaIiBmaWxsPSIjNkI3MjgwIi8+Cjwvc3ZnPgo=')] bg-[center_right_1rem] bg-no-repeat"
                  >
                    <option value="1-10">1-10 employees</option>
                    <option value="11-50">11-50 employees</option>
                    <option value="51-200">51-200 employees</option>
                    <option value="201-500">201-500 employees</option>
                    <option value="501-1000">501-1000 employees</option>
                    <option value="1000+">1000+ employees</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Company Website
                  </label>
                  <input
                    {...register("company.website")}
                    className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-all duration-200 hover:border-indigo-300"
                    placeholder="e.g. https://example.com"
                  />
                </div>

                <div className="md:col-span-2 mt-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company Logo
                  </label>
                  <div
                    {...getRootProps()}
                    className="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center cursor-pointer hover:border-indigo-300 transition-all duration-200 bg-gray-50 hover:bg-gray-100/50"
                  >
                    <input {...getInputProps()} />
                    {companyLogo ? (
                      <div className="flex items-center justify-center">
                        <div className="relative group">
                          <img
                            src={URL.createObjectURL(companyLogo)}
                            alt="Company logo preview"
                            className="h-20 object-contain rounded-md"
                          />
                          <motion.button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setCompanyLogo(null);
                            }}
                            className="absolute -top-2 -right-2 p-1 bg-white rounded-full text-gray-400 hover:text-red-500 shadow-sm border border-gray-200 opacity-0 group-hover:opacity-100 transition-opacity"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <X size={14} />
                          </motion.button>
                        </div>
                      </div>
                    ) : (
                      <div className="py-2">
                        <motion.div
                          className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-2"
                          whileHover={{ scale: 1.05 }}
                        >
                          <ImageIcon size={20} className="text-gray-500" />
                        </motion.div>
                        <p className="text-gray-500 text-sm mb-1">
                          Drop company logo here or click to upload
                        </p>
                        <p className="text-xs text-gray-400">Square image, at least 200x200px</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="mt-6 flex justify-between">
                <motion.button 
                  type="button"
                  onClick={() => setActiveSection(0)}
                  className="inline-flex items-center gap-1 text-gray-500 hover:text-gray-700 px-4 py-2 rounded-lg text-sm transition-colors"
                  whileHover={{ x: -2 }}
                >
                  <ChevronRight className="rotate-180" size={16} />
                  Back
                </motion.button>
                
                <motion.button 
                  type="button"
                  onClick={() => {
                    trigger(["company.name"]);
                    if (!errors.company?.name) setActiveSection(2);
                  }}
                  className="inline-flex items-center gap-1 bg-gray-50 hover:bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  Next: Job Details
                  <ChevronRight size={16} />
                </motion.button>
              </div>
            </div>

            {/* Job Details */}
            <div className={`p-6 transition-all duration-300 ${activeSection === 2 ? 'block' : 'hidden'}`}>
              <h2 className="text-lg font-medium text-gray-800 flex items-center pb-4 mb-5 border-b border-gray-100">
                <FileText className="mr-2 text-indigo-500" size={20} />
                Job Details
              </h2>

              <div className="space-y-6">
                <div>
                  <Controller
                    name="description"
                    control={control}
                    rules={{ required: "Job description is required" }}
                    render={({ field, fieldState }) => (
                      <RichTextEditor
                        value={field.value}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        placeholder="Describe the job role, responsibilities, and your company..."
                        error={fieldState.error?.message}
                        label="Job Description"
                        required
                        toolbar="full"
                        minHeight={250}
                        helpText="Provide a detailed description of the job role and your company."
                      />
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <Controller
                      name="requirements"
                      control={control}
                      render={({ field, fieldState }) => (
                        <RichTextEditor
                          value={field.value}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          placeholder="List requirements, one per line..."
                          error={fieldState.error?.message}
                          label="Requirements"
                          toolbar="basic"
                          minHeight={180}
                          helpText="List the required qualifications and skills."
                        />
                      )}
                    />
                  </div>

                  <div>
                    <Controller
                      name="responsibilities"
                      control={control}
                      render={({ field, fieldState }) => (
                        <RichTextEditor
                          value={field.value}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          placeholder="List responsibilities, one per line..."
                          error={fieldState.error?.message}
                          label="Responsibilities"
                          toolbar="basic"
                          minHeight={180}
                          helpText="List the main duties of this position."
                        />
                      )}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Skills
                    </label>
                    <Controller
                      name="skills"
                      control={control}
                      render={({ field }) => (
                        <SkillsInput
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="e.g. React, JavaScript, TypeScript, CSS"
                        />
                      )}
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Enter skills separated by commas
                    </p>
                  </div>

                  <div>
                    <Controller
                      name="benefits"
                      control={control}
                      render={({ field, fieldState }) => (
                        <RichTextEditor
                          value={field.value}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          placeholder="List benefits, one per line..."
                          error={fieldState.error?.message}
                          label="Benefits"
                          toolbar="basic"
                          minHeight={180}
                          helpText="List the benefits offered with this position."
                        />
                      )}
                    />
                  </div>
                </div>
              </div>
              
              <div className="mt-6 flex justify-between">
                <motion.button 
                  type="button"
                  onClick={() => setActiveSection(1)}
                  className="inline-flex items-center gap-1 text-gray-500 hover:text-gray-700 px-4 py-2 rounded-lg text-sm transition-colors"
                  whileHover={{ x: -2 }}
                >
                  <ChevronRight className="rotate-180" size={16} />
                  Back
                </motion.button>
                
                <motion.button 
                  type="button"
                  onClick={() => {
                    trigger(["description"]);
                    if (!errors.description) setActiveSection(3);
                  }}
                  className="inline-flex items-center gap-1 bg-gray-50 hover:bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  Next: Salary Info
                  <ChevronRight size={16} />
                </motion.button>
              </div>
            </div>

            {/* Salary Information */}
            <div className={`p-6 transition-all duration-300 ${activeSection === 3 ? 'block' : 'hidden'}`}>
              <h2 className="text-lg font-medium text-gray-800 flex items-center pb-4 mb-5 border-b border-gray-100">
                <DollarSign className="mr-2 text-indigo-500" size={20} />
                Salary Information
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Minimum Salary
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-2.5 text-gray-400" size={16} />
                    <input
                      type="number"
                      {...register("salary.min")}
                      className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-all duration-200 hover:border-indigo-300"
                      placeholder="e.g. 50000"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Maximum Salary
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-2.5 text-gray-400" size={16} />
                    <input
                      type="number"
                      {...register("salary.max")}
                      className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-all duration-200 hover:border-indigo-300"
                      placeholder="e.g. 80000"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Currency
                  </label>
                  <select
                    {...register("salary.currency")}
                    className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-all duration-200 hover:border-indigo-300 appearance-none bg-white bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIiIGhlaWdodD0iOCIgdmlld0JveD0iMCAwIDEyIDgiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxwYXRoIGQ9Ik02IDcuNUwwLjgwMzg0OSAyLjVMMTEuMTk2MiAyLjVMNiA3LjVaIiBmaWxsPSIjNkI3MjgwIi8+Cjwvc3ZnPgo=')] bg-[center_right_1rem] bg-no-repeat"
                  >
                    <option value="USD">USD - US Dollar</option>
                    <option value="EUR">EUR - Euro</option>
                    <option value="GBP">GBP - British Pound</option>
                    <option value="CAD">CAD - Canadian Dollar</option>
                    <option value="AUD">AUD - Australian Dollar</option>
                    <option value="INR">INR - Indian Rupee</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Period
                  </label>
                  <select
                    {...register("salary.period")}
                    className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-all duration-200 hover:border-indigo-300 appearance-none bg-white bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIiIGhlaWdodD0iOCIgdmlld0JveD0iMCAwIDEyIDgiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxwYXRoIGQ9Ik02IDcuNUwwLjgwMzg0OSAyLjVMMTEuMTk2MiAyLjVMNiA3LjVaIiBmaWxsPSIjNkI3MjgwIi8+Cjwvc3ZnPgo=')] bg-[center_right_1rem] bg-no-repeat"
                  >
                    <option value="Hourly">Hourly</option>
                    <option value="Monthly">Monthly</option>
                    <option value="Yearly">Yearly</option>
                  </select>
                </div>

                <div className="md:col-span-2 mt-1">
                  <label className="flex items-center cursor-pointer group py-2">
                    <div className="relative">
                      <input
                        type="checkbox"
                        {...register("salary.isVisible")}
                        className="sr-only peer"
                      />
                      <div className="h-5 w-5 border border-gray-300 rounded peer-checked:bg-indigo-500 peer-checked:border-indigo-500 peer-focus:ring-2 peer-focus:ring-indigo-200 transition-all duration-200 flex items-center justify-center">
                        <CheckCircle size={10} className="text-white scale-0 peer-checked:scale-100 transition-transform duration-200" />
                      </div>
                    </div>
                    <span className="ml-2 text-sm text-gray-700 group-hover:text-gray-900 transition-colors">
                      Display salary information publicly on job posting
                    </span>
                  </label>
                </div>
              </div>
              
              <div className="mt-6 flex justify-between">
                <motion.button 
                  type="button"
                  onClick={() => setActiveSection(2)}
                  className="inline-flex items-center gap-1 text-gray-500 hover:text-gray-700 px-4 py-2 rounded-lg text-sm transition-colors"
                  whileHover={{ x: -2 }}
                >
                  <ChevronRight className="rotate-180" size={16} />
                  Back
                </motion.button>
                
                <motion.button 
                  type="button"
                  onClick={() => setActiveSection(4)}
                  className="inline-flex items-center gap-1 bg-gray-50 hover:bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  Next: Application Info
                  <ChevronRight size={16} />
                </motion.button>
              </div>
            </div>

            {/* Application Information */}
            <div className={`p-6 transition-all duration-300 ${activeSection === 4 ? 'block' : 'hidden'}`}>
              <h2 className="text-lg font-medium text-gray-800 flex items-center pb-4 mb-5 border-b border-gray-100">
                <Clock className="mr-2 text-indigo-500" size={20} />
                Application Information
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Application Email
                  </label>
                  <input
                    type="email"
                    {...register("applicationEmail")}
                    className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-all duration-200 hover:border-indigo-300"
                    placeholder="e.g. careers@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Application URL
                  </label>
                  <input
                    {...register("applicationUrl")}
                    className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-all duration-200 hover:border-indigo-300"
                    placeholder="e.g. https://example.com/careers"
                  />
                </div>

                <div className="md:col-span-2">
                  <Controller
                    name="applicationInstructions"
                    control={control}
                    render={({ field, fieldState }) => (
                      <RichTextEditor
                        value={field.value}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        placeholder="Any specific instructions for applicants..."
                        error={fieldState.error?.message}
                        label="Application Instructions"
                        toolbar="minimal"
                        minHeight={120}
                        helpText="Optional: Provide any specific instructions for applicants."
                      />
                    )}
                  />
                </div>
              </div>
              
              <div className="mt-8 flex justify-between">
                <motion.button 
                  type="button"
                  onClick={() => setActiveSection(3)}
                  className="inline-flex items-center gap-1 text-gray-500 hover:text-gray-700 px-4 py-2 rounded-lg text-sm transition-colors"
                  whileHover={{ x: -2 }}
                >
                  <ChevronRight className="rotate-180" size={16} />
                  Back
                </motion.button>
                
                <motion.button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 bg-indigo-600 text-white py-2.5 rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 transition-all duration-300 flex items-center justify-center gap-2 text-sm font-medium shadow-sm hover:shadow"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Posting Job...</span>
                    </>
                  ) : (
                    <>
                      <Upload size={16} />
                      <span>Post Job</span>
                    </>
                  )}
                </motion.button>
              </div>
            </div>
          </form>
        </motion.div>
        
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-400">
            All fields marked with <span className="text-red-500">*</span> are required
          </p>
        </div>
      </div>
    </AnimatePresence>
  );
};

export default JobPostForm;