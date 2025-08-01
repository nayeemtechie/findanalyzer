import { useState, useEffect } from 'react';
import { searchProducts, searchByUrl, transformFacets } from '../services/searchApi.js';

export const useSearch = (initialQuery = null, searchOnLoad = false) => {
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false); // Start as false since we don't search initially
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    brands: [],
    sizeUnits: [],
    categories: [],
    priceRanges: []
  });
  const [page, setPage] = useState(1);
  const [facets, setFacets] = useState({
    brands: [],
    sizeUnits: [],
    categories: [],
    priceRanges: []
  });
  
  // Keep track of whether we're using a full URL or just a query
  const [useFullUrl, setUseFullUrl] = useState(false);
  const [fullUrl, setFullUrl] = useState('');
  const [shouldSearch, setShouldSearch] = useState(searchOnLoad);

  useEffect(() => {
    // Only perform search if we have a query or URL and shouldSearch is true
    if (shouldSearch && (query || (useFullUrl && fullUrl))) {
      const performSearch = async () => {
        setLoading(true);
        setError(null);
        
        try {
          let data;
          
          if (useFullUrl && fullUrl) {
            // Use the full URL provided by the user
            data = await searchByUrl(fullUrl);
            // Extract query from URL for display purposes
            const queryMatch = fullUrl.match(/query=([^&]*)/);
            if (queryMatch && queryMatch[1]) {
              setQuery(decodeURIComponent(queryMatch[1]));
            }
          } else if (query) {
            // Use the normal search with query parameter
            data = await searchProducts(query, filters, page);
          } else {
            // No search parameters available
            setLoading(false);
            return;
          }
          
          // For better debugging, log the response
          console.log('Search API response:', data);
          
          // Set the entire result object which includes debug info
          setResults(data);
          
          // Transform the facets into a more usable format
          const transformedFacets = transformFacets(data.facets);
          setFacets(transformedFacets);
        } catch (err) {
          setError(err.message || 'An error occurred while searching');
          console.error('Search error:', err);
        } finally {
          setLoading(false);
        }
      };

      performSearch();
    }
  }, [query, filters, page, useFullUrl, fullUrl, shouldSearch]);

  const updateQuery = (newQuery) => {
    setQuery(newQuery);
    setPage(1); // Reset page when query changes
    setUseFullUrl(false); // Switch back to normal search mode
    setShouldSearch(true); // Enable searching
  };

  const updateFilters = (newFilters) => {
    setFilters(newFilters);
    setPage(1); // Reset page when filters change
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
  };
  
  const searchByFullUrl = (url) => {
    setFullUrl(url);
    setUseFullUrl(true);
    setPage(1); // Reset page when using a new URL
    setShouldSearch(true); // Enable searching
  };

  return {
    query,
    results,
    loading,
    error,
    filters,
    page,
    updateQuery,
    updateFilters,
    handlePageChange,
    facets,
    searchByFullUrl
  };
};