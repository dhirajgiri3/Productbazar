// "use server"; // Uncomment this if you intend to use these directly as Server Actions

// Adjust import paths as per your project structure.
// These utilities (api, makePriorityRequest, logger) need to be usable in a server environment.
import api, { makePriorityRequest } from "../api/api"; // e.g., from '@/lib/services/api' or similar
import logger from "../utils/logger"; // e.g., from '@/lib/utils/logger'

export async function serverGetProductBySlug(slug, bypassCache = false) {
  if (!slug) {
    logger.error("[Server Action] serverGetProductBySlug: Slug is required");
    return { success: false, message: "Slug is required", data: null };
  }
  logger.info(`[Server Action] Fetching product by slug: ${slug}, bypassCache: ${bypassCache}`);

  let retryCount = 0;
  const maxRetries = 3;

  while (retryCount <= maxRetries) {
    try {
      const response = await makePriorityRequest('GET', `/products/${slug}`, {
        params: bypassCache ? { _bypass_cache: Date.now() } : undefined,
        retryCount
      });

      // The actual product data is expected to be in response.data.data
      // and userInteractions in response.data.userInteractions
      if (!response.data || !response.data.success) {
        throw new Error(response.data?.message || "Failed to fetch product from API");
      }

      // Return the structured data as received from your API wrapper
      return {
        success: true,
        data: response.data.data, // The product object
        userInteractions: response.data.userInteractions // User-specific interaction data
      };
    } catch (err) {
      if (err.response?.status === 429) {
        retryCount++;
        if (retryCount <= maxRetries) {
          const baseDelay = Math.min(Math.pow(2, retryCount) * 1000, 10000);
          const jitter = Math.random() * 1000;
          const delay = baseDelay + jitter;
          logger.warn(`[Server Action] Rate limited for product ${slug}. Retrying in ${Math.round(delay/1000)}s (attempt ${retryCount}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
      }
      logger.error(`[Server Action] Error fetching product ${slug}:`, err.message, err.stack);
      return { success: false, message: err.message || "Server error fetching product", error: { message: err.message, status: err.response?.status }, data: null };
    }
  }
  const errorMessage = `[Server Action] Failed to fetch product ${slug} after multiple attempts`;
  logger.error(errorMessage);
  return { success: false, message: errorMessage, data: null };
}

export async function serverGetAllProducts({
  page = 1,
  limit = 10,
  sort = "newest",
  category,
  status,
  bypassCache = false,
} = {}) {
  logger.info(`[Server Action] Fetching all products with params:`, { page, limit, sort, category, status, bypassCache });
  try {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
      sort,
      ...(category && { category }),
      ...(status && { status }),
      ...(bypassCache && { _t: String(Date.now()) }),
    });

    const response = await api.get(`/products?${params.toString()}`, {
      headers: bypassCache ? {
        'Cache-Control': 'no-cache, no-store',
        'Pragma': 'no-cache'
      } : {}
    });

    if (!response.data || !response.data.success) {
      throw new Error(response.data?.message || "Failed to fetch products from API");
    }
    return {
      success: true,
      data: response.data.data, // Array of products
      pagination: response.data.pagination
    };
  } catch (err) {
    logger.error("[Server Action] Error fetching products:", err.message, err.stack);
    return { success: false, message: err.message || "Server error fetching products", data: [], pagination: null, error: { message: err.message, status: err.response?.status } };
  }
}

export async function serverValidateProductUrl(url) {
  logger.info(`[Server Action] Validating product URL: ${url}`);
  if (!url) {
    return { success: false, message: "URL is required for validation.", data: null };
  }
  try {
    const response = await api.post("/products/validate-url", { url });
    if (!response.data || !response.data.success) {
      throw new Error(response.data?.message || "Failed to validate URL from API");
    }
    return { success: true, data: response.data.data };
  } catch (err) {
    logger.error("[Server Action] Error validating URL:", err.message, err.stack);
    return { success: false, message: err.message || "Server error validating URL", data: null, error: { message: err.message, status: err.response?.status } };
  }
}

export async function serverCreateProduct(formData) {
  logger.info("[Server Action] Attempting to create product.");
  try {
    // Ensure 'api.post' can handle FormData correctly in a server environment.
    // The 'Content-Type': 'multipart/form-data' header is typically set automatically by the HTTP client when using FormData.
    const response = await api.post("/products", formData);

    if (!response.data || !response.data.success) {
      throw new Error(response.data?.message || "Failed to create product via API");
    }
    // The response.data.data should contain the newly created product.
    // Gallery images might be handled as a subsequent step by the client context,
    // calling another server action or a dedicated service if needed.
    return { success: true, data: response.data.data };
  } catch (err) {
    logger.error("[Server Action] Error creating product:", err.message, err.stack);
    return { success: false, message: err.message || "Server error creating product", data: null, error: { message: err.message, status: err.response?.status } };
  }
}

export async function serverUpdateProduct(slug, formData) {
  logger.info(`[Server Action] Attempting to update product: ${slug}`);
  if (!slug) {
    return { success: false, message: "Slug is required for update." };
  }
  try {
    // makePriorityRequest should be configured to handle FormData server-side.
    // Headers like 'Content-Type' for multipart/form-data are usually handled by the request library with FormData.
    const response = await makePriorityRequest(
      'put',
      `/products/${slug}`,
      {
        data: formData,
        isFormData: true, // Assuming makePriorityRequest uses this to correctly format the request
        headers: { // Explicitly set cache-related headers for updates
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'X-Cache-Invalidate': 'true' // Custom header for server-side cache invalidation, if used
        },
        params: { timestamp: Date.now() } // Cache-busting param
      }
    );

    if (!response.data || !response.data.success) {
      throw new Error(response.data?.message || "Failed to update product via API");
    }
    // The response.data is expected to contain { success, data (updated product), newSlug, slugChanged, message }
    return { success: true, ...response.data };
  } catch (err) {
    logger.error(`[Server Action] Error updating product ${slug}:`, err.message, err.stack);
    return { success: false, message: err.message || "Server error updating product", error: { message: err.message, status: err.response?.status } };
  }
}

export async function serverDeleteProduct(slug) {
  logger.info(`[Server Action] Attempting to delete product: ${slug}`);
  if (!slug) {
    return { success: false, message: "Slug is required for deletion." };
  }
  try {
    const response = await makePriorityRequest(
      'delete',
      `/products/${slug}`,
      {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'X-Cache-Invalidate': 'true'
        },
        params: { timestamp: Date.now() }
      }
    );

    if (!response.data || !response.data.success) {
      // This will be caught and handled by the catch block
      throw new Error(response.data?.message || "Failed to delete product via API");
    }
    // The response.data is expected to contain { success, productId, message }
    return { success: true, ...response.data };
  } catch (err) {
    if (err.response && err.response.status === 404) {
      logger.warn(`[Server Action] Product ${slug} not found (404) during delete. Assuming already deleted.`);
      // Client-side will handle cache cleanup using the slug.
      // The API might not return productId on a 404.
      return { success: true, wasAlreadyDeleted: true, slug: slug, message: "Product not found, assumed already deleted." };
    }
    logger.error(`[Server Action] Error deleting product ${slug}:`, err.message, err.stack);
    return { success: false, message: err.message || "Server error deleting product", error: { message: err.message, status: err.response?.status } };
  }
}

export async function serverGetComments(slug, options = {}) {
  const { page = 1, limit = 10, signal } = options;

  logger.info(`[Server Action] Fetching comments for product: ${slug}, page: ${page}, limit: ${limit}`);

  if (!slug) {
    logger.error("[Server Action] serverGetComments: Slug is required");
    return { success: false, message: "Slug is required", comments: [] };
  }

  try {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
      _t: String(Date.now()), // Cache busting
    });

    const response = await api.get(`/products/${slug}/comments?${params.toString()}`, {
      signal, // Pass the AbortSignal if provided
      headers: {
        'Cache-Control': 'no-cache, no-store',
        'Pragma': 'no-cache'
      }
    });

    if (!response.data || !response.data.success) {
      throw new Error(response.data?.message || "Failed to fetch comments from API");
    }

    return {
      success: true,
      comments: response.data.data || [], // Array of comments
      pagination: response.data.pagination || null
    };
  } catch (err) {
    // Don't log aborted requests as errors
    if (err.name === "CanceledError" || err.code === "ERR_CANCELED") {
      logger.info(`[Server Action] Comment fetch for ${slug} was canceled`);
      return { success: false, message: "Request canceled", comments: [] };
    }

    logger.error(`[Server Action] Error fetching comments for ${slug}:`, err.message, err.stack);
    return {
      success: false,
      message: err.message || "Server error fetching comments",
      comments: [],
      error: { message: err.message, status: err.response?.status }
    };
  }
}
