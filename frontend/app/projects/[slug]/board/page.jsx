"use client";

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/contexts/auth-context';
import { useProject } from '@/lib/contexts/project-context';
import BoardPage from '../../../../Components/Board/BoardPage';
import LoaderComponent from '../../../../Components/UI/LoaderComponent';
import { toast } from 'react-hot-toast';

export default function ProjectBoardPage() {
  const { slug } = useParams();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const { currentProject, loading, error, fetchProjectBySlug } = useProject();
  const [boardData, setBoardData] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // Load project data
  useEffect(() => {
    if (slug && isAuthenticated) {
      fetchProjectBySlug(slug);
    }
  }, [slug, isAuthenticated, fetchProjectBySlug]);

  // Load board data for the project
  useEffect(() => {
    if (currentProject) {
      // Initialize with empty board data or load from API
      setBoardData({
        stickyNotes: [],
        lastModified: new Date().toISOString(),
      });
    }
  }, [currentProject]);

  // Save board data
  const handleSave = async (newBoardData) => {
    try {
      setIsSaving(true);
      
      // Here you would typically save to your backend API
      // For now, we'll just simulate a save
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setBoardData(newBoardData);
      toast.success('Board saved successfully!');
      
    } catch (error) {
      console.error('Failed to save board:', error);
      toast.error('Failed to save board. Please try again.');
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoaderComponent size="large" />
      </div>
    );
  }

  // Error state
  if (error || !currentProject) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8 bg-white rounded-xl border border-gray-100">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Project Not Found
          </h2>
          <p className="text-gray-600 mb-6">
            The project you're looking for doesn't exist or you don't have access to it.
          </p>
          <button
            onClick={() => router.push('/projects')}
            className="bg-violet-600 hover:bg-violet-700 text-white px-6 py-3 rounded-lg transition-colors"
          >
            Back to Projects
          </button>
        </div>
      </div>
    );
  }

  // Check if user has access to the board
  const hasAccess = currentProject.owner === user?._id || 
                   currentProject.collaborators?.some(
                     collab => collab.user === user?._id
                   );

  if (!hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8 bg-white rounded-xl border border-gray-100">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Access Denied
          </h2>
          <p className="text-gray-600 mb-6">
            You don't have permission to access this project's board.
          </p>
          <button
            onClick={() => router.push(`/projects/${slug}`)}
            className="bg-violet-600 hover:bg-violet-700 text-white px-6 py-3 rounded-lg transition-colors"
          >
            Back to Project
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen">
      {/* Project Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push(`/projects/${slug}`)}
              className="text-gray-600 hover:text-gray-800 transition-colors"
            >
              ← Back to Project
            </button>
            <div>
              <h1 className="text-lg font-semibold text-gray-800">
                {currentProject.title} - Board
              </h1>
              <p className="text-sm text-gray-600">
                Collaborative whiteboard
              </p>
            </div>
          </div>
          
          {isSaving && (
            <div className="text-sm text-gray-600">
              Saving...
            </div>
          )}
        </div>
      </div>

      {/* Board Component */}
      <div className="h-[calc(100vh-80px)]">
        <BoardPage
          projectId={currentProject._id}
          projectData={currentProject}
          onSave={handleSave}
        />
      </div>
    </div>
  );
}