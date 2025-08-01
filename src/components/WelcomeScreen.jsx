import { Search, BarChart2, Filter, Code } from 'lucide-react';

export const WelcomeScreen = () => {
  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Welcome to Find Response Analyzer</h2>
      
      <div className="text-gray-700 mb-6">
        <p className="mb-4">
          This application helps you analyze and understand how the Algonomy Find API 
          generates search results and scores products in its responses.
        </p>
        
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Key Features:</h3>
        
        <ul className="list-disc space-y-2 pl-5 mb-6">
          <li>
            <span className="font-medium">Score Analysis</span>: See detailed breakdowns of how each product's 
            relevance score is calculated including field weights and category boosts
          </li>
          <li>
            <span className="font-medium">Search Debug Information</span>: Visualize the hybrid search flow, 
            vector algorithms, and threshold settings used by the search engine
          </li>
          <li>
            <span className="font-medium">Facet Analysis</span>: Understand what filters are available based on 
            your search query and their distribution across results
          </li>
          <li>
            <span className="font-medium">Result Visualization</span>: See a clean, organized view of search 
            results with their associated images and scores
          </li>
        </ul>
        
        <h3 className="text-lg font-semibold text-gray-800 mb-2">How to Use:</h3>
        
        <ol className="list-decimal space-y-2 pl-5">
          <li>Enter a Find Request API URL in the text box above</li>
          <li>Click "Analyze" to fetch and process the API response</li>
          <li>Browse the results, facets, and debug information</li>
          <li>Click the "Score" button on any product to see its detailed scoring breakdown</li>
        </ol>
      </div>
      
      <div className="border-t border-gray-200 pt-4 mt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg flex items-start">
            <Search className="h-8 w-8 text-blue-600 mr-2 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-blue-800">API Analysis</h4>
              <p className="text-sm text-blue-600">Analyze any Find API response</p>
            </div>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg flex items-start">
            <BarChart2 className="h-8 w-8 text-green-600 mr-2 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-green-800">Score Breakdown</h4>
              <p className="text-sm text-green-600">Understand relevance calculations</p>
            </div>
          </div>
          
          <div className="bg-purple-50 p-4 rounded-lg flex items-start">
            <Filter className="h-8 w-8 text-purple-600 mr-2 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-purple-800">Facet Analysis</h4>
              <p className="text-sm text-purple-600">View available filters and counts</p>
            </div>
          </div>
          
          <div className="bg-amber-50 p-4 rounded-lg flex items-start">
            <Code className="h-8 w-8 text-amber-600 mr-2 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-amber-800">Debug Info</h4>
              <p className="text-sm text-amber-600">View search engine internals</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};