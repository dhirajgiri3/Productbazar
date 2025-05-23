// EditProductModal.jsx
"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useProduct } from "@/lib/contexts/product-context";
import { useAuth } from "@/lib/contexts/auth-context"; // <-- Marked as potentially unused
import { useCategories } from "@/lib/contexts/category-context";
import { toast } from "react-hot-toast";
import eventBus, { EVENT_TYPES } from "@/lib/utils/event-bus";
import {
  X,
  Image as ImageIcon,
  Link as LinkIcon,
  Tag,
  DollarSign,
  Edit,
  Info,
  Check,
  Upload,
  Trash2,
  AlertCircle,
  Globe,
  Plus,
  CheckCircle,
  Repeat, // For Subscription Icon
  CreditCard, // For Paid Icon
  Calendar, // For Contact Icon
  Loader, // For loading state
  ExternalLink, // For external link icon
  Video, // For video link icon
  Camera, // For gallery image icon
  Maximize, // For fullscreen preview
} from "lucide-react"; // <--- Use Lucide icons
import dynamic from "next/dynamic";
import Image from "next/image";
import { Tooltip } from "react-tooltip";
import { validateImageFile, optimizeImage } from "@/lib/utils/image/image-utils"; // <-- Import image utils
import { uploadGalleryImages as uploadGalleryImagesUtil, deleteGalleryImage as deleteGalleryImageUtil } from "../../../Utils/Image/galleryUtils"; // Import gallery utils

// Dynamically import the rich text editor
const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });
import "react-quill/dist/quill.snow.css"; // Quill styles

// --- Constants ---
const MAX_TAGS = 10;
const THUMBNAIL_MAX_SIZE_MB = 5;
const CURRENCIES = [
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "GBP", symbol: "£", name: "British Pound" },
  { code: "INR", symbol: "₹", name: "Indian Rupee" },
  { code: "JPY", symbol: "¥", name: "Japanese Yen" },
];
const PRICING_TYPES = [
  { id: "free", icon: CheckCircle, label: "Free", description: "Product is free" },
  { id: "paid", icon: CreditCard, label: "One-time Purchase", description: "Users pay once" },
  { id: "subscription", icon: Repeat, label: "Subscription", description: "Recurring payment" },
  { id: "freemium", icon: Tag, label: "Freemium", description: "Basic free, premium paid" },
  { id: "contact", icon: Calendar, label: "Contact for Pricing", description: "Contact for details" }
];
const LINK_TYPES = [
  { id: "website", icon: Globe, label: "Website", placeholder: "https://yourproduct.com" },
  { id: "github", icon: ExternalLink, label: "GitHub", placeholder: "https://github.com/username/repo" }, // Using ExternalLink as substitute
  { id: "demo", icon: ExternalLink, label: "Demo", placeholder: "https://demo.yourproduct.com" },
  { id: "appStore", icon: ExternalLink, label: "App Store", placeholder: "https://apps.apple.com/..." },
  { id: "playStore", icon: ExternalLink, label: "Play Store", placeholder: "https://play.google.com/..." },
  { id: "video", icon: Video, label: "Video", placeholder: "https://youtube.com/watch?v=..." }, // Using Video as substitute
];

