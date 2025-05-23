"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Rocket,
  ArrowRight,
  Link as LinkIcon,
  Camera,
  MessageSquare,
  DollarSign,
  Globe,
  Check,
  Sparkles,
  ImageIcon
} from "lucide-react";
import { toast } from "react-hot-toast";
import { useProduct } from "@/lib/contexts/product-context";
import { useCategories } from "@/lib/contexts/category-context";
import ThumbnailUploadSection from "./Components/ThumbnailUploadSection";
import GalleryUploadSection from "./Components/GalleryUploadSection";
import SmartDescriptionSection from "./Components/SmartDescriptionSection";
import LinksTagsSection from "./Components/LinksTagsSection";
import PricingSection from "./Components/PricingSection";
import ReviewSection from "./Components/ReviewSection";
import SuccessScreen from "./Components/SuccessScreen";

// Step configuration
const STEPS = [
  {
    id: "start",
    title: "Quick Start",
    description: "Let's begin with your product's URL or basic info",
    icon: Rocket,
  },
  {
    id: "visuals",
    title: "Thumbnail",
    description: "Add a primary image for your product",
    icon: Camera,
  },
  {
    id: "gallery",
    title: "Gallery",
    description: "Add additional images to showcase your product",
    icon: ImageIcon,
  },
  {
    id: "details",
    title: "Details",
    description: "Tell us more about your product",
    icon: MessageSquare,
  },
  {
    id: "links",
    title: "Links & Tags",
    description: "Add relevant links and categorize your product",
    icon: LinkIcon,
  },
  {
    id: "pricing",
    title: "Pricing",
    description: "Set your product's pricing model",
    icon: DollarSign,
  },
  {
    id: "review",
    title: "Review",
    description: "Preview and launch your product",
    icon: Check,
  },
];

