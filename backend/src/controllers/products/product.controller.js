// file: backend/Controllers/products/product.controller.js
import Product from "../../models/product/product.model.js";
import User from "../../models/user/user.model.js";
import Category from "../../models/category/category.model.js";
import { AppError } from "../../utils/logging/error.js";
import logger from "../../utils/logging/logger.js";
import { uploadToCloudinary, deleteFromCloudinary } from "../../utils/storage/cloudinary.utils.js";
import { generateUniqueSlug } from "../../utils/formatting/slugGenerator.js";
import slugify from "slugify";
import mongoose from "mongoose";
import { transformImage } from "../../utils/storage/image.utils.js";
import { getLinkPreview } from "link-preview-js";
import cache from "../../utils/cache/cache.js";
import recommendationCacheService from "../../services/recommendation/recommendationCache.service.js";
import UserContextService from "../../services/recommendation/userContext.service.js";

// --- Enhanced Helper Functions ---

/**
 * Process raw tags input into a standardized array format
 * @param {string|Array} tagsInput - Raw tags input from request
 * @returns {Array} - Array of unique, normalized tags
 */
const processTags = (tagsInput) => {
  let tags = [];
  if (typeof tagsInput === "string") {
    tags = tagsInput.split(",").map((tag) => tag.trim().toLowerCase()).filter(Boolean);
  } else if (Array.isArray(tagsInput)) {
    tags = tagsInput.map((tag) => String(tag || '').trim().toLowerCase()).filter(Boolean);
  }
  return [...new Set(tags)].slice(0, 10); // Limit to 10 unique tags
};

/**
 * Process raw links input into a standardized object format
 * @param {string|Object} linksInput - Raw links input from request
 * @returns {Object} - Standardized links object
 */
const processLinks = (linksInput) => {
  let links = {};
  try {
    if (typeof linksInput === "string") {
      links = JSON.parse(linksInput);
    } else if (typeof linksInput === "object" && linksInput !== null) {
      // Already an object, no need to parse
      links = linksInput;
    }
  } catch (error) {
    logger.warn("Could not parse links input", { linksInput: JSON.stringify(linksInput), error: error.message });
  }

  return {
    website: links.website || "",
    github: links.github || "",
    demo: links.demo || "",
    appStore: links.appStore || "",
    playStore: links.playStore || "",
  };
};

/**
 * Process and validate pricing information
 * @param {Object} pricingInput - Raw pricing input from request
 * @returns {Object} - Standardized pricing object
 * @throws {AppError} - If pricing validation fails
 */
const processPricing = (pricingInput) => {
  const validTypes = ["free", "paid", "contact"];
  const validCurrencies = ["USD", "EUR", "GBP"];
  let pricing = { type: "free", amount: 0, currency: "USD", discounted: false };

  if (!pricingInput || typeof pricingInput !== "object") return pricing;

  // Validate pricing type
  if (validTypes.includes(pricingInput.type)) {
    pricing.type = pricingInput.type;
  } else {
    logger.warn(`Invalid pricing type: ${pricingInput.type}. Defaulting 'free'.`);
    pricing.type = "free";
  }

  // Handle paid product pricing
  if (pricing.type === "paid") {
    const amount = parseFloat(pricingInput.amount);
    if (isNaN(amount) || amount <= 0) throw new AppError("Price > 0 for paid products", 400);
    pricing.amount = amount;

    // Validate currency
    if (validCurrencies.includes(pricingInput.currency)) {
      pricing.currency = pricingInput.currency;
    } else {
      logger.warn(`Invalid currency: ${pricingInput.currency}. Defaulting USD.`);
      pricing.currency = "USD";
    }

    // Handle discounted pricing
    if (pricingInput.discounted !== undefined) {
      pricing.discounted = Boolean(pricingInput.discounted);
      if (pricing.discounted) {
        const origAmount = parseFloat(pricingInput.originalAmount);
        if (isNaN(origAmount) || origAmount <= pricing.amount)
          throw new AppError("Original price must be > discounted", 400);
        pricing.originalAmount = origAmount;
      } else {
        delete pricing.originalAmount;
      }
    }
  } else {
    pricing.amount = 0;
    delete pricing.originalAmount;
  }

  return pricing;
};

/**
 * Validate URL and extract metadata using link-preview
 * @param {string} url - URL to validate and process
 * @returns {Promise<Object>} - Success status and extracted data
 */