// --- EditProductModal Component ---
const EditProductModal = ({ isOpen, onClose, product }) => {
  const { updateProduct, error: productError, clearError } = useProduct();
  const { categories, loading: categoriesLoading, fetchCategories } = useCategories();

  // --- State ---
  const [activeTab, setActiveTab] = useState("basic");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const fileInputRef = useRef(null);
  const galleryInputRef = useRef(null);
  const [thumbnailPreview, setThumbnailPreview] = useState(null);
  const [thumbnailProcessing, setThumbnailProcessing] = useState(false);
  const [galleryPreviews, setGalleryPreviews] = useState([]);
  const [galleryProcessing, setGalleryProcessing] = useState(false);
  const [activeGalleryImage, setActiveGalleryImage] = useState(null);
  const [showFullscreenPreview, setShowFullscreenPreview] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [tagInput, setTagInput] = useState("");
  const [urlInput, setUrlInput] = useState("");
  const [urlType, setUrlType] = useState("website");

  // Main form state - Aligned with AddProductForm and productSchema
  const [formData, setFormData] = useState({
    name: "", // Read-only, populated from product
    tagline: "",
    description: "",
    category: "",
    status: "Published",
    thumbnail: null, // Will hold the File object if a new one is uploaded
    pricing: {
      type: "free",
      amount: "",
      currency: "USD",
      discounted: false,
      originalAmount: "",
      interval: "",
      contactEmail: "",
      contactPhone: "",
      contactInstructions: ""
    },
    tags: [],
    links: { // Ensure all link types from schema are present
      website: "",
      github: "",
      demo: "",
      appStore: "",
      playStore: "",
      video: "", // Add video link type if needed
    },
    gallery: [], // <--- Gallery field
  });

  // --- Effects ---

  // Reset form and errors when closing
  useEffect(() => {
    if (!isOpen) {
      clearError();
      setTimeout(() => {
        setValidationErrors({});
        setActiveTab("basic"); // Reset to first tab
        setHasUnsavedChanges(false);
      }, 300); // Delay to allow exit animation
    }
  }, [isOpen, clearError]);

  // Listen for tab switch events
  useEffect(() => {
    const unsubscribe = eventBus.subscribe(EVENT_TYPES.SWITCH_MODAL_TAB, (data) => {
      if (isOpen && data && data.tab) {
        setActiveTab(data.tab);
      }
    });

    return () => unsubscribe();
  }, [isOpen]);

  // Initialize form data when product or isOpen changes
  useEffect(() => {
    if (product && isOpen) {
      setFormData({
        name: product.name || "", // Name is read-only
        tagline: product.tagline || "",
        description: product.description || "",
        category: product.category?._id || product.category || "", // Handle object or ID
        status: product.status || "Published",
        thumbnail: null, // Start with null, only set if user uploads a new file
        pricing: {
          type: product.pricing?.type || "free",
          amount: product.pricing?.amount?.toString() || "", // Ensure amount is string for input
          currency: product.pricing?.currency || "USD",
          discounted: product.pricing?.discounted || false,
          originalAmount: product.pricing?.originalAmount?.toString() || "",
          interval: product.pricing?.interval || "",
          contactEmail: product.pricing?.contactEmail || "",
          contactPhone: product.pricing?.contactPhone || "",
          contactInstructions: product.pricing?.contactInstructions || ""
        },
        tags: product.tags || [],
        links: {
          website: product.links?.website || "",
          github: product.links?.github || "",
          demo: product.links?.demo || "",
          appStore: product.links?.appStore || "",
          playStore: product.links?.playStore || "",
          video: product.links?.video || "",
          // Ensure other links are initialized if added to schema/form
        },
        gallery: [], // Initialize empty gallery array for new uploads
      });

      // Set the initial preview from the existing product thumbnail URL
      setThumbnailPreview(product.thumbnail || null);

      // Initialize gallery previews from existing product gallery
      if (product.gallery && Array.isArray(product.gallery) && product.gallery.length > 0) {
        const galleryItems = product.gallery.map((item, index) => {
          const imageUrl = typeof item === 'string' ? item : item.url;
          return {
            id: item._id || `existing-${index}`,
            url: imageUrl,
            isExisting: true,
            caption: item.caption || ''
          };
        });
        setGalleryPreviews(galleryItems);
      } else {
        setGalleryPreviews([]);
      }

      // Reset state variables
      setHasUnsavedChanges(false);
      setValidationErrors({});
      setTagInput("");
      setUrlInput("");
      setUrlType("website");
    }
  }, [product, isOpen]);

  // Fetch categories if needed when modal opens
  useEffect(() => {
    if (isOpen && (!categories || categories.length === 0)) {
      fetchCategories();
    }
  }, [isOpen, categories, fetchCategories]);

  // Set active gallery image when gallery previews change
  useEffect(() => {
    if (galleryPreviews.length > 0 && !activeGalleryImage) {
      setActiveGalleryImage(galleryPreviews[0]);
    } else if (galleryPreviews.length === 0) {
      setActiveGalleryImage(null);
    } else if (activeGalleryImage) {
      // Check if the active image still exists in the gallery
      const stillExists = galleryPreviews.some(preview =>
        preview.id === activeGalleryImage.id ||
        preview.url === activeGalleryImage.url
      );
      if (!stillExists) {
        setActiveGalleryImage(galleryPreviews[0]);
      }
    }
  }, [galleryPreviews, activeGalleryImage]);

  // Handle ESC key to close fullscreen preview
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && showFullscreenPreview) {
        setShowFullscreenPreview(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showFullscreenPreview]);


  // --- Event Handlers ---

  // Generic input change handler
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const updatePath = name.split("."); // For nested state like pricing.amount

    setFormData((prev) => {
      let newState = { ...prev };
      let currentLevel = newState;

      // Navigate nested state for updates (e.g., pricing.type)
      for (let i = 0; i < updatePath.length - 1; i++) {
        currentLevel = currentLevel[updatePath[i]];
      }

      // Update the final value
      currentLevel[updatePath[updatePath.length - 1]] = type === 'checkbox' ? checked : value;

      return newState;
    });

    setHasUnsavedChanges(true);
    clearValidation(name);
  };

  // Pricing specific change handler
  const handlePricingChange = (e) => {
    const { name, value, type, checked } = e.target;
    const field = name.replace('pricing.', ''); // Get field name like 'type', 'amount'

    setFormData((prev) => {
        const newPricing = { ...prev.pricing };

        if (type === 'checkbox') {
            newPricing[field] = checked;
            // If turning off discount, clear original amount
            if (field === 'discounted' && !checked) {
                newPricing.originalAmount = '';
            }
        } else {
            newPricing[field] = value;
        }

        // Reset fields based on type change
        if (field === 'type') {
            if (value === "free" || value === "contact") {
                newPricing.amount = "";
                newPricing.originalAmount = "";
                newPricing.discounted = false;
            }
            if (value !== "subscription") {
                newPricing.interval = "";
            }
             if (value === "contact") {
                newPricing.contactEmail = newPricing.contactEmail || ""; // Keep existing if already set
             } else {
                // Clear contact fields if not contact type
                delete newPricing.contactEmail;
                delete newPricing.contactPhone;
                delete newPricing.contactInstructions;
             }
        }

        return { ...prev, pricing: newPricing };
    });

    setHasUnsavedChanges(true);
    clearValidation(name); // Clear validation for pricing field
};


  // Handle pricing type button clicks
  const handlePricingTypeChange = (type) => {
    handlePricingChange({ target: { name: 'pricing.type', value: type } });
  };

   // Toggle discount button handler
   const handleToggleDiscount = () => {
    const isDiscounted = !formData.pricing.discounted;
    handlePricingChange({ target: { name: 'pricing.discounted', type: 'checkbox', checked: isDiscounted } });
  };

  // Description change handler
  const handleDescriptionChange = (content) => {
    setFormData((prev) => ({ ...prev, description: content }));
    setHasUnsavedChanges(true);
    clearValidation("description");
  };

  // Thumbnail upload handler
  const handleThumbnailChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setThumbnailProcessing(true);
    const toastId = toast.loading('Processing thumbnail...');

    try {
      // Validate
      const validation = validateImageFile(file, THUMBNAIL_MAX_SIZE_MB);
      if (!validation.valid) {
        toast.error(validation.error, { id: toastId });
        setThumbnailProcessing(false);
        return;
      }

      // Optimize (optional but good practice)
      const optimizedFile = await optimizeImage(file, { maxWidth: 1200, format: 'webp', quality: 0.8 });

      setFormData((prev) => ({ ...prev, thumbnail: optimizedFile || file }));

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setThumbnailPreview(reader.result);
        toast.success('Thumbnail ready to be saved', { id: toastId });
      };
      reader.readAsDataURL(optimizedFile || file);

      setHasUnsavedChanges(true);
      clearValidation("thumbnail");

    } catch (err) {
      console.error("Thumbnail processing error:", err);
      toast.error('Failed to process thumbnail', { id: toastId });
    } finally {
      setThumbnailProcessing(false);
       // Reset file input value to allow re-uploading the same file if needed
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // Remove thumbnail preview and uploaded file
   const handleRemoveThumbnail = () => {
    setThumbnailPreview(product?.thumbnail || null); // Revert to original preview if exists
    setFormData((prev) => ({ ...prev, thumbnail: null }));
    setHasUnsavedChanges(true); // Mark as changed if user reverts
    toast.info("Thumbnail upload removed. Original will be kept unless replaced.");
  };

  // Add Tag Handler (Enter, Comma, Space)
  const handleAddTag = () => {
    if (!tagInput.trim()) return;
    const newTag = tagInput.trim().toLowerCase();

    if (formData.tags.includes(newTag)) {
      toast.error("Tag already added");
      return;
    }
    if (formData.tags.length >= MAX_TAGS) {
      toast.error(`Maximum ${MAX_TAGS} tags allowed`);
      return;
    }

    setFormData((prev) => ({ ...prev, tags: [...prev.tags, newTag] }));
    setTagInput("");
    setHasUnsavedChanges(true);
  };

  // Remove Tag Handler
  const handleRemoveTag = (indexToRemove) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((_, index) => index !== indexToRemove),
    }));
    setHasUnsavedChanges(true);
  };

  // Tag Input KeyDown Handler
  const handleTagKeyDown = (e) => {
    if (e.key === "Enter" || e.key === "," || e.key === " ") {
      e.preventDefault();
      handleAddTag();
    } else if (e.key === 'Backspace' && !tagInput && formData.tags.length > 0) {
      // Optional: Remove last tag on backspace if input is empty
      handleRemoveTag(formData.tags.length - 1);
    }
  };

  // Add Link Handler
  const handleAddLink = () => {
    if (!urlInput.trim()) return;

    try {
      new URL(urlInput); // Basic URL validation
      setFormData(prev => ({
        ...prev,
        links: { ...prev.links, [urlType]: urlInput }
      }));
      setUrlInput("");
      // Optionally reset urlType or move to next available empty link type
      // setUrlType("website"); // Reset to default
      toast.success(`${LINK_TYPES.find(lt => lt.id === urlType)?.label || urlType} link updated/added`);
      setHasUnsavedChanges(true);
      clearValidation(`links.${urlType}`);
    } catch (error) {
      toast.error("Please enter a valid URL (e.g., https://example.com)");
    }
  };

  // Remove Link Handler
  const handleRemoveLink = (typeToRemove) => {
    setFormData(prev => {
        const newLinks = { ...prev.links };
        newLinks[typeToRemove] = ""; // Set to empty string instead of deleting key
        return { ...prev, links: newLinks };
    });
    setHasUnsavedChanges(true);
    toast.info(`${LINK_TYPES.find(lt => lt.id === typeToRemove)?.label || typeToRemove} link cleared`);
  };

  // Handle gallery image upload
  const handleGalleryChange = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    setGalleryProcessing(true);
    const toastId = toast.loading(`Processing ${files.length} gallery image(s)...`);

    try {
      // Validate files
      const validFiles = [];
      const newPreviews = [];

      for (const file of files) {
        // Check file size (5MB limit)
        if (file.size > 5 * 1024 * 1024) {
          toast.error(`${file.name} is too large (max 5MB)`, { id: toastId });
          continue;
        }

        // Check file type
        if (!file.type.startsWith('image/')) {
          toast.error(`${file.name} is not a valid image file`, { id: toastId });
          continue;
        }

        validFiles.push(file);

        // Create preview
        const reader = new FileReader();
        reader.onloadend = () => {
          newPreviews.push({
            id: `new-${Date.now()}-${newPreviews.length}`,
            url: reader.result,
            file: file,
            isExisting: false
          });

          // If all files are processed, update state
          if (newPreviews.length === validFiles.length) {
            setGalleryPreviews(prev => [...prev, ...newPreviews]);
            setFormData(prev => ({
              ...prev,
              gallery: [...(prev.gallery || []), ...validFiles]
            }));
            setHasUnsavedChanges(true);
            toast.success(`Added ${validFiles.length} image(s) to gallery`, { id: toastId });
          }
        };
        reader.readAsDataURL(file);
      }

      if (validFiles.length === 0) {
        toast.error('No valid images to add', { id: toastId });
      }
    } catch (error) {
      console.error('Gallery processing error:', error);
      toast.error('Failed to process gallery images', { id: toastId });
    } finally {
      setGalleryProcessing(false);
      // Reset file input
      if (galleryInputRef.current) {
        galleryInputRef.current.value = '';
      }
    }
  };

  // Remove gallery image
  const handleRemoveGalleryImage = (indexToRemove) => {
    const imageToRemove = galleryPreviews[indexToRemove];

    // If it's an existing image, we'll need to track it for deletion on save
    if (imageToRemove.isExisting) {
      // We'll handle existing image deletion when saving the form
      // Just remove from previews for now
      setGalleryPreviews(prev => prev.filter((_, index) => index !== indexToRemove));
      toast.success('Image removed from gallery');
      setHasUnsavedChanges(true);
      return;
    }

    // For new uploads, remove from both previews and form data
    setGalleryPreviews(prev => prev.filter((_, index) => index !== indexToRemove));
    setFormData(prev => ({
      ...prev,
      gallery: prev.gallery.filter((_, index) => {
        // Find the corresponding index in the gallery array
        // This is more complex because we need to match the file objects
        const previewFile = galleryPreviews[indexToRemove].file;
        return index !== prev.gallery.findIndex(file => file === previewFile);
      })
    }));
    toast.success('Image removed from gallery');
    setHasUnsavedChanges(true);
  };

  // Handle direct upload of gallery images to server
  const handleUploadGalleryImages = async () => {
    if (!product?.slug || !formData.gallery || formData.gallery.length === 0) {
      toast.error('No images to upload');
      return;
    }

    const toastId = toast.loading('Uploading gallery images...');
    setGalleryProcessing(true);

    try {
      const result = await uploadGalleryImagesUtil(product.slug, formData.gallery);

      if (result.success) {
        // Update gallery previews with the new server data
        if (result.data && Array.isArray(result.data)) {
          const updatedGallery = result.data.map(item => ({
            id: item._id,
            url: typeof item === 'string' ? item : item.url,
            isExisting: true,
            caption: item.caption || ''
          }));
          setGalleryPreviews(updatedGallery);
        }

        // Clear the upload queue
        setFormData(prev => ({ ...prev, gallery: [] }));

        toast.success('Gallery images uploaded successfully', { id: toastId });
      } else {
        toast.error(result.message || 'Failed to upload images', { id: toastId });
      }
    } catch (error) {
      console.error('Gallery upload error:', error);
      toast.error('Error uploading gallery images', { id: toastId });
    } finally {
      setGalleryProcessing(false);
    }
  };

  // Handle removing an existing gallery image from the server
  const handleDeleteGalleryImage = async (imageId) => {
    if (!product?.slug || !imageId) {
      toast.error('Cannot delete image');
      return;
    }

    const toastId = toast.loading('Removing image...');

    try {
      const result = await deleteGalleryImageUtil(product.slug, imageId);

      if (result.success) {
        // Update gallery previews with the new server data
        if (result.data && Array.isArray(result.data)) {
          const updatedGallery = result.data.map(item => ({
            id: item._id,
            url: typeof item === 'string' ? item : item.url,
            isExisting: true,
            caption: item.caption || ''
          }));
          setGalleryPreviews(updatedGallery);
        } else {
          // If no data returned, just remove the image from previews
          setGalleryPreviews(prev => prev.filter(item => item.id !== imageId));
        }

        toast.success('Image removed successfully', { id: toastId });
      } else {
        toast.error(result.message || 'Failed to remove image', { id: toastId });
      }
    } catch (error) {
      console.error('Gallery image deletion error:', error);
      toast.error('Error removing image', { id: toastId });
    }
  };

  // --- Validation ---

  const clearValidation = (fieldName) => {
    if (validationErrors[fieldName]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const errors = {};
    const { tagline, description, category, pricing, links } = formData;

    // Basic Info
    if (tagline && tagline.length > 160) {
        errors.tagline = "Tagline cannot exceed 160 characters";
    }
    if (!description || description.trim().length < 10) {
      errors.description = "Description must be at least 10 characters";
    }
    if (!category) {
      errors.category = "Please select a category";
    }

    // Pricing
    if (pricing.type === "paid" || pricing.type === "subscription") {
      if (!pricing.amount || parseFloat(pricing.amount) <= 0) {
        errors.pricingAmount = "Please enter a valid positive price";
      }
       if (pricing.discounted) {
            if (!pricing.originalAmount || parseFloat(pricing.originalAmount) <= 0) {
                errors.pricingOriginalAmount = "Original price is required for discounts";
            } else if (parseFloat(pricing.originalAmount) <= parseFloat(pricing.amount || 0)) {
                errors.pricingOriginalAmount = "Original price must be higher than the discounted price";
            }
        }
    }
     if (pricing.type === "subscription" && !pricing.interval) {
        errors.pricingInterval = "Please select a billing interval";
    }
     if (pricing.type === "contact") {
        if (!pricing.contactEmail) {
            errors.pricingContactEmail = "Contact email is required";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(pricing.contactEmail)) {
            errors.pricingContactEmail = "Please enter a valid email address";
        }
    }


    // Links - Validate only non-empty links
    Object.entries(links).forEach(([key, value]) => {
      if (value && typeof value === 'string' && value.trim()) {
        try {
          new URL(value);
        } catch (_) {
          errors[`links.${key}`] = `Please enter a valid URL for ${key}`;
        }
      }
    });

    // Tags
    if (formData.tags.length > MAX_TAGS) {
        errors.tags = `You can add a maximum of ${MAX_TAGS} tags`;
    }
    formData.tags.forEach(tag => {
        if (tag.length > 30) {
            errors.tags = `Tag "${tag}" is too long (max 30 characters)`;
        }
    });


    // Thumbnail (Check if there's an existing one or a new one uploaded)
    // No explicit validation needed here as we retain the old one if none is uploaded

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // --- Form Submission ---
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fix the errors before saving");
      // Find the first tab with an error and switch to it
      const firstErrorKey = Object.keys(validationErrors)[0];
      if (firstErrorKey) {
          if (['tagline', 'description', 'category', 'status'].includes(firstErrorKey)) setActiveTab('basic');
          else if (firstErrorKey.startsWith('pricing')) setActiveTab('pricing');
          else if (firstErrorKey.startsWith('links')) setActiveTab('links');
          else if (firstErrorKey === 'tags') setActiveTab('tags');
          // Thumbnail validation is handled differently (not in form errors)
      }
      return;
    }

    setSubmitting(true);
    const toastId = toast.loading("Saving changes...");

    try {
      // Prepare data for API - Align with AddProductForm submission logic
      const productDataToSubmit = {
        tagline: formData.tagline,
        description: formData.description,
        category: formData.category,
        status: formData.status,
        tags: formData.tags,
        links: formData.links, // Send links object directly
        pricing: { // Format pricing data
          ...formData.pricing,
          amount: (formData.pricing.type === "paid" || formData.pricing.type === "subscription" || formData.pricing.type === "freemium")
            ? parseFloat(formData.pricing.amount || 0)
            : 0,
          originalAmount: (formData.pricing.discounted && formData.pricing.originalAmount)
            ? parseFloat(formData.pricing.originalAmount)
            : undefined, // Send undefined if not applicable
           // Interval is already handled in state
           // Contact fields are already handled in state
        },
        // Conditionally include thumbnail only if a new file was uploaded
        ...(formData.thumbnail && { thumbnail: formData.thumbnail }),
        // Include gallery images if there are any new ones to upload
        ...(formData.gallery && formData.gallery.length > 0 && { gallery: formData.gallery }),
      };

      // Log data being sent
      console.log("Data sent to updateProduct:", {
          ...productDataToSubmit,
          thumbnail: productDataToSubmit.thumbnail ? '[File Object]' : '[Not Changed]'
      });

      const result = await updateProduct(product.slug, productDataToSubmit);

      if (result.success) {
        toast.success("Product updated successfully!", { id: toastId });
        setHasUnsavedChanges(false);

        // Prepare updated data for the parent component
        const updatedProductDataForUI = {
            ...product, // Start with existing product data
            ...result.data, // Overwrite with response data from API
            // Explicitly update fields from form data that might not be in API response
            tagline: formData.tagline,
            description: formData.description,
            category: formData.category, // This might need adjustment if API returns populated category
            status: formData.status,
            tags: formData.tags,
            links: formData.links,
            pricing: productDataToSubmit.pricing, // Use the formatted pricing
            thumbnail: thumbnailPreview || product.thumbnail, // Use new preview or original
            // Include gallery if it was updated
            gallery: result.data.gallery || product.gallery,
            updatedAt: new Date().toISOString(), // Reflect immediate update
        };

        onClose(updatedProductDataForUI); // Pass updated data back
      } else {
        // Display specific backend errors if available
        const errorMessage = result.message || productError || "Failed to update product";
        toast.error(errorMessage, { id: toastId });
        // Optionally map backend errors to form fields
        if (result.errors) {
            setValidationErrors(result.errors);
        }
      }
    } catch (err) {
      console.error("Error updating product:", err);
      toast.error(productError || "An unexpected error occurred", { id: toastId });
    } finally {
      setSubmitting(false);
    }
  };

  // --- Modal Close Handler ---
  const handleCloseModal = useCallback(() => {
    if (hasUnsavedChanges && !submitting) {
      if (window.confirm("You have unsaved changes. Are you sure you want to close?")) {
        onClose(); // Close without saving
      }
    } else if (!submitting) {
      onClose(); // Close normally
    }
  }, [hasUnsavedChanges, submitting, onClose]);

  // --- Animation Variants ---
  const modalVariants = {
    hidden: { opacity: 0, scale: 0.9, y: 20 },
    visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } },
    exit: { opacity: 0, scale: 0.9, y: 20, transition: { duration: 0.2, ease: "easeIn" } }
  };

  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.3 } },
    exit: { opacity: 0, transition: { duration: 0.2 } }
  };

  const headerVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: { opacity: 1, y: 0, transition: { delay: 0.1, duration: 0.3 } }
  };

  const tabContentVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.3 } },
    exit: { opacity: 0, x: 10, transition: { duration: 0.2 } }
  };

  const contentVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { delay: 0.2, duration: 0.3 } }
  };

  // --- Tab Configuration ---
  const tabs = [
    { id: "basic", label: "Basic Info", icon: Edit },
    { id: "media", label: "Thumbnail", icon: ImageIcon },
    { id: "gallery", label: "Gallery", icon: Camera },
    { id: "pricing", label: "Pricing", icon: DollarSign },
    { id: "links", label: "Links", icon: LinkIcon },
    { id: "tags", label: "Tags", icon: Tag },
  ];

  // --- Rich Text Editor Config ---
  const editorModules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['link', 'image'],
      ['clean']
    ],
  };
  const editorFormats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'list', 'bullet',
    'link', 'image'
  ];


  // --- Render Logic ---
  if (!isOpen) return null;

  // Helper to get currency symbol
  const getSelectedCurrency = () => {
    return CURRENCIES.find(c => c.code === formData.pricing.currency) || CURRENCIES[0];
  };


  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
      <Tooltip id="tooltip" className="z-[100]" />
      <AnimatePresence mode="wait">
        {/* Overlay */}
        <motion.div
          key="edit-product-modal-overlay"
          className="absolute inset-0"
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={overlayVariants}
          onClick={handleCloseModal}
        />

        {/* Modal Content */}
        <motion.div
          key="edit-product-modal"
          className="bg-gradient-to-b from-white via-white to-gray-50 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden z-10 border border-gray-200/50"
          variants={modalVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          {/* Header */}
          <motion.div
            className="p-6 bg-gradient-to-r from-white to-violet-50/30 border-b border-gray-100 flex justify-between items-center"
            variants={headerVariants}
          >
             <div>
              <motion.h2
                className="text-2xl font-bold text-gray-800 flex items-center gap-2"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2, duration: 0.3 }}
              >
                <motion.span
                  className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center shadow-sm border border-violet-200/50"
                  initial={{ scale: 0.8, rotate: -10 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.3, duration: 0.4, type: "spring" }}
                >
                  <Edit className="w-5 h-5 text-violet-600" />
                </motion.span>
                <span className="bg-gradient-to-r from-violet-700 to-indigo-600 text-transparent bg-clip-text">
                  Edit Product: {formData.name} {/* Show product name */}
                </span>
              </motion.h2>
              <motion.p
                className="text-gray-500 text-sm mt-1 ml-12"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.3 }}
              >
                Update details, media, pricing, and more.
              </motion.p>
            </div>
            <motion.button
              onClick={handleCloseModal}
              className="text-gray-400 hover:text-violet-600 p-2 rounded-full hover:bg-violet-100/50 transition-all duration-200"
              aria-label="Close modal"
              whileHover={{ scale: 1.05, rotate: 90 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, rotate: 45 }}
              animate={{ opacity: 1, rotate: 0 }}
              transition={{ delay: 0.3, duration: 0.3 }}
            >
              <X className="w-6 h-6" />
            </motion.button>
          </motion.div>

          {/* Tabs */}
          <motion.div
            className="px-6 flex overflow-x-auto hide-scrollbar bg-white border-b border-gray-100 shadow-sm"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.3 }}
          >
             <div className="flex space-x-1 py-3 w-full">
              {tabs.map((tab, index) => (
                <motion.button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative flex items-center space-x-1.5 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
                    activeTab === tab.id
                      ? "text-violet-700"
                      : "text-gray-500 hover:text-violet-600 hover:bg-gray-50/70"
                  }`}
                  data-tooltip-id="tooltip"
                  data-tooltip-content={tab.label}
                   whileHover={{ y: -1 }}
                  whileTap={{ y: 0 }}
                   initial={{ opacity: 0, y: -5 }}
                  animate={{
                    opacity: 1,
                    y: 0,
                    transition: { delay: 0.1 + index * 0.05, duration: 0.2 },
                  }}
                >
                  {/* Active tab indicator */}
                  {activeTab === tab.id && (
                    <motion.div
                      className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-violet-500 to-purple-500"
                      layoutId="activeTabIndicatorEdit"
                       initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3, type: 'spring', stiffness: 300, damping: 30 }}
                    />
                  )}
                   {/* Subtle background for active tab */}
                    {activeTab === tab.id && (
                        <motion.div
                        className="absolute inset-0 rounded-lg bg-violet-50/50 -z-10"
                        layoutId="activeTabBackgroundEdit"
                        transition={{ duration: 0.2 }}
                        />
                    )}

                  <motion.div className="flex items-center space-x-1.5 relative z-10">
                    <tab.icon
                      className={`w-4 h-4 flex-shrink-0 ${
                        activeTab === tab.id ? "text-violet-600" : "text-gray-400"
                      }`}
                    />
                    <span className="whitespace-nowrap">{tab.label}</span>
                  </motion.div>
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* Form Content Area */}
          <motion.div
            className="flex-1 overflow-y-auto p-6 md:p-8 bg-gray-50/30" // Added padding
            variants={contentVariants}
            initial="hidden"
            animate="visible"
          >
            <form onSubmit={handleSubmit} className="space-y-8 max-w-full mx-auto">
              <AnimatePresence mode="wait">
                {/* Basic Info Tab */}
                {activeTab === "basic" && (
                   <motion.div
                    key="basic-tab"
                    className="space-y-6 bg-white p-6 rounded-xl shadow-sm border border-gray-100"
                    variants={tabContentVariants} initial="hidden" animate="visible" exit="exit"
                  >
                    {/* Product Name (Read Only) */}
                    <div className="bg-violet-50/50 rounded-lg p-4 border border-violet-100 shadow-inner">
                      <label htmlFor="name" className="text-sm font-medium text-gray-600 mb-1.5 flex items-center">
                        Product Name
                        <span className="ml-2 text-xs text-violet-500 bg-violet-100 px-2 py-0.5 rounded-full">Read Only</span>
                      </label>
                      <input
                        type="text" id="name" name="name" value={formData.name} readOnly
                        className="w-full px-4 py-2.5 border border-violet-200 rounded-lg bg-white text-gray-700 cursor-not-allowed focus:outline-none focus:ring-1 focus:ring-violet-300"
                      />
                       <p className="mt-1.5 text-xs text-violet-600">Product names cannot be changed after creation.</p>
                    </div>

                     {/* Tagline */}
                    <div>
                      <label htmlFor="tagline" className="text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
                        Tagline <span className="text-xs text-gray-400">(Optional)</span>
                      </label>
                      <div className="relative">
                        <input
                          type="text" id="tagline" name="tagline" value={formData.tagline} onChange={handleChange}
                          className={`w-full pl-4 pr-16 py-2.5 border rounded-lg transition-colors duration-200 ${
                            validationErrors.tagline ? 'border-red-400 ring-1 ring-red-300 focus:border-red-500' : 'border-gray-200 hover:border-gray-300 focus:ring-1 focus:ring-violet-500 focus:border-violet-500'
                          }`}
                          placeholder="Short, catchy description (max 160 chars)"
                          maxLength={160}
                        />
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-400 pointer-events-none">
                          {formData.tagline?.length || 0}/160
                        </div>
                      </div>
                      {validationErrors.tagline && <p className="mt-1 text-xs text-red-600 flex items-center gap-1"><AlertCircle size={14} />{validationErrors.tagline}</p>}
                       <p className="mt-1 text-xs text-gray-500">A good tagline helps users understand your product quickly.</p>
                    </div>

                    {/* Description */}
                     <div>
                      <label htmlFor="description" className="text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
                        Description <span className="text-xs text-red-500 bg-red-50 px-1.5 py-0.5 rounded-full">Required</span>
                      </label>
                      <div className="rich-text-editor-container rounded-lg overflow-hidden border border-gray-200 focus-within:ring-1 focus-within:ring-violet-500 focus-within:border-violet-500">
                         {/* Keep global styles for Quill */}
                         <style jsx global>{` /* ... Quill styles ... */ `}</style>
                        <ReactQuill
                          theme="snow" value={formData.description} onChange={handleDescriptionChange}
                          modules={editorModules} formats={editorFormats}
                          placeholder="Describe your product in detail (features, benefits, use cases)..."
                          className={validationErrors.description ? 'border-red-400' : ''}
                        />
                      </div>
                       {validationErrors.description ? (
                        <p className="mt-1 text-xs text-red-600 flex items-center gap-1"><AlertCircle size={14} />{validationErrors.description}</p>
                      ) : (
                         <p className="mt-1 text-xs text-gray-500">Use Markdown for formatting. Minimum 10 characters.</p>
                      )}
                    </div>

                    {/* Category & Status */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Category */}
                      <div>
                        <label htmlFor="category" className="text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
                          Category <span className="text-xs text-red-500 bg-red-50 px-1.5 py-0.5 rounded-full">Required</span>
                        </label>
                        <div className="relative">
                          <select
                            id="category" name="category" value={formData.category} onChange={handleChange}
                            className={`w-full pl-4 pr-10 py-2.5 border rounded-lg appearance-none bg-white transition-colors duration-200 ${
                              validationErrors.category ? 'border-red-400 ring-1 ring-red-300 focus:border-red-500' : 'border-gray-200 hover:border-gray-300 focus:ring-1 focus:ring-violet-500 focus:border-violet-500'
                            }`}
                            disabled={categoriesLoading}
                          >
                            <option value="">{categoriesLoading ? 'Loading...' : 'Select Category'}</option>
                            {categories && categories.length > 0 && categories.map((cat) => (
                              <option key={cat._id} value={cat._id}>{cat.name}</option>
                            ))}
                          </select>
                           <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                            <Tag className="w-4 h-4 text-gray-400" />
                          </div>
                        </div>
                        {validationErrors.category && <p className="mt-1 text-xs text-red-600 flex items-center gap-1"><AlertCircle size={14} />{validationErrors.category}</p>}
                      </div>

                      {/* Status */}
                      <div>
                        <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
                         <div className="relative">
                            <select
                                id="status" name="status" value={formData.status} onChange={handleChange}
                                className="w-full pl-4 pr-10 py-2.5 border border-gray-200 rounded-lg appearance-none bg-white transition-colors duration-200 hover:border-gray-300 focus:ring-1 focus:ring-violet-500 focus:border-violet-500"
                            >
                                <option value="Draft">Draft</option>
                                <option value="Published">Published</option>
                                <option value="Archived">Archived</option>
                            </select>
                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                                <Check className="w-4 h-4 text-gray-400" />
                            </div>
                        </div>
                        <div className="mt-1.5">
                          {/* Status descriptions */}
                          {formData.status === "Draft" && <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 px-2 py-1 rounded inline-flex items-center gap-1"><Info size={12}/>Not visible publicly</p>}
                          {formData.status === "Published" && <p className="text-xs text-green-700 bg-green-50 border border-green-100 px-2 py-1 rounded inline-flex items-center gap-1"><CheckCircle size={12}/>Visible to everyone</p>}
                          {formData.status === "Archived" && <p className="text-xs text-gray-600 bg-gray-100 border border-gray-200 px-2 py-1 rounded inline-flex items-center gap-1"><Info size={12}/>Hidden from lists</p>}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Thumbnail Tab */}
                 {activeTab === "media" && (
                   <motion.div
                    key="media-tab"
                    className="space-y-6 bg-white p-6 rounded-xl shadow-sm border border-gray-100"
                     variants={tabContentVariants} initial="hidden" animate="visible" exit="exit"
                  >
                     <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-100">
                      <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center border border-violet-200/50">
                        <ImageIcon className="w-4 h-4 text-violet-600" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-800">Product Thumbnail</h3>
                       <span className="text-xs text-red-500 bg-red-50 px-1.5 py-0.5 rounded-full ml-1">Required</span>
                    </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                         {/* Upload Area */}
                        <div>
                          <motion.div
                            className={`relative border-2 border-dashed rounded-xl p-6 min-h-[14rem] flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 group ${
                              thumbnailProcessing ? 'opacity-50 cursor-wait' : 'hover:border-violet-400 hover:bg-violet-50/30 border-gray-200'
                            }`}
                            onClick={() => !thumbnailProcessing && fileInputRef.current?.click()}
                            whileHover={!thumbnailProcessing ? { scale: 1.02 } : {}}
                            whileTap={!thumbnailProcessing ? { scale: 0.98 } : {}}
                          >
                             <input
                              type="file" ref={fileInputRef} onChange={handleThumbnailChange}
                              className="hidden" accept="image/png, image/jpeg, image/gif, image/webp" disabled={thumbnailProcessing}
                            />
                             {thumbnailProcessing ? (
                                <>
                                    <Loader size={32} className="text-violet-500 animate-spin mb-3"/>
                                    <p className="text-sm font-medium text-gray-700">Processing...</p>
                                    <p className="text-xs text-gray-500 mt-1">Optimizing image</p>
                                </>
                             ) : (
                                <>
                                    <div className="w-16 h-16 rounded-full bg-violet-100 group-hover:bg-violet-200/70 flex items-center justify-center mb-4 transition-colors">
                                        <Upload className="w-7 h-7 text-violet-500 group-hover:text-violet-600" />
                                    </div>
                                    <p className="text-sm font-medium text-gray-700 group-hover:text-violet-700">
                                        {thumbnailPreview ? 'Replace Thumbnail' : 'Upload Thumbnail'}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">PNG, JPG, WEBP, GIF (Max {THUMBNAIL_MAX_SIZE_MB}MB)</p>
                                    <p className="text-xs text-gray-500 mt-0.5">Recommended: 800x800px</p>
                                </>
                             )}
                          </motion.div>
                        </div>

                         {/* Preview Area */}
                         {thumbnailPreview && (
                          <motion.div
                            className="relative h-56 bg-gray-100 rounded-xl overflow-hidden border border-gray-200 shadow-md group"
                            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }}
                          >
                            <Image
                              src={thumbnailPreview} alt="Thumbnail preview"
                              layout="fill" // Use fill for better responsiveness
                              objectFit="cover" // Or 'contain' based on preference
                              className="transition-transform duration-300 group-hover:scale-105"
                            />
                             {/* Show remove button only if a *new* image was uploaded */}
                            {formData.thumbnail && (
                                <motion.button
                                type="button"
                                className="absolute top-2 right-2 z-10 bg-red-600/80 hover:bg-red-700 text-white p-1.5 rounded-full shadow-lg backdrop-blur-sm"
                                onClick={handleRemoveThumbnail}
                                title="Remove uploaded image"
                                whileHover={{ scale: 1.1, rotate: 5 }} whileTap={{ scale: 0.9 }}
                                >
                                    <Trash2 className="w-4 h-4" />
                                </motion.button>
                            )}
                             {/* Overlay for better visibility of button */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                          </motion.div>
                        )}
                     </div>
                     {!formData.thumbnail && product?.thumbnail && (
                          <p className="mt-4 text-sm text-gray-600 bg-blue-50/70 p-3 rounded-lg border border-blue-100 flex items-center gap-2">
                            <Info size={16} className="text-blue-500 flex-shrink-0" />
                            You are currently using the existing product thumbnail. Upload a new image to replace it.
                          </p>
                      )}
                     {/* Add other media fields if necessary */}
                   </motion.div>
                 )}

                 {/* Gallery Tab */}
                 {activeTab === "gallery" && (
                   <motion.div
                    key="gallery-tab"
                    className="space-y-6 bg-white p-6 rounded-xl shadow-sm border border-gray-100"
                    variants={tabContentVariants} initial="hidden" animate="visible" exit="exit"
                   >
                     <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-100">
                      <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center border border-violet-200/50">
                        <Camera className="w-4 h-4 text-violet-600" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-800">Product Gallery</h3>
                     </div>

                     <div className="space-y-6">
                       <p className="text-sm text-gray-600 bg-gray-50/70 p-3 rounded-lg border border-gray-100">
                         Add up to 10 images to showcase your product. Images will be displayed in the product gallery.
                       </p>

                       {/* Upload Area */}
                       <div className="mb-4">
                         <div
                           className={`border-2 border-dashed rounded-lg p-4 h-32 flex flex-col items-center justify-center cursor-pointer transition-colors ${galleryProcessing ? 'opacity-50 cursor-wait border-gray-300' : 'hover:border-violet-500 border-gray-300'}`}
                           onClick={() => !galleryProcessing && galleryInputRef.current?.click()}
                         >
                           {galleryProcessing ? (
                             <>
                               <Loader className="w-8 h-8 text-violet-500 animate-spin mb-2" />
                               <p className="text-sm text-gray-500">Processing images...</p>
                             </>
                           ) : (
                             <>
                               <Upload className="w-8 h-8 text-gray-400 mb-2" />
                               <p className="text-sm text-gray-500">Click to upload gallery images</p>
                               <p className="text-xs text-gray-400 mt-1">PNG, JPG, WEBP, GIF (Max 5MB each)</p>
                             </>
                           )}
                           <input
                             type="file"
                             ref={galleryInputRef}
                             onChange={handleGalleryChange}
                             className="hidden"
                             accept="image/*"
                             multiple
                             disabled={galleryProcessing}
                           />
                         </div>
                       </div>

                       {/* Gallery Preview */}
                       {galleryPreviews.length > 0 ? (
                         <div className="space-y-4">
                           <div className="flex justify-between items-center">
                             <h4 className="font-medium text-gray-700">Gallery Images ({galleryPreviews.length}/10)</h4>
                             {formData.gallery && formData.gallery.length > 0 && (
                               <button
                                 type="button"
                                 onClick={handleUploadGalleryImages}
                                 disabled={galleryProcessing}
                                 className="px-3 py-1.5 bg-violet-600 text-white text-xs rounded-md hover:bg-violet-700 transition-colors disabled:bg-violet-300 disabled:cursor-not-allowed flex items-center gap-1.5"
                               >
                                 <Upload size={14} /> Upload New Images
                               </button>
                             )}
                           </div>

                           {/* Enhanced Gallery with Main Preview + Thumbnails */}
                           <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-4">
                             {/* Main Preview */}
                             <motion.div
                               className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden border border-gray-200 shadow-sm"
                               initial={{ opacity: 0 }}
                               animate={{ opacity: 1 }}
                               transition={{ duration: 0.3 }}
                             >
                               {activeGalleryImage || galleryPreviews[0] ? (
                                 <>
                                   <img
                                     src={(activeGalleryImage || galleryPreviews[0]).url}
                                     alt="Selected gallery image"
                                     className="w-full h-full object-contain"
                                     onError={(e) => {
                                       e.target.src = '/images/placeholder-image.png';
                                       toast.error(`Failed to load gallery image`);
                                     }}
                                   />
                                   <div className="absolute top-2 right-2 flex gap-2">
                                     <button
                                       type="button"
                                       className="bg-white/80 hover:bg-white text-gray-700 p-2 rounded-full shadow-md backdrop-blur-sm transition-all"
                                       onClick={() => setShowFullscreenPreview(true)}
                                       title="View fullscreen"
                                     >
                                       <Maximize className="w-4 h-4" />
                                     </button>
                                     <button
                                       type="button"
                                       className="bg-red-600/80 hover:bg-red-700 text-white p-2 rounded-full shadow-md backdrop-blur-sm transition-all"
                                       onClick={() => {
                                         const current = activeGalleryImage || galleryPreviews[0];
                                         if (current.isExisting && current.id) {
                                           handleDeleteGalleryImage(current.id);
                                         } else {
                                           const index = galleryPreviews.findIndex(p => p === current);
                                           if (index !== -1) handleRemoveGalleryImage(index);
                                         }
                                         setActiveGalleryImage(galleryPreviews.length > 1 ? galleryPreviews[1] : null);
                                       }}
                                       title="Remove image"
                                     >
                                       <Trash2 className="w-4 h-4" />
                                     </button>
                                   </div>
                                 </>
                               ) : (
                                 <div className="flex flex-col items-center justify-center h-full">
                                   <Camera className="w-10 h-10 text-gray-300 mb-2" />
                                   <p className="text-gray-500 text-sm">No image selected</p>
                                 </div>
                               )}
                             </motion.div>

                             {/* Thumbnails */}
                             <div className="grid grid-cols-2 gap-3 h-fit max-h-[300px] overflow-y-auto pr-1">
                               {galleryPreviews.map((preview, index) => (
                                 <motion.div
                                   key={preview.id || index}
                                   className={`relative aspect-square rounded-lg overflow-hidden cursor-pointer border-2 transition-all duration-200 ${activeGalleryImage === preview ? 'border-violet-500 ring-2 ring-violet-200' : 'border-gray-200 hover:border-violet-300'}`}
                                   whileHover={{ scale: 1.03 }}
                                   whileTap={{ scale: 0.98 }}
                                   onClick={() => setActiveGalleryImage(preview)}
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
                                   {activeGalleryImage === preview && (
                                     <div className="absolute inset-0 bg-violet-500/10"></div>
                                   )}
                                 </motion.div>
                               ))}
                             </div>
                           </div>

                           {/* Fullscreen Preview Modal */}
                           <AnimatePresence>
                             {showFullscreenPreview && activeGalleryImage && (
                               <motion.div
                                 className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
                                 initial={{ opacity: 0 }}
                                 animate={{ opacity: 1 }}
                                 exit={{ opacity: 0 }}
                                 onClick={() => setShowFullscreenPreview(false)}
                               >
                                 <motion.div
                                   className="relative max-w-5xl w-full max-h-[90vh] flex flex-col items-center"
                                   initial={{ scale: 0.9, opacity: 0 }}
                                   animate={{ scale: 1, opacity: 1 }}
                                   exit={{ scale: 0.9, opacity: 0 }}
                                   transition={{ type: 'spring', damping: 25 }}
                                   onClick={(e) => e.stopPropagation()}
                                 >
                                   <div className="bg-black/30 backdrop-blur-md p-2 rounded-xl overflow-hidden shadow-2xl relative">
                                     <img
                                       src={activeGalleryImage.url}
                                       alt="Gallery Image Preview"
                                       className="max-h-[85vh] max-w-full mx-auto object-contain rounded-lg"
                                       onError={(e) => {
                                         e.target.src = '/images/placeholder-image.png';
                                         toast.error("Failed to load preview image");
                                       }}
                                     />
                                     <button
                                       onClick={() => setShowFullscreenPreview(false)}
                                       className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
                                     >
                                       <X size={20} />
                                     </button>
                                   </div>

                                   {galleryPreviews.length > 1 && (
                                     <div className="mt-4 flex justify-center gap-2 overflow-x-auto pb-2 max-w-full">
                                       {galleryPreviews.map((preview, index) => (
                                         <motion.div
                                           key={preview.id || index}
                                           whileHover={{ scale: 1.05 }}
                                           whileTap={{ scale: 0.95 }}
                                           className={`relative w-16 h-16 rounded-md overflow-hidden cursor-pointer border-2 ${activeGalleryImage === preview ? 'border-violet-500' : 'border-gray-400/30'}`}
                                           onClick={(e) => {
                                             e.stopPropagation();
                                             setActiveGalleryImage(preview);
                                           }}
                                         >
                                           <img
                                             src={preview.url}
                                             alt={`Thumbnail ${index + 1}`}
                                             className="w-full h-full object-cover"
                                             onError={(e) => {
                                               e.target.src = '/images/placeholder-image.png';
                                               toast.error(`Failed to load thumbnail ${index + 1}`);
                                             }}
                                           />
                                         </motion.div>
                                       ))}
                                     </div>
                                   )}
                                 </motion.div>
                               </motion.div>
                             )}
                           </AnimatePresence>
                         </div>
                       ) : (
                         <div className="text-center py-8 bg-gray-50/50 rounded-lg border border-gray-100">
                           <Camera className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                           <p className="text-gray-500">No gallery images yet</p>
                           <p className="text-sm text-gray-400 mt-1">Upload images to showcase your product</p>
                         </div>
                       )}
                     </div>
                   </motion.div>
                 )}


                {/* Pricing Tab */}
                 {activeTab === "pricing" && (
                  <motion.div
                    key="pricing-tab"
                    className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"
                    variants={tabContentVariants} initial="hidden" animate="visible" exit="exit"
                  >
                    <div className="flex items-center gap-2 mb-6 pb-2 border-b border-gray-100">
                      <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center border border-violet-200/50">
                        <DollarSign className="w-4 h-4 text-violet-600" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-800">Pricing</h3>
                    </div>

                    <div className="space-y-8">
                      {/* Pricing Type Selection */}
                        <div>
                            <label className="text-sm font-medium text-gray-700 mb-3 block">Pricing Model</label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                            {PRICING_TYPES.map((ptype) => {
                                const isSelected = formData.pricing.type === ptype.id;
                                return (
                                <button
                                    type="button"
                                    key={ptype.id}
                                    onClick={() => handlePricingTypeChange(ptype.id)}
                                    className={`flex flex-col items-center text-center p-4 rounded-lg border-2 transition-all duration-200 ${
                                    isSelected
                                        ? "border-violet-500 bg-violet-50/80 shadow-sm"
                                        : "border-gray-200 hover:border-violet-300 hover:bg-gray-50/50"
                                    }`}
                                >
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-colors ${
                                    isSelected ? "bg-violet-100 text-violet-600" : "bg-gray-100 text-gray-500"
                                    }`}>
                                    <ptype.icon size={20} />
                                    </div>
                                    <h4 className={`text-sm font-semibold ${isSelected ? "text-violet-700" : "text-gray-700"}`}>
                                    {ptype.label}
                                    </h4>
                                    <p className="text-xs text-gray-500 mt-1">{ptype.description}</p>
                                </button>
                                );
                            })}
                            </div>
                        </div>

                        {/* Price Details Section (for paid, subscription, freemium) */}
                         {(formData.pricing.type === "paid" || formData.pricing.type === "subscription" || formData.pricing.type === "freemium") && (
                            <motion.div
                                className="space-y-6 bg-gray-50/70 p-5 rounded-xl border border-gray-100 shadow-inner"
                                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
                            >
                                <h4 className="font-medium text-gray-800 border-b border-gray-200 pb-2 mb-4">Price Details</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    {/* Currency */}
                                    <div>
                                        <label htmlFor="pricing.currency" className="text-xs font-medium text-gray-600 mb-1 block">Currency</label>
                                         <select
                                            id="pricing.currency" name="pricing.currency" value={formData.pricing.currency} onChange={handlePricingChange}
                                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:ring-1 focus:ring-violet-500 focus:border-violet-500 bg-white appearance-none"
                                        >
                                            {CURRENCIES.map((currency) => (
                                                <option key={currency.code} value={currency.code}>
                                                {currency.code} ({currency.symbol}) - {currency.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                     {/* Price Amount */}
                                    <div>
                                        <label htmlFor="pricing.amount" className="text-xs font-medium text-gray-600 mb-1 flex items-center gap-1">
                                            Price <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-sm text-gray-500">
                                                {getSelectedCurrency().symbol}
                                            </div>
                                            <input
                                                type="number" min="0" step="0.01" id="pricing.amount" name="pricing.amount" value={formData.pricing.amount} onChange={handlePricingChange}
                                                placeholder="0.00"
                                                className={`w-full pl-8 pr-3 py-2 text-sm border rounded-md bg-white ${
                                                    validationErrors.pricingAmount ? 'border-red-400 ring-1 ring-red-300 focus:border-red-500' : 'border-gray-200 focus:ring-1 focus:ring-violet-500 focus:border-violet-500'
                                                }`}
                                                required={formData.pricing.type === 'paid' || formData.pricing.type === 'subscription'}
                                            />
                                        </div>
                                         {validationErrors.pricingAmount && <p className="mt-1 text-xs text-red-600 flex items-center gap-1"><AlertCircle size={14} />{validationErrors.pricingAmount}</p>}
                                    </div>
                                </div>

                                {/* Billing Interval (Subscription only) */}
                                {formData.pricing.type === "subscription" && (
                                    <div>
                                        <label htmlFor="pricing.interval" className="text-xs font-medium text-gray-600 mb-1 flex items-center gap-1">
                                            Billing Interval <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            id="pricing.interval" name="pricing.interval" value={formData.pricing.interval || ""} onChange={handlePricingChange} required
                                            className={`w-full px-3 py-2 text-sm border rounded-md bg-white appearance-none ${
                                                 validationErrors.pricingInterval ? 'border-red-400 ring-1 ring-red-300 focus:border-red-500' : 'border-gray-200 focus:ring-1 focus:ring-violet-500 focus:border-violet-500'
                                            }`}
                                        >
                                            <option value="" disabled>Select interval</option>
                                            <option value="month">Monthly</option>
                                            <option value="year">Yearly</option>
                                            <option value="week">Weekly</option>
                                            {/* Add other intervals if needed */}
                                        </select>
                                         {validationErrors.pricingInterval && <p className="mt-1 text-xs text-red-600 flex items-center gap-1"><AlertCircle size={14} />{validationErrors.pricingInterval}</p>}
                                    </div>
                                )}

                                {/* Discount Section */}
                                 <div className="pt-4 border-t border-gray-200 space-y-4">
                                     <button
                                        type="button" onClick={handleToggleDiscount}
                                        className={`flex items-center gap-2 px-3 py-1.5 text-xs rounded-md transition-colors duration-200 ${
                                        formData.pricing.discounted
                                            ? "bg-violet-100 text-violet-700 border border-violet-200 hover:bg-violet-200/70"
                                            : "bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200/70"
                                        }`}
                                    >
                                        <Tag size={14} />
                                        <span>{formData.pricing.discounted ? "Remove Discount" : "Add Discount / Sale Price"}</span>
                                    </button>

                                    {formData.pricing.discounted && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} transition={{ duration: 0.2 }}
                                    >
                                        <label htmlFor="pricing.originalAmount" className="text-xs font-medium text-gray-600 mb-1 flex items-center gap-1">
                                            Original Price (Before Discount) <span className="text-red-500">*</span>
                                        </label>
                                         <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-sm text-gray-500 line-through">
                                                {getSelectedCurrency().symbol}
                                            </div>
                                            <input
                                                type="number" min="0" step="0.01" id="pricing.originalAmount" name="pricing.originalAmount" value={formData.pricing.originalAmount} onChange={handlePricingChange} required
                                                placeholder="0.00"
                                                className={`w-full pl-8 pr-3 py-2 text-sm border rounded-md bg-white ${
                                                    validationErrors.pricingOriginalAmount ? 'border-red-400 ring-1 ring-red-300 focus:border-red-500' : 'border-gray-200 focus:ring-1 focus:ring-violet-500 focus:border-violet-500'
                                                }`}
                                            />
                                        </div>
                                        {validationErrors.pricingOriginalAmount && <p className="mt-1 text-xs text-red-600 flex items-center gap-1"><AlertCircle size={14} />{validationErrors.pricingOriginalAmount}</p>}
                                    </motion.div>
                                    )}
                                 </div>

                            </motion.div>
                         )}

                        {/* Contact for Pricing Section */}
                         {formData.pricing.type === "contact" && (
                            <motion.div
                                className="space-y-6 bg-blue-50/50 p-5 rounded-xl border border-blue-100 shadow-inner"
                                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
                            >
                                <div className="flex items-start gap-3">
                                    <div className="bg-blue-100 p-2 rounded-full mt-1">
                                        <Calendar size={16} className="text-blue-600" />
                                    </div>
                                    <div>
                                        <h4 className="font-medium text-gray-800">Contact Information for Pricing</h4>
                                        <p className="text-xs text-gray-600 mt-1">Provide how users can reach you for pricing details.</p>
                                    </div>
                                </div>

                                 <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                     {/* Contact Email */}
                                    <div>
                                        <label htmlFor="pricing.contactEmail" className="text-xs font-medium text-gray-600 mb-1 flex items-center gap-1">
                                            Contact Email <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="email" id="pricing.contactEmail" name="pricing.contactEmail" value={formData.pricing.contactEmail || ""} onChange={handlePricingChange} required
                                            placeholder="sales@example.com"
                                            className={`w-full px-3 py-2 text-sm border rounded-md bg-white ${
                                                validationErrors.pricingContactEmail ? 'border-red-400 ring-1 ring-red-300 focus:border-red-500' : 'border-gray-200 focus:ring-1 focus:ring-violet-500 focus:border-violet-500'
                                            }`}
                                        />
                                        {validationErrors.pricingContactEmail && <p className="mt-1 text-xs text-red-600 flex items-center gap-1"><AlertCircle size={14} />{validationErrors.pricingContactEmail}</p>}
                                    </div>

                                     {/* Contact Phone (Optional) */}
                                    <div>
                                        <label htmlFor="pricing.contactPhone" className="text-xs font-medium text-gray-600 mb-1 flex items-center gap-1">
                                            Contact Phone <span className="text-gray-400">(Optional)</span>
                                        </label>
                                        <input
                                            type="tel" id="pricing.contactPhone" name="pricing.contactPhone" value={formData.pricing.contactPhone || ""} onChange={handlePricingChange}
                                            placeholder="+1 555-123-4567"
                                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md bg-white focus:ring-1 focus:ring-violet-500 focus:border-violet-500"
                                        />
                                    </div>
                                 </div>

                                 {/* Contact Instructions (Optional) */}
                                <div>
                                    <label htmlFor="pricing.contactInstructions" className="text-xs font-medium text-gray-600 mb-1 flex items-center gap-1">
                                        Instructions <span className="text-gray-400">(Optional)</span>
                                    </label>
                                    <textarea
                                        id="pricing.contactInstructions" name="pricing.contactInstructions" value={formData.pricing.contactInstructions || ""} onChange={handlePricingChange}
                                        rows={3} placeholder="e.g., Business hours, preferred contact method..."
                                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md bg-white focus:ring-1 focus:ring-violet-500 focus:border-violet-500"
                                        maxLength={500}
                                    ></textarea>
                                    <p className="text-xs text-gray-500 mt-1">Max 500 characters.</p>
                                </div>
                            </motion.div>
                        )}

                    </div>
                  </motion.div>
                )}


                {/* Links Tab */}
                 {activeTab === "links" && (
                  <motion.div
                    key="links-tab"
                    className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"
                    variants={tabContentVariants} initial="hidden" animate="visible" exit="exit"
                  >
                    <div className="flex items-center gap-2 mb-6 pb-2 border-b border-gray-100">
                       <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center border border-violet-200/50">
                        <LinkIcon className="w-4 h-4 text-violet-600" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-800">Product Links</h3>
                    </div>

                    <div className="space-y-6">
                       <p className="text-sm text-gray-600 bg-gray-50/70 p-3 rounded-lg border border-gray-100">
                        Add or update relevant links for your product (Website, GitHub, Demo, App Stores etc.).
                      </p>

                       {/* Link Input Area */}
                        <div className="grid grid-cols-1 sm:grid-cols-[1fr_2fr_auto] gap-3 items-end bg-gray-50/70 p-4 rounded-lg border border-gray-100">
                            {/* Link Type Selector */}
                            <div>
                                <label htmlFor="linkType" className="text-xs font-medium text-gray-600 mb-1 block">Link Type</label>
                                <select
                                    id="linkType" value={urlType} onChange={(e) => setUrlType(e.target.value)}
                                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:ring-1 focus:ring-violet-500 focus:border-violet-500 bg-white appearance-none"
                                >
                                {LINK_TYPES.map((type) => (
                                    <option key={type.id} value={type.id}>{type.label}</option>
                                ))}
                                </select>
                            </div>

                             {/* URL Input */}
                            <div>
                                <label htmlFor="urlInput" className="text-xs font-medium text-gray-600 mb-1 block">URL</label>
                                <input
                                    type="url" id="urlInput" value={urlInput} onChange={(e) => setUrlInput(e.target.value)}
                                    placeholder={LINK_TYPES.find(type => type.id === urlType)?.placeholder || "Enter URL"}
                                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:ring-1 focus:ring-violet-500 focus:border-violet-500"
                                    onKeyDown={(e) => e.key === 'Enter' && handleAddLink()}
                                />
                            </div>

                             {/* Add Button */}
                            <button
                                type="button" onClick={handleAddLink} disabled={!urlInput.trim()}
                                className="px-4 py-2 bg-violet-600 text-white text-sm rounded-md hover:bg-violet-700 transition-colors disabled:bg-violet-300 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 h-[2.375rem]" // Match input height
                            >
                                <Plus size={16} /> Add/Update
                            </button>
                        </div>


                      {/* Display Added Links */}
                      <div className="space-y-3">
                         <AnimatePresence>
                            {Object.entries(formData.links).map(([type, url]) => {
                            if (!url || typeof url !== 'string' || !url.trim()) return null; // Only show non-empty links

                            const linkInfo = LINK_TYPES.find(lt => lt.id === type);
                            const Icon = linkInfo?.icon || LinkIcon;

                            return (
                                <motion.div
                                key={type}
                                className="flex items-center gap-3 p-3 bg-violet-50/50 rounded-lg border border-violet-100 shadow-sm"
                                initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.2 }}
                                >
                                <Icon size={18} className="text-violet-500 flex-shrink-0" />
                                <div className="flex-grow min-w-0">
                                    <p className="text-sm font-medium text-gray-700 truncate">{linkInfo?.label || type}</p>
                                    <a href={url} target="_blank" rel="noopener noreferrer" className="text-xs text-violet-600 hover:underline truncate block" title={url}>
                                        {url}
                                    </a>
                                </div>
                                <button
                                    type="button" onClick={() => handleRemoveLink(type)}
                                    className="p-1.5 text-red-500 hover:bg-red-100 rounded-md transition-colors flex-shrink-0"
                                    title={`Remove ${linkInfo?.label || type} link`}
                                >
                                    <Trash2 size={16} />
                                </button>
                                </motion.div>
                            );
                            })}
                         </AnimatePresence>
                         {Object.values(formData.links).every(link => !link?.trim()) && (
                             <p className="text-center text-sm text-gray-400 py-4">No links added yet.</p>
                         )}
                      </div>
                    </div>
                  </motion.div>
                )}


                {/* Tags Tab */}
                 {activeTab === "tags" && (
                  <motion.div
                    key="tags-tab"
                    className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"
                     variants={tabContentVariants} initial="hidden" animate="visible" exit="exit"
                  >
                     <div className="flex items-center gap-2 mb-6 pb-2 border-b border-gray-100">
                      <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center border border-violet-200/50">
                        <Tag className="w-4 h-4 text-violet-600" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-800">Product Tags</h3>
                    </div>

                    <div className="space-y-6">
                       {/* Tag Input */}
                        <div>
                            <label htmlFor="tagInput" className="text-sm font-medium text-gray-700 mb-1.5 block">
                                Add Tags (Max {MAX_TAGS})
                            </label>
                             <div className="flex gap-3">
                                <div className="relative flex-grow">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Tag size={16} className="text-gray-400" />
                                    </div>
                                    <input
                                        type="text" id="tagInput" value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={handleTagKeyDown}
                                        placeholder="Type a tag and press Enter, Comma, or Space"
                                        className={`w-full pl-10 pr-4 py-2.5 border rounded-lg transition-colors duration-200 ${
                                             validationErrors.tags ? 'border-red-400 ring-1 ring-red-300 focus:border-red-500' : 'border-gray-200 hover:border-gray-300 focus:ring-1 focus:ring-violet-500 focus:border-violet-500'
                                        }`}
                                        maxLength={30}
                                        disabled={formData.tags.length >= MAX_TAGS}
                                    />
                                </div>
                                <button
                                    type="button" onClick={handleAddTag} disabled={!tagInput.trim() || formData.tags.length >= MAX_TAGS}
                                    className="px-4 py-2 bg-violet-600 text-white text-sm rounded-lg hover:bg-violet-700 transition-colors disabled:bg-violet-300 disabled:cursor-not-allowed flex items-center gap-1.5 whitespace-nowrap"
                                >
                                    <Plus size={16} /> Add
                                </button>
                             </div>
                             {validationErrors.tags && <p className="mt-1 text-xs text-red-600 flex items-center gap-1"><AlertCircle size={14} />{validationErrors.tags}</p>}
                             <p className="mt-1 text-xs text-gray-500">
                                Tags help users find your product. Max 30 characters per tag. Current: {formData.tags.length}/{MAX_TAGS}.
                            </p>
                        </div>

                         {/* Display Tags */}
                         {formData.tags.length > 0 && (
                            <div className="mt-4 p-4 bg-gray-50/70 rounded-lg border border-gray-100">
                                <h4 className="text-sm font-medium text-gray-700 mb-3">Current Tags:</h4>
                                <div className="flex flex-wrap gap-2">
                                 <AnimatePresence>
                                    {formData.tags.map((tag, index) => (
                                    <motion.div
                                        key={tag} // Use tag as key assuming uniqueness
                                        className="flex items-center gap-1 px-3 py-1 bg-violet-100 text-violet-800 rounded-full text-sm border border-violet-200 shadow-sm"
                                        initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.1 } }}
                                        transition={{ duration: 0.2, delay: index * 0.03 }}
                                        layout // Enable smooth layout animation on removal
                                    >
                                        <Tag size={14} className="mr-0.5" />
                                        <span className="font-medium">{tag}</span>
                                        <button
                                        type="button" onClick={() => handleRemoveTag(index)}
                                        className="ml-1 text-violet-500 hover:text-violet-700 hover:bg-violet-200/50 rounded-full p-0.5 transition-colors"
                                        title={`Remove tag "${tag}"`}
                                        >
                                            <X size={14} />
                                        </button>
                                    </motion.div>
                                    ))}
                                 </AnimatePresence>
                                </div>
                            </div>
                         )}
                          {formData.tags.length === 0 && (
                            <p className="text-center text-sm text-gray-400 py-4">No tags added yet.</p>
                         )}
                    </div>
                  </motion.div>
                 )}
              </AnimatePresence>
            </form>
          </motion.div>

          {/* Footer */}
          <motion.div
            className="p-6 border-t border-gray-100 bg-gradient-to-r from-white to-gray-50/30 flex justify-between items-center"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.4 }}
          >
             {/* Status Area */}
             <div className="flex text-sm items-center">
                <AnimatePresence mode="wait">
                    {hasUnsavedChanges && !submitting && (
                        <motion.span
                            key="unsaved" className="text-amber-700 bg-amber-100/70 px-3 py-1.5 rounded-full border border-amber-200/80 flex items-center gap-1.5 shadow-sm text-xs font-medium"
                            initial={{ opacity: 0, scale: 0.8, x: -10 }} animate={{ opacity: 1, scale: 1, x: 0 }} exit={{ opacity: 0, scale: 0.8, x: -10 }} transition={{ duration: 0.2 }}
                        >
                            <AlertCircle size={14} /> Unsaved Changes
                        </motion.span>
                    )}
                     {/* Display General Product Error */}
                     {productError && !submitting && (
                         <motion.span
                             key="productError" className="text-red-700 bg-red-100/70 px-3 py-1.5 rounded-full border border-red-200/80 flex items-center gap-1.5 shadow-sm text-xs font-medium"
                            initial={{ opacity: 0, scale: 0.8, x: -10 }} animate={{ opacity: 1, scale: 1, x: 0 }} exit={{ opacity: 0, scale: 0.8, x: -10 }} transition={{ duration: 0.2 }}
                         >
                             <AlertCircle size={14} /> {productError}
                         </motion.span>
                     )}
                </AnimatePresence>
             </div>

            {/* Action Buttons */}
             <div className="flex space-x-3">
              <motion.button
                type="button" onClick={handleCloseModal}
                className="px-5 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50/80 transition-colors duration-200 shadow-sm hover:shadow text-sm font-medium"
                disabled={submitting}
                whileHover={{ y: -1 }} whileTap={{ y: 0, scale: 0.98 }}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.2 }}
              >
                Cancel
              </motion.button>
              <motion.button
                type="submit" onClick={handleSubmit} // Changed to trigger submit via form handler
                className="px-6 py-2 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-lg hover:from-violet-700 hover:to-purple-700 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md hover:shadow-lg text-sm font-medium"
                disabled={submitting || (!hasUnsavedChanges && !productError)} // Disable if no changes or already submitting/error
                whileHover={{ y: -1 }} whileTap={{ y: 0, scale: 0.98 }}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.2 }}
              >
                {submitting ? (
                  <>
                    <Loader size={16} className="animate-spin" /> Saving...
                  </>
                ) : (
                  <> <Check size={16} /> Save Changes </>
                )}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default EditProductModal;