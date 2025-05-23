// src/utils/api.js
import axios from 'axios';

// Create axios instance
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5004/api/v1',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Add request interceptor to automatically add Authorization header
api.interceptors.request.use(
  (config) => {
    // Get token from localStorage if available
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('accessToken');
      if (token) {
        // Ensure we're setting the header correctly with Bearer prefix
        config.headers['Authorization'] = `Bearer ${token}`;

        // Log token presence for debugging (remove in production)
        if (process.env.NODE_ENV === 'development') {
          console.debug('Request with auth token:', config.url);
        }
      } else {
        // Log missing token for debugging (remove in production)
        if (process.env.NODE_ENV === 'development') {
          console.debug('Request without auth token:', config.url);
        }
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Flag to prevent multiple concurrent refresh attempts
let isRefreshing = false;
let refreshSubscribers = [];

const processQueue = (error, token = null) => {
  refreshSubscribers.forEach(callback => callback(error, token));
  refreshSubscribers = [];
};

/**
 * Check if we should attempt a token refresh
 * Implements rate limiting for refresh attempts
 */
const shouldAttemptRefresh = () => {
  const now = Date.now();
  if (now - refreshAttemptTimestamp < REFRESH_COOLDOWN) {
    return false;
  }
  refreshAttemptTimestamp = now;
  return true;
};

/**
 * Check if token is about to expire and should be refreshed proactively
 */
const shouldProactivelyRefresh = () => {
  if (typeof window === 'undefined') return false;

  const token = localStorage.getItem('accessToken');
  if (!token) return false;

  try {
    // Decode token without verification
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    const { exp } = JSON.parse(jsonPayload);
    const expiryTime = exp * 1000; // Convert to milliseconds

    // If token will expire within the threshold, refresh it
    const shouldRefresh = Date.now() > expiryTime - TOKEN_REFRESH_THRESHOLD;

    // For debugging
    if (shouldRefresh && process.env.NODE_ENV === 'development') {
      console.debug('Token needs proactive refresh. Expires in:',
        Math.round((expiryTime - Date.now()) / 1000), 'seconds');
    }

    return shouldRefresh;
  } catch (error) {
    console.error('Error checking token expiry:', error);
    return false;
  }
};

/**
 * Handle unauthorized errors consistently
 */
const handleUnauthorizedError = (message, status, errorCode) => {
  // Clear tokens
  if (typeof window !== 'undefined') {
    localStorage.removeItem('accessToken');

    window.dispatchEvent(new CustomEvent('auth:unauthorized', {
      detail: {
        message: message || 'Your session has expired. Please log in again to continue.',
        code: status,
        errorCode
      }
    }));
  }
};

/**
 * Notify the application that a token has been refreshed
 */
const notifyTokenRefreshed = (newToken, userData) => {
  if (typeof window !== 'undefined') {
    console.debug('Dispatching auth:token-refreshed event with new token');

    // Create a custom event with the new token and user data
    const tokenRefreshedEvent = new CustomEvent('auth:token-refreshed', {
      detail: {
        accessToken: newToken,
        user: userData
      }
    });

    // Dispatch the event
    window.dispatchEvent(tokenRefreshedEvent);

    // Log success for debugging
    console.debug('auth:token-refreshed event dispatched successfully');
  }
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Check if the error is a 401, not from a refresh token attempt, and not already retrying
    if (error.response && error.response.status === 401 && !originalRequest._retry && originalRequest.url !== '/auth/refresh-token') {
      if (!isRefreshing) {
        isRefreshing = true;
        originalRequest._retry = true; // Mark as retrying to prevent infinite loops

        try {
          console.debug('API Interceptor: Access token expired. Attempting to refresh token...');
          const { data } = await api.post('/auth/refresh-token', {}, { withCredentials: true });

          if (data.success && data.data.accessToken) {
            const newAccessToken = data.data.accessToken;
            const refreshedUser = data.data.user; // Assuming user data is also returned

            console.debug('API Interceptor: Token refresh successful. Updating Authorization header and retrying original request.');
            api.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;
            originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;

            // Dispatch an event so AuthContext can update its state
            window.dispatchEvent(new CustomEvent('auth:token-refreshed', {
              detail: { accessToken: newAccessToken, user: refreshedUser },
            }));

            processQueue(null, newAccessToken);
            return api(originalRequest); // Retry the original request with the new token
          } else {
            // Refresh token failed (e.g., refresh token invalid)
            console.warn('API Interceptor: Token refresh was not successful.', data.message);
            window.dispatchEvent(new CustomEvent('auth:unauthorized', { detail: { message: 'Refresh token failed', code: 'REFRESH_FAILED' } }));
            processQueue(new Error('Refresh token failed'));
            isRefreshing = false;
            // Do not reject here, let the original call fail with 401 if not handled by auth:unauthorized
            return Promise.reject(error); 
          }
        } catch (refreshError) {
          console.error('API Interceptor: Error during token refresh:', refreshError);
          window.dispatchEvent(new CustomEvent('auth:unauthorized', { detail: { message: 'Error during token refresh', code: 'REFRESH_ERROR', errorDetails: refreshError } }));
          processQueue(refreshError);
          isRefreshing = false;
          // Do not reject here, let the original call fail with 401 if not handled by auth:unauthorized
          return Promise.reject(error); 
        } finally {
          // isRefreshing = false; // Moved to after processQueue to ensure subscribers are processed first
        }
      } else {
        // If already refreshing, queue the original request
        return new Promise((resolve, reject) => {
          refreshSubscribers.push((error, token) => {
            if (error) {
              return reject(error);
            }
            originalRequest.headers['Authorization'] = `Bearer ${token}`;
            resolve(api(originalRequest));
          });
        });
      }
    }
    // For errors other than 401, or if it's a retry/refresh token URL, just pass the error along
    return Promise.reject(error);
  }
);

export const makePriorityRequest = async (method, url, options = {}) => {
  const { params, data, headers = {}, isFormData = false, timeout = 15000, retryCount = 0, _isRetry = false } = options;

  // Get token from localStorage if available
  let token = null;
  if (typeof window !== 'undefined') {
    token = localStorage.getItem('accessToken');
  }

  const config = {
    params: { ...params, _t: Date.now() },
    headers: {
      ...headers,
      // Add Authorization header if token exists
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    },
    timeout,
    withCredentials: true,
  };

  if (isFormData || (data instanceof FormData)) {
    config.headers['Content-Type'] = 'multipart/form-data';
  }

  try {
    let response;
    switch (method.toLowerCase()) {
      case 'get':
        response = await api.get(url, config);
        break;
      case 'post':
        response = await api.post(url, data, config);
        break;
      case 'put':
        response = await api.put(url, data, config);
        break;
      case 'patch':
        response = await api.patch(url, data, config);
        break;
      case 'delete':
        response = await api.delete(url, { ...config, data });
        break;
      default:
        throw new Error(`Unsupported method: ${method}`);
    }
    return response;
  } catch (error) {
    // Handle token expiration with refresh
    if (!_isRetry && error.response?.status === 401 && shouldAttemptRefresh()) {
      // Check for specific error codes that indicate we shouldn't retry
      const errorCode = error.response.data?.code || '';

      if (NO_RETRY_ERROR_CODES.includes(errorCode)) {
        // Clear tokens and trigger logout
        handleUnauthorizedError(error.response.data?.message, error.response.status, errorCode);
        throw error;
      }

      try {
        // Try to refresh the token - use api instance instead of axios directly
        const refreshResponse = await api.post(
          '/auth/refresh-token',
          {},
          { withCredentials: true }
        );

        if (refreshResponse.data.success) {
          // Update token in localStorage
          const newToken = refreshResponse.data.data.accessToken;
          localStorage.setItem('accessToken', newToken);

          // Get user data if available
          const userData = refreshResponse.data.data.user;

          // Update user data in localStorage if available
          if (userData) {
            localStorage.setItem('user', JSON.stringify(userData));
          }

          // Notify the application about the token refresh
          notifyTokenRefreshed(newToken, userData);

          // Retry the original request with the new token
          return makePriorityRequest(method, url, {
            ...options,
            _isRetry: true // Mark as a retry to prevent infinite loops
          });
        } else {
          // Handle unsuccessful refresh
          handleUnauthorizedError(
            refreshResponse.data.message,
            error.response.status,
            refreshResponse.data.code
          );
        }
      } catch (refreshError) {
        // Handle refresh error
        const refreshErrorMessage = refreshError.response?.data?.message || 'Your session has expired. Please log in again to continue.';
        const refreshErrorCode = refreshError.response?.data?.code;

        handleUnauthorizedError(
          refreshErrorMessage,
          refreshError.response?.status || error.response.status,
          refreshErrorCode
        );
      }
    }

    // If we have retries left and it's a network error, retry the request
    if (retryCount > 0 && error.code === 'ERR_NETWORK') {
      return makePriorityRequest(method, url, { ...options, retryCount: retryCount - 1 });
    }

    // Enhance error messages for common error codes
    if (error.response) {
      const status = error.response.status;
      const originalMessage = error.response.data?.message || '';
      const errorCode = error.response.data?.code || '';

      if (status === 401) {
        // Handle unauthorized errors
        handleUnauthorizedError(originalMessage, status, errorCode);
        throw new Error(originalMessage || 'Your session has expired. Please log in again to continue.');
      } else if (status === 403) {
        // Dispatch forbidden event
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('auth:forbidden', {
            detail: {
              message: originalMessage || 'You don\'t have permission to access this resource.',
              code: status
            }
          }));
        }
        throw new Error(originalMessage || 'You don\'t have permission to perform this action.');
      } else if (status === 404) {
        throw new Error(originalMessage || 'The requested resource was not found.');
      } else if (status === 429) {
        throw new Error(originalMessage || 'Too many requests. Please try again later.');
      } else if (status >= 500) {
        throw new Error(originalMessage || 'Server error. Please try again later or contact support.');
      }
    } else if (error.userMessage) {
      // Use the enhanced message from the interceptor if available
      throw new Error(error.userMessage);
    }

    // For any other errors, pass through
    throw error;
  }
};

export default api;