const validateAndExtractUrl = async (url) => {
  if (!url || typeof url !== 'string') return { success: false, error: 'URL is required' };

  try {
    // Basic URL validation
    new URL(url);

    // Check if URL is live with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    const liveCheck = await fetch(url, {
      method: "GET",
      signal: controller.signal,
      headers: {
        'User-Agent': 'ProductBazarLinkPreview/1.0',
        'Accept': 'text/html'
      }
    });
    clearTimeout(timeoutId);

    if (!liveCheck.ok) throw new Error(`URL status ${liveCheck.status}`);

    // Extract metadata using link-preview
    const data = await getLinkPreview(url, {
      timeout: 10000,
      followRedirects: "follow",
      headers: { 'User-Agent': 'ProductBazarLinkPreview/1.0' }
    });

    // Filter out tracking pixels and ad images
    const filteredImages = (data.images || [])
      .filter(imgUrl => imgUrl?.startsWith('http'))
      .filter(imgUrl => !/pixel|tracker|ads|banner|logo|favicon|spinner|loader/i.test(imgUrl));

    return {
      success: true,
      data: {
        title: data.title || "",
        description: data.description || "",
        images: filteredImages,
        url: data.url || url
      }
    };
  } catch (error) {
    logger.error(`URL validation/preview failed for ${url}: ${error.message}`);
    return { success: false, error: `Failed to process URL: ${error.message}` };
  }
};

/**
 * Process category information - find or create category as needed
 * @param {string|Object} categoryId - Category ID or name
 * @param {string} categoryName - Category name
 * @param {Object} user - User creating/updating the product
 * @returns {Promise<Object>} - Category object with ID and name
 */
const processCategory = async (categoryId, categoryName, user) => {
  let category;

  // Find by ID if provided and valid
  if (categoryId && mongoose.Types.ObjectId.isValid(categoryId)) {
    category = await Category.findById(categoryId);
    if (category) categoryName = category.name;
    else categoryId = null;
  }

  // Find or create by name if ID not found
  if (!category && categoryName) {
    category = await Category.findOneAndUpdate(
      { name: { $regex: new RegExp(`^${categoryName}$`, "i") } },
      { $setOnInsert: { slug: slugify(categoryName, { lower: true }), createdBy: user._id } },
      { upsert: true, new: true, runValidators: true }
    );
    categoryId = category._id;
    categoryName = category.name;
  }

  // Use default if still not found
  if (!category) {
    const defaultName = "Other";
    category = await Category.findOneAndUpdate(
      { name: defaultName },
      { $setOnInsert: { slug: slugify(defaultName, { lower: true }), createdBy: user._id } },
      { upsert: true, new: true }
    );
    categoryId = category._id;
    categoryName = category.name;
  }

  return { categoryId, categoryName, category };
};

/**
 * Handle thumbnail processing from multiple sources
 * @param {Object} req - Request object with file and body
 * @param {Object} urlData - Extracted URL data
 * @returns {Promise<Object>} - Processed thumbnail info
 * @throws {AppError} - If thumbnail processing fails
 */
const processThumbnail = async (req, urlData) => {
  let thumbnailUrl = null, thumbnailPublicId = null;

  // Case 1: File uploaded directly
  if (req.file) {
    try {
      const optimizedImage = await transformImage(req.file.buffer, "product_thumbnail");
      const uploadResult = await uploadToCloudinary(
        { ...req.file, buffer: optimizedImage.buffer },
        "product-thumbnails"
      );
      thumbnailUrl = uploadResult.secure_url || uploadResult.url;
      thumbnailPublicId = uploadResult.public_id;
    } catch (uploadError) {
      throw new AppError(`Image upload failed: ${uploadError.message}`, 400);
    }
  }
  // Case 2: Use image from URL extraction
  else if (urlData?.images?.length > 0) {
    thumbnailUrl = urlData.images[0];
  }
  // Case 3: Use direct thumbnail URL from request
  else if (req.body.thumbnail?.startsWith("http")) {
    thumbnailUrl = req.body.thumbnail;
  }

  // Validate we have a thumbnail
  if (!thumbnailUrl) throw new AppError("Product thumbnail required", 400);

  return { thumbnailUrl, thumbnailPublicId };
};

/**
 * Update caches and perform post-save operations
 * @param {Object} product - Saved product object
 * @param {boolean} slugChanged - Whether slug was changed
 * @param {string} oldSlug - Previous slug if changed
 */
const updateProductCaches = async (product, slugChanged = false, oldSlug = null) => {
  // Get the maker ID for targeted cache invalidation
  const makerId = product.maker.toString();

  // Invalidate product cache with maker ID
  await cache.invalidateProduct(product._id, product.slug, { invalidateRelated: true, makerId });
  if (slugChanged && oldSlug) await cache.invalidateProduct(product._id, oldSlug, { invalidateRelated: true, makerId });

  // Invalidate recommendation caches for this product
  await recommendationCacheService.invalidateSimilarCache(product._id.toString());

  // Invalidate category-based recommendations
  if (product.category) {
    await recommendationCacheService.invalidateCategoryCache(product.category.toString());
  }

  // Explicitly clear the user's products cache
  await cache.delByPattern(`products:user:${makerId}:*`);
};

