import { useState, useEffect } from 'react';
import { useRecommendation } from "@/lib/contexts/recommendation-context";
import { Switch, Chip, Slider } from '@mui/material';

const RecommendationPreferences = () => {
  const {
    recommendationPreferences,
    recommendationSettings,
    disabledTypes,
    updateRecommendationPreferences,
    updateSettings,
    RECOMMENDATION_TYPES
  } = useRecommendation();

  const [localSettings, setLocalSettings] = useState(recommendationSettings);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    setLocalSettings(recommendationSettings);
  }, [recommendationSettings]);

  const handleToggleType = async (type) => {
    const newDisabled = disabledTypes.includes(type) 
      ? disabledTypes.filter(t => t !== type)
      : [...disabledTypes, type];
      
    await updateRecommendationPreferences({
      disabledRecommendationTypes: newDisabled
    });
  };

  const handleSettingChange = (setting, value) => {
    setLocalSettings(prev => ({
      ...prev,
      [setting]: value
    }));
    setIsDirty(true);
  };

  const saveSettings = async () => {
    await updateSettings(localSettings);
    setIsDirty(false);
  };

  return (
    <div className="space-y-6 p-4 bg-white rounded-lg shadow">
      {/* Recommendation Types */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Recommendation Sources</h3>
        <div className="flex flex-wrap gap-3">
          {Object.values(RECOMMENDATION_TYPES).map(type => (
            <Chip
              key={type}
              label={type.charAt(0).toUpperCase() + type.slice(1)}
              onClick={() => handleToggleType(type)}
              color={disabledTypes.includes(type) ? 'default' : 'primary'}
              variant={disabledTypes.includes(type) ? 'outlined' : 'filled'}
            />
          ))}
        </div>
      </div>

      {/* Personalization Settings */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Personalization</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span>Enable Personalization</span>
            <Switch
              checked={localSettings.enablePersonalization}
              onChange={e => handleSettingChange('enablePersonalization', e.target.checked)}
            />
          </div>
          
          <div>
            <label className="block mb-2">Diversification Level</label>
            <Slider
              value={localSettings.diversifiedFeedWeight}
              onChange={(_, value) => handleSettingChange('diversifiedFeedWeight', value)}
              min={0}
              max={2}
              step={0.1}
              marks={[
                { value: 0, label: 'Low' },
                { value: 1, label: 'Medium' },
                { value: 2, label: 'High' }
              ]}
            />
          </div>
          
          <div>
            <label className="block mb-2">Maximum Recommendations</label>
            <Slider
              value={localSettings.maxRecommendations}
              onChange={(_, value) => handleSettingChange('maxRecommendations', value)}
              min={5}
              max={50}
              step={5}
              marks={[
                { value: 5, label: '5' },
                { value: 20, label: '20' },
                { value: 35, label: '35' },
                { value: 50, label: '50' }
              ]}
            />
          </div>
        </div>
      </div>

      {/* Save Button */}
      {isDirty && (
        <div className="flex justify-end">
          <button
            onClick={saveSettings}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Save Changes
          </button>
        </div>
      )}
    </div>
  );
};

export default RecommendationPreferences;