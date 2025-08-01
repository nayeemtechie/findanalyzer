import { useEffect, useState } from 'react';
import { useSearch } from './hooks/useSearch.js';
import { SearchHeader } from './components/SearchHeader';
import { ApiUrlInput } from './components/ApiUrlInput';
import { FilterSidebar } from './components/FilterSidebar';
import { ProductGrid } from './components/ProductGrid';
import { Pagination } from './components/Pagination';
import { SearchDebugInfo } from './components/SearchDebugInfo';
import { WelcomeScreen } from './components/WelcomeScreen';

function App() {
  const [hasSearched, setHasSearched] = useState(false);
  
  const {
    query,
    results,
    loading,
    error,
    page,
    updateQuery,
    handlePageChange,
    facets,
    searchByFullUrl
  } = useSearch(null, false); // Pass false to not search on initial load

  // Log results for debugging
  useEffect(() => {
    if (results) {
      console.log('App received results:', results);
      console.log('Debug data available:', !!results.debug);
      
      if (results.debug && results.debug.solrDebug) {
        console.log('solrDebug structure:', results.debug.solrDebug);
      }
    }
  }, [results]);

  const handleApiUrlSearch = (url) => {
    searchByFullUrl(url);
    setHasSearched(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <SearchHeader />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ApiUrlInput onSearch={handleApiUrlSearch} />
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative mb-6" role="alert">
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">{error}</span>
          </div>
        )}
        
        {!hasSearched ? (
          <WelcomeScreen />
        ) : (
          <>
            {!loading && results?.debug && (
              <SearchDebugInfo debugData={results.debug} />
            )}
            
            <div className="lg:grid lg:grid-cols-4 lg:gap-x-8 lg:gap-y-10">
              <div className="lg:col-span-1">
                <FilterSidebar facets={facets} />
              </div>
              
              <ProductGrid 
                products={results?.docs || []} 
                loading={loading} 
                total={results?.numFound || 0}
                query={query}
                debug={results?.debug}
              />
            </div>
            
            {results?.docs?.length > 0 && (
              <Pagination 
                currentPage={page}
                totalResults={results?.numFound || 0}
                onPageChange={handlePageChange}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default App;