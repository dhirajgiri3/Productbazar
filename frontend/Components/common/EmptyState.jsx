// src/components/common/EmptyState.jsx
import { motion } from "framer-motion";

const EmptyState = ({
  title,
  description,
  icon,
  action,
  actionButton,
  className = '',
  size = 'md'
}) => {
  const sizes = {
    sm: { container: 'py-6', icon: 'w-10 h-10', title: 'text-lg', description: 'text-sm max-w-sm' },
    md: { container: 'py-10', icon: 'w-12 h-12', title: 'text-xl', description: 'text-base max-w-md' },
    lg: { container: 'py-16', icon: 'w-16 h-16', title: 'text-2xl', description: 'text-lg max-w-lg' },
  };

  const sizeClasses = sizes[size] || sizes.md;
  const defaultIcon = (
    <svg className={`${sizeClasses.icon} text-violet-500`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex flex-col items-center text-center ${sizeClasses.container} ${className}`}
    >
      <div className="mb-4 bg-violet-50 rounded-full p-4">
        {icon || defaultIcon}
      </div>
      <h3 className={`font-semibold text-gray-900 mb-2 ${sizeClasses.title}`}>
        {title || 'Nothing here'}
      </h3>
      {description && (
        <p className={`text-gray-500 mb-6 ${sizeClasses.description}`}>
          {description}
        </p>
      )}
      {(actionButton || action) && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          {actionButton || (
            action && (
              <button
                onClick={action.onClick}
                className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors"
              >
                {action.label}
              </button>
            )
          )}
        </motion.div>
      )}
    </motion.div>
  );
};

export default EmptyState;