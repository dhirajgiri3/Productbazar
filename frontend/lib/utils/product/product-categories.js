// Define product categories - keep in sync with backend
export const categories = [
  'AI',
  'SaaS',
  'Fintech',
  'Design',
  'Developer Tools',
  'Marketing',
  'E-commerce',
  'Health',
  'Education',
  'Social',
  'Mobile',
  'Productivity',
  'Entertainment',
  'Analytics',
  'Other'
];

export const categoryIcons = {
  'AI': {
    icon: '🤖',
    color: 'bg-blue-50 text-blue-600'
  },
  'SaaS': {
    icon: '☁️',
    color: 'bg-indigo-50 text-indigo-600'
  },
  'Fintech': {
    icon: '💰',
    color: 'bg-green-50 text-green-600'
  },
  'Design': {
    icon: '🎨',
    color: 'bg-pink-50 text-pink-600'
  },
  'Developer Tools': {
    icon: '🛠️',
    color: 'bg-gray-50 text-gray-600'
  },
  'Marketing': {
    icon: '📢',
    color: 'bg-orange-50 text-orange-600'
  },
  'Other': {
    icon: '🔮',
    color: 'bg-violet-50 text-violet-600'
  }
};

// Export categorized industries for more specific classification
export const industries = {
  'Technology': [
    'AI',
    'Developer Tools',
    'Analytics',
    'Mobile',
    'SaaS'
  ],
  'Business': [
    'Marketing',
    'E-commerce',
    'Fintech',
    'Productivity'
  ],
  'Creative': [
    'Design',
    'Entertainment'
  ],
  'Health & Education': [
    'Health',
    'Education'
  ],
  'Social & Other': [
    'Social',
    'Other'
  ]
};

export const getCategoryDetails = (category) => {
  return categoryIcons[category] || categoryIcons['Other'];
};

export default categories;
