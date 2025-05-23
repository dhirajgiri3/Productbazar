"use client";

import { useMemo, useEffect, useState, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import {
  AlertCircle,
  Info,
  CheckCircle,
  RefreshCw,
  Save,
  Calendar,
  Clock,
  User,
} from "lucide-react";
import debounce from "lodash/debounce";
import "react-quill/dist/quill.snow.css";

// Dynamically import ReactQuill
const ReactQuill = dynamic(() => import("react-quill"), {
  ssr: false,
  loading: () => (
    <div className="border rounded-lg p-4 bg-gray-50 animate-pulse h-[120px]">
      <div className="h-6 bg-gray-200 rounded w-1/3 mb-3"></div>
      <div className="h-4 bg-gray-100 rounded mb-2 w-full"></div>
      <div className="h-4 bg-gray-100 rounded w-5/6"></div>
    </div>
  ),
});

const formatDateTime = (date) => {
  return new Date(date).toISOString().replace("T", " ").substring(0, 19);
};

// Fixed styles to properly enforce minHeight
const getCustomQuillStyles = (minHeight) => `
  .ql-toolbar.ql-snow {
    border-top-left-radius: 0.5rem;
    border-top-right-radius: 0.5rem;
    border: 1px solid #e5e7eb;
    background-color: #f9fafb;
    padding: 6px; /* Reduced padding for more compact toolbar */
  }

  .ql-container.ql-snow {
    border-bottom-left-radius: 0.5rem;
    border-bottom-right-radius: 0.5rem;
    border: 1px solid #e5e7eb;
    border-top: none;
    font-family: inherit;
    font-size: 0.875rem;
    height: auto !important;
    min-height: ${minHeight - 35}px !important; /* Adjusted for smaller toolbar */
  }

  /* Fixed: Force the quill container to respect minHeight */
  .quill {
    display: flex;
    flex-direction: column;
    height: auto !important;
    min-height: ${minHeight}px !important;
  }

  .quill .ql-container {
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  .quill .ql-editor {
    flex: 1;
    overflow-y: auto;
    font-family: inherit;
    padding: 0.75rem; /* Slightly reduced padding */
    line-height: 1.6;
    color: #374151;
    min-height: ${minHeight - 35}px !important; /* Important to enforce min height */
    height: auto !important;
  }

  /* Reduced icon sizes for more minimalistic appearance */
  .ql-snow.ql-toolbar button {
    width: 22px; /* Smaller button size */
    height: 22px; /* Smaller button size */
    padding: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 0.25rem;
    transition: all 0.15s;
    margin: 1px; /* Tighter spacing */
  }

  .ql-snow.ql-toolbar button svg {
    transform: scale(0.85); /* Slightly smaller icons */
  }

  .ql-snow.ql-toolbar button:hover {
    background-color: #f3f4f6;
  }

  .ql-snow.ql-toolbar button.ql-active {
    background-color: #eef2ff;
  }

  .ql-snow.ql-toolbar button:hover .ql-stroke,
  .ql-snow.ql-toolbar button.ql-active .ql-stroke {
    stroke: #4f46e5;
  }

  .ql-snow.ql-toolbar button:hover .ql-fill,
  .ql-snow.ql-toolbar button.ql-active .ql-fill {
    fill: #4f46e5;
  }

  /* Compact dropdown menus */
  .ql-snow .ql-picker {
    font-size: 0.75rem;
    height: 22px;
  }

  .ql-snow .ql-picker-label {
    padding: 0 4px;
    height: 22px;
    line-height: 22px;
  }

  .ql-snow .ql-picker-options {
    padding: 4px 8px;
  }

  .ql-editor p {
    margin-bottom: 0.75rem;
  }

  .ql-editor h1, .ql-editor h2, .ql-editor h3 {
    font-weight: 600;
    margin-bottom: 0.5rem;
  }

  .ql-editor ul, .ql-editor ol {
    padding-left: 1.5rem;
    margin-bottom: 0.75rem;
  }

  .ql-editor.ql-blank::before {
    font-style: normal;
    color: #9ca3af;
    font-size: 0.875rem;
    left: 0.75rem;
    right: 0.75rem;
  }

  .quill-error .ql-toolbar.ql-snow {
    border-color: #fecaca;
    background-color: #fef2f2;
  }

  .quill-error .ql-container.ql-snow {
    border-color: #fecaca;
  }

  .quill-focus .ql-toolbar.ql-snow,
  .quill-focus .ql-container.ql-snow {
    border-color: #a5b4fc;
  }
`;

const RichTextEditor = ({
  value,
  onChange,
  onBlur,
  placeholder = "Start typing...",
  error,
  label,
  required = false,
  toolbar = "full",
  minHeight = 150,
  helpText,
  maxLength,
  autoSave = false,
  onSave,
  readOnly = false,
  className = "",
  id,
  ariaLabel,
  showMetadata = true,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [characterCount, setCharacterCount] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);
  const [lastModified, setLastModified] = useState(formatDateTime(new Date()));
  const quillRef = useRef(null);
  const editorRef = useRef(null);
  const editorId = id || `editor-${Math.random().toString(36).substring(2, 9)}`;

  useEffect(() => {
    if (value) {
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = value;
      const textContent = tempDiv.textContent || tempDiv.innerText || "";
      setCharacterCount(textContent.length);
      setLastModified(formatDateTime(new Date()));
    } else {
      setCharacterCount(0);
    }
  }, [value]);

  // Inject dynamic CSS with the specified minHeight
  useEffect(() => {
    const styleId = "quill-custom-styles";
    const existingStyle = document.getElementById(styleId);
    
    if (existingStyle) {
      existingStyle.remove();
    }
    
    const styleElement = document.createElement("style");
    styleElement.id = styleId;
    styleElement.innerHTML = getCustomQuillStyles(minHeight);
    document.head.appendChild(styleElement);

    return () => {
      const styleToRemove = document.getElementById(styleId);
      if (styleToRemove) {
        styleToRemove.remove();
      }
    };
  }, [minHeight]);

  // Force correct height after mount
  useEffect(() => {
    if (quillRef.current) {
      const editor = quillRef.current.getEditor();
      if (editor) {
        const container = editor.container;
        if (container) {
          // Force height recalculation
          setTimeout(() => {
            container.style.minHeight = `${minHeight - 35}px`;
            const editorElement = container.querySelector('.ql-editor');
            if (editorElement) {
              editorElement.style.minHeight = `${minHeight - 35}px`;
            }
          }, 0);
        }
      }
    }
  }, [minHeight, quillRef.current]);

  const performSave = useCallback(async () => {
    if (!autoSave || !onSave || !value) return;

    try {
      setIsSaving(true);
      await onSave(value);
      setSaveStatus("success");
      setLastModified(formatDateTime(new Date()));

      setTimeout(() => {
        setSaveStatus(null);
      }, 2000);
    } catch (error) {
      console.error("Error saving content:", error);
      setSaveStatus("error");

      setTimeout(() => {
        setSaveStatus(null);
      }, 3000);
    } finally {
      setIsSaving(false);
    }
  }, [autoSave, onSave, value]);

  const debouncedSave = useMemo(
    () => debounce(performSave, 1000),
    [performSave]
  );

  useEffect(() => {
    if (autoSave && value) {
      debouncedSave();
    }

    return () => {
      debouncedSave.cancel();
    };
  }, [value, autoSave, debouncedSave]);

  const toolbarOptions = useMemo(() => {
    const toolbarConfigs = {
      full: [
        [{ header: [1, 2, 3, false] }],
        ["bold", "italic", "underline"],
        [{ list: "ordered" }, { list: "bullet" }],
        ["link", "blockquote"],
        ["clean"],
      ],
      basic: [
        [{ header: [2, 3, false] }],
        ["bold", "italic"],
        [{ list: "bullet" }],
        ["link"],
        ["clean"],
      ],
      minimal: [["bold", "italic"], [{ list: "bullet" }], ["link"], ["clean"]],
    };

    return toolbarConfigs[toolbar] || toolbarConfigs.basic;
  }, [toolbar]);

  const modules = useMemo(
    () => ({
      toolbar: toolbarOptions,
      clipboard: {
        matchVisual: false,
      },
      keyboard: {
        bindings: {
          tab: {
            key: 9,
            handler: () => true,
          },
        },
      },
    }),
    [toolbarOptions]
  );

  const formats = [
    "header",
    "bold",
    "italic",
    "underline",
    "list",
    "bullet",
    "link",
    "blockquote",
  ];

  return (
    <div className={`space-y-1.5 ${className}`}>
      <div className="flex items-center justify-between mb-1">
        {label && (
          <label
            htmlFor={editorId}
            className="block text-sm font-medium text-gray-700"
          >
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        {showMetadata && (
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <User size={12} />
              <span>dhirajgiri3</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar size={12} />
              <span>{lastModified.split(" ")[0]}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock size={12} />
              <span>{lastModified.split(" ")[1]}</span>
            </div>
          </div>
        )}
      </div>

      <div
        ref={editorRef}
        className={`relative ${isFocused ? "quill-focus" : ""} ${
          error ? "quill-error" : ""
        }`}
        style={{ minHeight: `${minHeight}px` }} /* Direct style application */
      >
        <ReactQuill
          ref={quillRef}
          theme="snow"
          value={value}
          onChange={onChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            setIsFocused(false);
            onBlur?.();
          }}
          placeholder={placeholder}
          modules={modules}
          formats={formats}
          readOnly={readOnly}
          className="h-full"
          style={{ minHeight: `${minHeight}px` }} // Direct style application
        />

        {error && (
          <div
            className="absolute -inset-px border-2 border-red-200 rounded-lg pointer-events-none"
            aria-hidden="true"
          />
        )}
      </div>

      <div className="flex items-center justify-between mt-1 px-1 text-xs text-gray-500">
        <div className="flex items-center gap-2">
          {error && (
            <motion.p
              id={`${editorId}-error`}
              className="text-xs text-red-600 flex items-center gap-1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              role="alert"
            >
              <AlertCircle size={12} />
              {error}
            </motion.p>
          )}

          {helpText && !error && (
            <p className="flex items-center gap-1 text-gray-500">
              <Info size={12} className="text-indigo-400" />
              {helpText}
            </p>
          )}
        </div>

        <div className="flex items-center gap-3">
          {maxLength && (
            <span
              className={`${
                characterCount > maxLength * 0.9
                  ? characterCount >= maxLength
                    ? "text-red-500"
                    : "text-amber-500"
                  : ""
              }`}
            >
              {characterCount}/{maxLength}
            </span>
          )}

          {autoSave && (
            <div className="flex items-center h-5">
              {isSaving && (
                <span className="flex items-center gap-1 text-indigo-500">
                  <RefreshCw size={12} className="animate-spin" />
                  <span className="sr-only">Saving...</span>
                </span>
              )}

              {saveStatus === "success" && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-emerald-500"
                >
                  <CheckCircle size={12} />
                </motion.span>
              )}

              {saveStatus === "error" && (
                <span className="text-red-500">
                  <AlertCircle size={12} />
                </span>
              )}
            </div>
          )}

          {!autoSave && onSave && (
            <button
              onClick={performSave}
              disabled={isSaving}
              className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700 disabled:opacity-50"
            >
              <Save size={12} />
              <span>Save</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default RichTextEditor;