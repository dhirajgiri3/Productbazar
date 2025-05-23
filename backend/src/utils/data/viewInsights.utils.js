import logger from '../logging/logger.js';

/**
 * Calculate trend using linear regression
 * @param {Array} points - Array of data points with x and y values
 * @returns {Object} - Trend information including slope and confidence
 */
const calculateLinearTrend = (points) => {
  if (!points || points.length < 3) {
    return { slope: 0, trend: 'stable', confidence: 0 };
  }
  
  // Convert dates to day numbers (0, 1, 2, ...) for calculation
  const xValues = points.map((_, i) => i);
  const yValues = points.map(p => p.count || p.value || 0);
  
  // Calculate means
  const n = points.length;
  const meanX = xValues.reduce((sum, x) => sum + x, 0) / n;
  const meanY = yValues.reduce((sum, y) => sum + y, 0) / n;
  
  // Calculate slope using least squares method
  let numerator = 0;
  let denominator = 0;
  
  for (let i = 0; i < n; i++) {
    numerator += (xValues[i] - meanX) * (yValues[i] - meanY);
    denominator += Math.pow(xValues[i] - meanX, 2);
  }
  
  const slope = denominator !== 0 ? numerator / denominator : 0;
  
  // Calculate R-squared for confidence level
  const totalSumSquares = yValues.reduce((sum, y) => sum + Math.pow(y - meanY, 2), 0);
  
  // Calculate predicted Y values
  const predictedY = xValues.map(x => meanY + slope * (x - meanX));
  
  // Calculate residual sum of squares
  const residualSumSquares = yValues.reduce((sum, y, i) => sum + Math.pow(y - predictedY[i], 2), 0);
  
  // Calculate R-squared (coefficient of determination)
  const rSquared = totalSumSquares !== 0 ? 1 - (residualSumSquares / totalSumSquares) : 0;
  
  // Calculate percentage change over the period
  const firstValue = yValues[0];
  const lastValue = yValues[yValues.length - 1];
  
  const percentageChange = firstValue !== 0 
    ? ((lastValue - firstValue) / firstValue) * 100 
    : 0;
  
  // Determine trend direction and confidence
  let trend = 'stable';
  if (slope > 0.05 * meanY) trend = 'increasing';
  else if (slope < -0.05 * meanY) trend = 'decreasing';
  
  return {
    slope,
    trend,
    confidence: Math.abs(rSquared),
    percentageChange: Math.round(percentageChange)
  };
};

/**
 * Generate insights based on view statistics and engagement metrics
 * @param {Object} stats - View statistics from getProductStats
 * @param {Object} engagementMetrics - Metrics from calculateEngagementMetrics
 * @returns {Object} - Insights object with analysis
 */