// --- Enhanced Controller Methods ---

/**
 * Create a new product
 * @route POST /api/products
 */
export const createProduct = async (req, res, next) => {
  try {
    const user = req.user;

    // Basic Input Validation
    if (!req.body.name?.trim() || req.body.name.trim().length < 3)
      return next(new AppError("Product name required (min 3 chars)", 400));

    if (!req.body.description?.trim() || req.body.description.trim().length < 10)
      return next(new AppError("Product description required (min 10 chars)", 400));

    if (!req.body.category && !req.body.categoryName)
      return next(new AppError("Product category ID or name required", 400));

    // Process Input Fields Concurrently (where possible)
    let urlData = null, optimizedImageBuffer = null;
    const processingPromises = [];

    if (req.body.productUrl) {
      processingPromises.push(
        validateAndExtractUrl(req.body.productUrl)
          .then(res => {
            urlData = res.success ? res.data : null;
            if (!res.success) logger.warn("URL extraction failed", { url: req.body.productUrl });
          })
      );
    }

    if (req.file) {
      processingPromises.push(
        transformImage(req.file.buffer, "product_thumbnail")
          .then(img => { optimizedImageBuffer = img.buffer; })
      );
    }

    await Promise.all(processingPromises);

    // Handle Thumbnail
    const { thumbnailUrl, thumbnailPublicId } = await processThumbnail(
      { file: req.file && optimizedImageBuffer ? { ...req.file, buffer: optimizedImageBuffer } : null, body: req.body },
      urlData
    );

    // Process Category
    const { categoryId, categoryName } = await processCategory(
      req.body.category,
      req.body.categoryName,
      user
    );

    // Process Other Fields
    const tags = processTags(req.body.tags);
    const linksData = typeof req.body.links === 'object' ? req.body.links : {};
    const links = processLinks({
      ...linksData,
      website: req.body.productUrl || linksData?.website
    });

    let pricing;
    try {
      pricing = processPricing(req.body.pricing);
    } catch (e) {
      return next(e);
    }

    const productName = (req.body.name || urlData?.title || "").trim();
    const slug = await generateUniqueSlug(productName);

    // Create Product Data Object
    const productData = {
      name: productName,
      slug,
      thumbnail: thumbnailUrl,
      thumbnailPublicId,
      description: (req.body.description || urlData?.description || "").trim(),
      tagline: (req.body.tagline || "").trim() || `${productName} - ${categoryName}`,
      category: categoryId,
      categoryName,
      maker: user._id,
      status: "Published",
      launchedAt: new Date(),
      tags,
      links,
      pricing,
      makerProfile: {
        name: user.fullName,
        bio: user.bio || "",
        title: user.companyRole || "Creator",
        image: user.profilePicture?.url || ""
      },
      extractedUrlData: urlData ? {
        originalUrl: urlData.url,
        extractedAt: new Date()
      } : undefined,
    };

    // Create Product in DB
    const product = await Product.create(productData);

    // Post-Creation Actions
    try {
      await user.addActivity("Launched", {
        description: `Launched product: ${product.name}`,
        reference: product._id,
        referenceModel: "Product"
      });
    } catch (activityError) {
      logger.warn(`Failed log launch activity user ${user._id}: ${activityError.message}`);
    }

    // Invalidate caches
    await updateProductCaches(product);

    logger.info(`New product created: ${product.slug} (${product._id}) by user ${user._id}`);

    res.status(201).json({
      success: true,
      data: product,
      message: "Product created successfully"
    });

  } catch (error) {
    logger.error("Failed to create product:", error);

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map(e => e.message);
      return next(new AppError(messages.join(', '), 400));
    }

    if (error.code === 11000 && error.keyPattern?.slug) {
      return next(new AppError("Product name conflict.", 409));
    }

    next(new AppError(error.message || "Failed to create product", error.statusCode || 500));
  }
};

/**
 * Validate a product URL and extract metadata
 * @route POST /api/products/validate-url
 */
export const validateProductUrl = async (req, res, next) => {
  try {
    const { url } = req.body;

    if (!url) return next(new AppError("URL required", 400));

    const result = await validateAndExtractUrl(url);

    if (!result.success)
      return next(new AppError(result.error || "URL validation failed", 400));

    res.status(200).json({
      success: true,
      data: result.data,
      message: "URL validated successfully"
    });
  } catch (error) {
    logger.error(`URL validation error:`, error);
    next(new AppError("Failed validate URL", 500));
  }
};

/**
 * Update an existing product
 * @route PUT /api/products/:slug
 */
