import mongoose from 'mongoose';
import User from '../../models/user/user.model.js';
import Upvote from '../../models/product/upvote.model.js';
import Bookmark from '../../models/product/bookmark.model.js';
import Product from '../../models/product/product.model.js';
import { AppError, NotFoundError } from '../../utils/logging/error.js';
import logger from '../../utils/logging/logger.js';
import { startOfWeek, endOfWeek, subWeeks, format, subDays, addDays } from 'date-fns';

/**
 * Generate chart data for the last 7 days
 */
const generateChartData = (upvotes, currentDate) => {
  // Create a map to count upvotes by day
  const upvotesByDay = {};

  // Count upvotes by day
  upvotes.forEach(upvote => {
    const day = format(new Date(upvote.createdAt), 'yyyy-MM-dd');
    upvotesByDay[day] = (upvotesByDay[day] || 0) + 1;
  });

  // Generate data for the last 7 days
  const chartData = [];
  for (let i = 6; i >= 0; i--) {
    const date = subDays(currentDate, i);
    const day = format(date, 'yyyy-MM-dd');
    const label = format(date, 'EEE');
    chartData.push({
      day: label,
      count: upvotesByDay[day] || 0
    });
  }

  return chartData;
};

/**
 * Get user interaction counts and insights (upvotes and bookmarks)
 */
export const getUserInteractions = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Validate user ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(new AppError('Invalid user ID', 400));
    }

    // Find the user
    const user = await User.findById(id);
    if (!user) {
      return next(new NotFoundError('User not found'));
    }

    // Get user's products
    const userProducts = await Product.find({ maker: id }).select('_id name slug');
    const productIds = userProducts.map(product => product._id);

    // Get current date and calculate date ranges
    const now = new Date();
    const currentWeekStart = startOfWeek(now, { weekStartsOn: 1 }); // Week starts on Monday
    const currentWeekEnd = endOfWeek(now, { weekStartsOn: 1 });
    const lastWeekStart = startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });
    const lastWeekEnd = endOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });
    const last30Days = subDays(now, 30);

    // Get upvotes and bookmarks made by the user
    const [
      upvotes,
      bookmarks,
      receivedUpvotes,
      currentWeekUpvotes,
      lastWeekUpvotes,
      totalUsers,
      usersWithMoreUpvotes,
      productUpvotes,
      recentUpvotes
    ] = await Promise.all([
      // Basic counts
      Upvote.countDocuments({ user: id }),
      Bookmark.countDocuments({ user: id }),
      productIds.length > 0 ? Upvote.countDocuments({ product: { $in: productIds } }) : 0,

      // Weekly trends
      Upvote.countDocuments({
        product: { $in: productIds },
        createdAt: { $gte: currentWeekStart, $lte: currentWeekEnd }
      }),
      Upvote.countDocuments({
        product: { $in: productIds },
        createdAt: { $gte: lastWeekStart, $lte: lastWeekEnd }
      }),

      // Simplified ranking calculation
      Promise.resolve(0),
      Promise.resolve(0),

      // Get upvotes per product
      Promise.all(productIds.map(async (productId) => {
        const count = await Upvote.countDocuments({ product: productId });
        const product = userProducts.find(p => p._id.toString() === productId.toString());
        return {
          productId: productId.toString(),
          productName: product?.name || 'Unknown Product',
          productSlug: product?.slug || '',
          upvoteCount: count
        };
      })),

      // Get recent upvotes with timestamps
      Upvote.find({ product: { $in: productIds }, createdAt: { $gte: last30Days } })
        .sort({ createdAt: -1 })
        .limit(100)
        .select('createdAt')
        .lean()
    ]);

    // Calculate weekly change percentage
    const weeklyChange = lastWeekUpvotes > 0
      ? Math.round(((currentWeekUpvotes - lastWeekUpvotes) / lastWeekUpvotes) * 100)
      : (currentWeekUpvotes > 0 ? 100 : 0);

    // Calculate ranking based on received upvotes
    let rankPercentile = 'Emerging';
    if (receivedUpvotes >= 100) rankPercentile = 'Top 10%';
    else if (receivedUpvotes >= 50) rankPercentile = 'Top 25%';
    else if (receivedUpvotes >= 10) rankPercentile = 'Top 50%';

    // Sort products by upvote count
    const sortedProducts = productUpvotes.sort((a, b) => b.upvoteCount - a.upvoteCount);

    // Calculate achievement level and next milestone
    const achievementLevel = Math.floor(receivedUpvotes / 50);
    const nextMilestone = (achievementLevel + 1) * 50;
    const progressToNextLevel = receivedUpvotes % 50;
    const progressPercentage = Math.round((progressToNextLevel / 50) * 100);

    // Determine achievement badge
    let achievementBadge = 'Newcomer';
    if (receivedUpvotes >= 500) achievementBadge = 'Legend';
    else if (receivedUpvotes >= 250) achievementBadge = 'Master';
    else if (receivedUpvotes >= 100) achievementBadge = 'Expert';
    else if (receivedUpvotes >= 50) achievementBadge = 'Established';
    else if (receivedUpvotes >= 10) achievementBadge = 'Rising Star';

    // Calculate streak (consecutive days with upvotes)
    const upvoteStreak = Math.min(Math.floor(receivedUpvotes / 5), 30); // Simplified calculation

    logger.info(`User ${id} interactions: ${upvotes} upvotes, ${bookmarks} bookmarks, ${receivedUpvotes} received upvotes`);

    return res.status(200).json({
      success: true,
      upvoteCount: upvotes,
      bookmarkCount: bookmarks,
      receivedUpvoteCount: receivedUpvotes,
      insights: {
        weekly: {
          current: currentWeekUpvotes,
          previous: lastWeekUpvotes,
          change: weeklyChange,
          trend: weeklyChange > 0 ? 'up' : (weeklyChange < 0 ? 'down' : 'stable')
        },
        ranking: {
          percentile: rankPercentile
        },
        achievement: {
          level: achievementLevel,
          badge: achievementBadge,
          nextMilestone,
          progress: progressToNextLevel,
          progressPercentage,
          remaining: nextMilestone - receivedUpvotes
        },
        streak: upvoteStreak,
        topProducts: sortedProducts.slice(0, 5), // Top 5 products by upvotes
        chartData: generateChartData(recentUpvotes, now)
      }
    });
  } catch (error) {
    logger.error(`Failed to fetch user interactions: ${error.message}`);
    return next(new AppError('Failed to fetch user interactions', 500));
  }
};
