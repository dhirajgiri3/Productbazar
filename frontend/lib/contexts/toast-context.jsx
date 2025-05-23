"use client";

import { createContext, useContext } from "react";
import toast from "react-hot-toast";

// Create a context for toast functionality
const ToastContext = createContext();

// Custom hook to use the toast context
export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};

// Toast provider component
export const ToastProvider = ({ children }) => {
  // Function to show toast messages with different types
  const showToast = (type, message) => {
    switch (type) {
      case "success":
        toast.success(message, {
          duration: 3000,
          position: "top-center",
        });
        break;
      case "error":
        toast.error(message, {
          duration: 4000,
          position: "top-center",
        });
        break;
      case "warning":
        toast(message, {
          duration: 4000,
          position: "top-center",
          icon: '⚠️',
          style: {
            backgroundColor: '#FEF3C7',
            color: '#92400E'
          }
        });
        break;
      case "loading":
        return toast.loading(message, {
          position: "top-center",
        });
      case "custom":
        toast(message, {
          duration: 3000,
          position: "top-center",
        });
        break;
      default:
        toast(message, {
          duration: 3000,
          position: "top-center",
        });
    }
  };

  // Dismiss a specific toast by ID
  const dismissToast = (id) => {
    toast.dismiss(id);
  };

  // Values to be provided by the context
  const value = {
    showToast,
    dismissToast,
  };

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
};

export default ToastContext;