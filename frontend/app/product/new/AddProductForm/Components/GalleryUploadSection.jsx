"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Image as ImageIcon,
  Upload,
  X,
  ArrowLeft,
  ArrowRight,
  Trash2,
  AlertCircle,
  Loader,
  Maximize2,
  X as CloseIcon,
  Info,
  CheckCircle2,
  Camera
} from "lucide-react";
import { useDropzone } from "react-dropzone";
import { validateImageFile, optimizeImage } from "@/lib/utils/image/image-utils";
import { toast } from "react-hot-toast";

const GalleryUploadSection = ({
  galleryImages,
  setGalleryImages,
  onBack,
  onNext,
  error,
}) => {
  const [processing, setProcessing] = useState(false);
  const [validationError, setValidationError] = useState("");
  const [previewImage, setPreviewImage] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [galleryPreviews, setGalleryPreviews] = useState([]);

  // Initialize gallery previews from existing gallery images
  useEffect(() => {
    if (galleryImages && galleryImages.length > 0) {
      const previews = galleryImages.map((image, index) => ({
        id: `existing-${index}`,
        url: typeof image === "string" ? image : URL.createObjectURL(image),
        file: typeof image !== "string" ? image : null,
        isExisting: typeof image === "string"
      }));
      setGalleryPreviews(previews);
    }
  }, []);

  // Process and optimize images before setting them
  const processImage = async (file) => {
    try {
      // Validate image first
      const validation = validateImageFile(file);
      if (!validation.valid) {
        toast.error(validation.error);
        return null;
      }

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
    }
  };

  const onDrop = useCallback(async (acceptedFiles) => {
    if (acceptedFiles.length === 0) return;

    // Check if adding these files would exceed the limit
    if (galleryPreviews.length + acceptedFiles.length > 10) {
      toast.error(`You can only add up to 10 gallery images. You're trying to add ${acceptedFiles.length} more, but you already have ${galleryPreviews.length}.`);
      return;
    }

    setProcessing(true);
    const toastId = toast.loading(`Processing ${acceptedFiles.length} image(s)...`);

    try {
      const processedImages = [];
      const newPreviews = [];
      
      // Process each image
      for (const file of acceptedFiles) {
        // Validate file type
        const isValid = /^image\/(jpeg|jpg|png|webp|gif)$/i.test(file.type);
        if (!isValid) {
          toast.error(`File "${file.name}" is not a supported image format`);
          continue;
        }

        // Process the image
        const optimizedImage = await processImage(file);
        if (optimizedImage) {
          processedImages.push(optimizedImage);
          
          // Create preview
          newPreviews.push({
            id: `new-${Date.now()}-${newPreviews.length}`,
            url: URL.createObjectURL(optimizedImage),
            file: optimizedImage,
            isExisting: false
          });
        }
      }

      if (processedImages.length > 0) {
        // Update gallery images
        setGalleryImages([...galleryImages, ...processedImages]);
        
        // Update previews
        setGalleryPreviews(prev => [...prev, ...newPreviews]);
        
        toast.success(`Added ${processedImages.length} image(s) to gallery`, { id: toastId });
      } else {
        toast.error('No valid images to add', { id: toastId });
      }
    } catch (error) {
      console.error("Gallery processing error:", error);
      toast.error("Failed to process gallery images", { id: toastId });
    } finally {
      setProcessing(false);
    }
  }, [galleryImages, setGalleryImages, galleryPreviews.length]);

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

  const handleRemoveImage = (index) => {
    const imageToRemove = galleryPreviews[index];
    
    // Remove from previews
    setGalleryPreviews(prev => prev.filter((_, i) => i !== index));
    
    // Remove from gallery images
    if (imageToRemove.file) {
      // If it's a file object, find and remove it
      setGalleryImages(prev => prev.filter(img => {
        if (typeof img === 'string') return true; // Keep all string URLs
        return img !== imageToRemove.file; // Remove the matching file
      }));
    } else if (imageToRemove.isExisting) {
      // If it's an existing URL, find and remove it
      setGalleryImages(prev => prev.filter(img => {
        if (typeof img !== 'string') return true; // Keep all file objects
        return img !== imageToRemove.url; // Remove the matching URL
      }));
    }
    
    toast.success("Image removed from gallery");
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-8"
    >
      {/* Tip bar */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }} 
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-100 rounded-lg text-blue-700 text-sm"
      >
        <Info size={18} className="text-blue-500 flex-shrink-0" />
        <p>
          Add up to 10 images to showcase your product in the gallery. 
          These images will be displayed in the product details page.
        </p>
      </motion.div>

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
                  src={previewImage}
                  alt="Gallery Image Preview"
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
              <p className="text-gray-700 font-medium">Processing images...</p>
              <p className="text-gray-500 text-sm mt-2">This may take a moment</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="space-y-6">
        {/* Upload Area */}
        <div
          {...getRootProps()}
          className={`relative border-2 border-dashed rounded-xl p-6 transition-all shadow-sm ${
            isDragActive || dragOver
              ? "border-violet-400 bg-violet-50"
              : "border-gray-200 hover:border-violet-300 hover:bg-gray-50"
          }`}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center justify-center p-6 text-center">
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: isDragActive ? 1.1 : 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
              className={`w-16 h-16 mb-4 rounded-full flex items-center justify-center shadow-md ${
                isDragActive ? "bg-violet-200 text-violet-600" : "bg-violet-100 text-violet-500"
              }`}
            >
              <Camera size={28} className={isDragActive ? "animate-bounce" : ""} />
            </motion.div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              {isDragActive ? "Drop your images here" : "Add gallery images"}
            </h3>
            <p className="text-gray-500 mb-4 max-w-md">
              {isDragActive 
                ? "Release to upload your images" 
                : "Drag and drop your product gallery images here, or click to select files."
              }
            </p>
            <button className="group px-6 py-2.5 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-all shadow-sm flex items-center justify-center gap-2">
              <Upload size={16} className="group-hover:scale-110 transition-transform" />
              Select Images
            </button>
            {!isDragActive && (
              <div className="flex items-center gap-3 mt-4 text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  <CheckCircle2 size={12} className="text-green-500" />
                  <span>JPG, PNG, WebP, GIF</span>
                </div>
                <div className="flex items-center gap-1">
                  <CheckCircle2 size={12} className="text-green-500" />
                  <span>Max 5MB each</span>
                </div>
                <div className="flex items-center gap-1">
                  <CheckCircle2 size={12} className="text-green-500" />
                  <span>Up to 10 images</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Gallery Preview */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-gray-700 flex items-center gap-2">
              <ImageIcon size={16} className="text-violet-500" />
              Gallery Images ({galleryPreviews.length}/10)
            </h4>
          </div>

          {galleryPreviews.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {galleryPreviews.map((preview, index) => (
                <motion.div
                  key={preview.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 border border-gray-200 shadow-sm hover:shadow-md transition-shadow group"
                >
                  <img
                    src={preview.url}
                    alt={`Gallery image ${index + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = '/images/placeholder-image.png';
                      toast.error(`Failed to load gallery image ${index + 1}`);
                    }}
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-200" />
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <button
                      onClick={() => handleRemoveImage(index)}
                      className="p-2 bg-red-500/90 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg"
                      title="Remove image"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <div className="absolute bottom-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <button
                      onClick={() => setPreviewImage(preview.url)}
                      className="p-2 bg-black/60 hover:bg-black/80 text-white rounded-full transition-colors shadow-lg"
                      title="Preview image"
                    >
                      <Maximize2 size={16} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
              <Camera className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No gallery images yet</p>
              <p className="text-sm text-gray-400 mt-1">Upload images to showcase your product</p>
            </div>
          )}
        </div>
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
        
        <button
          onClick={onNext}
          disabled={processing}
          className="px-8 py-3 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors shadow-sm flex items-center gap-2 disabled:bg-violet-300 disabled:cursor-not-allowed"
        >
          <span>Continue</span>
          <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
        </button>
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
      `}</style>
    </motion.div>
  );
};

export default GalleryUploadSection;