export const updateProduct = async (req, res, next) => {
  try {
    const product = req.product; // From middleware
    const oldSlug = product.slug;
    let slugChanged = false;

    // --- Thumbnail Update ---
    if (req.file) {
      try {
        // Clean up old thumbnail if it exists
        if (product.thumbnailPublicId) {
          deleteFromCloudinary(product.thumbnailPublicId)
            .catch(err => logger.error(`Failed delete old thumb ${product.thumbnailPublicId}: ${err.message}`));
        }

        const optimizedImage = await transformImage(req.file.buffer, "product_thumbnail");
        const uploadResult = await uploadToCloudinary(
          { ...req.file, buffer: optimizedImage.buffer },
          "product-thumbnails"
        );

        product.thumbnail = uploadResult.secure_url || uploadResult.url;
        product.thumbnailPublicId = uploadResult.public_id;
      } catch (uploadError) {
        logger.error(`Update img upload failed: ${uploadError.message}`);
      }
    } else if (req.body.thumbnail !== undefined) {
      if (req.body.thumbnail === '' && product.thumbnailPublicId) {
        deleteFromCloudinary(product.thumbnailPublicId)
          .catch(err => logger.error(`Failed to delete old thumbnail: ${err.message}`));
        product.thumbnailPublicId = null;
      }

      product.thumbnail = req.body.thumbnail;
    }

    // --- Apply Updates ---
    const updates = {};

    // Name and slug update
    if (req.body.name && req.body.name.trim() !== product.name) {
      updates.name = req.body.name.trim();
      if (updates.name.length < 3) throw new AppError("Name min 3 chars", 400);
      updates.slug = await generateUniqueSlug(updates.name);
      slugChanged = true;
    }

    // Description update
    if (req.body.description !== undefined && req.body.description.trim() !== product.description) {
      updates.description = req.body.description.trim();
      if (updates.description.length < 10) throw new AppError("Desc min 10 chars", 400);
    }

    // Other field updates
    if (req.body.tagline !== undefined) updates.tagline = req.body.tagline.trim();
    if (req.body.tags !== undefined) updates.tags = processTags(req.body.tags);
    if (req.body.links !== undefined) updates.links = processLinks(req.body.links);

    // Pricing update
    if (req.body.pricing !== undefined) {
      try {
        updates.pricing = processPricing(req.body.pricing);
      } catch (e) {
        return next(e);
      }
    }

    // Status update
    if (req.body.status && req.body.status !== product.status) {
      if (!["Draft", "Published", "Archived"].includes(req.body.status))
        throw new AppError("Invalid status", 400);

      updates.status = req.body.status;

      // Handle publishing of a new product
      if (product.status !== "Published" && updates.status === "Published") {
        updates.launchedAt = product.launchedAt || new Date();

        // Fetch full user doc for activity method if needed
        const userDoc = await User.findById(req.user._id);
        if (userDoc) {
          await userDoc.addActivity("Launched", {
            description: `Launched: ${product.name}`,
            reference: product._id,
            referenceModel: "Product"
          }).catch(e => logger.warn(`Failed to add launch activity: ${e.message}`));
        }
      }
    }

    // Category update
    if (req.body.category || req.body.categoryName) {
      const { categoryId, categoryName } = await processCategory(
        req.body.category,
        req.body.categoryName,
        req.user
      );

      if (categoryId) {
        updates.category = categoryId;
        updates.categoryName = categoryName;
      }
    }

    // Apply all updates to product
    Object.assign(product, updates);
    await product.save();

    // Invalidate Caches
    await updateProductCaches(product, slugChanged, oldSlug);

    // Update recommendation data when product is significantly changed
    if (req.body.tags || req.body.category || slugChanged) {
      try {
        // Let recommendation service know the product has been updated
        await recommendationCacheService.invalidateOnEngagement(product._id.toString());
      } catch (recError) {
        logger.warn(`Failed to update recommendation data for ${product._id}:`, recError);
      }
    }

    logger.info(`Product ${product.slug} updated by user ${req.user._id}`);

    res.status(200).json({
      success: true,
      data: product,
      message: "Product updated",
      slugChanged,
      newSlug: slugChanged ? product.slug : undefined
    });

  } catch (error) {
    logger.error(`Failed update product "${req.params.slug}":`, error);

    if (error.name === "ValidationError") {
      const msgs = Object.values(error.errors).map(e => e.message);
      return next(new AppError(msgs.join(', '), 400));
    }

    if (error.code === 11000 && error.keyPattern?.slug) {
      return next(new AppError("Product name conflict.", 409));
    }

    next(new AppError(error.message || "Failed update product", error.statusCode || 500));
  }
};

/**
 * Get product by slug with interaction tracking
 * @route GET /api/products/:slug
 */
