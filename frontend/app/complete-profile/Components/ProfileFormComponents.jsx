"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";
import LoaderComponent from "../../../Components/UI/LoaderComponent"; // Adjust path if needed

// --- FormField Component ---
export const FormField = ({
  name,
  label,
  type = "text",
  required = false,
  options = null,
  placeholder = "",
  value,
  onChange,
  error,
  disabled = false,
  icon, // Allow passing custom icon
}) => {
  const isError = !!error;
  // Normalize value to avoid null
  const normalizedValue = value ?? "";

  const getIconForField = () => {
    if (icon) return icon; // Use provided icon first

    const fieldIcons = {
      email: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
          />
        </svg>
      ),
      tel: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
          />
        </svg>
      ),
      date: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      ),
      url: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
          />
        </svg>
      ),
      number: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"
          />
        </svg>
      ),
      text: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
          />
        </svg>
      ),
      textarea: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h7" />
        </svg>
      ),
      select: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
        </svg>
      ),
    };

    if (type === "email") return fieldIcons.email;
    if (type === "tel") return fieldIcons.tel;
    if (type === "date") return fieldIcons.date;
    if (type === "url") return fieldIcons.url;
    if (type === "number") return fieldIcons.number;
    if (type === "textarea") return fieldIcons.textarea;
    if (type === "select") return fieldIcons.select;
    return fieldIcons.text;
  };

  const commonClasses =
    "w-full pl-10 pr-3 py-2.5 rounded-md border border-gray-200 bg-white text-gray-800 focus:outline-none transition-all duration-200 text-sm shadow-sm";
  const focusClasses =
    "focus:border-violet-300 focus:ring-2 focus:ring-violet-100";
  const hoverClasses = "hover:border-gray-300";
  const errorClasses =
    "border-red-300 bg-red-50 focus:border-red-400 focus:ring-2 focus:ring-red-100";
  const disabledClasses =
    "disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:border-gray-200";

  return (
    <div className="space-y-1.5">
      <label
        htmlFor={name}
        className={clsx(
          "flex items-center text-xs font-medium",
          isError ? "text-red-600" : "text-gray-700"
        )}
      >
        {label} {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <div className="relative">
        <div
          className={clsx(
            "absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10",
            type === "textarea" && "top-3 items-start"
          )}
        >
          {icon || getIconForField()}
        </div>
        {type === "select" ? (
          <div className="relative">
            <motion.select
              id={name}
              name={name}
              value={normalizedValue}
              onChange={onChange}
              disabled={disabled}
              className={clsx(
                commonClasses,
                "pr-8 appearance-none", // Select specific classes
                isError ? errorClasses : `${hoverClasses} ${focusClasses}`,
                disabledClasses
              )}
              initial={{ y: 3, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.2 }}
              whileFocus={{ y: -1 }}
            >
              {options?.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </motion.select>
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <svg
                className="h-4 w-4 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
          </div>
        ) : type === "textarea" ? (
          <motion.textarea
            id={name}
            name={name}
            value={normalizedValue}
            onChange={onChange}
            placeholder={placeholder}
            rows="4"
            disabled={disabled}
            className={clsx(
              commonClasses,
              isError ? errorClasses : `${hoverClasses} ${focusClasses}`,
              disabledClasses
            )}
            initial={{ y: 3, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.2 }}
            whileFocus={{ y: -1 }}
          />
        ) : (
          <motion.input
            type={type}
            id={name}
            name={name}
            value={normalizedValue}
            onChange={onChange}
            required={required}
            placeholder={placeholder}
            disabled={disabled}
            className={clsx(
              commonClasses,
              isError ? errorClasses : `${hoverClasses} ${focusClasses}`,
              disabledClasses
            )}
            initial={{ y: 3, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.2 }}
            whileFocus={{ y: -1 }}
          />
        )}
      </div>
      <AnimatePresence>
        {isError && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.2 }}
            className="mt-1.5"
          >
            <div className="bg-red-50 px-2.5 py-1.5 rounded-md border border-red-100">
              <p className="text-red-600 text-xs flex items-start">
                <svg
                  className="h-3 w-3 mr-1.5 mt-0.5 flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                <span>{error}</span>
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// --- Tag Component ---
export const TagComponent = ({ text, onRemove }) => (
  <div className="flex items-center bg-violet-50 text-violet-700 text-xs font-medium px-2.5 py-1.5 rounded-md border border-violet-100 shadow-sm">
    <span>{text}</span>
    <button
      type="button"
      onClick={onRemove}
      className="ml-2 text-violet-400 hover:text-violet-600 focus:outline-none transition-colors duration-200"
    >
      <svg
        className="h-3 w-3"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M6 18L18 6M6 6l12 12"
        />
      </svg>
    </button>
  </div>
);

// --- Tag Input Component ---
export const TagInput = ({
  type,
  label,
  tags,
  inputValue,
  onInputChange,
  onInputKeyDown,
  onRemoveTag,
  onAddPredefined,
  predefinedOptions,
  placeholder,
}) => {
  const icon =
    type === "skills" ? (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-5 w-5 text-gray-400 group-focus-within:text-violet-500 transition-colors duration-200"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
        />
      </svg>
    ) : (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-5 w-5 text-gray-400 group-focus-within:text-violet-500 transition-colors duration-200"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
        />
      </svg>
    );

  return (
    <div className="space-y-3 bg-white rounded-lg p-5 border border-gray-200 shadow-sm">
      <div className="flex items-center justify-between">
        <label className="flex items-center text-sm font-medium text-gray-700">
          {label}
          <span className="ml-2 bg-violet-100 text-violet-700 text-xs px-2 py-0.5 rounded-full">
            {tags.length} selected
          </span>
        </label>
      </div>
      <div className="relative group">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
          {icon}
        </div>
        <div className="flex flex-wrap gap-2 p-3 pl-10 bg-white border border-gray-200 rounded-md transition-all duration-200 focus-within:border-violet-300 focus-within:ring-2 focus-within:ring-violet-100 hover:border-gray-300 min-h-[60px] shadow-sm">
          <AnimatePresence>
            {tags.map((tag) => (
              <motion.div
                key={tag}
                initial={{ opacity: 0, scale: 0.8, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: 10 }}
                transition={{ duration: 0.2, type: "spring", stiffness: 200 }}
                layout
              >
                <TagComponent
                  text={tag}
                  onRemove={() => onRemoveTag(tag, type)}
                />
              </motion.div>
            ))}
          </AnimatePresence>
          <input
            type="text"
            value={inputValue}
            onChange={onInputChange}
            onKeyDown={onInputKeyDown}
            className="flex-grow min-w-[150px] outline-none p-1.5 text-sm bg-transparent text-gray-800"
            placeholder={placeholder}
          />
        </div>
      </div>
      {predefinedOptions && predefinedOptions.length > 0 && (
        <div className="mt-3 bg-gray-50 p-3 rounded-md border border-gray-200">
          <p className="text-xs font-medium text-gray-700 mb-2 flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-3.5 w-3.5 mr-1.5 text-violet-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
            {type === "skills"
              ? "Quickly add relevant skills:"
              : "Quickly add interests:"}
          </p>
          <div className="flex flex-wrap gap-2">
            {predefinedOptions.map((option) => {
              const isSelected = tags.includes(option);
              return (
                <motion.button
                  key={option}
                  type="button"
                  onClick={() => onAddPredefined(option, type)}
                  className={clsx(
                    "px-2.5 py-1 text-xs rounded-md transition-all duration-200 flex items-center border shadow-sm",
                    isSelected
                      ? "bg-violet-600 text-white border-violet-700"
                      : "bg-white text-gray-700 border-gray-200 hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700"
                  )}
                  disabled={isSelected}
                  whileHover={isSelected ? {} : { scale: 1.03, y: -1 }}
                  whileTap={isSelected ? {} : { scale: 0.97 }}
                >
                  {isSelected ? (
                    <>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-3 w-3 mr-1.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      {option}
                    </>
                  ) : (
                    <>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-3 w-3 mr-1.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={1.5}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M12 4v16m8-8H4"
                        />
                      </svg>
                      {option}
                    </>
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

// --- Step Indicator ---
export const StepIndicator = ({ currentStep, totalSteps, getStepLabel }) => (
  <div className="mb-10">
    <div className="flex justify-between mb-6">
      {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => {
        const isActive = currentStep >= step;
        const isCompleted = currentStep > step;
        return (
          <motion.button
            key={step}
            className="flex flex-col items-center relative"
            onClick={() => isCompleted /* && setCurrentStep(step) - Logic handled in container */}
            style={{ cursor: "default" }} // Navigation via buttons preferred
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: step * 0.05 }}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all duration-200 border-2 shadow-sm ${
                isActive
                  ? "bg-violet-600 text-white border-violet-700"
                  : "bg-white text-gray-500 border-gray-200"
              }`}
            >
              {isCompleted ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              ) : (
                step
              )}
            </div>
            <span
              className={`mt-2 text-xs ${
                isActive ? "text-violet-700 font-medium" : "text-gray-500"
              }`}
            >
              {getStepLabel(step)}
            </span>
          </motion.button>
        );
      })}
    </div>
    <div className="relative h-1 bg-gray-100 w-full rounded-full overflow-hidden">
      <motion.div
        className="absolute top-0 left-0 h-full bg-violet-600"
        initial={{ width: 0 }}
        animate={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }}
        transition={{ duration: 0.3 }}
      />
    </div>
  </div>
);

// --- Navigation Buttons ---
export const NavigationButtons = ({
  currentStep,
  totalSteps,
  onBack,
  onNext,
  onSubmit,
  isSubmitting,
}) => (
  <div className="flex items-center justify-end space-x-4">
    {currentStep > 1 && (
      <motion.button
        type="button"
        onClick={onBack}
        className="px-5 py-2.5 text-gray-600 text-sm flex items-center space-x-2 transition-all duration-200 hover:text-violet-700 border border-transparent hover:border-violet-100 rounded-md hover:bg-violet-50"
        whileHover={{ x: -1 }}
        whileTap={{ scale: 0.98 }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        <span>Back</span>
      </motion.button>
    )}
    {currentStep < totalSteps ? (
      <motion.button
        type="button"
        onClick={onNext}
        className="px-5 py-2.5 bg-violet-600 text-white text-sm rounded-md flex items-center space-x-2 transition-all duration-200 hover:bg-violet-700 shadow-sm border border-violet-700"
        whileHover={{ x: 1, y: -1 }}
        whileTap={{ scale: 0.98, y: 0 }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
      >
        <span>Continue</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 108" stroke="currentColor"
          strokeWidth={1.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </motion.button>
    ) : (
      <motion.button
        type="button"
        onClick={onSubmit}
        disabled={isSubmitting}
        className={clsx(
          "px-5 py-2.5 rounded-md text-white text-sm flex items-center space-x-2 transition-all duration-200 shadow-sm border",
          isSubmitting
            ? "bg-gray-400 cursor-not-allowed border-gray-500"
            : "bg-violet-600 hover:bg-violet-700 border-violet-700"
        )}
        whileHover={isSubmitting ? {} : { x: 1, y: -1 }}
        whileTap={isSubmitting ? {} : { scale: 0.98, y: 0 }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
      >
        {isSubmitting ? (
          <div className="flex items-center justify-center">
            <div className="mr-2">
              <LoaderComponent text="" message="" size="small" color="white" />
            </div>
            <span>Saving...</span>
          </div>
        ) : (
          <>
            <span>Complete Profile</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </>
        )}
      </motion.button>
    )}
  </div>
);