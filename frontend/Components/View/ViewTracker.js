import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/contexts/auth-context";
import { useRecommendation } from "@/lib/contexts/recommendation-context";
import { useView } from "@/lib/contexts/view-context";

const ViewTracker = ({
  productId,
  source = "direct",
  position = null,
  recommendationType = null,
  minimumViewTime = 2000, // 2 seconds
  visibilityThreshold = 0.5, // 50% visible
  elementSelector = null, // Optional custom selector
}) => {
  const { user } = useAuth();
  const { recordInteraction } = useRecommendation();
  const { trackProductView, updateViewDuration } = useView();
  const router = useRouter();
  const timerRef = useRef(null);
  const viewStartTimeRef = useRef(null);
  const hasTrackedRef = useRef(false);
  const observerRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);
  const [scrollDepth, setScrollDepth] = useState(0);

  // Check if view was already tracked in this session with improved deduplication
  const isViewTracked = () => {
    if (typeof window === "undefined") return true;

    try {
      // Use a more specific key that includes the page URL to prevent tracking across different pages
      const viewKey = `view-${productId}-${source}-${typeof window !== "undefined" ? window.location.pathname : ""}`;
      const lastView = sessionStorage.getItem(viewKey);
      const SESSION_TTL = 30 * 60 * 1000; // 30 minutes - increased to reduce duplicate views

      return lastView && Date.now() - parseInt(lastView) < SESSION_TTL;
    } catch (error) {
      console.warn('Error checking view tracking status:', error);
      return false; // Default to not tracked if there's an error
    }
  };

  // Calculate scroll depth
  const calculateScrollDepth = () => {
    if (typeof window === "undefined") return 0;

    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const windowHeight = window.innerHeight;
    const docHeight = Math.max(
      document.body.scrollHeight,
      document.documentElement.scrollHeight,
      document.body.offsetHeight,
      document.documentElement.offsetHeight
    );

    const totalScrollableDistance = docHeight - windowHeight;
    if (totalScrollableDistance <= 0) return 100; // No scroll needed

    const scrollPercentage = Math.min(100, Math.round((scrollTop / totalScrollableDistance) * 100));
    return scrollPercentage;
  };

  // Record the view interaction with enhanced deduplication and error handling
  const recordView = async () => {
    if (!productId || hasTrackedRef.current) return;

    // Generate a unique tracking ID for debugging
    const trackingId = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    console.log(`Starting view tracking (${trackingId}) for product ${productId}`);

    try {
      // Create a more specific view key that includes the page URL
      const viewKey = `view-${productId}-${source}-${typeof window !== "undefined" ? window.location.pathname : ""}`;

      // Double-check if view was already tracked in this session
      if (isViewTracked()) {
        console.log(`View for product ${productId} already tracked in this session (${viewKey}), skipping`);
        hasTrackedRef.current = true;
        return;
      }

      // Set hasTrackedRef immediately to prevent duplicate calls during async operation
      hasTrackedRef.current = true;

      // Mark as tracked in session storage BEFORE API calls to prevent duplicates
      // if component re-renders during the async operation
      try {
        sessionStorage.setItem(viewKey, Date.now().toString());
      } catch (storageError) {
        console.warn("Session storage error:", storageError);
        // Continue even if storage fails
      }
    } catch (error) {
      console.error(`Error in view tracking setup (${trackingId}):`, error);
      // Continue with tracking attempt even if there's an error in the setup
    }

    try {
      // Generate a unique request ID for this specific tracking attempt
      const requestId = `view-req-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      console.log(`Preparing view tracking request (${requestId}) for product ${productId}`);

      const currentScrollDepth = calculateScrollDepth();
      setScrollDepth(currentScrollDepth);

      // Get or generate a client ID for anonymous tracking
      let clientId;
      try {
        clientId = typeof window !== "undefined" ?
          localStorage.getItem('clientId') ||
          `client-${Date.now()}-${Math.random().toString(36).substring(2, 9)}` : null;

        // Store clientId for future use if it doesn't exist
        if (typeof window !== "undefined" && !localStorage.getItem('clientId') && clientId) {
          localStorage.setItem('clientId', clientId);
        }
      } catch (storageError) {
        console.warn("Client ID storage error:", storageError);
        // Generate a temporary client ID if storage fails
        clientId = `temp-client-${Date.now()}`;
      }

      const viewData = {
        type: 'view', // Explicitly set interaction type
        source,
        position,
        recommendationType,
        userId: user?._id,
        referrer: document.referrer || router.asPath,
        url: window.location.href,
        scrollDepth: currentScrollDepth,
        clientId,
        requestId, // Include request ID for debugging
        metadata: {
          source,
          position,
          recommendationType,
          url: window.location.href,
          scrollDepth: currentScrollDepth,
          timestamp: Date.now(), // Add timestamp for better tracking
          requestId // Include request ID in metadata too
        }
      };

      // Use a single Promise.all instead of Promise.allSettled for better performance
      // Only make API calls if the functions exist
      const promises = [];

      if (trackProductView) {
        console.log(`Adding trackProductView to promises (${requestId})`);
        promises.push(trackProductView(productId, viewData));
      }

      if (recordInteraction) {
        console.log(`Adding recordInteraction to promises (${requestId})`);
        promises.push(recordInteraction(productId, 'view', viewData.metadata));
      }

      // Only make the API call if we have promises to execute
      if (promises.length > 0) {
        // Use Promise.all with a timeout to prevent hanging
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error(`View tracking timed out (${requestId})`)), 8000) // Increased timeout to 8 seconds
        );

        console.log(`Executing ${promises.length} tracking promises (${requestId})`);
        try {
          const results = await Promise.race([
            Promise.all(promises),
            timeoutPromise
          ]);
          console.log(`View tracking completed successfully for product ${productId} (${requestId})`);
        } catch (promiseError) {
          console.error(`View tracking promise error (${requestId}):`, promiseError);
          // Don't throw - we want to continue even if tracking fails
        }
      } else {
        console.log(`No tracking functions available for product ${productId} (${requestId})`);
      }
    } catch (error) {
      console.error("View tracking error:", error);
      // Don't remove from session storage on error - this prevents retry attempts
      // that could lead to duplicate views
    }
  };

  // Cleanup resources
  const cleanup = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (observerRef.current) observerRef.current.disconnect();

    // Remove scroll listener if it was added
    if (typeof window !== "undefined") {
      window.removeEventListener('scroll', handleScroll);
    }
  };

  // Handle scroll events to track max scroll depth
  const handleScroll = () => {
    if (!viewStartTimeRef.current || !isVisible) return;

    const currentScrollDepth = calculateScrollDepth();
    if (currentScrollDepth > scrollDepth) {
      setScrollDepth(currentScrollDepth);
    }
  };

  useEffect(() => {
    // Skip if no productId, not in browser, or already tracked
    if (!productId || typeof window === "undefined") {
      return cleanup;
    }

    // Generate a unique tracking session ID for debugging
    const trackingId = `${productId}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    console.log(`Setting up view tracking for product: ${productId} (ID: ${trackingId})`);

    // Check for existing tracking before setting up
    try {
      if (isViewTracked()) {
        console.log(`View for product ${productId} already tracked in this session, skipping setup (ID: ${trackingId})`);
        hasTrackedRef.current = true;
        return cleanup;
      }
    } catch (trackingError) {
      console.error(`Error checking tracking status (ID: ${trackingId}):`, trackingError);
      // Continue with setup even if tracking check fails
    }

    // Find the element to track - either by data attribute or custom selector
    let targetElement;
    try {
      const selector = elementSelector || `[data-product-id="${productId}"]`;
      const element = document.querySelector(selector);

      // If no element found, try to use the main content area or body as fallback
      targetElement = element || document.querySelector('main') || document.body;

      if (!targetElement) {
        console.warn(`ViewTracker: No element found for tracking with selector ${selector} (ID: ${trackingId})`);
        // Use document.body as a last resort
        targetElement = document.body;
      }
    } catch (selectorError) {
      console.error(`Error finding target element (ID: ${trackingId}):`, selectorError);
      // Use document.body as a fallback
      targetElement = document.body;
    }

    // Add scroll listener for tracking scroll depth
    window.addEventListener('scroll', handleScroll, { passive: true });

    const handleVisibilityChange = (entries) => {
      try {
        entries.forEach((entry) => {
          setIsVisible(entry.isIntersecting);

          if (entry.isIntersecting && !hasTrackedRef.current) {
            viewStartTimeRef.current = Date.now();

            // Start timer only if element remains visible
            if (timerRef.current) {
              clearTimeout(timerRef.current); // Clear any existing timer
            }

            console.log(`Element visible, starting view timer (ID: ${trackingId})`);
            timerRef.current = setTimeout(() => {
              try {
                recordView();
              } catch (viewError) {
                console.error(`Error in recordView (ID: ${trackingId}):`, viewError);
              }
            }, minimumViewTime);
          } else {
            // Clear timer if element becomes not visible
            if (timerRef.current) {
              clearTimeout(timerRef.current);
              timerRef.current = null;
              console.log(`Element no longer visible, cleared timer (ID: ${trackingId})`);
            }
          }
        });
      } catch (visibilityError) {
        console.error(`Error in visibility change handler (ID: ${trackingId}):`, visibilityError);
      }
    };

    // Setup Intersection Observer with error handling
    try {
      observerRef.current = new IntersectionObserver(handleVisibilityChange, {
        threshold: visibilityThreshold,
        rootMargin: "0px 0px -100px 0px", // Ignore bottom 100px (footer)
      });

      observerRef.current.observe(targetElement);
      console.log(`Intersection Observer set up successfully (ID: ${trackingId})`);
    } catch (observerError) {
      console.error(`Error setting up Intersection Observer (ID: ${trackingId}):`, observerError);
      // Fallback to a simple timeout-based approach if IntersectionObserver fails
      console.log(`Using fallback timer for view tracking (ID: ${trackingId})`);
      timerRef.current = setTimeout(() => {
        try {
          recordView();
        } catch (fallbackError) {
          console.error(`Error in fallback view tracking (ID: ${trackingId}):`, fallbackError);
        }
      }, minimumViewTime * 1.5); // Use a slightly longer time for the fallback
    }

    // Record view duration on unmount
    return () => {
      console.log(`Cleaning up view tracking for product: ${productId} (ID: ${trackingId})`);

      try {
        // Call the cleanup function to remove event listeners and observers
        cleanup();

        // Record view duration if we have a start time and the view was tracked
        if (viewStartTimeRef.current && hasTrackedRef.current) {
          const viewDuration = Date.now() - viewStartTimeRef.current;
          if (viewDuration >= minimumViewTime) {
            console.log(`Recording view duration of ${Math.round(viewDuration/1000)}s for product: ${productId} (ID: ${trackingId})`);
            try {
              updateViewDuration(
                productId,
                viewStartTimeRef.current,
                {
                  scrollDepth,
                  exitPage: router.asPath
                }
              ).catch(durationError => {
                console.error(`Error updating view duration (ID: ${trackingId}):`, durationError);
                // Silent fail - this happens during page unload
              });
            } catch (durationError) {
              console.error(`Error updating view duration (ID: ${trackingId}):`, durationError);
              // Silent fail - this happens during page unload
            }
          } else {
            console.log(`View duration too short (${Math.round(viewDuration/1000)}s), not recording (ID: ${trackingId})`);
          }
        }
      } catch (cleanupError) {
        console.error(`Error during cleanup (ID: ${trackingId}):`, cleanupError);
        // Silent fail - we're already in cleanup
      }
    };
    // Only re-run this effect if these core props change
    // Using a stable dependency array to prevent unnecessary re-renders
  }, [productId, source, elementSelector, minimumViewTime, visibilityThreshold]);

  return null;
};

export default ViewTracker;
