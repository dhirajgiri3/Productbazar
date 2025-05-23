import React, { useState, useEffect } from 'react';
import { useRecommendation } from "@/lib/contexts/recommendation-context";
import { PieChart, BarChart } from '@mui/x-charts';

const RecommendationInsights = () => {
  const { getRecommendationHistory, getInteractionStats } = useRecommendation();
  const [insights, setInsights] = useState({
    typeBreakdown: [],
    interactionRates: [],
    categoryDistribution: [],
    timeOfDayStats: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadInsights = async () => {
      try {
        const [history, stats] = await Promise.all([
          getRecommendationHistory(),
          getInteractionStats()
        ]);

        // Process data for visualizations
        const typeBreakdown = processTypeBreakdown(history);
        const interactionRates = processInteractionRates(stats);
        const categoryDistribution = processCategoryDistribution(history);
        const timeOfDayStats = processTimeOfDay(stats);

        setInsights({
          typeBreakdown,
          interactionRates,
          categoryDistribution,
          timeOfDayStats
        });
      } catch (error) {
        console.error('Error loading recommendation insights:', error);
      } finally {
        setLoading(false);
      }
    };

    loadInsights();
  }, []);

  if (loading) return <div>Loading insights...</div>;

  return (
    <div className="space-y-8">
      <h2 className="text-xl font-semibold">Recommendation Insights</h2>

      {/* Recommendation Type Distribution */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-medium mb-4">Recommendation Types</h3>
        <div className="h-64">
          <PieChart
            series={[
              {
                data: insights.typeBreakdown,
                innerRadius: 30,
                paddingAngle: 2,
                cornerRadius: 4,
              },
            ]}
          />
        </div>
      </div>

      {/* Interaction Rates */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-medium mb-4">Interaction Rates</h3>
        <div className="h-64">
          <BarChart
            series={[
              {
                data: insights.interactionRates.map(item => item.value),
                label: 'Interaction Rate'
              }
            ]}
            xAxis={[{ 
              data: insights.interactionRates.map(item => item.type),
              scaleType: 'band' 
            }]}
          />
        </div>
      </div>

      {/* Category Distribution */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-medium mb-4">Category Distribution</h3>
        <div className="h-64">
          <BarChart
            series={[
              {
                data: insights.categoryDistribution.map(item => item.count),
                label: 'Recommendations'
              }
            ]}
            xAxis={[{
              data: insights.categoryDistribution.map(item => item.category),
              scaleType: 'band'
            }]}
          />
        </div>
      </div>

      {/* Time of Day Performance */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-medium mb-4">Time of Day Performance</h3>
        <div className="h-64">
          <BarChart
            series={[
              {
                data: insights.timeOfDayStats.map(item => item.interactionRate),
                label: 'Interaction Rate'
              }
            ]}
            xAxis={[{
              data: insights.timeOfDayStats.map(item => item.hour),
              scaleType: 'band'
            }]}
          />
        </div>
      </div>
    </div>
  );
};

// Helper functions to process data for visualizations
const processTypeBreakdown = (history) => {
  const counts = history.reduce((acc, rec) => {
    acc[rec.type] = (acc[rec.type] || 0) + 1;
    return acc;
  }, {});

  return Object.entries(counts).map(([type, value]) => ({
    id: type,
    value,
    label: type.charAt(0).toUpperCase() + type.slice(1)
  }));
};

const processInteractionRates = (stats) => {
  return Object.entries(stats.interactionRates).map(([type, value]) => ({
    type: type.charAt(0).toUpperCase() + type.slice(1),
    value: value * 100
  }));
};

const processCategoryDistribution = (history) => {
  const counts = history.reduce((acc, rec) => {
    if (rec.category) {
      acc[rec.category.name] = (acc[rec.category.name] || 0) + 1;
    }
    return acc;
  }, {});

  return Object.entries(counts)
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
};

const processTimeOfDay = (stats) => {
  return stats.timeOfDay.map((rate, hour) => ({
    hour: `${hour}:00`,
    interactionRate: rate * 100
  }));
};

export default RecommendationInsights;