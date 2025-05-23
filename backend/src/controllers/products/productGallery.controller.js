import Product from "../../models/product/product.model.js";
import { AppError } from "../../utils/logging/error.js";
import logger from "../../utils/logging/logger.js";
import {
  deleteFromCloudinary,
} from "../../utils/storage/cloudinary.utils.js";

/**
 * Add gallery images to a product
 * @route POST /api/v1/products/:slug/gallery
 * @access Private
 */
export const addGalleryImages = async (req, res, next) => {
  try {
    const { slug } = req.params;
    if (!slug) {
      return next(new AppError("Product slug is required", 400));
    }

    const product = await Product.findOne({ slug });
    if (!product) {
      return next(new AppError("Product not found", 404));
    }

    if (
      product.maker.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return next(
        new AppError("You are not authorized to update this product", 403)
      );
    }

    // Validate gallery size limit
    if (product.gallery.length + req.files.length > 10) {
      return next(
        new AppError("Maximum gallery size of 10 images would be exceeded", 400)
      );
    }

    // Check if we have files
    if (!req.files || req.files.length === 0) {
      return next(new AppError("No images provided", 400));
    }

    // Check if we have Cloudinary results from middleware
    if (!req.cloudinaryFiles || req.cloudinaryFiles.length === 0) {
      return next(new AppError("Image upload to cloud storage failed", 500));
    }

    // Add each uploaded image to the gallery
    const newGalleryItems = req.cloudinaryFiles.map((file, index) => {
      return {
        url: file.url,
        publicId: file.publicId,
        caption: req.body.captions ? req.body.captions[index] : "",
        addedAt: new Date(),
        order: product.gallery.length + index,
      };
    });

    // Add to gallery array
    product.gallery.push(...newGalleryItems);
    await product.save();

    res.status(200).json({
      success: true,
      data: product.gallery,
      message: "Gallery images uploaded successfully",
    });
  } catch (error) {
    logger.error("Failed to upload gallery images:", error);
    next(new AppError("Failed to upload gallery images: " + error.message, 500));
  }
};

/**
 * Remove a gallery image
 * @route DELETE /api/v1/products/:slug/gallery/:imageId
 * @access Private
 */
export const removeGalleryImage = async (req, res, next) => {
  try {
    const { slug, imageId } = req.params;

    if (!slug || !imageId) {
      return next(new AppError("Product slug and image ID are required", 400));
    }

    const product = await Product.findOne({ slug });

    if (!product) {
      return next(new AppError("Product not found", 404));
    }

    // Check if user is the owner
    if (
      product.maker.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return next(
        new AppError("You are not authorized to update this product", 403)
      );
    }

    // Find the image
    const imageIndex = product.gallery.findIndex(
      (img) => img._id.toString() === imageId
    );

    if (imageIndex === -1) {
      return next(new AppError("Gallery image not found", 404));
    }

    // Delete from Cloudinary if it has a publicId
    if (product.gallery[imageIndex].publicId) {
      try {
        await deleteFromCloudinary(product.gallery[imageIndex].publicId);
      } catch (cloudinaryError) {
        logger.error("Error deleting from Cloudinary:", cloudinaryError);
        // Continue even if Cloudinary deletion fails
      }
    }

    // Remove from gallery array
    product.gallery.splice(imageIndex, 1);
    await product.save();

    res.status(200).json({
      success: true,
      data: product.gallery,
      message: "Gallery image deleted successfully",
    });
  } catch (error) {
    logger.error("Failed to delete gallery image:", error);
    next(new AppError("Failed to delete gallery image", 500));
  }
};

/**
 * Update gallery image order
 * @route PUT /api/v1/products/:slug/gallery/reorder
 * @access Private
 */
export const updateGalleryOrder = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const { imageIds } = req.body;

    if (!slug) {
      return next(new AppError("Product slug is required", 400));
    }

    if (!imageIds || !Array.isArray(imageIds) || imageIds.length === 0) {
      return next(new AppError("Image IDs array is required", 400));
    }

    const product = await Product.findOne({ slug });

    if (!product) {
      return next(new AppError("Product not found", 404));
    }

    // Check if user is the owner
    if (
      product.maker.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return next(
        new AppError("You are not authorized to update this product", 403)
      );
    }

    // Validate that all provided IDs exist in the gallery
    const galleryIds = product.gallery.map((img) => img._id.toString());
    const allIdsExist = imageIds.every((id) => galleryIds.includes(id));

    if (!allIdsExist) {
      return next(new AppError("One or more image IDs are invalid", 400));
    }

    // Validate that all gallery images are included
    if (imageIds.length !== product.gallery.length) {
      return next(
        new AppError("All gallery images must be included in the order", 400)
      );
    }

    // Create a map of current gallery images
    const galleryMap = {};
    product.gallery.forEach((img) => {
      galleryMap[img._id.toString()] = img;
    });

    // Create new gallery array in the specified order
    const newGallery = imageIds.map((id) => galleryMap[id]);

    // Update gallery
    product.gallery = newGallery;
    await product.save();

    res.status(200).json({
      success: true,
      data: product.gallery,
      message: "Gallery order updated successfully",
    });
  } catch (error) {
    logger.error("Failed to update gallery order:", error);
    next(new AppError("Failed to update gallery order", 500));
  }
};
