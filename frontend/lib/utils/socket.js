import { io } from 'socket.io-client';
import { getAuthToken } from './auth/auth-utils.js';

let socket;

// Track subscriptions to prevent duplicates
const productSubscriptions = new Set();

// Track subscription reference counts to handle multiple components subscribing to the same product
const subscriptionRefCounts = new Map();

// Debounce socket events to prevent excessive logging and processing

// Debug mode flag - set to false in production
const DEBUG = process.env.NODE_ENV === 'development';

/**
 * Initialize socket connection
 * @returns {Object|null} - Socket instance or null if initialization failed
 */
export const initializeSocket = () => {
  const token = getAuthToken();

  if (!token) {
    if (DEBUG) console.warn('Cannot initialize socket: No authentication token');
    return null;
  }

  // Disconnect existing socket if any
  if (socket) {
    try {
      socket.disconnect();
      if (DEBUG) console.log('Disconnected existing socket connection');
    } catch (err) {
      console.error('Error disconnecting existing socket:', err);
    }
  }

  // Use the correct environment variable for Next.js
  const socketUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5004';
  // Remove /api/v1 from the URL if it exists
  const baseUrl = socketUrl.replace(/\/api\/v1$/, '');

  if (DEBUG) console.log(`Initializing socket connection to ${baseUrl}`);

  // Clear subscriptions when creating a new socket
  productSubscriptions.clear();

  try {
    // Initialize socket connection with improved options
    socket = io(baseUrl, {
      auth: { token },
      withCredentials: true,
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      autoConnect: true
    });

    // Set up basic event handlers
    socket.on('connect', () => {
      if (DEBUG) console.log(`Socket connected with ID: ${socket.id}`);

      // Resubscribe to all products after reconnection
      if (productSubscriptions.size > 0) {
        if (DEBUG) console.log(`Resubscribing to ${productSubscriptions.size} products after connection`);
        productSubscriptions.forEach(productId => {
          socket.emit('subscribe:product', productId);
        });
      }
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error?.message || 'Unknown error');
    });

    socket.on('error', (error) => {
      console.error('Socket error:', error?.message || 'Unknown error');
    });

    socket.on('disconnect', (reason) => {
      if (DEBUG) console.log(`Socket disconnected: ${reason}`);
    });

    socket.on('reconnect', (attemptNumber) => {
      if (DEBUG) console.log(`Socket reconnected after ${attemptNumber} attempts`);

      // Resubscribe to all products after reconnection
      if (productSubscriptions.size > 0) {
        if (DEBUG) console.log(`Resubscribing to ${productSubscriptions.size} products after reconnection`);
        productSubscriptions.forEach(productId => {
          socket.emit('subscribe:product', productId);
        });
      }
    });

    // Reduce logging for reconnection attempts
    if (DEBUG) {
      socket.on('reconnect_attempt', (attemptNumber) => {
        console.log(`Socket reconnection attempt ${attemptNumber}`);
      });

      socket.on('reconnect_error', (error) => {
        console.error('Socket reconnection error:', error?.message || 'Unknown error');
      });

      socket.on('reconnect_failed', () => {
        console.error('Socket reconnection failed after all attempts');
      });
    }

    // Listen for direct product update events
    socket.on('product:*:update', (data) => {
      if (!data || !data.productId) return;
      if (DEBUG) console.log(`Received direct product update for ${data.productId}`);
    });

    // Make socket available globally for all components that need direct access
    if (typeof window !== 'undefined') {
      window.socket = socket;
    }

    return socket;
  } catch (err) {
    console.error('Error initializing socket:', err);
    return null;
  }
};

/**
 * Get the current socket instance
 * @returns {Object|undefined} - Socket instance or undefined if not initialized
 */
export const getSocket = () => socket;

/**
 * Subscribe to product updates with reference counting
 * @param {string} productId - Product ID to subscribe to
 * @returns {function} - Unsubscribe function
 */
