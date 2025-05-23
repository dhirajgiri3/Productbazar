import Job from "../../models/job/job.model.js";
import logger from "../../utils/logging/logger.js";
import { AppError } from "../../utils/logging/error.js";

// Helper function to build search query
const buildSearchQuery = (searchParams) => {
  const { 
    search, 
    searchFields = 'title,description,skills,company.name', 
    searchMode = 'strict',
    titleRegex,
    skillsRegex
  } = searchParams;
  
  // Base filter - always show published jobs that haven't expired
  const baseFilter = {
    status: "Published",
    expiresAt: { $gt: new Date() }
  };
  
  // If no search parameters, return base filter
  if (!search && !titleRegex && !skillsRegex) {
    return baseFilter;
  }
  
  // If using regex search (fallback method)
  if (titleRegex || skillsRegex) {
    const regexFilter = { ...baseFilter };
    const searchQueries = [];
    
    if (titleRegex) {
      searchQueries.push({ title: { $regex: titleRegex, $options: 'i' } });
    }
    
    if (skillsRegex) {
      searchQueries.push({ skills: { $regex: skillsRegex, $options: 'i' } });
      // Also search in company name
      searchQueries.push({ 'company.name': { $regex: skillsRegex, $options: 'i' } });
    }
    
    if (searchQueries.length > 0) {
      regexFilter.$or = searchQueries;
    }
    
    return regexFilter;
  }
  
  // Process text search
  try {
    // Parse search fields
    const fields = searchFields.split(',').map(field => field.trim());
    
    // Determine search method based on mode
    if (searchMode === 'flexible') {
      // Flexible search uses $or with regex for partial matching
      const flexibleFilter = { ...baseFilter };
      const searchQueries = [];
      
      // Add regex search for each field
      fields.forEach(field => {
        // Handle nested fields like company.name
        if (field.includes('.')) {
          const [parent, child] = field.split('.');
          const query = {};
          query[`${parent}.${child}`] = { $regex: search, $options: 'i' };
          searchQueries.push(query);
        } else {
          const query = {};
          query[field] = { $regex: search, $options: 'i' };
          searchQueries.push(query);
        }
      });
      
      // Add skills array search
      if (fields.includes('skills')) {
        searchQueries.push({ 
          skills: { $elemMatch: { $regex: search, $options: 'i' } } 
        });
      }
      
      flexibleFilter.$or = searchQueries;
      return flexibleFilter;
    } else {
      // Default to text search for strict mode
      return {
        ...baseFilter,
        $text: { $search: search }
      };
    }
  } catch (error) {
    logger.error(`Error building search query: ${error.message}`);
    // Fall back to simple text search
    return {
      ...baseFilter,
      $text: { $search: search }
    };
  }
};

// Enhanced get all jobs with better search
export const getAllJobs = async (req, res, next) => {
  try {
    // Extract pagination parameters
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;
    
    // Build search filter
    const searchFilter = buildSearchQuery(req.query);
    
    // Add other filters from query params
    const { jobType, locationType, experienceLevel } = req.query;
    if (jobType) searchFilter.jobType = jobType;
    if (locationType) searchFilter.locationType = locationType;
    if (experienceLevel) searchFilter.experienceLevel = experienceLevel;
    
    // Determine sort order
    let sortOptions = {};
    if (req.query.sort) {
      const sortBy = req.query.sort.split(",").join(" ");
      sortOptions = { [sortBy.replace('-', '')]: sortBy.startsWith('-') ? -1 : 1 };
    } else {
      sortOptions = { createdAt: -1 };
    }
    
    // If using text search, add text score to sort
    if (req.query.search && (!req.query.searchMode || req.query.searchMode === 'strict')) {
      sortOptions = { score: { $meta: "textScore" }, ...sortOptions };
    }
    
    // Execute query
    let query = Job.find(searchFilter);
    
    // Add text score projection if using text search
    if (req.query.search && (!req.query.searchMode || req.query.searchMode === 'strict')) {
      query = query.select({ score: { $meta: "textScore" } });
    }
    
    // Apply sort, pagination and execute
    const jobs = await query
      .sort(sortOptions)
      .skip(skip)
      .limit(limit)
      .lean();
    
    // Count total matching documents
    const total = await Job.countDocuments(searchFilter);
    
    // Log search results
    logger.info(`Job search: Found ${jobs.length} jobs matching criteria`);
    if (req.query.search) {
      logger.info(`Search term: "${req.query.search}", mode: ${req.query.searchMode || 'strict'}`);
    }
    
    // Return results
    res.status(200).json({
      status: "success",
      results: jobs.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      data: {
        jobs,
      },
    });
  } catch (error) {
    logger.error(`Error in enhanced job search: ${error.message}`);
    next(new AppError(error.message, 500));
  }
};

export default {
  getAllJobs
};
