"use client";

import React from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  Calendar,
  ThumbsUp,
  Eye,
  User,
  ExternalLink
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const ProjectCard = ({ project, onClick }) => {
  const router = useRouter();

  const handleClick = () => {
    if (onClick) {
      onClick(project);
    } else {
      router.push(`/projects/${project.slug}`);
    }
  };

  // Format date
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (error) {
      return "Unknown date";
    }
  };

  return (
    <motion.div
      className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer group"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      whileHover={{ y: -5, scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      onClick={handleClick}
    >
      {/* Project Thumbnail */}
      <div className="aspect-video bg-gray-100 relative overflow-hidden">
        {project.thumbnail ? (
          <>
            <img
              src={project.thumbnail}
              alt={project.title}
              className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full bg-gray-200">
            <ExternalLink size={32} className="text-gray-400" />
          </div>
        )}

        {/* Owner Type Badge */}
        <div className="absolute top-3 left-3 bg-violet-600 text-white text-xs px-3 py-1.5 rounded-full font-medium shadow-sm backdrop-blur-sm bg-opacity-90 border border-violet-500/20">
          {project.ownerType === 'jobseeker' ? 'Job Seeker' :
           project.ownerType === 'freelancer' ? 'Freelancer' :
           project.ownerType === 'agency' ? 'Agency' :
           project.ownerType === 'startupOwner' ? 'Startup Owner' : project.ownerType}
        </div>

        {/* Category Badge (if available) */}
        {project.category && (
          <div className="absolute top-3 right-3 bg-white/80 backdrop-blur-sm text-gray-800 text-xs px-3 py-1.5 rounded-full font-medium shadow-sm border border-gray-200/50">
            {project.category}
          </div>
        )}
      </div>

      {/* Project Info */}
      <div className="p-5">
        <h3 className="text-lg font-semibold text-gray-800 mb-2 line-clamp-1 group-hover:text-violet-700 transition-colors">
          {project.title}
        </h3>

        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
          {project.summary || project.description}
        </p>

        {/* Tags/Technologies */}
        {project.technologies && project.technologies.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {project.technologies.slice(0, 3).map((tech, index) => (
              <span
                key={index}
                className="bg-gray-50 text-gray-700 text-xs px-3 py-1 rounded-full border border-gray-100 hover:bg-gray-100 transition-colors"
              >
                {tech}
              </span>
            ))}
            {project.technologies.length > 3 && (
              <span className="bg-gray-50 text-gray-700 text-xs px-3 py-1 rounded-full border border-gray-100 hover:bg-gray-100 transition-colors">
                +{project.technologies.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Project Status */}
        {project.status && (
          <div className="mb-4">
            <span className={`inline-flex items-center text-xs px-2.5 py-1 rounded-full font-medium ${project.status === 'completed' ? 'bg-green-50 text-green-700' : project.status === 'in-progress' ? 'bg-blue-50 text-blue-700' : project.status === 'planning' ? 'bg-amber-50 text-amber-700' : 'bg-gray-50 text-gray-700'}`}>
              <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${project.status === 'completed' ? 'bg-green-500' : project.status === 'in-progress' ? 'bg-blue-500' : project.status === 'planning' ? 'bg-amber-500' : 'bg-gray-500'}`}></span>
              {project.status === 'in-progress' ? 'In Progress' : project.status.charAt(0).toUpperCase() + project.status.slice(1)}
            </span>
          </div>
        )}

        {/* Project Meta */}
        <div className="flex items-center justify-between text-xs text-gray-500 mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
              {project.owner?.profilePicture?.url ? (
                <img
                  src={project.owner.profilePicture.url}
                  alt={project.owner?.firstName || "User"}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User size={12} className="m-auto text-gray-500" />
              )}
            </div>
            <span className="font-medium text-gray-700">
              {project.owner?.fullName || project.owner?.firstName || "Anonymous"}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center">
              <Eye size={14} className="mr-1 text-gray-400" />
              <span>{project.analytics?.views || project.views || 0}</span>
            </div>

            <div className="flex items-center">
              <ThumbsUp size={14} className="mr-1 text-gray-400" />
              <span>{project.analytics?.likes || project.likes || 0}</span>
            </div>

            <div className="flex items-center">
              <Calendar size={14} className="mr-1 text-gray-400" />
              <span>{formatDate(project.createdAt)}</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ProjectCard;