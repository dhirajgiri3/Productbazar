"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiCheck, FiLoader, FiAlertTriangle } from 'react-icons/fi';
import { toast } from 'react-hot-toast';

const RoleRequestModal = ({ isOpen, onClose, role, user }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [requestType, setRequestType] = useState('primary');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // In a real implementation, you would send a request to the backend here
      // For example:
      // await api.post('/user/role-requests', {
      //   roleId: role.id,
      //   requestType,
      //   message: e.target.message.value
      // });

      // Show success message
      toast.success(
        <div>
          <p className="font-medium mb-1">Role request submitted</p>
          <p className="text-sm mb-1">
            Your request for the <span className="font-medium">{role.label}</span> role has been noted.
          </p>
          <p className="text-sm">
            An administrator will review your request and update your profile accordingly.
          </p>
        </div>,
        { duration: 6000 }
      );

      // Close the modal
      onClose();
    } catch (err) {
      console.error('Error submitting role request:', err);
      toast.error('An error occurred while processing your request');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-xl shadow-lg max-w-md w-full overflow-hidden"
          >
            <div className="px-6 py-4 bg-gradient-to-r from-violet-50 to-white border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-800">Request Role: {role.label}</h3>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700"
                disabled={isSubmitting}
              >
                <FiX />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="mb-6">
                <div className="flex items-center p-3 bg-amber-50 rounded-lg border border-amber-100 mb-4">
                  <FiAlertTriangle className="text-amber-500 mr-2 flex-shrink-0" />
                  <p className="text-sm text-amber-700">
                    Role changes require administrator approval. Please explain why you need this role.
                  </p>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Request Type
                  </label>
                  <div className="flex space-x-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="requestType"
                        value="primary"
                        checked={requestType === 'primary'}
                        onChange={() => setRequestType('primary')}
                        className="h-4 w-4 text-violet-600 focus:ring-violet-500 border-gray-300"
                      />
                      <span className="ml-2 text-sm text-gray-700">Primary Role</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="requestType"
                        value="secondary"
                        checked={requestType === 'secondary'}
                        onChange={() => setRequestType('secondary')}
                        className="h-4 w-4 text-violet-600 focus:ring-violet-500 border-gray-300"
                      />
                      <span className="ml-2 text-sm text-gray-700">Secondary Role</span>
                    </label>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    {requestType === 'primary'
                      ? 'Primary role will replace your current role.'
                      : 'Secondary role will be added to your existing roles.'}
                  </p>
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                    Reason for Request
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-violet-500 focus:border-violet-500 text-sm"
                    placeholder="Please explain why you need this role..."
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-violet-600 hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500 flex items-center"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <FiLoader className="animate-spin mr-2" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <FiCheck className="mr-2" />
                      Submit Request
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default RoleRequestModal;
