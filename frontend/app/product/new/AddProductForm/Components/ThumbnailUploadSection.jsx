"use client";

import React, { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Image as ImageIcon,
  Upload,
  X,
  ArrowLeft,
  ArrowRight,
  Link as LinkIcon,
  AlertCircle,
  Loader,
  Maximize2,
  X as CloseIcon,
  Info,
  CheckCircle2
} from "lucide-react";
import { useDropzone } from "react-dropzone";
import { validateImageFile, optimizeImage } from "@/lib/utils/image/image-utils";
import { toast } from "react-hot-toast";

const ThumbnailUploadSection = ({
  thumbnail,
  setThumbnail,
  onBack,
  onNext,
  error,
}) => {
  const [activeTab, setActiveTab] = useState("upload");
  const [linkInput, setLinkInput] = useState("");
  const [processing, setProcessing] = useState(false);
  const [validationError, setValidationError] = useState("");
  const [previewImage, setPreviewImage] = useState(null);
  const [dragOver, setDragOver] = useState(false);

  // Process and optimize images before setting them
  const processImage = async (file) => {
    setProcessing(true);
    try {
      // Validate image first
      const validation = validateImageFile(file);
      if (!validation.valid) {
        setValidationError(validation.error);
        toast.error(validation.error);
        setProcessing(false);
        return null;
      }

      // Clear any previous errors
      setValidationError("");

      // Optimize the image
      const optimized = await optimizeImage(file, {
        maxWidth: 1200,
        maxSizeMB: 2,
        format: 'webp'
      });

      return optimized;
    } catch (error) {
      console.error("Image processing error:", error);
      toast.error("Failed to process image. Please try again.");
      return null;
    } finally {
      setProcessing(false);
    }
  };

  const onDrop = useCallback(async (acceptedFiles) => {
    if (acceptedFiles.length === 0) return;

    // Take only the first file if multiple files are dropped
    const file = acceptedFiles[0];

    // Validate file type
    const isValid = /^image\/(jpeg|jpg|png|webp|gif)$/i.test(file.type);
    if (!isValid) {
      toast.error(`File "${file.name}" is not a supported image format`);
      return;
    }

    setProcessing(true);
    const toastId = toast.loading('Processing image...');

    try {
      // Process the thumbnail image
      const optimizedThumbnail = await processImage(file);

      if (optimizedThumbnail) {
        // If we already had a thumbnail, replace it
        if (thumbnail) {
          toast.success('Thumbnail image replaced', { id: toastId });
        } else {
          toast.success('Thumbnail image added', { id: toastId });
        }

        setThumbnail(optimizedThumbnail);
        
        // Automatically switch to preview tab after successful upload
        setActiveTab("gallery");
      } else {
        toast.error('Failed to process image', { id: toastId });
      }

      // If multiple files were dropped, inform the user we only used the first one
      if (acceptedFiles.length > 1) {
        toast.info(`Note: Only the first image was used as thumbnail. ${acceptedFiles.length - 1} additional image(s) were ignored.`);
      }
    } catch (error) {
      console.error("Image drop processing error:", error);
      toast.error("Failed to process uploaded image", { id: toastId });
    } finally {
      setProcessing(false);
    }
  }, [thumbnail, setThumbnail]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { "image/*": [] },
    multiple: true,
    onDrop,
    maxSize: 10 * 1024 * 1024, // 10MB max size
    onDragEnter: () => setDragOver(true),
    onDragLeave: () => setDragOver(false),
    onDropAccepted: () => setDragOver(false),
    onDropRejected: () => setDragOver(false),
  });

  const handleRemoveImage = () => {
    setThumbnail(null);
    toast.success("Thumbnail removed");
    // Switch back to upload tab after removing
    setActiveTab("upload");
  };

  const handleAddImageFromUrl = async () => {
    if (!linkInput) return;

    try {
      setProcessing(true);
      const toastId = toast.loading("Fetching image...");

      // Attempt to fetch the image to verify it exists
      const response = await fetch(linkInput, { method: 'HEAD' });

      if (!response.ok) {
        toast.error("Invalid image URL. Please check and try again.", { id: toastId });
        setProcessing(false);
        return;
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.startsWith('image/')) {
        toast.error("The URL does not point to an image. Please use a direct image URL.", { id: toastId });
        setProcessing(false);
        return;
      }

      // Set or replace the thumbnail image
      if (thumbnail) {
        toast.success("Thumbnail image replaced", { id: toastId });
      } else {
        toast.success("Thumbnail image added", { id: toastId });
      }

      setThumbnail(linkInput);
      setLinkInput("");
      
      // Automatically switch to preview tab after successful URL import
      setActiveTab("gallery");
    } catch (error) {
      toast.error("Failed to add image from URL");
      console.error("URL image error:", error);
    } finally {
      setProcessing(false);
    }
  };

  // Handle ESC key press to close preview
  useEffect(() => {
    const handleEscKey = (e) => {
      if (e.key === 'Escape' && previewImage) {
        setPreviewImage(null);
      }
    };

    window.addEventListener('keydown', handleEscKey);
    return () => window.removeEventListener('keydown', handleEscKey);
  }, [previewImage]);

  // Determine if Continue button should be enabled
  const isContinueEnabled = !!thumbnail && !processing;

  // Auto-focus the URL input when switching to link tab
  useEffect(() => {
    if (activeTab === "link") {
      const timer = setTimeout(() => {
        document.getElementById("thumbnail-url-input")?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [activeTab]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-8"
    >
      {/* Tabs with animated indicator */}
      <div className="relative p-1 bg-gray-100 rounded-lg w-fit">
        <div className="flex gap-1">
          {[
            { id: "upload", icon: Upload, label: "Upload" },
            { id: "link", icon: LinkIcon, label: "URL" },
            { id: "gallery", icon: ImageIcon, label: "Preview" },
          ].map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`relative z-10 flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all ${
                activeTab === id
                  ? "text-violet-700 font-medium"
                  : "text-gray-600 hover:text-violet-600"
              }`}
              disabled={processing}
            >
              <Icon size={18} />
              <span>{label}</span>
              {id === "gallery" && thumbnail && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-100" />
              )}
            </button>
          ))}
        </div>
        {/* Animated tab indicator */}
        <AnimatePresence>
          <motion.div
            className="absolute inset-y-1 rounded-lg bg-white shadow-sm"
            initial={false}
            animate={{
              width: document.getElementById(`tab-${activeTab}`)?.offsetWidth || 100,
              x: document.getElementById(`tab-${activeTab}`)?.offsetLeft || 0,
            }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            id={`tab-${activeTab}`}
            style={{ zIndex: 1 }}
          />
        </AnimatePresence>
      </div>

      {/* Tip bar shown when no thumbnail is selected */}
      {!thumbnail && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }} 
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-100 rounded-lg text-blue-700 text-sm"
        >
          <Info size={18} className="text-blue-500 flex-shrink-0" />
          <p>
            A high-quality product thumbnail helps increase customer interest. 
            We recommend using a square image (1:1 ratio) with dimensions of at least 800×800 pixels.
          </p>
        </motion.div>
      )}

      {/* Image Preview Modal */}
      <AnimatePresence>
        {previewImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/95 flex items-center justify-center z-50"
            onClick={() => setPreviewImage(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-5xl p-4"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setPreviewImage(null)}
                className="absolute top-4 right-4 bg-white/20 hover:bg-white/40 p-3 rounded-full transition-colors z-10"
                title="Close preview"
              >
                <CloseIcon size={20} className="text-white" />
              </button>

              <div className="bg-black/30 backdrop-blur-md p-2 rounded-xl overflow-hidden shadow-2xl">
                <img
                  src={typeof previewImage === "string" ? previewImage : URL.createObjectURL(previewImage)}
                  alt="Product Thumbnail Preview"
                  className="max-h-[85vh] max-w-full mx-auto object-contain rounded-lg"
                  onError={(e) => {
                    e.target.src = '/images/placeholder-image.png';
                    toast.error("Failed to load preview image");
                  }}
                />
              </div>

              <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 bg-black/70 backdrop-blur-md text-white px-5 py-2 rounded-full text-sm shadow-lg">
                Click anywhere or press ESC to close
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Processing Overlay */}
      <AnimatePresence>
        {processing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-white p-6 rounded-lg shadow-lg flex flex-col items-center"
            >
              <Loader size={40} className="text-violet-600 animate-spin mb-4" />
              <p className="text-gray-700 font-medium">Processing image...</p>
              <p className="text-gray-500 text-sm mt-2">This may take a moment</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="relative min-h-[400px]">
        <AnimatePresence mode="wait">
          {activeTab === "upload" && (
            <motion.div
              key="upload"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="absolute inset-0"
            >
              <div
                {...getRootProps()}
                className={`relative h-full border-2 border-dashed rounded-xl transition-all shadow-sm ${
                  isDragActive || dragOver
                    ? "border-violet-400 bg-violet-50"
                    : "border-gray-200 hover:border-violet-300 hover:bg-gray-50"
                }`}
              >
                <input {...getInputProps()} />
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                  <motion.div
                    initial={{ scale: 0.8 }}
                    animate={{ scale: isDragActive ? 1.1 : 1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    className={`w-20 h-20 mb-4 rounded-full flex items-center justify-center shadow-md ${
                      isDragActive ? "bg-violet-200 text-violet-600" : "bg-violet-100 text-violet-500"
                    }`}
                  >
                    <Upload size={32} className={isDragActive ? "animate-bounce" : ""} />
                  </motion.div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    {isDragActive ? "Drop your thumbnail here" : "Upload product thumbnail"}
                  </h3>
                  <p className="text-gray-500 mb-6 max-w-md">
                    {isDragActive 
                      ? "Release to upload your image" 
                      : "Drag and drop your product thumbnail image here, or click to select a file."
                    }
                  </p>
                  <div className="space-y-2 text-center flex flex-col gap-4 items-center justify-center w-full max-w-md">
                    <button className="group px-8 py-3 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-all shadow-sm flex items-center justify-center gap-2">
                      <ImageIcon size={18} className="group-hover:scale-110 transition-transform" />
                      Choose Thumbnail
                    </button>
                    {!isDragActive && (
                      <div className="flex flex-col items-center justify-center gap-3 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <CheckCircle2 size={14} className="text-green-500" />
                          <span>JPG, PNG, WebP, GIF</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <CheckCircle2 size={14} className="text-green-500" />
                          <span>Max 10MB</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <CheckCircle2 size={14} className="text-green-500" />
                          <span>Recommended 800×800px</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "link" && (
            <motion.div
              key="link"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="absolute inset-0 flex flex-col"
            >
              <div className="flex-1 flex flex-col items-center justify-center p-6">
                <div className="w-full max-w-md space-y-6">
                  <div className="text-center">
                    <motion.div
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      className="w-16 h-16 mb-4 mx-auto rounded-full bg-violet-100 flex items-center justify-center text-violet-500 shadow-sm"
                    >
                      <LinkIcon size={24} />
                    </motion.div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">
                      Add thumbnail from URL
                    </h3>
                    <p className="text-gray-500 text-sm mb-6">
                      Enter a direct link to your product thumbnail image
                    </p>
                  </div>

                  <div className="space-y-3 bg-gray-50 p-4 rounded-xl border border-gray-200 shadow-sm">
                    <div className="space-y-1">
                      <label htmlFor="thumbnail-url-input" className="text-sm font-medium text-gray-700">Image URL</label>
                      <div className="relative">
                        <input
                          id="thumbnail-url-input"
                          type="url"
                          value={linkInput}
                          onChange={(e) => setLinkInput(e.target.value)}
                          placeholder="https://example.com/image.jpg"
                          className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 shadow-sm transition-all pr-12"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && linkInput && !processing) {
                              handleAddImageFromUrl();
                            }
                          }}
                        />
                        {linkInput && (
                          <button 
                            onClick={() => setLinkInput('')}
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
                          >
                            <X size={16} />
                          </button>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        URL must link directly to an image file (JPG, PNG, WebP, etc.)
                      </p>
                    </div>
                    <button
                      onClick={handleAddImageFromUrl}
                      disabled={!linkInput || processing}
                      className="w-full px-6 py-3 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-all disabled:bg-violet-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
                    >
                      {processing ? (
                        <>
                          <Loader size={18} className="animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <LinkIcon size={18} />
                          Set as Thumbnail
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "gallery" && (
            <motion.div
              key="gallery"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="absolute inset-0"
            >
              <div className="h-full p-6 border-2 border-gray-200 rounded-xl overflow-hidden">
                {!thumbnail ? (
                  <div className="h-full flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 mb-4 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                      <ImageIcon size={24} />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">
                      No thumbnail yet
                    </h3>
                    <p className="text-gray-500 mb-4">
                      Switch to Upload or URL tab to add a thumbnail image
                    </p>
                    <div className="flex gap-3">
                      <button 
                        onClick={() => setActiveTab("upload")}
                        className="px-4 py-2 bg-violet-100 text-violet-700 rounded-lg hover:bg-violet-200 transition-colors flex items-center gap-2"
                      >
                        <Upload size={18} />
                        Upload Image
                      </button>
                      <button 
                        onClick={() => setActiveTab("link")}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
                      >
                        <LinkIcon size={18} />
                        Use URL
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Thumbnail Section */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-gray-700 flex items-center gap-2">
                          <ImageIcon size={16} className="text-violet-500" />
                          Product Thumbnail
                        </h4>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setActiveTab("upload")}
                            className="px-3 py-1.5 text-sm border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors flex items-center gap-1"
                          >
                            <Upload size={14} />
                            Replace
                          </button>
                        </div>
                      </div>
                      
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="relative w-full h-64 md:h-96 rounded-lg overflow-hidden bg-gray-100 border border-gray-200 shadow-sm hover:shadow-md transition-shadow group"
                      >
                        <div className="absolute top-2 left-2 z-10 bg-violet-500 text-white text-xs px-3 py-1 rounded-full font-medium shadow-sm">
                          Primary Thumbnail
                        </div>
                        <img
                          src={
                            typeof thumbnail === "string"
                              ? thumbnail
                              : URL.createObjectURL(thumbnail)
                          }
                          alt="Thumbnail"
                          className="w-full h-full object-contain bg-checkerboard"
                          onError={(e) => {
                            e.target.src = '/images/placeholder-image.png';
                            toast.error("Failed to load thumbnail image");
                          }}
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200" />
                        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <button
                            onClick={() => setPreviewImage(thumbnail)}
                            className="px-3 py-2 bg-black/60 hover:bg-black/80 text-white rounded-lg transition-colors shadow-lg flex items-center gap-2"
                          >
                            <Maximize2 size={16} />
                            Preview
                          </button>
                          <button
                            onClick={() => handleRemoveImage()}
                            className="px-3 py-2 bg-red-500/90 text-white rounded-lg hover:bg-red-600 transition-colors shadow-lg flex items-center gap-2"
                          >
                            <X size={16} />
                            Remove
                          </button>
                        </div>
                      </motion.div>
                      
                      <div className="flex items-center gap-2 text-sm text-gray-500 mt-2">
                        <CheckCircle2 size={16} className="text-green-500" />
                        <p>
                          This image will be displayed as the main image for your product.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Error Message */}
      <AnimatePresence>
        {(error || validationError) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-3 bg-red-50 border border-red-100 rounded-lg text-red-600 text-sm flex items-center gap-2"
          >
            <AlertCircle size={16} className="flex-shrink-0" />
            <p>{error || validationError}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex justify-between items-center pt-6">
        <button
          onClick={onBack}
          className="px-6 py-3 flex items-center gap-2 text-gray-600 hover:text-violet-600 transition-colors group"
          disabled={processing}
        >
          <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          <span>Back</span>
        </button>
        
        <div className="flex items-center gap-4">
          {thumbnail && (
            <span className="hidden md:flex items-center text-sm text-green-600 gap-1">
              <CheckCircle2 size={16} />
              Thumbnail added
            </span>
          )}
          <button
            onClick={onNext}
            disabled={!isContinueEnabled}
            className={`px-8 py-3 rounded-lg flex items-center gap-2 shadow-sm transition-all ${
              isContinueEnabled
                ? "bg-violet-600 text-white hover:bg-violet-700 hover:shadow-md"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            <span>Continue</span>
            <ArrowRight size={20} className={isContinueEnabled ? "group-hover:translate-x-1 transition-transform" : ""} />
          </button>
        </div>
      </div>

      {/* Extra CSS for styling */}
      <style jsx global>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .bg-checkerboard {
          background-image: 
            linear-gradient(45deg, #f0f0f0 25%, transparent 25%),
            linear-gradient(-45deg, #f0f0f0 25%, transparent 25%),
            linear-gradient(45deg, transparent 75%, #f0f0f0 75%),
            linear-gradient(-45deg, transparent 75%, #f0f0f0 75%);
          background-size: 20px 20px;
          background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
        }
      `}</style>
    </motion.div>
  );
};

export default ThumbnailUploadSection;