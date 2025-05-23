import logger from './logger';

/**
 * Download a file from a URL
 * @param {string} url - The URL of the file to download
 * @param {string} filename - The name to save the file as
 * @param {Object} options - Additional options
 * @param {Function} options.onProgress - Progress callback function
 * @param {Function} options.onError - Error callback function
 * @param {Function} options.onSuccess - Success callback function
 * @returns {Promise<void>}
 */
export const downloadFile = async (url, filename, options = {}) => {
  const { onProgress, onError, onSuccess } = options;
  
  try {
    // Start download
    logger.info(`Starting download of ${filename} from ${url}`);
    
    // Create a new XMLHttpRequest
    const xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.responseType = 'blob';
    
    // Set up progress tracking
    xhr.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        const percentComplete = Math.round((event.loaded / event.total) * 100);
        onProgress(percentComplete);
      }
    };
    
    // Handle successful download
    xhr.onload = function() {
      if (xhr.status === 200) {
        // Create a blob from the response
        const blob = new Blob([xhr.response], { type: xhr.getResponseHeader('content-type') });
        
        // Create a download link
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = filename;
        document.body.appendChild(a);
        
        // Trigger download
        a.click();
        
        // Clean up
        window.URL.revokeObjectURL(downloadUrl);
        document.body.removeChild(a);
        
        logger.info(`Successfully downloaded ${filename}`);
        if (onSuccess) onSuccess();
      } else {
        const error = new Error(`Failed to download file: ${xhr.status} ${xhr.statusText}`);
        logger.error(error);
        if (onError) onError(error);
      }
    };
    
    // Handle errors
    xhr.onerror = function() {
      const error = new Error('Network error occurred while downloading file');
      logger.error(error);
      if (onError) onError(error);
    };
    
    // Start the download
    xhr.send();
  } catch (error) {
    logger.error(`Error downloading file: ${error.message}`);
    if (onError) onError(error);
  }
};

/**
 * Extract filename from URL or content-disposition header
 * @param {string} url - The URL of the file
 * @param {string} contentDisposition - Content-Disposition header value
 * @param {string} defaultName - Default filename to use if extraction fails
 * @returns {string} - The extracted filename
 */
export const extractFilename = (url, contentDisposition, defaultName = 'download') => {
  // Try to extract from content-disposition header
  if (contentDisposition) {
    const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
    const matches = filenameRegex.exec(contentDisposition);
    if (matches && matches[1]) {
      return matches[1].replace(/['"]/g, '');
    }
  }
  
  // Try to extract from URL
  if (url) {
    const urlParts = url.split('/');
    let filename = urlParts[urlParts.length - 1];
    
    // Remove query parameters
    if (filename.includes('?')) {
      filename = filename.split('?')[0];
    }
    
    // If filename has extension, use it
    if (filename.includes('.')) {
      return decodeURIComponent(filename);
    }
  }
  
  // Use default name with appropriate extension
  return defaultName;
};

export default {
  downloadFile,
  extractFilename
};
