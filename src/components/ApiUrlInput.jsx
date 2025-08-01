import { useState } from 'react';
import { Search } from 'lucide-react';

export const ApiUrlInput = ({ onSearch }) => {
  const [apiUrl, setApiUrl] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (apiUrl.trim()) {
      // Create a URL object to easily manipulate parameters
      let urlToUse = apiUrl.trim();
      
      // Ensure the URL has a '?' character to separate the base URL from parameters
      if (!urlToUse.includes('?')) {
        urlToUse += '?';
      }
      
      // Append parameters to the URL, checking if they already exist
      const url = new URL(urlToUse.startsWith('http') ? urlToUse : `http://placeholder.com/${urlToUse}`);
      
      // Add findDebug parameter if it doesn't exist
      if (!url.searchParams.has('findDebug')) {
        url.searchParams.set('findDebug', 'searchServiceDebug,solrDebugAll');
      }
      
      // Add or update fl parameter
      if (!url.searchParams.has('fl')) {
        url.searchParams.set('fl', 'name,imageId');
      } else {
        // If fl already exists, make sure it includes name and imageId
        const currentFl = url.searchParams.get('fl');
        const flParams = currentFl.split(',');
        
        if (!flParams.includes('name')) {
          flParams.push('name');
        }
        
        if (!flParams.includes('imageId')) {
          flParams.push('imageId');
        }
        
        url.searchParams.set('fl', flParams.join(','));
      }
      
      // Get the final URL string, removing the placeholder if we added it
      let finalUrl = url.toString();
      if (finalUrl.startsWith('http://placeholder.com/')) {
        finalUrl = finalUrl.substring('http://placeholder.com/'.length);
      }
      
      console.log('Using URL with appended parameters:', finalUrl);
      onSearch(finalUrl);
    }
  };

  return (
    <div className="mb-6 bg-white p-4 rounded-lg shadow-sm">
      <h2 className="text-lg font-medium text-gray-900 mb-2">API URL</h2>
      <p className="text-sm text-gray-500 mb-3">
        Enter the Find Request API URL to analyze its response:
      </p>
      <form onSubmit={handleSubmit} className="flex flex-col space-y-2">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex-grow">
            <textarea
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm h-24"
              placeholder="https://recs.richrelevance.com/rrserver/api/find/v1/5db612dbf0548888?query=sheba&rows=30"
            />
          </div>
          <div className="flex sm:flex-col justify-end sm:justify-center">
            <button
              type="submit"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <Search className="h-4 w-4 mr-2" />
              Analyze
            </button>
          </div>
        </div>
        <div className="text-xs text-gray-500">
          <p>The following parameters will be automatically added to your URL:</p>
          <ul className="list-disc pl-4 mt-1">
            <li><code>findDebug=searchServiceDebug,solrDebugAll</code> - For detailed scoring information</li>
            <li><code>fl=name,imageId</code> - Required fields for display</li>
          </ul>
        </div>
      </form>
    </div>
  );
};