export const generateViewInsights = (stats, engagementMetrics) => {
  try {
    const insights = {
      summary: [],
      trends: {
        views: { trend: 'stable', percentage: 0 },
        engagement: { trend: 'stable', percentage: 0 },
        confidence: 0
      },
      recommendations: []
    };
    
    // Check if we have enough data to generate meaningful insights
    const totalViews = stats.totals?.totalViews || engagementMetrics?.totalViews || 0;
    
    if (totalViews < 5) {
      insights.summary.push('Not enough data to generate meaningful insights yet.');
      return insights;
    }
    
    // Generate summary based on available data
    const uniqueViewers = stats.totals?.uniqueViewers || engagementMetrics?.uniqueViewers || 0;
    insights.summary.push(`Your product had ${totalViews} views from ${uniqueViewers} unique visitors.`);
    
    // Analyze daily trends if available using linear regression
    if (stats.dailyViews && stats.dailyViews.length >= 3) {
      // Calculate view trend using linear regression
      const trendResult = calculateLinearTrend(stats.dailyViews);
      
      insights.trends.views.trend = trendResult.trend;
      insights.trends.views.percentage = trendResult.percentageChange;
      insights.trends.confidence = trendResult.confidence;
      
      // Add trend information to summary
      if (trendResult.trend === 'increasing' && trendResult.percentageChange > 10) {
        insights.summary.push(`Views are trending upward (+${trendResult.percentageChange}%).`);
      } else if (trendResult.trend === 'decreasing' && trendResult.percentageChange < -10) {
        insights.summary.push(`Views are trending downward (${trendResult.percentageChange}%).`);
      }
      
      // Add confidence-based insights
      if (trendResult.confidence > 0.7) {
        if (trendResult.trend === 'increasing') {
          insights.summary.push('This upward trend is consistent and statistically significant.');
        } else if (trendResult.trend === 'decreasing') {
          insights.summary.push('This downward trend is consistent and may require attention.');
          insights.recommendations.push('Consider refreshing your content or promoting it through additional channels');
        }
      } else if (trendResult.confidence < 0.3 && stats.dailyViews.length > 7) {
        insights.summary.push('View patterns show high variability day-to-day.');
        insights.recommendations.push('Consider a more consistent content promotion strategy');
      }
    }
    
    // Analyze device usage if available
    if (stats.devices && stats.devices.length > 0) {
      const deviceTypes = stats.devices.map(d => d.device);
      const totalDeviceCount = stats.devices.reduce((sum, d) => sum + d.count, 0);
      
      if (totalDeviceCount > 0) {
        // Mobile analysis with adjusted thresholds
        const mobileDevice = stats.devices.find(d => d.device === 'mobile');
        const mobileCount = mobileDevice ? mobileDevice.count : 0;
        const mobilePercentage = Math.round((mobileCount / totalDeviceCount) * 100);
        
        if (mobilePercentage > 75) {
          insights.summary.push(`${mobilePercentage}% of your visitors use mobile devices.`);
          insights.recommendations.push('Prioritize the mobile experience and perform mobile-specific testing');
        } else if (mobilePercentage < 25 && totalViews > 20) {
          insights.summary.push(`${100 - mobilePercentage}% of your visitors use desktop devices.`);
          insights.recommendations.push('Your audience is primarily desktop-based - ensure your desktop experience is optimized');
        }
        
        // Add device diversity insights
        if (deviceTypes.length === 1 && totalViews > 15) {
          insights.recommendations.push('Your traffic comes from only one device type - consider testing on other platforms');
        }
      }
    }
    
    // Add engagement insights if available
    if (engagementMetrics && engagementMetrics.averageViewDuration) {
      const avgDurationSeconds = engagementMetrics.averageViewDuration;
      
      if (avgDurationSeconds > 0) {
        const minutes = Math.floor(avgDurationSeconds / 60);
        const seconds = Math.floor(avgDurationSeconds % 60);
        
        const durationText = minutes > 0 ? 
          `${minutes} min ${seconds} sec` : 
          `${seconds} seconds`;
          
        insights.summary.push(`Visitors spend an average of ${durationText} viewing your product.`);
        
        // Adjust thresholds based on content type
        const contentType = stats.contentType || 'standard';
        const durationThresholds = {
          standard: { low: 30, high: 120 },
          article: { low: 60, high: 180 },
          video: { low: 90, high: 240 },
          tool: { low: 120, high: 300 }
        };
        
        const thresholds = durationThresholds[contentType] || durationThresholds.standard;
        
        if (avgDurationSeconds < thresholds.low) {
          insights.recommendations.push('Consider adding more engaging content to increase view time');
        } else if (avgDurationSeconds > thresholds.high) {
          insights.summary.push('Your content is keeping visitors engaged for a significant time.');
          insights.recommendations.push('Consider adding call-to-actions for this engaged audience');
        }
      }
    }
    
    // Add traffic source insights with more nuanced suggestions
    if (stats.sources && stats.sources.length > 0) {
      const primarySource = stats.sources[0];
      const sourcePercentage = Math.round((primarySource.count / totalViews) * 100);
      
      insights.summary.push(`${sourcePercentage}% of traffic comes from ${primarySource.source === 'direct' ? 'direct visits' : primarySource.source}.`);
      
      // More specific recommendations based on primary source
      if (sourcePercentage > 80 && stats.sources.length <= 2) {
        insights.recommendations.push('Your traffic sources are concentrated - diversify by sharing on additional platforms');
        
        if (primarySource.source === 'direct') {
          insights.recommendations.push('High direct traffic suggests word-of-mouth referrals - consider adding social sharing options');
        } else if (primarySource.source === 'social') {
          insights.recommendations.push('Consider content marketing or SEO to diversify beyond social traffic');
        } else if (primarySource.source === 'search') {
          insights.recommendations.push('Consider social media promotion to complement your SEO traffic');
        }
      }
      
      // Add insights for multi-source traffic
      if (stats.sources.length >= 3) {
        insights.summary.push('Your traffic is coming from multiple sources, which is healthy for sustainable growth.');
      }
    }
    
    // Add geographic insights if available
    if (stats.countries && stats.countries.length > 0) {
      const topCountry = stats.countries[0];
      const countryPercentage = Math.round((topCountry.count / totalViews) * 100);
      
      if (countryPercentage > 90) {
        insights.summary.push(`${countryPercentage}% of your visitors are from ${topCountry.country}.`);
        if (stats.countries.length === 1 && totalViews > 20) {
          insights.recommendations.push('Consider if your product could benefit from international exposure');
        }
      } else if (stats.countries.length > 5) {
        insights.summary.push('Your product is attracting a global audience.');
      }
    }
    
    return insights;
  } catch (error) {
    logger.error('Error generating view insights:', error);
    return {
      summary: ['Unable to generate insights due to an error.'],
      trends: { views: { trend: 'stable', percentage: 0 }, confidence: 0 },
      recommendations: []
    };
  }
};

export default { generateViewInsights };