export const subscribeToProduct = (productId) => {
  if (!productId) return () => {};

  if (!socket) {
    if (DEBUG) console.error(`Cannot subscribe to product ${productId}: Socket not initialized`);
    return () => {};
  }

  // Increment reference count
  const currentCount = subscriptionRefCounts.get(productId) || 0;
  subscriptionRefCounts.set(productId, currentCount + 1);

  // If this is not the first subscription, just return the unsubscribe function
  if (currentCount > 0) {
    if (DEBUG && currentCount === 1) console.log(`Additional subscription to product ${productId}, ref count: ${currentCount + 1}`);

    return () => {
      const count = subscriptionRefCounts.get(productId) || 0;
      if (count <= 1) {
        unsubscribeFromProduct(productId);
        subscriptionRefCounts.delete(productId);
      } else {
        subscriptionRefCounts.set(productId, count - 1);
      }
    };
  }

  if (!socket.connected) {
    if (DEBUG) console.warn(`Socket not connected, will subscribe to product ${productId} when connected`);

    // Set up a one-time connection handler to subscribe when connected
    socket.once('connect', () => {
      if (DEBUG) console.log(`Socket connected, now subscribing to product ${productId}`);
      if (subscriptionRefCounts.get(productId) > 0) {
        socket.emit('subscribe:product', productId);
        productSubscriptions.add(productId);
      }
    });

    // Still add to our tracking set so it will be resubscribed on reconnection
    productSubscriptions.add(productId);

    return () => {
      const count = subscriptionRefCounts.get(productId) || 0;
      if (count <= 1) {
        unsubscribeFromProduct(productId);
        subscriptionRefCounts.delete(productId);
      } else {
        subscriptionRefCounts.set(productId, count - 1);
      }
    };
  }

  try {
    // Only emit if not already subscribed
    if (!productSubscriptions.has(productId)) {
      socket.emit('subscribe:product', productId);
      productSubscriptions.add(productId);
      if (DEBUG) console.log(`Subscribed to product ${productId}`);
    }

    // Return unsubscribe function
    return () => {
      const count = subscriptionRefCounts.get(productId) || 0;
      if (count <= 1) {
        unsubscribeFromProduct(productId);
        subscriptionRefCounts.delete(productId);
      } else {
        subscriptionRefCounts.set(productId, count - 1);
      }
    };
  } catch (err) {
    console.error(`Error subscribing to product ${productId}:`, err);
    return () => {};
  }
};

/**
 * Unsubscribe from product updates
 * @param {string} productId - Product ID to unsubscribe from
 * @returns {boolean} - Whether the unsubscription was successful
 */
export const unsubscribeFromProduct = (productId) => {
  if (!socket) {
    if (DEBUG) console.warn(`Cannot unsubscribe from product ${productId}: Socket not initialized`);
    return false;
  }

  if (!socket.connected) {
    if (DEBUG) console.warn(`Socket not connected, cannot unsubscribe from product ${productId}`);
    // Still remove from our local tracking
    productSubscriptions.delete(productId);
    return false;
  }

  // Only unsubscribe if we have this product in our subscriptions
  if (!productSubscriptions.has(productId)) {
    return false;
  }

  try {
    socket.emit('unsubscribe:product', productId);
    productSubscriptions.delete(productId);
    if (DEBUG) console.log(`Unsubscribed from product ${productId}`);
    return true;
  } catch (err) {
    console.error(`Error unsubscribing from product ${productId}:`, err);
    // Still remove from our local tracking
    productSubscriptions.delete(productId);
    return false;
  }
};

/**
 * Get the socket connection status
 * @returns {Object} - Socket connection status
 */
export const getSocketStatus = () => {
  if (!socket) {
    return { connected: false, id: null };
  }

  return {
    connected: socket.connected,
    id: socket.id,
    transport: socket.io?.engine?.transport?.name || 'unknown'
  };
};

/**
 * Force a reconnection to the socket server
 * @returns {boolean} - Whether the reconnection was initiated
 */
export const forceReconnect = () => {
  if (!socket) {
    console.warn('Cannot force reconnect: Socket not initialized');
    return false;
  }

  try {
    // Store current subscriptions
    const currentSubscriptions = [...productSubscriptions];

    // Clear subscriptions on reconnect
    productSubscriptions.clear();

    // Disconnect and reconnect
    console.log('Forcing socket reconnection...');
    socket.disconnect();

    // Wait a bit before reconnecting
    setTimeout(() => {
      socket.connect();

      // Wait for connection to be established
      socket.once('connect', () => {
        console.log('Socket reconnected, resubscribing to products...');

        // Resubscribe to all products
        currentSubscriptions.forEach(productId => {
          subscribeToProduct(productId);
        });
      });
    }, 1000);

    return true;
  } catch (err) {
    console.error('Error forcing socket reconnection:', err);
    return false;
  }
};