export const getProductBySlug = async (req, res, next) => {
  try {
    const product = req.product; // From middleware

    // View recording is handled by a separate dedicated endpoint (/api/views/product/:id)

    // Populate virtual fields first
    await product.populate(['upvotes', 'bookmarkCount']);

    // Force refresh of virtual fields
    await mongoose.model("Upvote").countDocuments({ product: product._id })
      .then(count => product.upvoteCount = count);
    await mongoose.model("Bookmark").countDocuments({ product: product._id })
      .then(count => product.bookmarkCount = count);

    // Fetch Counts & User Interactions in parallel for better performance
    const [commentCount, userInteractions] = await Promise.all([
      mongoose.model("Comment").countDocuments({ product: product._id }),
      req.user ? Promise.all([
        req.user.hasUpvotedProduct(product._id),
        req.user.hasBookmarkedProduct(product._id)
      ]) : [false, false]
    ]);

    // Get counts from populated virtuals or use direct counts
    const upvoteCount = product.upvoteCount || 0;
    const bookmarkCount = product.bookmarkCount || 0;

    // Get user interaction data if authenticated
    const hasUpvoted = req.user ? userInteractions[0] : false;
    const hasBookmarked = req.user ? userInteractions[1] : false;

    // Populate necessary fields if not already populated
    if (!product.populated('maker')) {
      await product.populate({
        path: "maker",
        select: "firstName lastName fullName profilePicture bio"
      });
    }

    if (!product.populated('category')) {
      await product.populate({
        path: "category",
        select: "name slug"
      });
    }

    // Convert to plain object and add interaction data
    const productData = product.toObject({ virtuals: true });

    productData.upvotes = {
      count: upvoteCount,
      userHasUpvoted: hasUpvoted
    };

    productData.comments = {
      count: commentCount
    };

    productData.bookmarks = {
      count: bookmarkCount,
      userHasBookmarked: hasBookmarked
    };

    // Add top-level interaction data for consistency
    productData.upvoteCount = upvoteCount;
    productData.bookmarkCount = bookmarkCount;

    // Add userInteractions object for easier access
    productData.userInteractions = {
      hasUpvoted: hasUpvoted,
      hasBookmarked: hasBookmarked
    };

    // Use view counts directly from product (synced in background)
    productData.views = {
      count: Number(productData.views?.count || 0),
      unique: Number(productData.views?.unique || 0)
    };

    // If user is authenticated, record this as a view for recommendations
    if (req.user) {
      try {
        // Don't await to avoid blocking the response
        UserContextService.updateAfterInteraction(
          req.user._id,
          product._id,
          "view",
          { source: "product_detail", slug: product.slug }
        ).catch(err => logger.warn(`Failed to record recommendation interaction: ${err.message}`));
      } catch (interactionError) {
        logger.warn("Error tracking product view for recommendations:", interactionError);
      }
    }

    res.status(200).json({ success: true, data: productData });

  } catch (error) {
    logger.error(`Error fetching product slug "${req.params.slug}":`, error);
    next(new AppError(`Failed fetch product: ${error.message}`, error.statusCode || 500));
  }
};

/**
 * Get recent products
 * @route GET /api/products/recent
 */
export const getRecentProducts = async (req, res, next) => {
  try {
    const days = parseInt(req.query.days, 10) || 30;
    const limit = parseInt(req.query.limit, 10) || 6;
    const page = parseInt(req.query.page, 10) || 1;
    const skip = (page - 1) * limit;

    // Calculate date threshold
    const dateThreshold = new Date();
    dateThreshold.setDate(dateThreshold.getDate() - days);

    // Query for products created within the specified time period
    const query = {
      status: "Published",
      createdAt: { $gte: dateThreshold }
    };

    // Execute query and count in parallel for better performance
    const [products, totalCount] = await Promise.all([
      Product.find(query)
        .sort({ createdAt: -1 }) // Sort by newest first
        .skip(skip)
        .limit(limit)
        .populate("maker", "firstName lastName fullName profilePicture")
        .populate("category", "name slug")
        .populate(['upvotes', 'bookmarkCount']) // Populate virtual fields
        .select("-__v -moderation -gallery")
        .lean({ virtuals: true }),
      Product.countDocuments(query)
    ]);

    // Enhance products with user interaction data if user is authenticated
    const enhancedProducts = await enhanceProductsWithUserData(products, req.user);

    // Format pagination object
    const paginationData = {
      total: totalCount,
      page,
      limit,
      pages: Math.ceil(totalCount / limit),
      hasNextPage: (page * limit) < totalCount,
      hasPrevPage: page > 1
    };

    res.status(200).json({
      success: true,
      results: enhancedProducts.length,
      pagination: paginationData,
      data: enhancedProducts,
    });

  } catch (error) {
    logger.error("Failed to fetch recent products:", error);
    next(new AppError("Failed to fetch recent products", 500));
  }
};

