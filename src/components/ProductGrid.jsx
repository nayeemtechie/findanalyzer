import { useState } from 'react';
import { extractScoringInfoByIndex } from '../services/searchApi.js';
import { ProductScoreDetail } from './ProductScoreDetail.jsx';

const ProductCard = ({ product, loading, onScoreClick, debug, productIndex }) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  const handleImageError = () => {
    setImageError(true);
    setImageLoading(false);
  };

  const handleImageLoad = () => {
    setImageLoading(false);
  };

  const formatScore = (score) => {
    if (typeof score === 'number') {
      return score.toFixed(2);
    }
    return 'N/A';
  };

  // Check if we have debug data and scoring information
  const hasScoreData = debug && debug.solrDebug && debug.solrDebug.explain && onScoreClick;

  const handleScoreButtonClick = () => {
    console.log('Score button clicked for product:', product.name);
    console.log('Debug data available:', !!debug);
    console.log('Solr debug available:', !!(debug && debug.solrDebug));
    console.log('Explain data available:', !!(debug && debug.solrDebug && debug.solrDebug.explain));
    
    if (onScoreClick) {
      onScoreClick(product, productIndex);
    } else {
      console.error('onScoreClick function not provided');
    }
  };

  if (loading) {
    return (
      <div className="border rounded-lg p-4 animate-pulse">
        <div className="bg-gray-300 h-48 rounded mb-4"></div>
        <div className="bg-gray-300 h-4 rounded mb-2"></div>
        <div className="bg-gray-300 h-4 rounded w-2/3 mb-2"></div>
        <div className="bg-gray-300 h-6 rounded w-1/3"></div>
      </div>
    );
  }

  return (
    <div className="border rounded-lg p-4 hover:shadow-lg transition-shadow bg-white">
      {/* Product Image */}
      <div className="relative mb-4">
        {imageLoading && (
          <div className="absolute inset-0 bg-gray-200 animate-pulse rounded flex items-center justify-center">
            <span className="text-gray-400">Loading...</span>
          </div>
        )}
        {imageError ? (
          <div className="h-48 bg-gray-100 rounded flex items-center justify-center">
            <span className="text-gray-400">No image available</span>
          </div>
        ) : (
          <img
            src={product.imageId}
            alt={product.name}
            className={`w-full h-48 object-cover rounded ${imageLoading ? 'opacity-0' : 'opacity-100'}`}
            onError={handleImageError}
            onLoad={handleImageLoad}
          />
        )}
      </div>

      {/* Product Info */}
      <div className="space-y-2">
        <h3 className="font-medium text-gray-900 line-clamp-2 text-sm">
          {product.name}
        </h3>
        
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">
            ID: {product.id}
          </span>
          {product.score && (
            <span className="text-sm font-medium text-blue-600">
              Score: {formatScore(product.score)}
            </span>
          )}
        </div>

        {/* Score Analysis Button */}
        {hasScoreData ? (
          <button
            onClick={handleScoreButtonClick}
            className="w-full mt-3 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
          >
            View Score Analysis
          </button>
        ) : (
          <div className="w-full mt-3 px-3 py-2 bg-gray-50 text-gray-500 rounded-lg text-sm text-center">
            {debug ? 'No scoring data available' : 'Debug data not available'}
          </div>
        )}
      </div>
    </div>
  );
};

export const ProductGrid = ({ products, loading, total, query, debug }) => {
  const [selectedProductScore, setSelectedProductScore] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedProductIndex, setSelectedProductIndex] = useState(null);

  const handleScoreClick = (product, productIndex) => {
    console.log('=== Score Analysis Debug ===');
    console.log('Product:', product.name, 'Index:', productIndex);
    console.log('Debug object:', debug);
    
    if (!debug) {
      console.error('No debug data available');
      alert('No debug data available. Make sure debug=true is included in your search URL.');
      return;
    }

    if (!debug.solrDebug) {
      console.error('No solrDebug data available');
      alert('No Solr debug data available in the response.');
      return;
    }

    if (!debug.solrDebug.explain) {
      console.error('No explain data available in solrDebug');
      alert('No explain data available in the Solr debug response.');
      return;
    }

    console.log('Solr debug explain data:', debug.solrDebug.explain);

    // Extract scoring info for this specific product by its index
    const scoreData = extractScoringInfoByIndex(products, debug.solrDebug, productIndex);
    console.log('Extracted score data:', scoreData);
    
    if (!scoreData) {
      console.warn(`No scoring data found for product at index ${productIndex}`);
      // Let's try to get the raw data anyway for debugging
      const rawExplainData = debug.solrDebug.explain;
      if (rawExplainData && rawExplainData.nvPairs) {
        console.log('Using raw explain data for modal');
        setSelectedProduct(product);
        setSelectedProductScore(rawExplainData.nvPairs[1]); // Try the second element which should be the score data
        setSelectedProductIndex(productIndex);
        return;
      }
      
      alert(`No scoring data found for this product. Check the console for more details.`);
      return;
    }

    console.log('Opening modal with score data');
    setSelectedProduct(product);
    setSelectedProductScore(scoreData);
    setSelectedProductIndex(productIndex);
  };

  const closeScoreDetail = () => {
    console.log('Closing score detail modal');
    setSelectedProductScore(null);
    setSelectedProduct(null);
    setSelectedProductIndex(null);
  };

  // Add debug logging for the overall state
  console.log('ProductGrid render - Debug data available:', !!debug);
  console.log('ProductGrid render - Products count:', products?.length || 0);
  
  if (loading) {
    return (
      <div className="lg:col-span-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <ProductCard key={index} loading={true} />
          ))}
        </div>
      </div>
    );
  }

  if (!products || products.length === 0) {
    return (
      <div className="lg:col-span-3">
        <div className="text-center py-12">
          <div className="text-gray-500">
            <svg
              className="w-12 h-12 mx-auto mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <p className="text-lg font-medium">No products found</p>
            <p className="text-sm">
              {query ? `Try searching for something else` : 'Enter a search term to get started'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="lg:col-span-3">
        {/* Results count */}
        <div className="mb-6">
          <p className="text-sm text-gray-600">
            Showing {products.length} of {total} results
            {query && (
              <span className="ml-1">
                for "<span className="font-medium">{query}</span>"
              </span>
            )}
          </p>
        </div>

        {/* Product grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product, index) => (
            <ProductCard
              key={product.id}
              product={product}
              productIndex={index}
              onScoreClick={handleScoreClick}
              debug={debug}
            />
          ))}
        </div>
      </div>

      {/* Score Detail Modal */}
      {selectedProductScore && selectedProduct && (
        <ProductScoreDetail
          product={selectedProduct}
          scoreData={selectedProductScore}
          productIndex={selectedProductIndex}
          onClose={closeScoreDetail}
        />
      )}
    </>
  );
};