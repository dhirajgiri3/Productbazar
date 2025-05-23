import { useEffect } from 'react';

// /Users/dhirajgiri/Desktop/ProductBazar/pb/frontend/Hooks/useOnClickOutside.js


/**
 * Custom hook that handles click events outside of a specified element.
 * @param {React.RefObject} ref - The React ref object pointing to the element to monitor.
 * @param {Function} handler - The callback function to execute when a click outside occurs.
 */
export const useOnClickOutside = (ref, handler) => {
    useEffect(() => {
        // Return early if ref or handler isn't provided
        if (!ref || !handler) return;
        
        const listener = (event) => {
            // Do nothing if the ref doesn't point to an element yet
            // or if the click was inside the referenced element
            if (!ref.current || ref.current.contains(event.target)) {
                return;
            }
            
            // Otherwise, call the handler
            handler(event);
        };
        
        // Add event listeners
        document.addEventListener('mousedown', listener);
        document.addEventListener('touchstart', listener);
        
        // Clean up the event listeners on unmount
        return () => {
            document.removeEventListener('mousedown', listener);
            document.removeEventListener('touchstart', listener);
        };
    }, [ref, handler]); // Re-run effect if ref or handler changes
};