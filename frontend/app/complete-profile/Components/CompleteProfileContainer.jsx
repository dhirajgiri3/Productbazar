"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/lib/contexts/auth-context";
// useRouter is not used for navigation based on original code, keeping import commented
import { useRouter } from "next/navigation";
import logger from "@/lib/utils/logger";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { optimizeImage } from "@/lib/utils/image/image-utils";
import api, { makePriorityRequest } from "@/lib/api/api";
import LoaderComponent from "../../../Components/UI/LoaderComponent";
import SuccessConfetti from "./SuccessConfetti"; // Adjust path

// Import Child Components
import { ProfileBasicsForm } from "./ProfileBasicsForm";
import { ProfileDetailsForm } from "./ProfileDetailsForm";
import { RoleSpecificForm } from "./RoleSpecificForm";
import { ProfileReview } from "./ProfileReview";
import { StepIndicator, NavigationButtons } from "./ProfileFormComponents";
import { FormStep } from "./FormStep"; // Keep if Profile*Form components use it

const CompleteProfileContainer = () => {
  const { user, completeProfile, updateProfilePicture, authLoading, error: authError, clearError, fetchUserData, skipProfileCompletion } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef(null);

  const [showConfetti, setShowConfetti] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "", lastName: "", email: "", phone: "", gender: "", birthDate: "",
    bio: "", headline: "", address: { country: "", city: "", street: "" }, openToWork: false,
    about: "", preferredContact: "", skills: [], interests: [],
    socialLinks: { facebook: "", twitter: "", linkedin: "", instagram: "", github: "", website: "" },
    profilePicture: "", // URL from server or local preview
    profileImage: null, // Actual File/Blob for upload
    companyName: "", companyWebsite: "", companyRole: "", industry: "",
    roleDetails: {}, // Populated based on user role
  });
  const [multiInputValues, setMultiInputValues] = useState({}); // State for RoleSpecificForm inputs

  const [currentStep, setCurrentStep] = useState(1);
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [profileImagePreview, setProfileImagePreview] = useState(null);
  const [skillInput, setSkillInput] = useState("");
  const [skillTags, setSkillTags] = useState([]);
  const [interestInput, setInterestInput] = useState("");
  const [interestTags, setInterestTags] = useState([]);
  const [roleDataLoaded, setRoleDataLoaded] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [hasAccessToken, setHasAccessToken] = useState(false);
  const [loadingTimeout, setLoadingTimeout] = useState(false);

  const totalSteps = user?.role && ["startupOwner", "investor", "agency", "freelancer", "jobseeker"].includes(user.role) ? 6 : 5;

  const predefinedOptions = {
    skills: ["JavaScript", "React", "Python", "UI/UX Design", "Product Management", "Digital Marketing", "Data Analysis", "Node.js", "Project Management"],
    interests: ["Technology", "AI/ML", "Design", "E-commerce", "SaaS", "Fintech", "Web3", "Sustainability", "Startups", "Investing"],
  };

  // --- Data Fetching & Initialization ---
  const fetchRoleSpecificData = async (userId, role) => {
      if (!userId || !role || role === "user") return null;
      try {
          // Use makePriorityRequest to prevent this request from being canceled during navigation
          try {
              // Use priority request to prevent cancellation during navigation
              const response = await makePriorityRequest('get', `/users/${userId}/role-details`, { timeout: 10000 });
              if (response.data.status === "success" && response.data.data) {
                  logger.info(`Fetched role details for ${role}:`, response.data.data);
                  return response.data.data;
              }
          } catch (priorityErr) {
              // If priority request fails, fall back to regular request
              logger.warn(`Priority request failed, falling back to regular request: ${priorityErr.message}`);
              const response = await api.get(`/users/${userId}/role-details`, { timeout: 10000 });
              if (response.data.status === "success" && response.data.data) {
                  logger.info(`Fetched role details for ${role}:`, response.data.data);
                  return response.data.data;
              }
          }
          return null;
      } catch (err) {
          // Don't log canceled errors as they're expected during navigation
          if (err.name !== 'CanceledError' && err.code !== 'ERR_CANCELED') {
              logger.error(`Failed to fetch ${role} details:`, err);
          }
          return null;
      }
  };

  // Check for access token in useEffect to prevent hydration mismatch
  useEffect(() => {
    setHasAccessToken(!!localStorage.getItem('accessToken'));
  }, []);

  // Add a timeout to prevent infinite loading in extreme cases
  useEffect(() => {
    if (authLoading || (hasAccessToken && !user)) {
      const timeout = setTimeout(() => {
        setLoadingTimeout(true);
      }, 15000); // 15 seconds timeout

      return () => clearTimeout(timeout);
    } else {
      setLoadingTimeout(false);
    }
  }, [authLoading, hasAccessToken, user]);

  // Enhanced OAuth callback handling for complete profile page
  useEffect(() => {
    // Check if this is an OAuth callback and handle it properly
    const urlParams = new URLSearchParams(window.location.search);
    const isOAuthCallback = urlParams.has('oauth_success') || urlParams.has('token');
    
    if (isOAuthCallback) {
      // If this is an OAuth callback, wait a bit longer for auth context to process
      const oauthTimer = setTimeout(() => {
        // Force a re-check of auth state after OAuth processing
        const token = localStorage.getItem('accessToken');
        const userData = localStorage.getItem('user');
        
        if (token && userData && !user) {
          // Auth context might not have processed OAuth yet, try to refresh
          try {
            const parsedUser = JSON.parse(userData);
            console.log('OAuth callback detected, found stored user data:', parsedUser);
          } catch (error) {
            console.error('Error parsing stored user data:', error);
          }
        }
      }, 1000); // Wait 1 second for OAuth processing
      
      return () => clearTimeout(oauthTimer);
    }
  }, [user]);

  useEffect(() => {
    // Reset role data loaded state when auth state changes
    if (authLoading) {
      setRoleDataLoaded(false);
      return;
    }

    // Function to retry loading user data with exponential backoff
    const loadUserDataWithRetry = async (retryCount = 0) => {
      const maxRetries = 3;
      const baseDelay = 1000; // 1 second
      
      try {
        // Use the fetchUserData function from AuthContext
        const success = await fetchUserData();
        if (!success && retryCount < maxRetries) {
          // Retry with exponential backoff
          const delay = baseDelay * Math.pow(2, retryCount);
          setTimeout(() => {
            loadUserDataWithRetry(retryCount + 1);
          }, delay);
        } else if (!success) {
          logger.warn("Failed to load user data after retries, marking as loaded to prevent infinite loading");
          setRoleDataLoaded(true);
        }
        // We don't need to set roleDataLoaded here as this effect will run again when user is updated
      } catch (err) {
        logger.error("Failed to refresh user data:", err);
        if (retryCount < maxRetries) {
          const delay = baseDelay * Math.pow(2, retryCount);
          setTimeout(() => {
            loadUserDataWithRetry(retryCount + 1);
          }, delay);
        } else {
          setRoleDataLoaded(true); // Prevent infinite loading
        }
      }
    };

    // Enhanced condition for OAuth scenarios
    // If we have an access token but no user data yet, try to refresh user data
    if (!user && hasAccessToken && !authLoading) {
      // Check if this might be an OAuth callback scenario
      const urlParams = new URLSearchParams(window.location.search);
      const isOAuthCallback = urlParams.has('oauth_success') || urlParams.has('token');
      
      if (isOAuthCallback) {
        // For OAuth callbacks, wait a bit longer before trying to fetch user data
        // as the auth context might still be processing the callback
        const oauthDelay = setTimeout(() => {
          loadUserDataWithRetry();
        }, 500);
        return () => clearTimeout(oauthDelay);
      } else {
        // For normal scenarios, try immediately
        loadUserDataWithRetry();
      }
      return;
    }

    if (user) {
      const initialData = {
        firstName: user.firstName || "", lastName: user.lastName || "", email: user.email || "",
        phone: (user.isPhoneVerified && user.phone) ? user.phone : user.phone || "",
        gender: user.gender || "",
        birthDate: user.birthDate ? new Date(user.birthDate).toISOString().split("T")[0] : "",
        bio: user.bio || "",
        headline: user.headline || "",
        address: typeof user.address === 'object' ? { ...user.address } : { country: '', city: '', street: user.address || '' },
        openToWork: user.openToWork || false, about: user.about || "", preferredContact: user.preferredContact || "",
        skills: user.skills || [],
        interests: user.interests?.map(i => (typeof i === 'string' ? i : i?.name || '')).filter(Boolean) || [],
        socialLinks: user.socialLinks || { facebook: "", twitter: "", linkedin: "", instagram: "", github: "", website: "" },
        profilePicture: user.profilePicture?.url || user.googleProfile?.profilePicture || "", profileImage: null,
        companyName: user.companyName || "", companyWebsite: user.companyWebsite || "",
        companyRole: user.companyRole || "", industry: user.industry || "",
        roleDetails: {}, // Initialize empty, will be populated below
      };

      // Set initial role-specific defaults (important before fetching existing)
      if (user.role && user.role !== "user") {
        initialData.roleDetails[user.role] = getInitialRoleDefaults(user.role, initialData);
      }

      setFormData(initialData);
      setSkillTags(user.skills || []);
      setInterestTags(initialData.interests); // Use the processed interests
      setProfileImagePreview(user.profilePicture?.url || user.googleProfile?.profilePicture || null);

      // Fetch and merge existing role-specific data
      if (user.role && user.role !== "user" && user._id) {
        fetchRoleSpecificData(user._id, user.role).then((roleData) => {
          if (roleData) {
            setFormData((prev) => ({
              ...prev,
              roleDetails: {
                ...prev.roleDetails, // Keep other roles if they somehow exist
                [user.role]: { ...prev.roleDetails[user.role], ...roleData }, // Merge fetched over defaults
              },
            }));
            logger.info(`Merged role details for ${user.role}`);
          }
          setRoleDataLoaded(true);
        })
        .catch(err => {
          logger.error(`Error fetching role details: ${err.message}`);
          setRoleDataLoaded(true); // Still mark as loaded even if there's an error
        });
      } else {
        setRoleDataLoaded(true);
      }
    } else {
      // If no user, set roleDataLoaded to true to prevent infinite loading
      if (!authLoading) {
        setRoleDataLoaded(true);
      }
    }
  }, [user, authLoading, fetchUserData, hasAccessToken]); // Added hasAccessToken dependency

  // Helper for initial role defaults
    const getInitialRoleDefaults = (role, baseData) => {
        switch (role) {
            case "startupOwner": return { companyName: "", industry: "", fundingStage: "Pre-seed", companySize: "1-10", yearFounded: null, website: "", description: "", location: { country: "", city: "" }, teamSize: 1, socialLinks: baseData.socialLinks };
            case "investor": return { investorType: "Angel Investor", investmentFocus: [], investmentRange: { min: 10000, max: 50000, currency: "USD" }, companyName: "", industry: "", previousInvestments: [], location: { country: "", city: "" }, website: "", investmentCriteria: [], preferredStages: [] };
            case "agency": return { companyName: "", industry: "", services: [], companySize: "1-10", yearFounded: null, website: "", description: "", location: { country: "", city: "" }, clientTypes: [], portfolio: [], socialLinks: baseData.socialLinks };
            case "freelancer": return { skills: baseData.skills, experience: "Intermediate", hourlyRate: { amount: 0, currency: "USD" }, availability: "Flexible", preferredJobTypes: ["Remote"], education: [], certifications: [], languages: [] };
            case "jobseeker": return { jobTitle: "", experience: "Mid-Level", skills: baseData.skills, education: [], workExperience: [], certifications: [], languages: [], preferredJobTypes: ["Full-time"], preferredLocations: [], expectedSalary: { amount: 0, currency: "USD", period: "Yearly" }, resumeUrl: "" };
            default: return {};
        }
    };


  // --- Event Handlers ---
  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    const parts = name.split(".");

    setFormData((prev) => {
      let newState = { ...prev };
      let current = newState;

      for (let i = 0; i < parts.length - 1; i++) {
        // Ensure nested objects exist
        if (!current[parts[i]] || typeof current[parts[i]] !== 'object') {
           // If part is roleDetails, initialize with the user's role structure
           if (parts[i] === 'roleDetails' && user?.role && parts[i+1] === user.role) {
               current.roleDetails = { ...current.roleDetails, [user.role]: { ...current.roleDetails?.[user.role] } };
           } else {
               current[parts[i]] = {};
           }
        } else {
             // Clone nested object to avoid mutation
             current[parts[i]] = { ...current[parts[i]] };
        }
        current = current[parts[i]];
      }

      const finalValue = type === "checkbox" ? checked : type === "number" ? (value === "" ? null : Number(value)) : value;
      current[parts[parts.length - 1]] = finalValue;

      return newState;
    });

    // Clear specific error when user types
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: undefined }));
    }
  }, [formErrors, user?.role]);


  const handleProfileImageChange = useCallback(async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.match(/image\/(jpeg|jpg|png|gif|webp)/)) {
      toast.error("Invalid image file type.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      toast.error("Image must be under 10MB.");
      return;
    }

    setImageLoading(true);
    try {
      const optimizedFile = await optimizeImage(file, { maxWidth: 1024, maxHeight: 1024, quality: 0.8 });
      const localPreview = URL.createObjectURL(optimizedFile);
      setProfileImagePreview(localPreview); // Show local preview immediately

      // Set the optimized file in formData for submission
       setFormData((prev) => ({
        ...prev,
        profileImage: optimizedFile,
        profilePicture: {
          url: localPreview, // Use local preview URL initially
          publicId: undefined // Will be set after upload
        }
      }));

      // Optional: Attempt background upload if user exists, update URL on success
      if (user && user._id) {
        const uploadData = new FormData();
        uploadData.append("profileImage", optimizedFile);
        try {
            // Note: updateProfilePicture should ideally handle the API call
            // and return the URL, not modify auth context directly during this flow.
            // Assuming it returns { success: true, url: '...' } or similar
          const result = await updateProfilePicture(uploadData); // This might update context, be mindful
          if (result?.success) {
             // Use the URL from the result or from the profilePicture object
             const imageUrl = result.url || result.profilePicture?.url;
             const publicId = result.publicId || result.profilePicture?.publicId;
             if (imageUrl) {
               setFormData((prev) => ({
                 ...prev,
                 profilePicture: {
                   url: imageUrl,
                   publicId: publicId
                 }
               })); // Update with server URL
               setProfileImagePreview(imageUrl); // Update preview to server URL
               toast.success("Profile picture updated successfully.");
             } else {
               // Success but no URL returned (shouldn't happen)
               toast.success("Profile picture updated.");
             }
          } else {
            // Keep local preview if background upload fails but file is ready
             toast.success("Image ready for submission.");
          }
        } catch (uploadErr) {
          logger.error("Background profile picture upload failed:", uploadErr);
          toast.error("Couldn't save picture now, will save with profile.");
          // Keep local preview and file for final submission
        }
      } else {
          toast.success("Image ready for submission.");
      }

    } catch (err) {
      toast.error(`Image processing failed: ${err.message}`);
      logger.error("Image processing error:", err);
      setProfileImagePreview(formData.profilePicture || user?.profilePicture?.url || null); // Revert preview on error
       setFormData((prev) => ({ ...prev, profileImage: null })); // Clear the faulty image file
    } finally {
      setImageLoading(false);
       // Clear the file input value to allow re-uploading the same file
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }, [user, updateProfilePicture, formData.profilePicture]);


  const handleTagInput = useCallback((e, type) => {
    if (e.key !== "Enter" && e.key !== ",") return;
    e.preventDefault();
    const inputVal = type === "skills" ? skillInput : interestInput;
    const newTag = inputVal.trim();
    if (!newTag) return;

    if (type === "skills") {
      if (!skillTags.includes(newTag)) {
        const updatedTags = [...skillTags, newTag];
        setSkillTags(updatedTags);
         // Update formData.skills AND roleDetails.skills if applicable
         setFormData(prev => ({
             ...prev,
             skills: updatedTags,
             ...( (prev.roleDetails?.freelancer || prev.roleDetails?.jobseeker) && user?.role && ['freelancer', 'jobseeker'].includes(user.role)
                ? { roleDetails: { ...prev.roleDetails, [user.role]: { ...prev.roleDetails[user.role], skills: updatedTags } } }
                : {} )
         }));
      }
      setSkillInput("");
    } else { // interests
      if (!interestTags.includes(newTag)) {
        const updatedTags = [...interestTags, newTag];
        setInterestTags(updatedTags);
        // Store interests as simple strings in review state, convert on submit
        // setFormData(prev => ({ ...prev, interests: updatedTags })); // Managed by interestTags state
      }
      setInterestInput("");
    }
  }, [skillInput, interestInput, skillTags, interestTags, user?.role]);

  const removeTag = useCallback((tagToRemove, type) => {
    if (type === "skills") {
      const updatedTags = skillTags.filter(tag => tag !== tagToRemove);
      setSkillTags(updatedTags);
       // Update formData.skills AND roleDetails.skills if applicable
         setFormData(prev => ({
             ...prev,
             skills: updatedTags,
             ...( (prev.roleDetails?.freelancer || prev.roleDetails?.jobseeker) && user?.role && ['freelancer', 'jobseeker'].includes(user.role)
                ? { roleDetails: { ...prev.roleDetails, [user.role]: { ...prev.roleDetails[user.role], skills: updatedTags } } }
                : {} )
         }));
    } else { // interests
      const updatedTags = interestTags.filter(tag => tag !== tagToRemove);
      setInterestTags(updatedTags);
      // setFormData(prev => ({ ...prev, interests: updatedTags })); // Managed by interestTags state
    }
  }, [skillTags, interestTags, user?.role]);

  const addPredefinedTag = useCallback((tagToAdd, type) => {
     if (type === "skills") {
      if (!skillTags.includes(tagToAdd)) {
        const updatedTags = [...skillTags, tagToAdd];
        setSkillTags(updatedTags);
         setFormData(prev => ({
             ...prev,
             skills: updatedTags,
              ...( (prev.roleDetails?.freelancer || prev.roleDetails?.jobseeker) && user?.role && ['freelancer', 'jobseeker'].includes(user.role)
                ? { roleDetails: { ...prev.roleDetails, [user.role]: { ...prev.roleDetails[user.role], skills: updatedTags } } }
                : {} )
         }));
      }
    } else { // interests
      if (!interestTags.includes(tagToAdd)) {
        const updatedTags = [...interestTags, tagToAdd];
        setInterestTags(updatedTags);
        // setFormData(prev => ({ ...prev, interests: updatedTags })); // Managed by interestTags state
      }
    }
  }, [skillTags, interestTags, user?.role]);

    // Handlers for RoleSpecificForm's MultiInput
    const handleMultiInputChange = useCallback((role, field, value) => {
        setMultiInputValues(prev => ({ ...prev, [`${role}_${field}`]: value }));
    }, []);

    const addMultiInputTag = useCallback((e, role, field, directValue = null) => {
        if (e && e.key !== "Enter" && e.key !== ",") return;
        if (e) e.preventDefault();

        const key = `${role}_${field}`;
        const inputVal = directValue ?? multiInputValues[key];
        const newTag = inputVal?.trim();
        if (!newTag) return;

        setFormData(prev => {
            const currentTags = prev.roleDetails?.[role]?.[field] || [];
            if (!currentTags.includes(newTag)) {
                const updatedRoleDetails = {
                    ...prev.roleDetails,
                    [role]: {
                        ...prev.roleDetails?.[role],
                        [field]: [...currentTags, newTag]
                    }
                };
                return { ...prev, roleDetails: updatedRoleDetails };
            }
            return prev; // No change if tag exists
        });

        // Clear the specific input field
        setMultiInputValues(prev => ({ ...prev, [key]: '' }));

    }, [multiInputValues]);

    const removeMultiInputTag = useCallback((role, field, tagToRemove) => {
         setFormData(prev => {
            const currentTags = prev.roleDetails?.[role]?.[field] || [];
            const updatedTags = currentTags.filter(tag => tag !== tagToRemove);
             const updatedRoleDetails = {
                 ...prev.roleDetails,
                 [role]: {
                     ...prev.roleDetails?.[role],
                     [field]: updatedTags
                 }
             };
             return { ...prev, roleDetails: updatedRoleDetails };
         });
    }, []);


  // --- Validation ---
  const validateForm = useCallback(() => {
    const errors = {};
    if (!formData.firstName) errors.firstName = "First name required";
    if (!formData.lastName) errors.lastName = "Last name required";
    if (!formData.email && !formData.phone) errors.contact = "Email or phone required";
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) errors.email = "Invalid email";
    if (formData.phone && typeof formData.phone === 'string' && !/^\+?[0-9\s\-()]{10,15}$/.test(formData.phone)) errors.phone = "Invalid phone number";

    // Role Specific Validation
    if (user?.role && formData.roleDetails?.[user.role]) {
        const roleData = formData.roleDetails[user.role];
        const roleKey = `roleDetails.${user.role}`;
        switch (user.role) {
            case "startupOwner":
                if (!roleData.companyName) errors[`${roleKey}.companyName`] = "Company name required";
                if (!roleData.industry) errors[`${roleKey}.industry`] = "Industry required";
                if (roleData.yearFounded && (roleData.yearFounded < 1900 || roleData.yearFounded > new Date().getFullYear())) errors[`${roleKey}.yearFounded`] = `Year must be between 1900 and ${new Date().getFullYear()}`;
                break;
            case "investor":
                if (!roleData.investorType) errors[`${roleKey}.investorType`] = "Investor type required";
                if (roleData.investmentRange?.min > roleData.investmentRange?.max) errors[`${roleKey}.investmentRange.min`] = "Min investment must be less than max";
                break;
            case "agency":
                if (!roleData.companyName) errors[`${roleKey}.companyName`] = "Agency name required";
                if (!roleData.services || roleData.services.length === 0) errors[`${roleKey}.services`] = "At least one service required";
                break;
             case "freelancer":
                // Use skillTags directly as they reflect UI state, formData.skills might lag
                if (!skillTags || skillTags.length === 0) errors[`${roleKey}.skills`] = "At least one skill required";
                if (!roleData.experience) errors[`${roleKey}.experience`] = "Experience level required";
                break;
             case "jobseeker":
                if (!roleData.jobTitle) errors[`${roleKey}.jobTitle`] = "Desired job title required";
                if (!skillTags || skillTags.length === 0) errors[`${roleKey}.skills`] = "At least one skill required";
                break;
            default: break;
        }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData, user?.role, skillTags]);

  // --- Submission ---
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setApiError(null); // Clear previous API errors
    if (clearError) clearError(); // Clear auth context errors

    if (!validateForm()) {
      toast.error("Please correct the errors in the form");
      // Find the first error and potentially scroll to it or focus it
      const firstErrorKey = Object.keys(formErrors)[0];
      if (firstErrorKey) {
          const element = document.getElementsByName(firstErrorKey)[0];
          element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          element?.focus();
          // Determine which step the error is on
          // This logic needs refinement based on where fields are located
          // Example: if (firstErrorKey.startsWith('roleDetails')) setCurrentStep(5); else if ...
      }
      return;
    }

    setIsSubmitting(true);
    const loadingToast = toast.loading("Saving your profile...");

    try {
        // Prepare data for submission
        const cleanedSocialLinks = Object.fromEntries(
            Object.entries(formData.socialLinks || {}).filter(([, v]) => v && String(v).trim())
        );

        const addressObject = {
            country: formData.address?.country || "", city: formData.address?.city || "", street: formData.address?.street || "",
        };

        // Use skillTags and interestTags from state for submission accuracy
        const interestsFormatted = interestTags.map(tag => ({ name: tag, strength: 5 })); // Format interests correctly

        // Extract final role details, ensuring it's the object itself, not nested under role name
        let roleDetailsPayload = {};
         if (user?.role && user.role !== 'user' && formData.roleDetails?.[user.role]) {
             roleDetailsPayload = { ...formData.roleDetails[user.role] };
             // Ensure skills in roleDetails match the main skillTags if applicable
             if (['freelancer', 'jobseeker'].includes(user.role)) {
                 roleDetailsPayload.skills = skillTags;
             }
         }

        const userDataPayload = {
            firstName: formData.firstName, lastName: formData.lastName, email: formData.email, phone: formData.phone,
            gender: formData.gender, birthDate: formData.birthDate || null, // Send null if empty
            bio: formData.bio, address: addressObject, openToWork: formData.openToWork, about: formData.about,
            preferredContact: formData.preferredContact,
            skills: skillTags, // Use state variable
            interests: interestsFormatted, // Use formatted state variable
            socialLinks: cleanedSocialLinks,
            companyName: formData.companyName, companyWebsite: formData.companyWebsite,
            companyRole: formData.companyRole, industry: formData.industry,
            // Send roleDetails only if the user has a specific role and data exists
            ...(user?.role && user.role !== 'user' && Object.keys(roleDetailsPayload).length > 0 && { roleDetails: roleDetailsPayload }),
             // Include profilePicture as an object with url property if no new image is being uploaded
            ...(!formData.profileImage && formData.profilePicture && {
                profilePicture: {
                    url: formData.profilePicture,
                    publicId: formData.profilePicture.includes('cloudinary') ? formData.profilePicture.split('/').pop().split('.')[0] : undefined
                }
            }),
        };

        const submissionData = new FormData();
        submissionData.append("userData", JSON.stringify(userDataPayload));

        // Append image file ONLY if it's a File/Blob
        if (formData.profileImage instanceof File || formData.profileImage instanceof Blob) {
            submissionData.append("profileImage", formData.profileImage, `profile-${user._id || 'new'}.jpg`); // Provide a filename
        }

        // Log for debugging
        // console.log("Submitting User Data:", userDataPayload);
        // console.log("Submitting FormData Keys:", Array.from(submissionData.keys()));

        const result = await completeProfile(submissionData); // Call the context function

        if (result?.success) {
            toast.dismiss(loadingToast);
            toast.success("Profile completed successfully!");
            setShowConfetti(true);

            // Redirect after confetti
            setTimeout(() => {
                setShowConfetti(false);
                 router.push(`/user/${user.username}`); // Use dynamic route for navigation
            }, 2500); // Show confetti longer

        } else {
            const errorMessage = result?.message || authError || "Profile update failed. Please try again.";
            toast.dismiss(loadingToast);
            toast.error(errorMessage);
            setApiError(errorMessage); // Store API error for display
            logger.error("Profile completion failed:", errorMessage, result);
        }
    } catch (err) {
        logger.error("Submission error:", err);
        toast.dismiss(loadingToast);
        const errorMessage = err.response?.data?.message || err.message || "An unexpected error occurred.";
        toast.error(`Error: ${errorMessage}`);
        setApiError(errorMessage);
    } finally {
        setIsSubmitting(false);
    }
  };

  // --- Navigation ---
  const handleNext = () => {
      // Optional: Add validation for the current step before proceeding
      // if (!validateStep(currentStep)) {
      //     toast.error("Please fill required fields for this step.");
      //     return;
      // }
      if (currentStep < totalSteps) {
          setCurrentStep(prev => prev + 1);
      }
  };
  const handleBack = () => {
      if (currentStep > 1) {
          setCurrentStep(prev => prev - 1);
      }
  };

  // --- Step Label Logic ---
   const getStepLabel = useCallback((step) => {
      const labels = ["Basic", "Personal", "Professional", "Social"];
      if (totalSteps === 6) {
        labels.push(
          user?.role ? (user.role.charAt(0).toUpperCase() + user.role.slice(1)) : "Role"
        );
        labels.push("Review");
      } else { // totalSteps === 5
         labels.push("Review");
      }
      return labels[step - 1] || `Step ${step}`;
    }, [totalSteps, user?.role]);

  // --- Render Logic ---
  // hasAccessToken is now managed by state to prevent hydration mismatch

  // Show loading state while authentication is in progress or if we have a token but no user yet
  if ((authLoading || (hasAccessToken && !user)) && !loadingTimeout) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <LoaderComponent 
          text={authLoading ? "Loading authentication data..." : "Setting up your profile..."} 
          size="large" 
          color="violet" 
        />
      </div>
    );
  }

  // If timeout occurred or we still don't have user data, show error
  if (loadingTimeout || (!user && !hasAccessToken)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white p-6 text-center">
        <h2 className="text-xl font-semibold text-red-600 mb-4">
          {loadingTimeout ? "Loading Timeout" : "Authentication Error"}
        </h2>
        <p className="text-gray-700 mb-6">
          {loadingTimeout 
            ? "Profile data is taking longer than expected to load. Please try refreshing the page or logging in again."
            : "Could not load user data. You might need to log in again."
          }
        </p>
        <div className="space-x-4">
          <button
            onClick={() => window.location.reload()} 
            className="px-6 py-2 border border-violet-600 text-violet-600 rounded-md hover:bg-violet-50 transition-colors mr-4"
          >
            Refresh Page
          </button>
          <button
            onClick={() => window.location.href = '/auth/login'}
            className="px-6 py-2 bg-violet-600 text-white rounded-md hover:bg-violet-700 transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  // Show loading while role data is being fetched
  if (!roleDataLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <LoaderComponent text="Loading profile data..." size="large" color="violet" />
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-white py-12 pt-6 px-4 sm:px-6 lg:px-8">
      {showConfetti && <SuccessConfetti trigger={true} duration={5000} />}
      <div className="max-w-3xl mx-auto">
        {/* Header Logo/Brand */}
         <div className="flex justify-center mb-10">
          <motion.div className="flex items-center space-x-2" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <div className="w-8 h-8 rounded-md bg-violet-600 flex items-center justify-center"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg></div>
            <span className="text-lg font-medium text-violet-600">ProductBazar</span>
          </motion.div>
        </div>

        {/* Main Card */}
        <motion.div
          className="bg-white rounded-lg overflow-hidden flex flex-col h-[80vh] max-h-[800px] border border-gray-200"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          {/* Card Header */}
          <div className="border-b border-gray-200 flex-shrink-0 px-6 py-5 bg-gradient-to-r from-violet-50 to-white">
            <div className="flex justify-between items-start">
              <div>
                <motion.h2
                  className="text-xl font-semibold text-gray-800 mb-1 flex items-center"
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <span className="w-1.5 h-6 bg-violet-600 rounded-full mr-3"></span>
                  Complete Your Profile
                </motion.h2>
                <motion.p
                  className="text-gray-600 text-sm ml-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                >
                  Step {currentStep} of {totalSteps}: <span className="text-violet-700 font-medium">{getStepLabel(currentStep)}</span>
                </motion.p>
              </div>
            </div>
          </div>

          {/* Skip Profile Banner */}
          <div className="bg-violet-50 border-b border-violet-100 px-6 py-3 flex items-center justify-between">
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-violet-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-sm text-violet-800 font-medium">Profile completion is optional</p>
                <p className="text-xs text-violet-600">You can complete your profile later from settings</p>
              </div>
            </div>
            <motion.button
              onClick={() => {
                skipProfileCompletion();
                toast.success("You can complete your profile later from settings");
                router.push(user.username ? `/user/${user.username}` : "/products");
              }}
              className="flex items-center px-3 py-1.5 text-sm font-medium text-white bg-violet-600 hover:bg-violet-700 rounded-md transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 9l3 3m0 0l-3 3m3-3H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Skip & Continue
            </motion.button>
          </div>

          {/* Scrollable Content Area */}
          <div className="p-6 md:p-8 overflow-y-auto flex-grow">
             <StepIndicator currentStep={currentStep} totalSteps={totalSteps} getStepLabel={getStepLabel} />

             <AnimatePresence mode="wait">
                {(authError || apiError) && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg border border-red-200 shadow-sm"
                  >
                    <div className="flex items-start">
                       <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 mt-0.5 flex-shrink-0 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                         <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                       </svg>
                       <div>
                         <h4 className="font-medium text-red-800 mb-1">Error</h4>
                         <p className="text-sm">{apiError || authError}</p>
                       </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

            {/* Render Active Step Component */}
            <form onSubmit={handleSubmit} noValidate> {/* Use form tag for semantics, handle submit via button */}
                <ProfileBasicsForm
                    isActive={currentStep === 1 || currentStep === 2}
                    currentStep={currentStep}
                    formData={formData}
                    handleChange={handleChange}
                    formErrors={formErrors}
                    user={user}
                    profileImagePreview={profileImagePreview}
                    imageLoading={imageLoading}
                    handleProfileImageChange={handleProfileImageChange}
                    fileInputRef={fileInputRef}
                 />
                <ProfileDetailsForm
                    isActive={currentStep === 3 || currentStep === 4}
                    currentStep={currentStep}
                    formData={formData}
                    handleChange={handleChange}
                    formErrors={formErrors}
                    skillTags={skillTags}
                    interestTags={interestTags}
                    skillInput={skillInput}
                    setSkillInput={setSkillInput}
                    interestInput={interestInput}
                    setInterestInput={setInterestInput}
                    handleTagInput={handleTagInput}
                    removeTag={removeTag}
                    addPredefinedTag={addPredefinedTag}
                    predefinedOptions={predefinedOptions}
                />
                {/* Render role specific only if user has a role and it's step 5 */}
                {user.role !== 'user' && (
                    <RoleSpecificForm
                        isActive={currentStep === 5}
                        user={user}
                        formData={formData}
                        handleChange={handleChange}
                        formErrors={formErrors}
                        handleMultiInputChange={handleMultiInputChange}
                        multiInputValues={multiInputValues}
                        addMultiInputTag={addMultiInputTag}
                        removeMultiInputTag={removeMultiInputTag}
                    />
                )}
                 <ProfileReview
                    isActive={currentStep === totalSteps}
                    formData={formData}
                    user={user}
                    profileImagePreview={profileImagePreview}
                    skillTags={skillTags}
                    interestTags={interestTags}
                />
            </form>
          </div>

          {/* Fixed Footer with Navigation */}
          <div className="border-t border-gray-200 px-6 py-4 flex justify-between items-center flex-shrink-0 bg-white">
             <motion.div
               className="text-xs text-gray-500 flex items-center"
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               transition={{ duration: 0.3, delay: 0.2 }}
             >
               <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                 <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
               </svg>
               {new Date().getFullYear()} © ProductBazar
            </motion.div>
             <motion.div
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               transition={{ duration: 0.3, delay: 0.3 }}
               className="flex items-center space-x-3"
             >
               {/* Skip button - more prominent position */}
               <motion.button
                 onClick={() => {
                   // Skip profile completion using the context function
                   skipProfileCompletion();
                   toast.success("You can complete your profile later from settings");
                   router.push(user.username ? `/user/${user.username}` : "/products");
                 }}
                 className="flex items-center px-4 py-2 text-sm font-medium text-gray-600 hover:text-violet-700 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
                 whileHover={{ scale: 1.02 }}
                 whileTap={{ scale: 0.98 }}
               >
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                   <path strokeLinecap="round" strokeLinejoin="round" d="M13 9l3 3m0 0l-3 3m3-3H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                 </svg>
                 Skip for now
               </motion.button>
               <NavigationButtons
                  currentStep={currentStep}
                  totalSteps={totalSteps}
                  onBack={handleBack}
                  onNext={handleNext}
                  onSubmit={handleSubmit}
                  isSubmitting={isSubmitting}
               />
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default CompleteProfileContainer;