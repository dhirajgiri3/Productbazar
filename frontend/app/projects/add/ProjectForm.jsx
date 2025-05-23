"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { toast } from "react-hot-toast";
import {
  FolderKanban,
  Upload,
  X,
  Image as ImageIcon,
  Link,
  Building,
  CheckCircle,
  Briefcase,
  Eye
} from "lucide-react";
import { useDropzone } from "react-dropzone";
import api from "@/lib/api/api";
import logger from "@/lib/utils/logger";

const ProjectForm = ({ user, project = null, isEditing = false }) => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [thumbnail, setThumbnail] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState(null);
  const [galleryImages, setGalleryImages] = useState([]);
  const [galleryPreviews, setGalleryPreviews] = useState([]);
  const [clientLogo, setClientLogo] = useState(null);
  const [clientLogoPreview, setClientLogoPreview] = useState(null);
  const [formComplete, setFormComplete] = useState(false);
  const [createdProjectSlug, setCreatedProjectSlug] = useState(null);
  const [currentProject, setCurrentProject] = useState(isEditing ? true : false);

  // Set initial values for thumbnail and gallery images when editing
  useEffect(() => {
    if (isEditing && project) {
      // Set current project status
      setCurrentProject(project.current || false);

      // Load existing images as File objects if needed for preview
      // Note: We don't actually load the files here, just set the URLs for preview
      // The actual files will be uploaded only if the user changes them
      if (project.thumbnail) {
        // For thumbnail, we just need to show the preview
        setThumbnailPreview(project.thumbnail);
      }

      if (project.gallery && project.gallery.length > 0) {
        // For gallery, we need to show previews of all images
        setGalleryPreviews(project.gallery.map(item => ({
          url: item.url,
          caption: item.caption || ''
        })));
      }

      if (project.client?.logo) {
        setClientLogoPreview(project.client.logo);
      }
    }
  }, [isEditing, project]);

  // Determine owner type based on user role
  const determineOwnerType = () => {
    if (user.role === "jobseeker") return "jobseeker";
    if (user.role === "freelancer") return "freelancer";
    if (user.role === "agency") return "agency";
    if (user.role === "startupOwner" || user.role === "maker") return "startupOwner";

    // Check secondary roles if primary role doesn't match
    if (user.secondaryRoles?.includes("jobseeker")) return "jobseeker";
    if (user.secondaryRoles?.includes("freelancer")) return "freelancer";
    if (user.secondaryRoles?.includes("agency")) return "agency";
    if (user.secondaryRoles?.includes("startupOwner") || user.secondaryRoles?.includes("maker")) return "startupOwner";

    return "freelancer"; // Default fallback
  };

  // Set up default values based on whether we're editing or creating
  const getDefaultValues = () => {
    if (isEditing && project) {
      return {
        title: project.title || "",
        description: project.description || "",
        category: project.category || "",
        role: project.role || "",
        client: {
          name: project.client?.name || "",
          industry: project.client?.industry || "",
          website: project.client?.website || "",
          testimonial: {
            content: project.client?.testimonial?.content || "",
            author: project.client?.testimonial?.author || "",
            position: project.client?.testimonial?.position || "",
          },
        },
        technologies: project.technologies?.join(", ") || "",
        skills: project.skills?.join(", ") || "",
        startDate: project.startDate ? new Date(project.startDate).toISOString().split('T')[0] : "",
        endDate: project.endDate ? new Date(project.endDate).toISOString().split('T')[0] : "",
        challenge: project.challenge || "",
        solution: project.solution || "",
        results: project.results || "",
        achievements: project.achievements?.join("\n") || "",
        projectUrl: project.projectUrl || "",
        repositoryUrl: project.repositoryUrl || "",
        visibility: project.visibility || "public",
      };
    } else {
      return {
        title: "",
        description: "",
        category: "",
        role: "",
        client: {
          name: "",
          industry: "",
          website: "",
          testimonial: {
            content: "",
            author: "",
            position: "",
          },
        },
        technologies: "",
        skills: "",
        startDate: "",
        endDate: "",
        challenge: "",
        solution: "",
        results: "",
        achievements: "",
        projectUrl: "",
        repositoryUrl: "",
        visibility: "public",
      };
    }
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: getDefaultValues(),
  });

  const { getRootProps: getThumbnailRootProps, getInputProps: getThumbnailInputProps } = useDropzone({
    accept: "image/*",
    multiple: false,
    onDrop: (files) => {
      if (files[0]) {
        setThumbnail(files[0]);
      }
    },
  });

  const { getRootProps: getGalleryRootProps, getInputProps: getGalleryInputProps } = useDropzone({
    accept: "image/*",
    multiple: true,
    onDrop: (files) => {
      setGalleryImages((prev) => [...prev, ...files]);
    },
  });

  const { getRootProps: getClientLogoRootProps, getInputProps: getClientLogoInputProps } = useDropzone({
    accept: "image/*",
    multiple: false,
    onDrop: (files) => {
      if (files[0]) {
        setClientLogo(files[0]);
      }
    },
  });

  const onSubmit = async (data) => {
    try {
      setIsSubmitting(true);

      // Format arrays from comma-separated strings
      const formattedData = {
        ...data,
        ownerType: determineOwnerType(),
        technologies: data.technologies.split(",").map(tech => tech.trim()).filter(Boolean),
        skills: data.skills.split(",").map(skill => skill.trim()).filter(Boolean),
        achievements: data.achievements.split("\\n").filter(item => item.trim()),
        current: currentProject,
      };

      // If current project, remove end date
      if (currentProject) {
        delete formattedData.endDate;
      }

      // Create FormData for file upload
      const formData = new FormData();

      // Add JSON data
      formData.append("data", JSON.stringify(formattedData));

      // Add thumbnail if exists
      if (thumbnail) {
        formData.append("thumbnail", thumbnail);
      }

      // Add gallery images if exist
      galleryImages.forEach((image) => {
        formData.append('gallery', image);
      });

      // Add client logo if exists
      if (clientLogo) {
        formData.append("clientLogo", clientLogo);
      }

      let response;

      if (isEditing && project) {
        // Update existing project
        response = await api.patch(`/projects/${project._id}`, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });

        if (response.data.status === "success") {
          setFormComplete(true);
          setCreatedProjectSlug(response.data.data.project.slug);
          toast.success("Project updated successfully!");
        } else {
          toast.error(response.data.message || "Failed to update project");
        }
      } else {
        // Create new project
        response = await api.post("/projects", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });

        if (response.data.status === "success") {
          setFormComplete(true);
          setCreatedProjectSlug(response.data.data.project.slug);
          toast.success("Project added successfully!");
        } else {
          toast.error(response.data.message || "Failed to add project");
        }
      }
    } catch (error) {
      logger.error(`Error ${isEditing ? 'updating' : 'adding'} project:`, error);
      toast.error(error.response?.data?.message || `Failed to ${isEditing ? 'update' : 'add'} project`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (formComplete) {
    return (
      <motion.div
        className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 max-w-md mx-auto text-center"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
          className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-6"
        >
          <CheckCircle size={40} className="text-green-600" />
        </motion.div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          {isEditing ? "Project Updated!" : "Project Added!"}
        </h1>
        <p className="text-gray-600 mb-8">
          Your project has been {isEditing ? "updated" : "added"} successfully and is now visible to the community.
        </p>
        <div className="flex flex-col space-y-4">
          <button
            onClick={() => router.push(`/projects/${createdProjectSlug}`)}
            className="bg-violet-600 text-white px-6 py-3 rounded-lg hover:bg-violet-700 transition-colors"
          >
            View Project
          </button>
          <button
            onClick={() => router.push("/projects")}
            className="text-violet-600 px-6 py-3 rounded-lg hover:bg-violet-50 transition-colors"
          >
            Browse All Projects
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Project Basics Section */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center">
            <FolderKanban className="mr-2 text-violet-600" size={20} />
            Project Basics
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Project Title*
              </label>
              <input
                {...register("title", { required: "Project title is required" })}
                className={`w-full px-4 py-2 border bg-white rounded-lg focus:ring-2 focus:ring-violet-500 ${
                  errors.title ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="e.g. E-commerce Website Redesign"
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Project Description*
              </label>
              <textarea
                {...register("description", { required: "Project description is required" })}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-violet-500 ${
                  errors.description ? "border-red-500" : "border-gray-300"
                }`}
                rows={4}
                placeholder="Provide a brief overview of your project..."
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                {...register("category")}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500"
              >
                <option value="">Select a category</option>
                <option value="Web Development">Web Development</option>
                <option value="Mobile App">Mobile App</option>
                <option value="UI/UX Design">UI/UX Design</option>
                <option value="Branding">Branding</option>
                <option value="E-commerce">E-commerce</option>
                <option value="Marketing">Marketing</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Your Role
              </label>
              <input
                {...register("role")}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500"
                placeholder="e.g. Lead Developer, UI Designer"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                {...register("startDate")}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500"
              />
            </div>

            <div>
              <div className="flex justify-between items-center">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <label className="flex items-center text-sm text-gray-600">
                  <input
                    type="checkbox"
                    checked={currentProject}
                    onChange={() => setCurrentProject(!currentProject)}
                    className="mr-2 h-4 w-4 text-violet-600 focus:ring-violet-500 border-gray-300 rounded"
                  />
                  Current Project
                </label>
              </div>
              <input
                type="date"
                {...register("endDate")}
                disabled={currentProject}
                className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 ${
                  currentProject ? "bg-gray-100" : ""
                }`}
              />
            </div>
          </div>
        </div>

        {/* Project Media */}
        <div className="space-y-6 pt-4 border-t border-gray-100">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center pt-2">
            <ImageIcon className="mr-2 text-violet-600" size={20} />
            Project Media
          </h2>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Project Thumbnail
              </label>
              <div
                {...getThumbnailRootProps()}
                className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-violet-500"
              >
                <input {...getThumbnailInputProps()} />
                {thumbnail ? (
                  <div className="flex items-center justify-center">
                    <img
                      src={URL.createObjectURL(thumbnail)}
                      alt="Thumbnail preview"
                      className="h-32 object-contain"
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setThumbnail(null);
                      }}
                      className="ml-2 p-1 bg-red-100 rounded-full text-red-500 hover:bg-red-200"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : thumbnailPreview ? (
                  <div className="flex items-center justify-center">
                    <img
                      src={thumbnailPreview}
                      alt="Existing thumbnail"
                      className="h-32 object-contain"
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setThumbnailPreview(null);
                      }}
                      className="ml-2 p-1 bg-red-100 rounded-full text-red-500 hover:bg-red-200"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <div>
                    <ImageIcon size={24} className="mx-auto mb-2 text-gray-400" />
                    <p className="text-gray-600">
                      Drop thumbnail here or click to upload
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Project Gallery
              </label>
              <div
                {...getGalleryRootProps()}
                className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-violet-500"
              >
                <input {...getGalleryInputProps()} />
                <ImageIcon size={24} className="mx-auto mb-2 text-gray-400" />
                <p className="text-gray-600">
                  Drop gallery images here or click to upload (up to 10 images)
                </p>
              </div>
              {(galleryImages.length > 0 || galleryPreviews.length > 0) && (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-4 mt-4">
                  {/* New gallery images */}
                  {galleryImages.map((image, index) => (
                    <div key={`new-${index}`} className="relative">
                      <img
                        src={URL.createObjectURL(image)}
                        alt={`Gallery image ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setGalleryImages(galleryImages.filter((_, i) => i !== index));
                        }}
                        className="absolute top-1 right-1 p-1 bg-red-500 rounded-full text-white"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}

                  {/* Existing gallery images */}
                  {galleryPreviews.map((image, index) => (
                    <div key={`existing-${index}`} className="relative">
                      <img
                        src={image.url}
                        alt={image.caption || `Gallery image ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setGalleryPreviews(galleryPreviews.filter((_, i) => i !== index));
                        }}
                        className="absolute top-1 right-1 p-1 bg-red-500 rounded-full text-white"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Project Details */}
        <div className="space-y-6 pt-4 border-t border-gray-100">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center pt-2">
            <Briefcase className="mr-2 text-violet-600" size={20} />
            Project Details
          </h2>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                The Challenge
              </label>
              <textarea
                {...register("challenge")}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500"
                rows={3}
                placeholder="Describe the problem or challenge you were trying to solve..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                The Solution
              </label>
              <textarea
                {...register("solution")}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500"
                rows={3}
                placeholder="Explain your approach and how you solved the problem..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                The Results
              </label>
              <textarea
                {...register("results")}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500"
                rows={3}
                placeholder="Describe the outcomes and impact of your work..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Key Achievements (one per line)
              </label>
              <textarea
                {...register("achievements")}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500"
                rows={3}
                placeholder="e.g.&#10;Increased conversion rate by 25%&#10;Reduced page load time by 40%&#10;Implemented responsive design for all devices"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Technologies Used (comma separated)
              </label>
              <input
                {...register("technologies")}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500"
                placeholder="e.g. React, Node.js, MongoDB, Tailwind CSS"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Skills Demonstrated (comma separated)
              </label>
              <input
                {...register("skills")}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500"
                placeholder="e.g. UI Design, API Development, Database Optimization"
              />
            </div>
          </div>
        </div>

        {/* Client Information */}
        <div className="space-y-6 pt-4 border-t border-gray-100">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center pt-2">
            <Building className="mr-2 text-violet-600" size={20} />
            Client Information (Optional)
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Client Name
              </label>
              <input
                {...register("client.name")}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500"
                placeholder="e.g. Acme Inc."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Client Industry
              </label>
              <input
                {...register("client.industry")}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500"
                placeholder="e.g. E-commerce, Healthcare, Finance"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Client Website
              </label>
              <input
                {...register("client.website")}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500"
                placeholder="e.g. https://example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Client Logo
              </label>
              <div
                {...getClientLogoRootProps()}
                className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-violet-500"
              >
                <input {...getClientLogoInputProps()} />
                {clientLogo ? (
                  <div className="flex items-center justify-center">
                    <img
                      src={URL.createObjectURL(clientLogo)}
                      alt="Client logo preview"
                      className="h-16 object-contain"
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setClientLogo(null);
                      }}
                      className="ml-2 p-1 bg-red-100 rounded-full text-red-500 hover:bg-red-200"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : clientLogoPreview ? (
                  <div className="flex items-center justify-center">
                    <img
                      src={clientLogoPreview}
                      alt="Existing client logo"
                      className="h-16 object-contain"
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setClientLogoPreview(null);
                      }}
                      className="ml-2 p-1 bg-red-100 rounded-full text-red-500 hover:bg-red-200"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <div>
                    <ImageIcon size={20} className="mx-auto mb-1 text-gray-400" />
                    <p className="text-sm text-gray-600">
                      Upload logo
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Client Testimonial
              </label>
              <textarea
                {...register("client.testimonial.content")}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500"
                rows={3}
                placeholder="What did the client say about your work?"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Testimonial Author
              </label>
              <input
                {...register("client.testimonial.author")}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500"
                placeholder="e.g. John Smith"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Author Position
              </label>
              <input
                {...register("client.testimonial.position")}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500"
                placeholder="e.g. CEO, Project Manager"
              />
            </div>
          </div>
        </div>

        {/* Project Links */}
        <div className="space-y-6 pt-4 border-t border-gray-100">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center pt-2">
            <Link className="mr-2 text-violet-600" size={20} />
            Project Links
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Live Project URL
              </label>
              <input
                {...register("projectUrl")}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500"
                placeholder="e.g. https://example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Repository URL
              </label>
              <input
                {...register("repositoryUrl")}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500"
                placeholder="e.g. https://github.com/username/repo"
              />
            </div>
          </div>
        </div>

        {/* Visibility Settings */}
        <div className="space-y-6 pt-4 border-t border-gray-100">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center pt-2">
            <Eye className="mr-2 text-violet-600" size={20} />
            Visibility Settings
          </h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Who can see this project?
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="public"
                  {...register("visibility")}
                  className="h-4 w-4 text-violet-600 focus:ring-violet-500 border-gray-300"
                />
                <span className="ml-2 text-gray-700">
                  Public - Anyone can view this project
                </span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="unlisted"
                  {...register("visibility")}
                  className="h-4 w-4 text-violet-600 focus:ring-violet-500 border-gray-300"
                />
                <span className="ml-2 text-gray-700">
                  Unlisted - Only people with the link can view this project
                </span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="private"
                  {...register("visibility")}
                  className="h-4 w-4 text-violet-600 focus:ring-violet-500 border-gray-300"
                />
                <span className="ml-2 text-gray-700">
                  Private - Only you can view this project
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-6 border-t border-gray-100">
          <motion.button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-violet-600 text-white py-3 rounded-lg hover:bg-violet-700 disabled:bg-gray-400 transition-colors flex items-center justify-center gap-2 shadow-md"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Upload size={20} />
            {isSubmitting
              ? isEditing ? "Updating Project..." : "Adding Project..."
              : isEditing ? "Update Project" : "Add Project"}
          </motion.button>
        </div>
      </form>
    </motion.div>
  );
};

export default ProjectForm;
