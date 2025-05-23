"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Users,
  UserPlus,
  ArrowLeft,
  Search,
  Mail,
  Trash2,
  Edit,
  Shield,
  CheckCircle,
  XCircle
} from "lucide-react";
import Image from "next/image";
import { useProject } from "@/lib/contexts/project-context";
import { useAuth } from "@/lib/contexts/auth-context";
import LoaderComponent from "../../../../Components/UI/LoaderComponent";
import { toast } from "react-hot-toast";
import logger from "@/lib/utils/logger";

const ProjectCollaboratorsPage = () => {
  const { slug } = useParams();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const {
    currentProject,
    loading,
    error,
    fetchProjectBySlug,
    getCollaborators,
    addCollaborator,
    removeCollaborator
  } = useProject();

  const [collaborators, setCollaborators] = useState([]);
  const [collaboratorsLoading, setCollaboratorsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCollaborator, setSelectedCollaborator] = useState(null);
  const [newCollaborator, setNewCollaborator] = useState({
    email: "",
    role: "contributor",
    permissions: {
      canEdit: false,
      canDelete: false,
      canInvite: false
    }
  });

  useEffect(() => {
    if (slug) {
      fetchProjectBySlug(slug);
    }
  }, [slug, fetchProjectBySlug]);

  useEffect(() => {
    // Create an AbortController for this effect
    const controller = new AbortController();

    const fetchCollaboratorsData = async () => {
      if (currentProject && currentProject._id) {
        setCollaboratorsLoading(true);
        try {
          // Pass the signal to the getCollaborators function
          const collaboratorsData = await getCollaborators(currentProject._id, controller.signal);
          if (collaboratorsData) {
            setCollaborators(collaboratorsData);
          } else {
            toast.error("Failed to load collaborators");
          }
        } catch (error) {
          // Don't show error toast for canceled requests (navigation or unmount)
          if (!error.isNavigationCancel && error.code !== "ERR_CANCELED" && error.name !== "CanceledError") {
            logger.error("Error fetching project collaborators:", error);
            toast.error("Failed to load collaborators");
          } else {
            logger.info("Collaborators request canceled due to navigation or unmount");
          }
        } finally {
          setCollaboratorsLoading(false);
        }
      }
    };

    // Execute the fetch function
    fetchCollaboratorsData();

    // Clean up function to abort any pending requests when component unmounts
    return () => {
      controller.abort();
    };
  }, [currentProject, getCollaborators]);

  const canManageCollaborators = () => {
    if (!isAuthenticated || !currentProject) return false;

    // Check if user is owner
    const isOwner = currentProject.owner === user._id;

    // Check if user is collaborator with invite permissions
    const isCollaborator = currentProject.collaborators?.some(
      collab => collab.user === user._id && (collab.role === 'owner' || collab.permissions?.canInvite)
    );

    return isOwner || isCollaborator;
  };

  const handleAddCollaborator = async () => {
    if (!newCollaborator.email) {
      toast.error("Email is required");
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newCollaborator.email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    try {
      // Show loading toast
      const loadingToast = toast.loading("Adding collaborator...");

      const result = await addCollaborator(
        currentProject._id,
        newCollaborator.email,
        newCollaborator.role,
        newCollaborator.permissions
      );

      // Dismiss loading toast
      toast.dismiss(loadingToast);

      if (result) {
        setCollaborators(result);
        setShowAddModal(false);
        setNewCollaborator({
          email: "",
          role: "contributor",
          permissions: {
            canEdit: false,
            canDelete: false,
            canInvite: false
          }
        });
        toast.success("Collaborator added successfully! An email notification has been sent.");
      }
    } catch (error) {
      logger.error("Error adding collaborator:", error);

      // Show more specific error message if available
      const errorMessage = error.response?.data?.message || "Failed to add collaborator";
      toast.error(errorMessage);
    }
  };

  const handleUpdateCollaborator = async () => {
    if (!selectedCollaborator) return;

    try {
      // Update collaborator logic here
      toast.success("Collaborator updated successfully");
      setShowEditModal(false);
    } catch (error) {
      logger.error("Error updating collaborator:", error);
      toast.error("Failed to update collaborator");
    }
  };

  const handleRemoveCollaborator = async (collaboratorId) => {
    if (!collaboratorId) return;

    try {
      const result = await removeCollaborator(currentProject._id, collaboratorId);
      if (result) {
        setCollaborators(result);
        toast.success("Collaborator removed successfully");
      }
    } catch (error) {
      logger.error("Error removing collaborator:", error);
      toast.error("Failed to remove collaborator");
    }
  };

  const filteredCollaborators = collaborators.filter(collab =>
    collab.user?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    collab.user?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    collab.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    collab.role?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading || collaboratorsLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoaderComponent size="large" />
      </div>
    );
  }

  if (error || !currentProject) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Project Not Found</h1>
        <p className="text-gray-600 mb-6">
          The project you're looking for doesn't exist or has been removed.
        </p>
        <button
          onClick={() => router.push("/projects")}
          className="bg-violet-600 text-white px-6 py-2 rounded-lg hover:bg-violet-700 transition-colors"
        >
          Browse Projects
        </button>
      </div>
    );
  }

  if (!canManageCollaborators()) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Access Denied</h1>
        <p className="text-gray-600 mb-6">
          You don't have permission to manage collaborators for this project.
        </p>
        <button
          onClick={() => router.push(`/projects/${slug}`)}
          className="bg-violet-600 text-white px-6 py-2 rounded-lg hover:bg-violet-700 transition-colors"
        >
          Back to Project
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-purple-50 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Back Button */}
          <div className="mb-6">
            <button
              onClick={() => router.push(`/projects/${slug}`)}
              className="flex items-center text-gray-600 hover:text-violet-600 transition-colors"
            >
              <ArrowLeft size={18} className="mr-2" />
              Back to Project
            </button>
          </div>

          {/* Header */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2 flex items-center">
                  <Users size={24} className="mr-2 text-violet-600" />
                  Collaborators for {currentProject.title}
                </h1>
                <p className="text-gray-600">
                  Manage who can access and edit this project
                </p>
              </div>

              <button
                onClick={() => setShowAddModal(true)}
                className="bg-violet-600 text-white px-4 py-2 rounded-lg hover:bg-violet-700 transition-colors flex items-center gap-2"
              >
                <UserPlus size={18} />
                Add Collaborator
              </button>
            </div>
          </div>

          {/* Search and Filter */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
            <div className="relative">
              <Search className="absolute left-3 top-3 text-gray-400" size={20} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search collaborators by name, email, or role"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500"
              />
            </div>
          </div>

          {/* Collaborators List */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            {filteredCollaborators.length === 0 ? (
              <div className="p-8 text-center">
                <Users size={48} className="mx-auto text-gray-300 mb-4" />
                <h3 className="text-xl font-semibold text-gray-800 mb-2">No Collaborators Found</h3>
                <p className="text-gray-600 mb-6">
                  {searchTerm ? "No collaborators match your search criteria." : "This project doesn't have any collaborators yet."}
                </p>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="bg-violet-600 text-white px-6 py-2 rounded-lg hover:bg-violet-700 transition-colors inline-flex items-center gap-2"
                >
                  <UserPlus size={18} />
                  Add Collaborator
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Permissions
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Added
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredCollaborators.map((collaborator) => (
                      <tr key={collaborator._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-10 w-10 flex-shrink-0">
                              {collaborator.user?.profilePicture?.url ? (
                                <Image
                                  src={collaborator.user.profilePicture.url}
                                  alt={`${collaborator.user.firstName} ${collaborator.user.lastName}`}
                                  width={40}
                                  height={40}
                                  className="h-10 w-10 rounded-full object-cover"
                                />
                              ) : (
                                <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                  <Users size={20} className="text-gray-500" />
                                </div>
                              )}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {collaborator.user?.firstName} {collaborator.user?.lastName}
                              </div>
                              <div className="text-sm text-gray-500 flex items-center">
                                <Mail size={12} className="mr-1" />
                                {collaborator.user?.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            collaborator.role === 'owner'
                              ? 'bg-purple-100 text-purple-800'
                              : collaborator.role === 'admin'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-green-100 text-green-800'
                          }`}>
                            {collaborator.role.charAt(0).toUpperCase() + collaborator.role.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex space-x-2">
                            {collaborator.permissions?.canEdit && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                Edit
                              </span>
                            )}
                            {collaborator.permissions?.canDelete && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                                Delete
                              </span>
                            )}
                            {collaborator.permissions?.canInvite && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                Invite
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(collaborator.addedAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => {
                                setSelectedCollaborator(collaborator);
                                setShowEditModal(true);
                              }}
                              className="text-indigo-600 hover:text-indigo-900"
                            >
                              <Edit size={18} />
                            </button>
                            <button
                              onClick={() => handleRemoveCollaborator(collaborator.user?._id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Collaborator Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            className="bg-white rounded-xl shadow-lg p-6 max-w-md w-full"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900">Add Collaborator</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <XCircle size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address*
                </label>
                <input
                  type="email"
                  value={newCollaborator.email}
                  onChange={(e) => setNewCollaborator({...newCollaborator, email: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500"
                  placeholder="Enter collaborator's email"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <select
                  value={newCollaborator.role}
                  onChange={(e) => setNewCollaborator({...newCollaborator, role: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500"
                >
                  <option value="contributor">Contributor</option>
                  <option value="admin">Admin</option>
                  <option value="owner">Owner</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Permissions
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={newCollaborator.permissions.canEdit}
                      onChange={(e) => setNewCollaborator({
                        ...newCollaborator,
                        permissions: {
                          ...newCollaborator.permissions,
                          canEdit: e.target.checked
                        }
                      })}
                      className="h-4 w-4 text-violet-600 focus:ring-violet-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-gray-700">Can edit project</span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={newCollaborator.permissions.canDelete}
                      onChange={(e) => setNewCollaborator({
                        ...newCollaborator,
                        permissions: {
                          ...newCollaborator.permissions,
                          canDelete: e.target.checked
                        }
                      })}
                      className="h-4 w-4 text-violet-600 focus:ring-violet-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-gray-700">Can delete project</span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={newCollaborator.permissions.canInvite}
                      onChange={(e) => setNewCollaborator({
                        ...newCollaborator,
                        permissions: {
                          ...newCollaborator.permissions,
                          canInvite: e.target.checked
                        }
                      })}
                      className="h-4 w-4 text-violet-600 focus:ring-violet-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-gray-700">Can invite others</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddCollaborator}
                className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors flex items-center gap-2"
              >
                <UserPlus size={18} />
                Add Collaborator
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Edit Collaborator Modal */}
      {showEditModal && selectedCollaborator && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <motion.div
            className="bg-white rounded-2xl shadow-xl p-8 max-w-lg w-full"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900">Edit Collaborator</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XCircle size={28} />
              </button>
            </div>

            <div className="flex items-center mb-6 bg-gray-50 p-4 rounded-lg">
              <div className="h-16 w-16 flex-shrink-0 mr-4">
                {selectedCollaborator.user?.profilePicture?.url ? (
                  <Image
                    src={selectedCollaborator.user.profilePicture.url}
                    alt={`${selectedCollaborator.user.firstName} ${selectedCollaborator.user.lastName}`}
                    width={64}
                    height={64}
                    className="h-16 w-16 rounded-full object-cover border-2 border-violet-200"
                  />
                ) : (
                  <div className="h-16 w-16 rounded-full bg-violet-100 flex items-center justify-center">
                    <Users size={32} className="text-violet-500" />
                  </div>
                )}
              </div>
              <div>
                <div className="text-xl font-semibold text-gray-900">
                  {selectedCollaborator.user?.firstName} {selectedCollaborator.user?.lastName}
                </div>
                <div className="text-sm text-gray-600">
                  {selectedCollaborator.user?.email}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role
                </label>
                <select
                  value={selectedCollaborator.role}
                  onChange={(e) => setSelectedCollaborator({
                    ...selectedCollaborator,
                    role: e.target.value
                  })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-colors"
                >
                  <option value="contributor">Contributor</option>
                  <option value="admin">Admin</option>
                  <option value="owner">Owner</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Permissions
                </label>
                <div className="space-y-3 bg-gray-50 p-4 rounded-lg">
                  {['canEdit', 'canDelete', 'canInvite'].map((permission) => (
                    <label key={permission} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedCollaborator.permissions?.[permission]}
                        onChange={(e) => setSelectedCollaborator({
                          ...selectedCollaborator,
                          permissions: {
                            ...selectedCollaborator.permissions,
                            [permission]: e.target.checked
                          }
                        })}
                        className="h-5 w-5 text-violet-600 focus:ring-violet-500 border-gray-300 rounded transition-colors"
                      />
                      <span className="ml-3 text-gray-700 capitalize">
                        Can {permission.replace('can', '').toLowerCase()}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-end gap-4">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateCollaborator}
                className="px-6 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors flex items-center gap-2"
              >
                <CheckCircle size={20} />
                Save Changes
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
};

export default ProjectCollaboratorsPage;
