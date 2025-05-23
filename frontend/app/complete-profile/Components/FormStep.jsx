import { motion } from "framer-motion";
import clsx from "clsx";

export const FormStep = ({ children, title, isActive }) => (
  <motion.div
    initial={{ opacity: 0, x: 10 }}
    animate={{ opacity: isActive ? 1 : 0, x: isActive ? 0 : 10 }}
    exit={{ opacity: 0, x: -10 }}
    transition={{ duration: 0.3, ease: "easeInOut" }}
    className={clsx(
      "space-y-8 transition-all duration-300",
      isActive ? "block" : "hidden"
    )}
  >
    <motion.div
      className="mb-8"
      initial={{ opacity: 0, y: -5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
    >
      <div className="flex items-center space-x-4 mb-3">
        <div className="w-1.5 h-8 bg-violet-600 rounded-full"></div>
        <h3 className="text-xl font-semibold text-gray-800">
          {title}
        </h3>
        <div className="h-px flex-grow bg-gradient-to-r from-violet-200 to-transparent"></div>
      </div>
      <div className="pl-6 border-l-2 border-violet-100">
        <p className="text-sm text-gray-600">
          {title.includes("Review") ?
            "Please review your information before submitting" :
            "Please fill in the following information to complete your profile."}
        </p>
      </div>
    </motion.div>
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm"
    >
      {children}
    </motion.div>
  </motion.div>
);
