"use client";

/**
 * Utility functions to handle hydration issues with browser extensions
 * that might inject attributes into the DOM during runtime
 */

/**
 * This function removes known problematic attributes added by browser extensions
 * such as Bitdefender's bis_skin_checked attribute which causes React hydration errors
 */
export const removeExtensionAttributes = () => {
  if (typeof window === 'undefined') return;
  
  // Run after a small delay to ensure DOM is fully loaded
  setTimeout(() => {
    try {
      // Find all divs and remove bis_skin_checked attributes
      const elements = document.querySelectorAll('[bis_skin_checked]');
      elements.forEach(el => {
        el.removeAttribute('bis_skin_checked');
      });
      
      // You can add more problematic attributes here as they are discovered
    } catch (error) {
      console.error('Error removing extension attributes:', error);
    }
  }, 0);
};

/**
 * MutationObserver to continuously clean up attributes 
 * added by browser extensions that cause hydration issues
 */
export const setupExtensionAttributeCleaner = () => {
  if (typeof window === 'undefined' || typeof MutationObserver === 'undefined') return;
  
  try {
    // Create mutation observer to watch for added bis_skin_checked attributes
    const observer = new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'bis_skin_checked') {
          mutation.target.removeAttribute('bis_skin_checked');
        }
      });
    });
    
    // Start observing the document with the configured parameters
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['bis_skin_checked'],
      subtree: true
    });
    
    return observer; // Return the observer in case it needs to be disconnected later
  } catch (error) {
    console.error('Error setting up extension attribute cleaner:', error);
    return null;
  }
};

export default {
  removeExtensionAttributes,
  setupExtensionAttributeCleaner
};
