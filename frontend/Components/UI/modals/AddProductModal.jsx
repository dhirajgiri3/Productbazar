"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useProduct } from "@/lib/contexts/product-context";
import { useAuth } from "@/lib/contexts/auth-context";
import { useCategories } from "@/lib/contexts/category-context";
import { toast } from "react-hot-toast";
import {
  HiX,
  HiPhotograph,
  HiLink,
  HiTag,
  HiCurrencyDollar,
  HiPencil,
} from "react-icons/hi";
import { uploadProductGalleryImages } from "../../../services/productService";
import dynamic from "next/dynamic";
import Image from "next/image";
import { Tooltip } from "react-tooltip";

const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });
import "react-quill/dist/quill.snow.css";

const AddProductModal = ({ isOpen, onClose }) => {
  const {
    createProduct,
    loading: productLoading,
    error: productError,
    clearError,
  } = useProduct();
  const { user } = useAuth();
  const {
    categories,
    loading: categoriesLoading,
    error: categoriesError,
    fetchCategories,
  } = useCategories(); // Use CategoryContext
  const [activeTab, setActiveTab] = useState("basic");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const fileInputRef = useRef(null);
  const galleryInputRef = useRef(null);
  const [thumbnailPreview, setThumbnailPreview] = useState(null);
  const [galleryPreviews, setGalleryPreviews] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  // Fetch categories when modal opens (if not already fetched)
  useEffect(() => {
    if (isOpen && categories.length === 0 && !categoriesLoading) {
      fetchCategories();
    }
  }, [isOpen, categories, categoriesLoading, fetchCategories]);

  // Reset form when closing modal
  useEffect(() => {
    if (!isOpen) {
      clearError();
      setTimeout(() => {
        setValidationErrors({});
      }, 300);
    }
  }, [isOpen, clearError]);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    tagline: "",
    description: "",
    category: "",
    status: "Draft",
    thumbnail: null,
    pricingType: "free",
    pricingAmount: 0,
    pricingCurrency: "USD",
    tags: [],
    links: {
      website: "",
      github: "",
      demo: "",
      appStore: "",
      playStore: "",
    },
    gallery: [],
  });

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === "checkbox") {
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else if (name.startsWith("links.")) {
      const linkType = name.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        links: { ...prev.links, [linkType]: value },
      }));
    } else if (name === "tags") {
      const tagsArray = value
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag);
      setFormData((prev) => ({ ...prev, tags: tagsArray }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
    setHasUnsavedChanges(true);
    if (validationErrors[name]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Handle rich text editor changes
  const handleDescriptionChange = (content) => {
    setFormData((prev) => ({ ...prev, description: content }));
    setHasUnsavedChanges(true);
    if (validationErrors.description) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.description;
        return newErrors;
      });
    }
  };

  // Handle thumbnail upload
  const handleThumbnailChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size should be less than 5MB");
      return;
    }
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload a valid image file");
      return;
    }
    setFormData((prev) => ({ ...prev, thumbnail: file }));
    const reader = new FileReader();
    reader.onloadend = () => {
      setThumbnailPreview(reader.result);
    };
    reader.readAsDataURL(file);
    setHasUnsavedChanges(true);
  };

  // Handle gallery images upload
  const handleGalleryChange = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    if (galleryPreviews.length + files.length > 10) {
      toast.error("Maximum 10 gallery images allowed");
      return;
    }
    const newPreviews = [];
    const newGalleryFiles = [];
    files.forEach((file) => {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} is too large (max 5MB)`);
        return;
      }
      if (!file.type.startsWith("image/")) {
        toast.error(`${file.name} is not a valid image file`);
        return;
      }
      newGalleryFiles.push(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        newPreviews.push({
          id: `new-${Date.now()}-${newPreviews.length}`,
          url: reader.result,
          file: file,
          isExisting: false,
        });
        if (newPreviews.length === files.length) {
          setGalleryPreviews((prev) => [...prev, ...newPreviews]);
        }
      };
      reader.readAsDataURL(file);
    });
    // Store the gallery files directly without any special field name
    // The field name will be added during upload in the submit handler
    setFormData((prev) => ({
      ...prev,
      gallery: [...prev.gallery, ...newGalleryFiles],
    }));
    setHasUnsavedChanges(true);
  };

  // Remove a gallery image
  const removeGalleryImage = (indexToRemove) => {
    setGalleryPreviews((prev) =>
      prev.filter((_, index) => index !== indexToRemove)
    );
    setFormData((prev) => ({
      ...prev,
      gallery: prev.gallery.filter((_, index) => index !== indexToRemove),
    }));
    setHasUnsavedChanges(true);
  };

  // Form validation
  const validateForm = () => {
    const errors = {};
    if (!formData.name || formData.name.trim().length < 3) {
      errors.name = "Product name must be at least 3 characters";
    }
    if (!formData.description || formData.description.trim().length < 10) {
      errors.description = "Description must be at least 10 characters";
    }
    if (!formData.category) {
      errors.category = "Please select a category";
    }
    if (formData.pricingType === "paid") {
      if (!formData.pricingAmount || parseFloat(formData.pricingAmount) <= 0) {
        errors.pricingAmount = "Please enter a valid price amount";
      }
    }
    Object.entries(formData.links).forEach(([key, value]) => {
      if (value && !value.match(/^(https?:\/\/)?.+\..+/)) {
        errors[`links.${key}`] = "Please enter a valid URL";
      }
    });
    if (!formData.thumbnail) {
      errors.thumbnail = "Product thumbnail is required";
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submit the form
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error("Please fix the form errors");
      return;
    }
    setSubmitting(true);
    try {
      const productData = {
        ...formData,
        tags: formData.tags.join(","),
        links: JSON.stringify(formData.links),
      };

      if (formData.thumbnail) {
        productData.thumbnail = formData.thumbnail;
      }

      const result = await createProduct(productData);
      if (result.success) {
        if (formData.gallery.length > 0 && result.product.slug) {
          try {
            // Show upload progress for gallery
            toast.loading("Uploading gallery images...");

            const galleryResponse = await uploadProductGalleryImages(
              result.product.slug,
              formData.gallery
            );

            if (galleryResponse.success) {
              toast.dismiss(); // Dismiss the loading toast
              // Don't show separate gallery success toast
            } else {
              toast.dismiss();
              toast.error("Some gallery images failed to upload");
            }
          } catch (galleryError) {
            toast.dismiss();
            console.error("Error uploading gallery:", galleryError);
            toast.error("Product created but gallery upload failed");
          }
        }
        // Single success toast that covers both product and gallery creation
        toast.success("Product created successfully");
        setHasUnsavedChanges(false);
        onClose(result.product);
      } else {
        toast.error(result.message || "Failed to create product");
      }
    } catch (err) {
      console.error("Error creating product:", err);
      toast.error(err.response?.data?.message || "Failed to create product");
    } finally {
      setSubmitting(false);
    }
  };

  // Modal animation variants
  const modalVariants = {
    hidden: { opacity: 0, y: 50, scale: 0.95 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.3 } },
    exit: { opacity: 0, y: 50, scale: 0.95, transition: { duration: 0.2 } },
  };

  // Tab configuration
  const tabs = [
    { id: "basic", label: "Basic Info", icon: HiPencil },
    { id: "media", label: "Media & Gallery", icon: HiPhotograph },
    { id: "pricing", label: "Pricing", icon: HiCurrencyDollar },
    { id: "links", label: "Links", icon: HiLink },
    { id: "tags", label: "Tags", icon: HiTag },
  ];

  // Rich text editor modules and formats
  const editorModules = {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ["bold", "italic", "underline", "strike", "blockquote"],
      [
        { list: "ordered" },
        { list: "bullet" },
        { indent: "-1" },
        { indent: "+1" },
      ],
      ["link", "code-block"],
      ["clean"],
    ],
  };
  const editorFormats = [
    "header",
    "bold",
    "italic",
    "underline",
    "strike",
    "blockquote",
    "list",
    "bullet",
    "indent",
    "link",
    "code-block",
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-[10px] flex items-center justify-center p-4">
      <Tooltip id="tooltip" className="z-[100]" />
      <AnimatePresence>
        <motion.div
          key="add-product-modal"
          className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden relative"
          variants={modalVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          {/* Header */}
          <div className="p-6 border-b border-gray-200 flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">
                Add New Product
              </h2>
              <p className="text-gray-500 mt-1">
                Share your creation with the community
              </p>
            </div>
            <button
              onClick={() => {
                if (hasUnsavedChanges) {
                  if (
                    window.confirm(
                      "You have unsaved changes. Are you sure you want to close?"
                    )
                  ) {
                    onClose();
                  }
                } else {
                  onClose();
                }
              }}
              className="text-gray-400 hover:text-gray-500 p-2 rounded-full hover:bg-gray-100 transition-colors"
              aria-label="Close modal"
            >
              <HiX className="w-6 h-6" />
            </button>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200 px-6 flex overflow-x-auto hide-scrollbar">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-4 px-3 border-b-2 font-medium transition-colors ${
                  activeTab === tab.id
                    ? "border-violet-600 text-violet-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
                data-tooltip-id="tooltip"
                data-tooltip-content={tab.label}
              >
                <tab.icon className="w-5 h-5" />
                <span className="whitespace-nowrap">{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Form content */}
          <div className="flex-1 overflow-y-auto p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Info Tab */}
              {activeTab === "basic" && (
                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="name"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Product Name*
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-colors ${
                        validationErrors.name
                          ? "border-red-500"
                          : "border-gray-300"
                      }`}
                      placeholder="Enter your product name"
                    />
                    {validationErrors.name && (
                      <p className="mt-1 text-sm text-red-600">
                        {validationErrors.name}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="tagline"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Tagline
                    </label>
                    <input
                      type="text"
                      id="tagline"
                      name="tagline"
                      value={formData.tagline}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-colors"
                      placeholder="A short, catchy description (max 160 characters)"
                      maxLength={160}
                    />
                    <p className="mt-1 text-xs text-gray-500 flex justify-end">
                      {formData.tagline?.length || 0}/160 characters
                    </p>
                  </div>

                  <div>
                    <label
                      htmlFor="description"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Description*
                    </label>
                    <div
                      className={`border rounded-lg ${
                        validationErrors.description
                          ? "border-red-500"
                          : "border-gray-300"
                      }`}
                    >
                      <ReactQuill
                        theme="snow"
                        value={formData.description}
                        onChange={handleDescriptionChange}
                        modules={editorModules}
                        formats={editorFormats}
                        className="h-72"
                      />
                    </div>
                    {validationErrors.description && (
                      <p className="mt-1 text-sm text-red-600">
                        {validationErrors.description}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="category"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Category*
                    </label>
                    <select
                      id="category"
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 appearance-none bg-white transition-colors ${
                        validationErrors.category
                          ? "border-red-500"
                          : "border-gray-300"
                      }`}
                      disabled={
                        productLoading ||
                        categoriesLoading ||
                        categories.length === 0
                      }
                    >
                      <option value="">Select a category</option>
                      {categories.map((category) => (
                        <option key={category._id} value={category._id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                    {validationErrors.category && (
                      <p className="mt-1 text-sm text-red-600">
                        {validationErrors.category}
                      </p>
                    )}
                    {categoriesLoading && (
                      <p className="mt-1 text-sm text-gray-500">
                        Loading categories...
                      </p>
                    )}
                    {categoriesError && !categoriesLoading && (
                      <p className="mt-1 text-sm text-red-600">
                        {categoriesError}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="status"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Status
                    </label>
                    <select
                      id="status"
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 appearance-none bg-white transition-colors"
                    >
                      <option value="Draft">Draft</option>
                      <option value="Published">Published</option>
                    </select>
                    <p className="mt-1 text-xs text-gray-500">
                      {formData.status === "Draft" &&
                        "Your product will be saved but not visible to others."}
                      {formData.status === "Published" &&
                        "Your product will be visible to everyone."}
                    </p>
                  </div>
                </div>
              )}

              {/* Media Tab */}
              {activeTab === "media" && (
                <div className="space-y-6">
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h3 className="font-medium text-gray-900 mb-3">
                      Product Thumbnail*
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <div
                          className={`border-2 border-dashed rounded-lg p-4 h-48 flex flex-col items-center justify-center cursor-pointer hover:border-violet-500 transition-colors ${
                            validationErrors.thumbnail
                              ? "border-red-500"
                              : "border-gray-300"
                          }`}
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <HiPhotograph className="w-10 h-10 text-gray-400 mb-3" />
                          <p className="text-sm text-gray-500">
                            Click to upload thumbnail
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            PNG, JPG, GIF up to 5MB
                          </p>
                          <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleThumbnailChange}
                            className="hidden"
                            accept="image/*"
                          />
                        </div>
                        {validationErrors.thumbnail && (
                          <p className="mt-1 text-sm text-red-600">
                            {validationErrors.thumbnail}
                          </p>
                        )}
                      </div>
                      {thumbnailPreview && (
                        <div className="relative h-48 bg-gray-100 rounded-lg overflow-hidden">
                          <Image
                            src={thumbnailPreview}
                            alt="Thumbnail preview"
                            className="w-full h-full object-cover"
                            width={300}
                            height={200}
                          />
                          <button
                            type="button"
                            className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full"
                            onClick={() => {
                              setThumbnailPreview(null);
                              setFormData((prev) => ({
                                ...prev,
                                thumbnail: null,
                              }));
                              setHasUnsavedChanges(true);
                            }}
                          >
                            <HiX className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h3 className="font-medium text-gray-900 mb-3">
                      Product Gallery
                    </h3>
                    <p className="text-sm text-gray-500 mb-4">
                      Add up to 10 images to showcase your product
                    </p>
                    <div className="mb-4">
                      <div
                        className="border-2 border-dashed border-gray-300 rounded-lg p-4 h-32 flex flex-col items-center justify-center cursor-pointer hover:border-violet-500 transition-colors"
                        onClick={() => galleryInputRef.current?.click()}
                      >
                        <HiPhotograph className="w-8 h-8 text-gray-400 mb-2" />
                        <p className="text-sm text-gray-500">
                          Click to upload gallery images
                        </p>
                        <input
                          type="file"
                          ref={galleryInputRef}
                          onChange={handleGalleryChange}
                          className="hidden"
                          accept="image/*"
                          multiple
                        />
                      </div>
                    </div>
                    {galleryPreviews.length > 0 && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {galleryPreviews.map((preview, index) => (
                          <div
                            key={preview.id || index}
                            className="relative bg-gray-100 rounded-lg overflow-hidden aspect-square"
                          >
                            <Image
                              src={preview.url}
                              alt={`Gallery image ${index + 1}`}
                              className="w-full h-full object-cover"
                              width={150}
                              height={150}
                            />
                            <button
                              type="button"
                              className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full"
                              onClick={() => removeGalleryImage(index)}
                            >
                              <HiX className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    {galleryPreviews.length === 0 && (
                      <p className="text-sm text-gray-400 text-center py-4">
                        No gallery images yet
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Pricing Tab */}
              {activeTab === "pricing" && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Pricing Type
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {["free", "paid", "contact"].map((type) => (
                        <div
                          key={type}
                          className={`border rounded-lg p-4 cursor-pointer transition-all ${
                            formData.pricingType === type
                              ? "border-violet-500 bg-violet-50"
                              : "border-gray-200 hover:border-violet-200"
                          }`}
                          onClick={() => {
                            setFormData((prev) => ({
                              ...prev,
                              pricingType: type,
                            }));
                            setHasUnsavedChanges(true);
                          }}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="capitalize font-medium">
                              {type}
                            </span>
                            <div
                              className={`w-4 h-4 rounded-full border ${
                                formData.pricingType === type
                                  ? "border-violet-500 bg-violet-500"
                                  : "border-gray-300"
                              }`}
                            >
                              {formData.pricingType === type && (
                                <div className="w-2 h-2 bg-white rounded-full m-auto mt-1"></div>
                              )}
                            </div>
                          </div>
                          <p className="text-xs text-gray-500">
                            {type === "free" &&
                              "Your product is available for free"}
                            {type === "paid" &&
                              "Your product has a specific price"}
                            {type === "contact" &&
                              "Users need to contact you for pricing"}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                  {formData.pricingType === "paid" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label
                          htmlFor="pricingAmount"
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          Price Amount*
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            {formData.pricingCurrency === "USD" && "$"}
                            {formData.pricingCurrency === "EUR" && "€"}
                            {formData.pricingCurrency === "GBP" && "£"}
                          </div>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            id="pricingAmount"
                            name="pricingAmount"
                            value={formData.pricingAmount}
                            onChange={handleChange}
                            className={`w-full pl-8 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-colors ${
                              validationErrors.pricingAmount
                                ? "border-red-500"
                                : "border-gray-300"
                            }`}
                            placeholder="0.00"
                          />
                        </div>
                        {validationErrors.pricingAmount && (
                          <p className="mt-1 text-sm text-red-600">
                            {validationErrors.pricingAmount}
                          </p>
                        )}
                      </div>
                      <div>
                        <label
                          htmlFor="pricingCurrency"
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          Currency
                        </label>
                        <select
                          id="pricingCurrency"
                          name="pricingCurrency"
                          value={formData.pricingCurrency}
                          onChange={handleChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 appearance-none bg-white transition-colors"
                        >
                          <option value="USD">USD ($)</option>
                          <option value="EUR">EUR (€)</option>
                          <option value="GBP">GBP (£)</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Links Tab */}
              {activeTab === "links" && (
                <div className="space-y-4">
                  <p className="text-sm text-gray-500 mb-4">
                    Add relevant links to your product. These will be displayed
                    on your product page.
                  </p>
                  {Object.entries({
                    website: "Website URL",
                    github: "GitHub Repository",
                    demo: "Demo / Live Version",
                    appStore: "App Store Link",
                    playStore: "Play Store Link",
                  }).map(([key, label]) => (
                    <div key={key}>
                      <label
                        htmlFor={`links.${key}`}
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        {label}
                      </label>
                      <input
                        type="url"
                        id={`links.${key}`}
                        name={`links.${key}`}
                        value={formData.links[key]}
                        onChange={handleChange}
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-colors ${
                          validationErrors[`links.${key}`]
                            ? "border-red-500"
                            : "border-gray-300"
                        }`}
                        placeholder={`Enter ${label.toLowerCase()}`}
                      />
                      {validationErrors[`links.${key}`] && (
                        <p className="mt-1 text-sm text-red-600">
                          {validationErrors[`links.${key}`]}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Tags Tab */}
              {activeTab === "tags" && (
                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="tags"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Tags (comma separated)
                    </label>
                    <input
                      type="text"
                      id="tags"
                      name="tags"
                      value={formData.tags.join(", ")}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-colors"
                      placeholder="e.g. productivity, ai, tool, design"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Up to 10 tags to categorize your product. Tags help users
                      discover your product.
                    </p>
                  </div>
                  {formData.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {formData.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="bg-violet-100 text-violet-800 px-3 py-1 rounded-full text-sm"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </form>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-200 bg-gray-50 flex justify-between items-center">
            <div className="flex text-sm">
              {hasUnsavedChanges && (
                <span className="text-amber-600">You have unsaved changes</span>
              )}
              {(productError || categoriesError) && (
                <span className="text-red-600">
                  {productError || categoriesError}
                </span>
              )}
            </div>
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => {
                  if (hasUnsavedChanges) {
                    if (
                      window.confirm(
                        "You have unsaved changes. Are you sure you want to cancel?"
                      )
                    ) {
                      onClose();
                    }
                  } else {
                    onClose();
                  }
                }}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                className="px-6 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                disabled={submitting || !hasUnsavedChanges || categoriesLoading}
              >
                {submitting ? (
                  <>
                    <svg
                      className="animate-spin h-4 w-4 mr-2 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Creating...
                  </>
                ) : (
                  "Create Product"
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default AddProductModal;
