import { useState } from 'react';
import { Tab, Tabs } from '@mui/material';
import RecommendationPreferences from './RecommendationPreferences';
import CategoryPreferences from './CategoryPreferences';
import TagPreferences from './TagPreferences';
import RecommendationInsights from './RecommendationInsights';

const RecommendationSettings = () => {
  const [activeTab, setActiveTab] = useState(0);

  const handleTabChange = (_, newValue) => {
    setActiveTab(newValue);
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-6">Recommendation Settings</h2>
      
      <Tabs
        value={activeTab}
        onChange={handleTabChange}
        className="mb-6"
        variant="scrollable"
        scrollButtons="auto"
      >
        <Tab label="General" />
        <Tab label="Categories" />
        <Tab label="Tags" />
        <Tab label="Insights" />
      </Tabs>

      <div className="bg-white rounded-lg shadow p-6">
        {activeTab === 0 && <RecommendationPreferences />}
        {activeTab === 1 && <CategoryPreferences />}
        {activeTab === 2 && <TagPreferences />}
        {activeTab === 3 && <RecommendationInsights />}
      </div>
    </div>
  );
};

export default RecommendationSettings;