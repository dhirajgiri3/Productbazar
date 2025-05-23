"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { initializeSocket, getSocket, subscribeToProduct, unsubscribeFromProduct } from "../utils/socket";
import { useAuth } from "./auth-context";
import { useProduct } from "./product-context";
import logger from "../utils/logger";
import { getSlugFromId, hasProductId } from "../utils/product/product-mapping-utils";
import eventBus, { EVENT_TYPES } from "../utils/event-bus";

// Create context
const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const { updateProductInCache } = useProduct();
  const [isConnected, setIsConnected] = useState(false);
  const [socketId, setSocketId] = useState(null);
  const subscribedProducts = useRef(new Set());
  const socket = useRef(null);
  const updateTimestamps = useRef({});  // Track last update times to prevent duplicate updates

  // Initialize socket connection
  useEffect(() => {
    if (isAuthenticated) {
      // Initialize socket connection
      socket.current = initializeSocket();

      if (socket.current) {
        // Set up connection event handlers
        socket.current.on('connect', () => {
          setIsConnected(true);
          setSocketId(socket.current.id);
          logger.debug(`Socket connected with ID: ${socket.current.id}`);

          // Broadcast socket connection event
          eventBus.publish(EVENT_TYPES.SOCKET_CONNECTED, { socketId: socket.current.id });

          // Resubscribe to all products after reconnection
          if (subscribedProducts.current.size > 0) {
            logger.debug(`Resubscribing to ${subscribedProducts.current.size} products`);
            subscribedProducts.current.forEach(productId => {
              subscribeToProduct(productId);
            });
          }
        });

        socket.current.on('disconnect', () => {
          setIsConnected(false);
          setSocketId(null);
          logger.debug('Socket disconnected');

          // Broadcast socket disconnection event
          eventBus.publish(EVENT_TYPES.SOCKET_DISCONNECTED, { timestamp: Date.now() });
        });

        // Set up product event handlers
        setupProductEventHandlers();
      }
    } else {
      // Disconnect socket if user is not authenticated
      if (socket.current) {
        socket.current.disconnect();
        socket.current = null;
        setIsConnected(false);
        setSocketId(null);
      }
    }

    // Cleanup on unmount
    return () => {
      if (socket.current) {
        socket.current.disconnect();
        socket.current = null;
      }
    };
  }, [isAuthenticated]);

  // Set up product event handlers
  const setupProductEventHandlers = useCallback(() => {
    if (!socket.current) {
      logger.error('Cannot set up product event handlers: socket is not initialized');
      return;
    }

    // Remove any existing listeners to prevent duplicates
    socket.current.off('product:view:update');
    socket.current.off('product:upvote');
    socket.current.off('product:bookmark');
    socket.current.off('product:*:update');

    // Handle view events
    socket.current.on('product:view:update', (data) => {
      logger.debug(`Received view update event for product ${data.productId}`, data);

      // Broadcast view update event to all components
      eventBus.publish(EVENT_TYPES.VIEW_UPDATED, {
        productId: data.productId,
        count: data.count,
        unique: data.unique,
        viewDuration: data.viewDuration,
        scrollDepth: data.scrollDepth,
        viewType: data.viewType,
        timestamp: data.timestamp || Date.now()
      });
    });

    // Handle upvote events
    socket.current.on('product:upvote', (data) => {
      logger.info(`Received upvote event for product ${data.productId}`, data);

      // Update product in cache
      if (data.productId && data.count !== undefined) {
        // Get the current user ID from localStorage
        let currentUserId = localStorage.getItem('userId');

        // If userId is not directly available, try to get it from auth data
        if (!currentUserId) {
          try {
            const authData = localStorage.getItem('auth');
            if (authData) {
              const parsedAuth = JSON.parse(authData);
              currentUserId = parsedAuth?.user?._id;
            }
          } catch (e) {
            logger.error('Error getting current user ID:', e);
          }
        }

        // Check if the event includes user information
        const isCurrentUserAction = data.userId === currentUserId;

        // Find product by ID in cache and update it
        updateProductBySocketEvent(data.productId, {
          upvoteCount: data.count,
          upvotes: {
            count: data.count,
            // Only update userHasUpvoted if this is the current user's action
            ...(isCurrentUserAction && { userHasUpvoted: data.action === 'add' })
          },
          // Also update top-level upvoted property if this is the current user's action
          ...(isCurrentUserAction && { upvoted: data.action === 'add' }),
          // Update userInteractions if this is the current user's action
          ...(isCurrentUserAction && {
            userInteractions: {
              hasUpvoted: data.action === 'add'
            }
          })
        });

        // Broadcast upvote update event to all components
        const slug = getSlugFromId(data.productId);
        logger.info(`Broadcasting upvote event for product ${data.productId} (slug: ${slug})`, {
          count: data.count,
          action: data.action,
          isCurrentUserAction
        });

        // Broadcast to both specific product ID and general upvote events
        eventBus.publish(EVENT_TYPES.UPVOTE_UPDATED, {
          productId: data.productId,
          slug: slug,
          count: data.count,
          // Include user interaction state in the event
          ...(isCurrentUserAction && { upvoted: data.action === 'add' }),
          userId: data.userId,
          action: data.action,
          timestamp: Date.now()
        });

        // Also broadcast as a general product update
        eventBus.publish(EVENT_TYPES.PRODUCT_UPDATED, {
          productId: data.productId,
          slug: slug,
          updates: {
            upvoteCount: data.count,
            upvotes: { count: data.count },
            ...(isCurrentUserAction && { upvoted: data.action === 'add' })
          },
          source: 'socket',
          timestamp: Date.now()
        });
      }
    });

    // Handle bookmark events
    socket.current.on('product:bookmark', (data) => {
      logger.info(`Received bookmark event for product ${data.productId}`, data);

      // Update product in cache
      if (data.productId && data.count !== undefined) {
        // Get the current user ID from localStorage
        let currentUserId = localStorage.getItem('userId');

        // If userId is not directly available, try to get it from auth data
        if (!currentUserId) {
          try {
            const authData = localStorage.getItem('auth');
            if (authData) {
              const parsedAuth = JSON.parse(authData);
              currentUserId = parsedAuth?.user?._id;
            }
          } catch (e) {
            logger.error('Error getting current user ID:', e);
          }
        }

        // Check if the event includes user information
        const isCurrentUserAction = data.userId === currentUserId;

        // Find product by ID in cache and update it
        updateProductBySocketEvent(data.productId, {
          bookmarkCount: data.count,
          bookmarks: {
            count: data.count,
            // Only update userHasBookmarked if this is the current user's action
            ...(isCurrentUserAction && { userHasBookmarked: data.action === 'add' })
          },
          // Also update top-level bookmarked property if this is the current user's action
          ...(isCurrentUserAction && { bookmarked: data.action === 'add' }),
          // Update userInteractions if this is the current user's action
          ...(isCurrentUserAction && {
            userInteractions: {
              hasBookmarked: data.action === 'add'
            }
          })
        });

        // Broadcast bookmark update event to all components
        const slug = getSlugFromId(data.productId);
        logger.info(`Broadcasting bookmark event for product ${data.productId} (slug: ${slug})`, {
          count: data.count,
          action: data.action,
          isCurrentUserAction
        });

        // Broadcast to both specific product ID and general bookmark events
        eventBus.publish(EVENT_TYPES.BOOKMARK_UPDATED, {
          productId: data.productId,
          slug: slug,
          count: data.count,
          // Include user interaction state in the event
          ...(isCurrentUserAction && { bookmarked: data.action === 'add' }),
          userId: data.userId,
          action: data.action,
          timestamp: Date.now()
        });

        // Also broadcast as a general product update
        eventBus.publish(EVENT_TYPES.PRODUCT_UPDATED, {
          productId: data.productId,
          slug: slug,
          updates: {
            bookmarkCount: data.count,
            bookmarks: { count: data.count },
            ...(isCurrentUserAction && { bookmarked: data.action === 'add' })
          },
          source: 'socket',
          timestamp: Date.now()
        });
      }
    });

    // Handle direct product update events
    socket.current.on('product:*:update', (data) => {
      if (!data || !data.productId) return;

      logger.info(`Received direct product update for ${data.productId}`, data);

      // Update the product in cache with the received data
      updateProductBySocketEvent(data.productId, data);

      // Also broadcast as a general product update
      const slug = getSlugFromId(data.productId);
      eventBus.publish(EVENT_TYPES.PRODUCT_UPDATED, {
        productId: data.productId,
        slug: slug,
        updates: data,
        source: 'socket',
        timestamp: Date.now()
      });
    });
  }, []);

  // Update product in cache based on socket event - with debouncing
  const updateProductBySocketEvent = useCallback((productId, updates) => {
    if (!productId || !updates) return;

    // Create a unique key for this update to prevent duplicate updates
    // Only use essential fields for the key to avoid unnecessary duplicates
    const essentialUpdates = {};
    if (updates.upvoteCount !== undefined) essentialUpdates.upvoteCount = updates.upvoteCount;
    if (updates.bookmarkCount !== undefined) essentialUpdates.bookmarkCount = updates.bookmarkCount;
    if (updates.upvoted !== undefined) essentialUpdates.upvoted = updates.upvoted;
    if (updates.bookmarked !== undefined) essentialUpdates.bookmarked = updates.bookmarked;

    const updateKey = `${productId}_${JSON.stringify(essentialUpdates)}`;

    // Check if we've processed this exact update recently
    const lastUpdateTime = updateTimestamps.current[updateKey] || 0;
    const now = Date.now();

    // If we've processed this exact update in the last 300ms, skip it
    if (now - lastUpdateTime < 300) {
      return;
    }

    // Record this update timestamp
    updateTimestamps.current[updateKey] = now;

    // Clean up old timestamps periodically
    setTimeout(() => {
      delete updateTimestamps.current[updateKey];
    }, 5000);

    // Use the ProductContext to update the product in cache
    if (updateProductInCache) {
      // Check if we have this product ID in our mapping
      if (hasProductId(productId)) {
        // Get the slug from the ID
        const slug = getSlugFromId(productId);
        if (slug) {
          // Update the product in cache using the slug
          logger.info(`Using slug ${slug} to update product ${productId}`);
          updateProductInCache(slug, updates);

          // Also publish a product updated event to ensure all components are notified
          eventBus.publish(EVENT_TYPES.PRODUCT_UPDATED, {
            productId,
            slug,
            updates,
            source: 'socket',
            timestamp: Date.now()
          });
        } else {
          // Fallback to using the ID directly
          logger.info(`No slug found for ${productId}, using ID directly`);
          updateProductInCache(productId, updates);

          // Also publish a product updated event with ID only
          eventBus.publish(EVENT_TYPES.PRODUCT_UPDATED, {
            productId,
            updates,
            source: 'socket',
            timestamp: Date.now()
          });
        }
      } else {
        // If we don't have the ID in our mapping, try to update by ID directly
        logger.info(`Product ID ${productId} not in mapping, using ID directly`);
        updateProductInCache(productId, updates);

        // Also publish a product updated event with ID only
        eventBus.publish(EVENT_TYPES.PRODUCT_UPDATED, {
          productId,
          updates,
          source: 'socket',
          timestamp: Date.now()
        });
      }
    } else {
      logger.error(`Cannot update product ${productId}: updateProductInCache is not available`);

      // Even if we can't update the cache, still publish the event
      // so components can react to it
      eventBus.publish(EVENT_TYPES.PRODUCT_UPDATED, {
        productId,
        updates,
        source: 'socket',
        timestamp: Date.now()
      });
    }
  }, [updateProductInCache]);

  // Reference counter for product subscriptions to handle multiple components subscribing to the same product
  const subscriptionCounts = useRef({});

  // Subscribe to product updates with deduplication and reference counting
  // This is a stable function that doesn't depend on isConnected to prevent unnecessary re-renders
  const subscribeToProductUpdates = useCallback((productId) => {
    if (!productId) return () => {};

    // Initialize or increment the reference count
    subscriptionCounts.current[productId] = (subscriptionCounts.current[productId] || 0) + 1;

    // Check if already subscribed to avoid duplicate subscriptions
    if (subscribedProducts.current.has(productId)) {
      // Return an unsubscribe function that decrements the reference count
      return () => {
        // Decrement reference count
        if (subscriptionCounts.current[productId]) {
          subscriptionCounts.current[productId]--;

          // Only unsubscribe if no components are using this subscription anymore
          if (subscriptionCounts.current[productId] <= 0) {
            delete subscriptionCounts.current[productId];
            unsubscribeFromProduct(productId);
            subscribedProducts.current.delete(productId);
          }
        }
      };
    }

    // Add to our tracking set
    subscribedProducts.current.add(productId);

    // Only actually subscribe if we're connected
    if (socket.current && socket.current.connected) {
      // Use the socket.js utility which handles reference counting
      subscribeToProduct(productId);
    }

    // Return unsubscribe function that decrements the reference count
    return () => {
      // Decrement reference count
      if (subscriptionCounts.current[productId]) {
        subscriptionCounts.current[productId]--;

        // Only unsubscribe if no components are using this subscription anymore
        if (subscriptionCounts.current[productId] <= 0) {
          delete subscriptionCounts.current[productId];
          unsubscribeFromProduct(productId);
          subscribedProducts.current.delete(productId);
        }
      }
    };
  }, []); // No dependencies to prevent unnecessary re-renders

  // Context value
  const value = {
    isConnected,
    socketId,
    subscribeToProductUpdates,
    socket: socket.current,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

// Custom hook to use the socket context
export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
};

export default SocketContext;