/**
 * Get all products with filtering, sorting and pagination
 * @route GET /api/products
 */
export const getAllProducts = async (req, res, next) => {
  try {
    const { dbQuery, pagination, sortOptions } = req; // From prepareProductQuery middleware
    const { limit, skip, page } = pagination;

    // Execute query and count in parallel for better performance
    const [products, totalCount] = await Promise.all([
      Product.find(dbQuery)
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .populate("maker", "firstName lastName fullName profilePicture")
        .populate("category", "name slug")
        .populate(['upvotes', 'bookmarkCount']) // Populate virtual fields
        .select("-__v -moderation -gallery")
        .lean({ virtuals: true }),
      Product.countDocuments(dbQuery)
    ]);

    // Enhance with User Interactions if authenticated
    let userInteractionsMap = new Map();
    if (req.user && products.length > 0) {
      const productIds = products.map(p => p._id);

      // Get all user interactions with these products in parallel
      const [userUpvotes, userBookmarks] = await Promise.all([
        mongoose.model("Upvote")
          .find({ user: req.user._id, product: { $in: productIds } })
          .select('product -_id')
          .lean(),
        mongoose.model("Bookmark")
          .find({ user: req.user._id, product: { $in: productIds } })
          .select('product -_id')
          .lean()
      ]);

      // Create sets for faster lookup
      const upvotedIds = new Set(userUpvotes.map(up => up.product.toString()));
      const bookmarkedIds = new Set(userBookmarks.map(bm => bm.product.toString()));

      // Map product IDs to interaction data
      products.forEach(p => userInteractionsMap.set(p._id.toString(), {
        hasUpvoted: upvotedIds.has(p._id.toString()),
        hasBookmarked: bookmarkedIds.has(p._id.toString())
      }));
    }

    // Ensure bookmark and upvote counts are accurate
    const productIds = products.map(p => p._id);
    const [upvoteCounts, bookmarkCounts] = await Promise.all([
      mongoose.model("Upvote").aggregate([
        { $match: { product: { $in: productIds } } },
        { $group: { _id: '$product', count: { $sum: 1 } } }
      ]),
      mongoose.model("Bookmark").aggregate([
        { $match: { product: { $in: productIds } } },
        { $group: { _id: '$product', count: { $sum: 1 } } }
      ])
    ]);

    // Create maps for faster lookup
    const upvoteCountMap = new Map(upvoteCounts.map(item => [item._id.toString(), item.count]));
    const bookmarkCountMap = new Map(bookmarkCounts.map(item => [item._id.toString(), item.count]));

    // Format products with enhanced interaction data
    const enhancedProducts = products.map(product => {
      const interactions = userInteractionsMap.get(product._id.toString()) || {};
      const productId = product._id.toString();

      // Use the accurate counts from our aggregation
      const upvoteCount = upvoteCountMap.get(productId) || 0;
      const bookmarkCount = bookmarkCountMap.get(productId) || 0;

      // Create a consistent product object with all interaction data
      return {
        ...product,
        upvotes: {
          count: upvoteCount,
          userHasUpvoted: interactions.hasUpvoted || false
        },
        comments: {
          count: product.commentCount || 0
        },
        bookmarks: {
          count: bookmarkCount,
          userHasBookmarked: interactions.hasBookmarked || false
        },
        views: {
          count: Number(product.views?.count || 0),
          unique: Number(product.views?.unique || 0)
        },
        // Ensure top-level counts are consistent
        upvoteCount: upvoteCount,
        bookmarkCount: bookmarkCount,
        // Add userInteractions object for easier access
        userInteractions: {
          hasUpvoted: interactions.hasUpvoted || false,
          hasBookmarked: interactions.hasBookmarked || false
        }
      };
    });

    // Format pagination object
    const paginationData = {
      total: totalCount,
      page,
      limit,
      pages: Math.ceil(totalCount / limit),
      hasNextPage: (page * limit) < totalCount,
      hasPrevPage: page > 1
    };

    res.status(200).json({
      success: true,
      results: enhancedProducts.length,
      pagination: paginationData,
      data: enhancedProducts,
    });

  } catch (error) {
    logger.error("Failed fetch products:", error);
    next(new AppError("Failed fetch products", 500));
  }
};

/**
 * Get all products by a specific user
 * @route GET /api/products/user/:userId
 */
