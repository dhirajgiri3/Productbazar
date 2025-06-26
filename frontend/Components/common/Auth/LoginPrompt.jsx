import React from "react";
import {
  FaUser,
  FaLock,
  FaTimes,
  FaGoogle,
  FaGithub,
  FaTwitter,
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import GoogleAuthButton from './GoogleAuthButton';

// Animation variants
const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const modalVariants = {
  hidden: { scale: 0.8, opacity: 0, y: 30 },
  visible: {
    scale: 1,
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 30,
    },
  },
  exit: {
    scale: 0.8,
    opacity: 0,
    y: 30,
    transition: { duration: 0.2 },
  },
};

const LoginPrompt = ({
  isOpen,
  onClose,
  message = "Sign in to interact with our community.",
  title = "Sign In",
  redirectUrl = "",
}) => {
  if (!isOpen) return null;

  // Handle backdrop click to close modal
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Add redirectUrl to auth paths if needed
  const getRedirectPath = (basePath) => {
    if (redirectUrl) {
      return `${basePath}?redirect=${encodeURIComponent(redirectUrl)}`;
    }
    return basePath;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="login-prompt-backdrop"
          className="fixed inset-0 bg-black/40 backdrop-blur-[10px] flex items-center justify-center z-50 p-4"
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          onClick={handleBackdropClick}
        >
          <motion.div
            className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden"
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {/* Modal Header */}
            <div className="relative p-5 border-b border-gray-200 bg-gradient-to-r from-violet-500 to-purple-600 text-white">
              <div className="absolute top-0 left-0 w-full h-full opacity-20">
                <div className="absolute top-0 right-0 transform translate-x-1/4 -translate-y-1/2">
                  <div className="w-40 h-40 rounded-full bg-white/10"></div>
                </div>
                <div className="absolute bottom-0 left-0 transform -translate-x-1/4 translate-y-1/2">
                  <div className="w-32 h-32 rounded-full bg-white/10"></div>
                </div>
              </div>

              <div className="relative z-10 flex justify-between items-center">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <FaUser className="text-violet-200" />
                  {title}
                </h3>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-full hover:bg-white/20 transition-colors"
                  aria-label="Close dialog"
                >
                  <FaTimes size={18} />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              <p className="text-gray-700 mb-6 text-center">
                {message}
              </p>

              {/* Auth Methods */}
              <div className="space-y-4">
                {/* Email/Password Login Form */}
                <div className="space-y-3">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <FaUser className="text-gray-400" />
                    </div>
                    <input
                      type="email"
                      placeholder="Email"
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 text-gray-800 transition-colors"
                    />
                  </div>

                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <FaLock className="text-gray-400" />
                    </div>
                    <input
                      type="password"
                      placeholder="Password"
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 text-gray-800 transition-colors"
                    />
                  </div>

                  <motion.button
                    className="w-full bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white py-2.5 rounded-lg font-medium shadow-lg shadow-violet-500/20 flex items-center justify-center"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Sign In
                  </motion.button>

                  <div className="text-xs text-gray-500 text-center">
                    <a
                      href={getRedirectPath("/auth/forgot-password")}
                      className="text-violet-600 hover:underline"
                    >
                      Forgot password?
                    </a>
                  </div>
                </div>

                {/* Divider */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">
                      Or continue with
                    </span>
                  </div>
                </div>

                {/* Social Login Options */}
                <div className="grid grid-cols-3 gap-3">
                  <GoogleAuthButton isLogin={true} size="default" />
                  <motion.button
                    className="py-2.5 px-4 bg-[#24292E] text-white rounded-lg flex items-center justify-center"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <FaGithub size={16} />
                  </motion.button>

                  <motion.button
                    className="py-2.5 px-4 bg-[#1DA1F2] text-white rounded-lg flex items-center justify-center"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <FaTwitter size={16} />
                  </motion.button>
                </div>
              </div>

              {/* Sign Up Link */}
              <div className="mt-6 text-center text-sm text-gray-600">
                Don't have an account?{" "}
                <a
                  href={getRedirectPath("/auth/register")}
                  className="font-medium text-violet-600 hover:text-violet-700 hover:underline"
                >
                  Register Now
                </a>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LoginPrompt;
