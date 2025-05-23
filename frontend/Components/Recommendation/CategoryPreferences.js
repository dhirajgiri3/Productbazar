import React, { useState, useEffect } from 'react';
import { useRecommendation } from "@/lib/contexts/recommendation-context";
import { Slider, Chip } from '@mui/material';

const CategoryPreferences = () => {
  const { updateCategoryPreferences, categories } = useRecommendation();
  const [preferences, setPreferences] = useState({});
  const [selectedCategories, setSelectedCategories] = useState([]);

  useEffect(() => {
    if (categories) {
      const initialPrefs = {};
      categories.forEach(cat => {
        initialPrefs[cat._id] = cat.score || 1;
      });
      setPreferences(initialPrefs);
      setSelectedCategories(categories.filter(cat => cat.score > 0).map(cat => cat._id));
    }
  }, [categories]);

  const handleCategoryToggle = (categoryId) => {
    setSelectedCategories(prev => {
      const newSelected = prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId];

      // Update preferences when deselecting
      if (!newSelected.includes(categoryId)) {
        setPreferences(prev => ({
          ...prev,
          [categoryId]: 0
        }));
        updateCategoryPreferences({
          [categoryId]: 0
        });
      }

      return newSelected;
    });
  };

  const handleWeightChange = (categoryId, value) => {
    setPreferences(prev => ({
      ...prev,
      [categoryId]: value
    }));
    updateCategoryPreferences({
      [categoryId]: value
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Category Preferences</h3>
        <div className="flex flex-wrap gap-2">
          {categories?.map(category => (
            <Chip
              key={category._id}
              label={category.name}
              onClick={() => handleCategoryToggle(category._id)}
              color={selectedCategories.includes(category._id) ? 'primary' : 'default'}
              variant={selectedCategories.includes(category._id) ? 'filled' : 'outlined'}
            />
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {selectedCategories.map(categoryId => {
          const category = categories.find(c => c._id === categoryId);
          if (!category) return null;

          return (
            <div key={categoryId} className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between mb-2">
                <span className="font-medium">{category.name}</span>
                <span className="text-sm text-gray-600">
                  Weight: {preferences[categoryId]?.toFixed(1)}
                </span>
              </div>
              <Slider
                value={preferences[categoryId] || 1}
                onChange={(_, value) => handleWeightChange(categoryId, value)}
                min={0.1}
                max={2}
                step={0.1}
                marks={[
                  { value: 0.1, label: 'Low' },
                  { value: 1, label: 'Normal' },
                  { value: 2, label: 'High' }
                ]}
              />
            </div>
          );
        })}
      </div>

      {selectedCategories.length === 0 && (
        <div className="text-gray-500 text-center py-4">
          Select categories to set your preferences
        </div>
      )}
    </div>
  );
};

export default CategoryPreferences;