const AddProductForm = () => {
  // Context and state
  const { createProduct, validateProductUrl } = useProduct();
  const { categories } = useCategories();
  const [currentStep, setCurrentStep] = useState("start");
  const [urlValidating, setUrlValidating] = useState(false);
  const [formComplete, setFormComplete] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedProduct, setSubmittedProduct] = useState(null);



  // Form state
  const [formData, setFormData] = useState({
    productUrl: "",
    name: "",
    tagline: "",
    description: "",
    category: "",
    thumbnail: null,
    galleryImages: [],
    tags: [],
    links: {},
    pricing: {
      type: "free",
      amount: "",
      currency: "USD",
      discounted: false,
      originalAmount: "",
      interval: "", // For subscription pricing
    },
  });

  // URL validation and autofill
  const handleUrlValidation = async (url) => {
    if (!url) return;

    setUrlValidating(true);

    try {
      const result = await validateProductUrl(url);

      if (result) {
        setFormData((prev) => ({
          ...prev,
          name: result.title || "",
          tagline: result.description?.substring(0, 100) || "",
          description: result.description || "",
          thumbnail: result.images?.[0] || null,
          links: { ...prev.links, website: result.url },
        }));

        toast.success(
          "URL validated! We've pre-filled some information for you."
        );
        setCurrentStep("visuals");
      } else {
        toast.error(
          "We couldn't validate this URL. Please check it and try again."
        );
      }
    } catch (error) {
      toast.error("Error validating URL. Please try again.");
    } finally {
      setUrlValidating(false);
    }
  };

  // Form submission
  const handleSubmit = async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    toast.loading("Submitting your product...");

    try {
      // Format pricing data based on type
      const pricingData = { ...formData.pricing };

      // Handle amount based on pricing type
      if (pricingData.type === "free" || pricingData.type === "contact") {
        pricingData.amount = 0;
        pricingData.originalAmount = 0;
        pricingData.discounted = false;
      } else {
        // For paid, subscription, freemium
        pricingData.amount = parseFloat(pricingData.amount) || 0;

        if (pricingData.discounted && pricingData.originalAmount) {
          pricingData.originalAmount = parseFloat(pricingData.originalAmount) || 0;
        } else {
          pricingData.originalAmount = 0;
          pricingData.discounted = false;
        }
      }

      // Clear interval if not subscription
      if (pricingData.type !== "subscription") {
        pricingData.interval = "";
      }

      // Prepare product data for submission
      const productToSubmit = {
        ...formData,
        pricing: pricingData,
      };

      // Log submission details
      console.log("Submitting product:", {
        ...productToSubmit,
        thumbnail: productToSubmit.thumbnail ? "[File or URL present]" : "[None]",
        galleryImages: Array.isArray(productToSubmit.galleryImages) ?
          `${productToSubmit.galleryImages.length} images` : "[None or invalid]"
      });

      // Submit the product with gallery images
      const result = await createProduct(productToSubmit);

      // Dismiss loading toast
      toast.dismiss();

      if (result && result._id) {
        console.log("Product created successfully:", result);

        // Set the submitted product data
        setSubmittedProduct(result);

        // Set form complete state to trigger success screen
        setFormComplete(true);

        // Show success message
        toast.success("Your product has been launched successfully! 🚀");
      } else {
        throw new Error("Failed to create product. Please try again.");
      }
    } catch (error) {
      // Dismiss loading toast
      toast.dismiss();

      console.error("Product submission error:", error);
      toast.error(error.message || "Error submitting product. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset form to add another product
  const handleReset = () => {
    setFormData({
      productUrl: "",
      name: "",
      tagline: "",
      description: "",
      category: "",
      thumbnail: null,
      galleryImages: [],
      tags: [],
      links: {},
      pricing: {
        type: "free",
        amount: "",
        currency: "USD",
        discounted: false,
        originalAmount: "",
        interval: "",
      },
    });
    setCurrentStep("start");
    setFormComplete(false);
    setSubmittedProduct(null);
  };

  // Quick start step
  const QuickStartStep = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-8"
    >
      <div className="text-center max-w-xl mx-auto">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="w-20 h-20 mx-auto mb-6 rounded-full bg-violet-100 flex items-center justify-center"
        >
          <Rocket size={32} className="text-violet-600" />
        </motion.div>

        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          Let's Launch Your Product
        </h2>

        <p className="text-gray-600 mb-8">
          Have a product website? Let us extract information automatically to
          speed up your submission.
        </p>
      </div>

      <div className="max-w-xl mx-auto space-y-6">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Product URL (Optional)
          </label>
          <div className="flex gap-3">
            <input
              type="url"
              value={formData.productUrl}
              onChange={(e) =>
                setFormData({ ...formData, productUrl: e.target.value })
              }
              placeholder="https://yourproduct.com"
              className="flex-1 px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
            />
            <button
              onClick={() => handleUrlValidation(formData.productUrl)}
              disabled={urlValidating || !formData.productUrl}
              className="px-6 py-3 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors disabled:bg-violet-300 flex items-center gap-2 whitespace-nowrap"
            >
              {urlValidating ? (
                <>
                  <span className="animate-spin">⟳</span> Checking...
                </>
              ) : (
                <>
                  Validate URL <Globe size={18} />
                </>
              )}
            </button>
          </div>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-white text-gray-500">
              or start manually
            </span>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Product Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="Enter your product name"
              className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Tagline *
            </label>
            <input
              type="text"
              value={formData.tagline}
              onChange={(e) =>
                setFormData({ ...formData, tagline: e.target.value })
              }
              placeholder="A short, catchy description"
              className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
            />
          </div>
        </div>

        <div className="pt-6">
          <button
            onClick={() => setCurrentStep("visuals")}
            disabled={!formData.name || !formData.tagline}
            className="w-full px-8 py-4 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <span>Continue to Next Step</span>
            <ArrowRight size={20} />
          </button>
        </div>
      </div>
    </motion.div>
  );

  // Step content mapping
  const renderStepContent = () => {
    // If form is complete, show success screen
    if (formComplete) {
      return (
        <SuccessScreen productData={submittedProduct} onReset={handleReset} />
      );
    }

    switch (currentStep) {
      case "start":
        return <QuickStartStep />;
      case "visuals":
        return (
          <ThumbnailUploadSection
            thumbnail={formData.thumbnail}
            setThumbnail={(thumb) =>
              setFormData({ ...formData, thumbnail: thumb })
            }
            onBack={() => setCurrentStep("start")}
            onNext={() => setCurrentStep("gallery")}
            error={!formData.thumbnail ? "Please add a thumbnail image" : null}
          />
        );
      case "gallery":
        return (
          <GalleryUploadSection
            galleryImages={formData.galleryImages}
            setGalleryImages={(images) =>
              setFormData({ ...formData, galleryImages: images })
            }
            onBack={() => setCurrentStep("visuals")}
            onNext={() => setCurrentStep("details")}
            error={null} // Gallery is optional
          />
        );
      case "details":
        return (
          <SmartDescriptionSection
            name={formData.name}
            tagline={formData.tagline}
            description={formData.description}
            onChange={(desc) => setFormData({ ...formData, description: desc })}
            onBack={() => setCurrentStep("visuals")}
            onNext={() => setCurrentStep("links")}
            error={!formData.description ? "Please add a description" : null}
          />
        );
      case "links":
        return (
          <LinksTagsSection
            links={formData.links}
            setLinks={(links) => setFormData({ ...formData, links })}
            tags={formData.tags}
            setTags={(tags) => setFormData({ ...formData, tags })}
            category={formData.category}
            setCategory={(category) => setFormData({ ...formData, category })}
            categories={categories}
            onBack={() => setCurrentStep("details")}
            onNext={() => setCurrentStep("pricing")}
            error={!formData.category ? "Please select a category" : null}
          />
        );
      case "pricing":
        return (
          <PricingSection
            pricing={formData.pricing}
            setPricing={(pricing) => setFormData({ ...formData, pricing })}
            onBack={() => setCurrentStep("links")}
            onNext={() => setCurrentStep("review")}
            error={
              (formData.pricing.type === "paid" || formData.pricing.type === "subscription") && !formData.pricing.amount
                ? "Please enter a price amount"
                : formData.pricing.type === "contact" && !formData.pricing.contactEmail
                ? "Please enter a contact email for pricing inquiries"
                : null
            }
          />
        );
      case "review":
        return (
          <ReviewSection
            formData={formData}
            categories={categories}
            onBack={() => setCurrentStep("pricing")}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            error={null}
          />
        );
      default:
        return null;
    }
  };

  // Find current step index
  const currentStepIndex = STEPS.findIndex((step) => step.id === currentStep);

  return (
    <div className="min-h-[600px] bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
      {/* Progress Header - Only show when not in success state */}
      {!formComplete && (
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-purple-600 opacity-10"></div>
          <div className="relative px-8 py-6">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-semibold text-gray-800">
                {STEPS[currentStepIndex].title}
              </h2>
              <span className="text-sm text-gray-500">
                Step {currentStepIndex + 1} of {STEPS.length}
              </span>
            </div>

            {/* Progress Bar */}
            <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden">
              <motion.div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-violet-600 to-purple-600"
                initial={{ width: 0 }}
                animate={{
                  width: `${((currentStepIndex + 1) / STEPS.length) * 100}%`,
                }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
              />
            </div>

            {/* Step Description */}
            <p className="mt-3 text-sm text-gray-600 flex items-center gap-2">
              {React.createElement(STEPS[currentStepIndex].icon, {
                size: 16,
                className: "text-violet-600",
              })}
              {STEPS[currentStepIndex].description}
            </p>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className={formComplete ? "" : "p-8"}>
        <AnimatePresence mode="wait">{renderStepContent()}</AnimatePresence>
      </div>


    </div>
  );
};

export default AddProductForm;