export const getProductsByUser = async (req, res, next) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return next(new AppError("Invalid user ID", 400));
    }

    // Check for view permissions
    const isOwner = req.user && req.user._id.toString() === userId;
    const isAdmin = req.user && req.user.role === "admin";
    const canViewNonPublished = isOwner || isAdmin;

    // Execute queries in parallel
    const [user, totalCount, publishedCount] = await Promise.all([
      User.findById(userId)
        .select("firstName lastName fullName profilePicture bio")
        .populate({
          path: "products",
          match: canViewNonPublished ? {} : { status: "Published" },
          options: { sort: { createdAt: -1 } },
          select: "-__v -moderation",
          populate: { path: 'category', select: 'name slug' }
        })
        .lean({ virtuals: true }),
      Product.countDocuments({ maker: userId }),
      Product.countDocuments({ maker: userId, status: 'Published'})
    ]);

    if (!user) return next(new AppError("User not found", 404));

    const products = user.products || [];

    res.status(200).json({
      success: true,
      results: products.length,
      data: products,
      meta: {
        totalProducts: totalCount,
        publishedProducts: canViewNonPublished ? publishedCount : products.length,
        isOwnerView: canViewNonPublished
      },
      user: {
        _id: user._id,
        fullName: user.fullName,
        profilePicture: user.profilePicture,
        bio: user.bio
      }
    });

  } catch (error) {
    logger.error(`Failed fetch products for user ${req.params.userId}:`, error);
    next(new AppError("Failed fetch user products", 500));
  }
};

/**
 * Delete a product
 * @route DELETE /api/products/:slug
 */
export const deleteProduct = async (req, res, next) => {
  try {
    const product = req.product; // From middleware
    const productId = product._id;
    const productSlug = product.slug;

    // Trigger Background Deletions (Images, Related Data)
    if (product.thumbnailPublicId) {
      deleteFromCloudinary(product.thumbnailPublicId)
        .catch(err => logger.error(`Failed to delete thumbnail: ${err.message}`));
    }

    (product.gallery || []).forEach(image => {
      if (image.publicId) {
        deleteFromCloudinary(image.publicId)
          .catch(err => logger.error(`Failed to delete gallery image: ${err.message}`));
      }
    });

    // Asynchronous cleanup of related data
    setImmediate(async () => {
      try {
        await Promise.all([
          mongoose.model("Upvote").deleteMany({ product: productId }),
          mongoose.model("Comment").deleteMany({ product: productId }),
          mongoose.model("View").deleteMany({ product: productId }),
          mongoose.model("Bookmark").deleteMany({ product: productId }),
          mongoose.model("RecommendationInteraction").deleteMany({ product: productId }),
        ]);
        logger.info(`Background cleanup completed for product ${productId}`);
      } catch (relatedError) {
        logger.error(`Background cleanup failed for product ${productId}: ${relatedError.message}`);
      }
    });

    // Get the maker ID before deleting the product
    const makerId = product.maker.toString();

    // Delete the product first
    await Product.findByIdAndDelete(productId);

    // Invalidate cache after delete with maker ID
    await cache.invalidateProduct(productId, productSlug, { invalidateRelated: true, makerId });

    // Invalidate recommendation caches
    await recommendationCacheService.invalidateSimilarCache(productId.toString());

    // Explicitly clear the user's products cache
    await cache.delByPattern(`products:user:${makerId}:*`);

    logger.info(`Product ${productId} deleted by user ${req.user._id}`);

    res.status(200).json({
      success: true,
      message: "Product deleted",
      productId: productId.toString(),
      slug: productSlug
    });

  } catch (error) {
    logger.error(`Failed delete product "${req.params.slug}":`, error);
    next(new AppError(`Failed delete product: ${error.message}`, 500));
  }
};

/**
 * Toggle featured status of a product (admin only)
 * @route PATCH /api/products/:slug/feature
 */
export const toggleFeatureProduct = async (req, res, next) => {
  try {
    const product = req.product; // From middleware

    // Toggle featured status
    product.featured = !product.featured;
    product.lastPromoted = product.featured ? new Date() : product.lastPromoted;

    // Initialize flags if not present
    if (!product.flags) product.flags = {};
    product.flags.isPromoted = product.featured;

    await product.save();

    // Invalidate relevant caches
    await Promise.all([
      cache.invalidatePatterns('featured:*'),
      cache.invalidateProduct(product._id, product.slug),
    ]);

    logger.info(`Product ${product._id} featured: ${product.featured} by admin ${req.user._id}`);

    res.status(200).json({
      success: true,
      data: {
        featured: product.featured,
        productId: product._id,
        slug: product.slug
      },
      message: product.featured ? "Product featured" : "Product unfeatured",
    });

  } catch (error) {
    logger.error(`Failed toggle feature "${req.params.slug}":`, error);
    next(new AppError(`Failed update feature status: ${error.message}`, 500));
  }
};

/**
 * Get product by ID (alternative lookup method)
 * @route GET /api/products/id/:id
 */
