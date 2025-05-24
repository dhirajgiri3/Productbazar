// lib/utils.js
import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Combines className strings with Tailwind CSS classes
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

/**
 * Formats a date into a readable string
 * @param {Date|string} date - The date to format
 * @param {Object} options - Formatting options
 * @returns {string} Formatted date string
 */
export function formatDate(date, options = {}) {
  const defaultOptions = {
    format: 'relative', // 'relative' or 'full'
    ...options
  }
  
  if (!date) return 'N/A'
  
  const dateObj = typeof date === 'string' ? new Date(date) : date
  
  if (defaultOptions.format === 'relative') {
    // Calculate time difference in seconds
    const diff = Math.floor((new Date() - dateObj) / 1000)
    
    // Less than a minute
    if (diff < 60) return 'just now'
    
    // Less than an hour
    if (diff < 3600) {
      const minutes = Math.floor(diff / 60)
      return `${minutes} min${minutes > 1 ? 's' : ''} ago`
    }
    
    // Less than a day
    if (diff < 86400) {
      const hours = Math.floor(diff / 3600)
      return `${hours} hour${hours > 1 ? 's' : ''} ago`
    }
    
    // Less than a week
    if (diff < 604800) {
      const days = Math.floor(diff / 86400)
      return `${days} day${days > 1 ? 's' : ''} ago`
    }
    
    // Format as date
    return typeof window !== 'undefined'
      ? dateObj.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: dateObj.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
        })
      : dateObj.toISOString().slice(0, 10);
  }
  
  // Full date format
  return typeof window !== 'undefined'
    ? dateObj.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : dateObj.toISOString().replace('T', ' ').slice(0, 16);
}

/**
 * Counts completed tasks in a project
 * @param {Array} tasks - Array of task objects
 * @returns {number} Number of completed tasks
 */
export function getCompletedTasksCount(tasks) {
  if (!tasks || !Array.isArray(tasks)) return 0
  return tasks.filter(task => task.status === 'completed' || task.completed).length
}

/**
 * Truncates text to a specified length
 * @param {string} text - The text to truncate
 * @param {number} maxLength - Maximum length before truncation
 * @returns {string} Truncated text
 */
export function truncateText(text, maxLength = 100) {
  if (!text || text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}