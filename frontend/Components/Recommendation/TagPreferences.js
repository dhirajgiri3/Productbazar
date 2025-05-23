import React, { useState, useEffect } from 'react';
import { useRecommendation } from "@/lib/contexts/recommendation-context";
import { Chip, TextField, Slider } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';

const TagPreferences = () => {
  const { updateTagPreferences, tagPreferences } = useRecommendation();
  const [newTag, setNewTag] = useState('');
  const [tags, setTags] = useState([]);

  useEffect(() => {
    if (tagPreferences) {
      setTags(tagPreferences.map(t => ({
        name: t.tag,
        weight: t.score || 1
      })));
    }
  }, [tagPreferences]);

  const handleAddTag = (e) => {
    e.preventDefault();
    if (!newTag.trim() || tags.some(t => t.name === newTag.trim())) return;

    const updatedTags = [...tags, { name: newTag.trim(), weight: 1 }];
    setTags(updatedTags);
    updateTagPreferences(updatedTags);
    setNewTag('');
  };

  const handleRemoveTag = (tagName) => {
    const updatedTags = tags.filter(t => t.name !== tagName);
    setTags(updatedTags);
    updateTagPreferences(updatedTags);
  };

  const handleWeightChange = (tagName, newWeight) => {
    const updatedTags = tags.map(t => 
      t.name === tagName ? { ...t, weight: newWeight } : t
    );
    setTags(updatedTags);
    updateTagPreferences(updatedTags);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Tag Preferences</h3>
        <form onSubmit={handleAddTag} className="flex gap-2 mb-4">
          <TextField
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            placeholder="Add a tag"
            size="small"
            className="flex-1"
          />
          <button
            type="submit"
            className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <AddIcon />
          </button>
        </form>
      </div>

      <div className="space-y-4">
        {tags.map(tag => (
          <div key={tag.name} className="bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between mb-2">
              <div className="flex items-center gap-2">
                <Chip
                  label={tag.name}
                  onDelete={() => handleRemoveTag(tag.name)}
                  color="primary"
                />
              </div>
              <span className="text-sm text-gray-600">
                Weight: {tag.weight.toFixed(1)}
              </span>
            </div>
            <Slider
              value={tag.weight}
              onChange={(_, value) => handleWeightChange(tag.name, value)}
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
        ))}
      </div>

      {tags.length === 0 && (
        <div className="text-gray-500 text-center py-4">
          Add tags to customize your recommendations
        </div>
      )}
    </div>
  );
};

export default TagPreferences;