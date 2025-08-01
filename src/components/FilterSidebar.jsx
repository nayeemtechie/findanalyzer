import { useState } from 'react';
import { Filter, ChevronDown, ChevronUp } from 'lucide-react';

export const FilterSidebar = ({ facets }) => {
  const [filtersVisible, setFiltersVisible] = useState(false);

  // Non-functional filter section component (without checkboxes)
  const FilterSection = ({ title, items, filterType }) => {
    if (!items || items.length === 0) return null;

    return (
      <div className="pt-6">
        <h3 className="text-lg font-medium text-gray-900">{title}</h3>
        <ul className="mt-4 space-y-2">
          {items.map((item) => (
            <li key={item.value || item.name} className="flex items-center text-sm text-gray-600">
              {/* Simple bullet point instead of checkbox */}
              <span className="h-1.5 w-1.5 rounded-full bg-gray-400 mr-3 flex-shrink-0"></span>
              {item.name || item.value} ({item.count})
            </li>
          ))}
        </ul>
      </div>
    );
  };

  return (
    <>
      {/* Desktop filters */}
      <div className="hidden lg:block">
        <div className="divide-y divide-gray-200 space-y-6">
          <div className="pb-4">
            <h2 className="text-xl font-medium text-gray-900">Filters</h2>
            <p className="text-sm text-gray-500 mt-1">Filter options are shown for display purposes only.</p>
          </div>
          
          <FilterSection title="Brands" items={facets.brands || []} filterType="brands" />
          <FilterSection title="Size Units" items={facets.sizeUnits || []} filterType="sizeUnits" />
          <FilterSection title="Categories" items={facets.categories || []} filterType="categories" />
          
          {facets.priceRanges && facets.priceRanges.length > 0 && (
            <div className="pt-6">
              <h3 className="text-lg font-medium text-gray-900">Price Range</h3>
              <ul className="mt-4 space-y-2">
                {facets.priceRanges.map((range) => (
                  <li key={range.range} className="flex items-center text-sm text-gray-600">
                    <span className="h-1.5 w-1.5 rounded-full bg-gray-400 mr-3 flex-shrink-0"></span>
                    {range.range.replace(':', '-')} ({range.count})
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Mobile filter toggle */}
      <div className="lg:hidden">
        <button
          type="button"
          className="w-full flex items-center justify-between py-2 text-sm text-gray-500 font-medium border-b border-gray-200"
          onClick={() => setFiltersVisible(!filtersVisible)}
        >
          <span className="flex items-center">
            <Filter className="mr-2 h-5 w-5" />
            Filters
          </span>
          {filtersVisible ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        </button>
        
        {filtersVisible && (
          <div className="mt-4">
            <div className="divide-y divide-gray-200 space-y-6">
              <div className="pb-4">
                <p className="text-sm text-gray-500">Filter options are shown for display purposes only.</p>
              </div>
              
              <FilterSection title="Brands" items={facets.brands || []} filterType="brands" />
              <FilterSection title="Size Units" items={facets.sizeUnits || []} filterType="sizeUnits" />
              <FilterSection title="Categories" items={facets.categories || []} filterType="categories" />
            </div>
          </div>
        )}
      </div>
    </>
  );
};