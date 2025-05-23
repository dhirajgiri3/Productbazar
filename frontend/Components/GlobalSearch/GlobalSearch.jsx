import { useState, useEffect, useCallback, useRef } from 'react';
import { useDebounce } from '../../hooks/useDebounce';
import { motion, AnimatePresence } from 'framer-motion';

export const GlobalSearch = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({});
  const [isSearching, setIsSearching] = useState(false);
  const [selectedType, setSelectedType] = useState('all');
  const [suggestions, setSuggestions] = useState([]);
  const searchRef = useRef(null);

  const debouncedQuery = useDebounce(query, 300);

  const searchTypes = [
    { id: 'all', label: 'All' },
    { id: 'products', label: 'Products' },
    { id: 'jobs', label: 'Jobs' },
    { id: 'projects', label: 'Projects' }
  ];

  const handleSearch = useCallback(async () => {
    if (!debouncedQuery.trim()) {
      setResults({});
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(
        `/api/v1/search?q=${encodeURIComponent(debouncedQuery)}&type=${selectedType}`
      );
      const data = await response.json();
      setResults(data);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsSearching(false);
    }
  }, [debouncedQuery, selectedType]);

  useEffect(() => {
    handleSearch();
  }, [debouncedQuery, selectedType]);

  return (
    <div className="relative w-full max-w-3xl mx-auto" ref={searchRef}>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search across products, jobs, and more..."
            className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 text-gray-800 bg-white"
          />
          {isSearching && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity }}
                className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full"
              />
            </div>
          )}
        </div>

        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="px-4 py-2 rounded-lg border border-gray-200 text-gray-800 bg-white"
        >
          {searchTypes.map(type => (
            <option key={type.id} value={type.id}>{type.label}</option>
          ))}
        </select>
      </div>

      <AnimatePresence>
        {Object.keys(results).length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute w-full mt-2 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden"
          >
            {/* Render results by type */}
            {results.products?.length > 0 && (
              <div className="p-4">
                <h3 className="text-sm font-semibold text-gray-600 mb-2">Products</h3>
                {results.products.map(product => (
                  <ProductResult key={product._id} product={product} />
                ))}
              </div>
            )}

            {/* Add similar sections for jobs and other result types */}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Result item components
const ProductResult = ({ product }) => (
  <motion.div
    whileHover={{ backgroundColor: '#f8f9fa' }}
    className="p-2 rounded cursor-pointer"
  >
    <div className="flex items-center gap-3">
      {product.image && (
        <img src={product.image} alt={product.name} className="w-10 h-10 rounded object-cover" />
      )}
      <div>
        <h4 className="font-medium text-gray-900">{product.name}</h4>
        <p className="text-sm text-gray-500">{product.tagline}</p>
      </div>
    </div>
  </motion.div>
);