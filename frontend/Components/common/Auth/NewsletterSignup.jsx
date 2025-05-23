"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Mail, Check, AlertCircle } from 'lucide-react';

const NewsletterSignup = ({ className = '' }) => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle, loading, success, error
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic email validation
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setStatus('error');
      setErrorMessage('Please enter a valid email address');
      return;
    }

    setStatus('loading');

    try {
      // You would replace this with your actual API call
      const response = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Something went wrong');
      }

      // Success
      setStatus('success');
      setEmail('');

      // Reset to idle state after 5 seconds
      setTimeout(() => {
        setStatus('idle');
      }, 5000);

    } catch (error) {
      console.error('Newsletter signup error:', error);
      setStatus('error');
      setErrorMessage(error.message || 'Failed to subscribe. Please try again.');

      // Reset to idle state after 5 seconds
      setTimeout(() => {
        setStatus('idle');
      }, 5000);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: [0.22, 1, 0.36, 1],
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  const buttonVariants = {
    idle: { scale: 1 },
    hover: { scale: 1.03, transition: { duration: 0.2 } },
    tap: { scale: 0.97, transition: { duration: 0.1 } }
  };

  const iconMotion = {
    hidden: { scale: 0, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: { type: 'spring', stiffness: 500, damping: 15 }
    },
    exit: { scale: 0, opacity: 0, transition: { duration: 0.2 } }
  };

  return (
    <motion.div
      className={`bg-white rounded-2xl p-6 shadow-md border border-gray-100 overflow-hidden ${className}`}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={itemVariants}>
        <div className="flex items-center mb-3">
          <div className="bg-gradient-to-br from-violet-500 to-indigo-600 p-2.5 rounded-xl mr-3 shadow-md text-white">
            <Mail className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-gray-900 text-lg">Stay Updated</h3>
        </div>
      </motion.div>

      <motion.p
        className="text-gray-600 text-sm mb-4 leading-relaxed"
        variants={itemVariants}
      >
        Get weekly updates on the latest products, startup trends, and exclusive offers delivered to your inbox.
      </motion.p>

      <motion.form
        onSubmit={handleSubmit}
        className="relative"
        variants={itemVariants}
      >
        <input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={status === 'loading' || status === 'success'}
          className={`w-full px-4 py-3 pr-12 rounded-xl text-sm focus:outline-none focus:ring-2 text-gray-800
            ${status === 'error'
              ? 'focus:ring-red-500 border-red-300 bg-red-50'
              : 'focus:ring-violet-500 border-gray-200 bg-gray-50'}
            transition-all`}
        />

        <motion.button
          type="submit"
          disabled={status === 'loading' || status === 'success'}
          className={`absolute right-1.5 top-1.5 p-1.5 rounded-lg
            ${status === 'loading'
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : status === 'success'
                ? 'bg-green-500 text-white'
                : 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-sm'}
            transition-all`}
          variants={buttonVariants}
          whileHover="hover"
          whileTap="tap"
          aria-label="Subscribe to newsletter"
        >
          <AnimatePresence initial={false}>
            {status === 'loading' ? (
              <motion.div
                key="loading"
                className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"
                initial={iconMotion.hidden}
                animate={iconMotion.visible}
                exit={iconMotion.exit}
              />
            ) : status === 'success' ? (
              <motion.div
                key="success"
                initial={iconMotion.hidden}
                animate={iconMotion.visible}
                exit={iconMotion.exit}
              >
                <Check className="w-5 h-5" />
              </motion.div>
            ) : (
              <motion.div
                key="send"
                initial={iconMotion.hidden}
                animate={iconMotion.visible}
                exit={iconMotion.exit}
              >
                <Send className="w-5 h-5" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
      </motion.form>

      <AnimatePresence>
        {status === 'error' && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-center mt-2 text-red-600 text-xs"
          >
            <AlertCircle className="w-3 h-3 mr-1" />
            <span>{errorMessage}</span>
          </motion.div>
        )}

        {status === 'success' && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-center mt-2 text-green-600 text-xs"
          >
            <Check className="w-3 h-3 mr-1" />
            <span>Thank you for subscribing!</span>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        className="mt-6 pt-4 border-t border-gray-100"
        variants={itemVariants}
      >
        <p className="text-gray-500 text-xs text-center">
          We respect your privacy. Unsubscribe at any time.
        </p>
      </motion.div>
    </motion.div>
  );
};

// Skeleton loader for NewsletterSignup component
export const NewsletterSignupSkeleton = () => {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 animate-pulse">
      <div className="flex items-center mb-4">
        <div className="bg-gray-200 w-8 h-8 rounded-md mr-3" />
        <div className="h-5 bg-gray-200 rounded w-1/4" />
      </div>

      <div className="h-3 bg-gray-200 rounded w-full mb-2" />
      <div className="h-3 bg-gray-200 rounded w-4/5 mb-4" />

      <div className="h-10 bg-gray-200 rounded-lg w-full mb-4" />

      <div className="h-2 bg-gray-200 rounded w-2/3 mx-auto" />
    </div>
  );
};

export default NewsletterSignup;