export const getProductById = async (req, res, next) => {
  try {
    const product = req.product; // From middleware

    // Populate virtual fields first
    await product.populate(['upvotes', 'bookmarkCount']);

    // Force refresh of virtual fields
    await mongoose.model("Upvote").countDocuments({ product: product._id })
      .then(count => product.upvoteCount = count);
    await mongoose.model("Bookmark").countDocuments({ product: product._id })
      .then(count => product.bookmarkCount = count);

    // Fetch Counts & Interactions in parallel
    const [commentCount, userInteractions] = await Promise.all([
      mongoose.model("Comment").countDocuments({ product: product._id }),
      req.user ? Promise.all([
        req.user.hasUpvotedProduct(product._id),
        req.user.hasBookmarkedProduct(product._id)
      ]) : [false, false]
    ]);

    // Get counts from populated virtuals or use direct counts
    const upvoteCount = product.upvoteCount || 0;
    const bookmarkCount = product.bookmarkCount || 0;

    // Get user interaction data if authenticated
    const hasUpvoted = req.user ? userInteractions[0] : false;
    const hasBookmarked = req.user ? userInteractions[1] : false;

    // Log the interaction data for debugging
    if (req.user) {
      logger.debug(`User interaction data for product ${product._id}:`, {
        userId: req.user._id,
        hasUpvoted,
        hasBookmarked,
        upvoteCount,
        bookmarkCount
      });
    }

    // Populate & Prepare Response
    if (!product.populated('maker')) {
      await product.populate({
        path: "maker",
        select: "firstName lastName fullName profilePicture bio"
      });
    }

    if (!product.populated('category')) {
      await product.populate({
        path: "category",
        select: "name slug"
      });
    }

    const productData = product.toObject({ virtuals: true });

    productData.upvotes = {
      count: upvoteCount,
      userHasUpvoted: hasUpvoted
    };

    productData.comments = {
      count: commentCount
    };

    productData.bookmarks = {
      count: bookmarkCount,
      userHasBookmarked: hasBookmarked
    };

    // Add top-level interaction data for consistency
    productData.upvoteCount = upvoteCount;
    productData.bookmarkCount = bookmarkCount;

    // Add userInteractions object for easier access
    productData.userInteractions = {
      hasUpvoted: hasUpvoted,
      hasBookmarked: hasBookmarked
    };

    productData.views = {
      count: Number(productData.views?.count || 0),
      unique: Number(productData.views?.unique || 0)
    };

    // Log the interaction data for debugging
    if (req.user) {
      logger.debug(`User interaction data for product ${product._id} (by ID):`, {
        userId: req.user._id,
        hasUpvoted,
        hasBookmarked,
        upvoteCount,
        bookmarkCount
      });
    }

    res.status(200).json({ success: true, data: productData });

  } catch (error) {
    logger.error(`Error fetching product ID "${req.params.id}":`, error);
    next(new AppError(`Failed fetch product: ${error.message}`, error.statusCode || 500));
  }
};

/**
 * Get all products by a user's username
 * @route GET /api/products/user/username/:username
 * @access Public
 */
export const getProductsByUsername = async (req, res, next) => {
  try {
    const { username } = req.params;

    if (!username || typeof username !== 'string') {
      return next(new AppError("Invalid username format", 400));
    }

    // Find the user by username
    const user = await User.findOne({ username: username.toLowerCase() })
      .select("_id firstName lastName fullName profilePicture bio username");

    if (!user) {
      return next(new AppError("User not found", 404));
    }

    // Check for view permissions
    const isOwner = req.user && req.user._id.toString() === user._id.toString();
    const isAdmin = req.user && req.user.role === "admin";
    const canViewNonPublished = isOwner || isAdmin;

    // Execute queries in parallel
    const [products, totalCount, publishedCount] = await Promise.all([
      Product.find({
        maker: user._id,
        ...(canViewNonPublished ? {} : { status: "Published" })
      })
      .sort({ createdAt: -1 })
      .populate("category", "name slug")
      .select("-__v -moderation")
      .lean({ virtuals: true }),
      Product.countDocuments({ maker: user._id }),
      Product.countDocuments({ maker: user._id, status: 'Published'})
    ]);

    res.status(200).json({
      success: true,
      results: products.length,
      data: products,
      meta: {
        totalProducts: totalCount,
        publishedProducts: canViewNonPublished ? publishedCount : products.length,
        isOwnerView: canViewNonPublished
      },
      user: {
        _id: user._id,
        username: user.username,
        fullName: user.fullName,
        profilePicture: user.profilePicture,
        bio: user.bio
      }
    });

  } catch (error) {
    logger.error(`Failed to fetch products for username ${req.params.username}:`, error);
    next(new AppError("Failed to fetch user products", 500));
  }
};