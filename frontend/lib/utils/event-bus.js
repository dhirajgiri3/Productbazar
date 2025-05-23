/**
 * Simple event bus for cross-component communication
 * This helps with real-time updates across different parts of the application
 */

class EventBus {
  constructor() {
    this.events = {};
  }

  /**
   * Subscribe to an event
   * @param {string} event - Event name
   * @param {function} callback - Callback function
   * @returns {function} - Unsubscribe function
   */
  subscribe(event, callback) {
    if (!this.events[event]) {
      this.events[event] = [];
    }

    this.events[event].push(callback);

    // Return unsubscribe function
    return () => {
      this.events[event] = this.events[event].filter(cb => cb !== callback);
    };
  }

  /**
   * Publish an event
   * @param {string} event - Event name
   * @param {any} data - Event data
   */
  publish(event, data) {
    if (!this.events[event]) return;

    this.events[event].forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in event handler for ${event}:`, error);
      }
    });
  }

  /**
   * Clear all event handlers
   */
  clear() {
    this.events = {};
  }
}

// Create a singleton instance
const eventBus = new EventBus();

// Define standard event types
export const EVENT_TYPES = {
  PRODUCT_UPDATED: 'product:updated',
  PRODUCT_DELETED: 'product:deleted',
  UPVOTE_UPDATED: 'upvote:updated',
  BOOKMARK_UPDATED: 'bookmark:updated',
  VIEW_UPDATED: 'view:updated',
  VIEW_DURATION_UPDATED: 'view:duration:updated',
  VIEW_ANALYTICS_UPDATED: 'view:analytics:updated',
  SOCKET_CONNECTED: 'socket:connected',
  SOCKET_DISCONNECTED: 'socket:disconnected',
  SWITCH_MODAL_TAB: 'modal:switch_tab',
};

export default eventBus;
