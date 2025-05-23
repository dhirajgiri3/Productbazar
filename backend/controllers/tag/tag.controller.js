import Tag from "../../models/tag/tag.model.js";
import { AppError } from "../../utils/logging/error.js";
import logger from "../../utils/logging/logger.js";

export const createTag = async (req, res, next) => {
  try {
    const tag = await Tag.create(req.body);
    logger.info(`New tag created: ${tag._id}`);
    res.status(201).json({
      success: true,
      data: tag
    });
  } catch (error) {
    logger.error("Failed to create tag:", error);
    next(new AppError("Failed to create tag", 500));
  }
};

export const getAllTags = async (req, res, next) => {
  try {
    const tags = await Tag.find().sort({ name: 1 });
    res.status(200).json({
      success: true,
      count: tags.length,
      data: tags
    });
  } catch (error) {
    logger.error("Failed to fetch tags:", error);
    next(new AppError("Failed to fetch tags", 500));
  }
};

export const updateTag = async (req, res, next) => {
  try {
    const tag = await Tag.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    
    if (!tag) {
      return next(new AppError("Tag not found", 404));
    }

    logger.info(`Tag updated: ${tag._id}`);
    res.status(200).json({
      success: true,
      data: tag
    });
  } catch (error) {
    logger.error(`Failed to update tag ${req.params.id}:`, error);
    next(new AppError("Failed to update tag", 500));
  }
};

export const deleteTag = async (req, res, next) => {
  try {
    const tag = await Tag.findById(req.params.id);
    
    if (!tag) {
      return next(new AppError("Tag not found", 404));
    }

    await tag.remove();
    logger.info(`Tag deleted: ${tag._id}`);
    res.status(200).json({
      success: true,
      message: "Tag deleted successfully"
    });
  } catch (error) {
    logger.error(`Failed to delete tag ${req.params.id}:`, error);
    next(new AppError("Failed to delete tag", 500));
  }
};

export const getRelatedTags = async (req, res, next) => {
  try {
    const { tagId } = req.params;
    const relatedTags = await Tag.getRelatedTags(tagId);
    res.status(200).json({
      success: true,
      count: relatedTags.length,
      data: relatedTags
    });
  } catch (error) {
    logger.error(`Failed to fetch related tags for ${req.params.tagId}:`, error);
    next(new AppError("Failed to fetch related tags", 500));
  }
};
