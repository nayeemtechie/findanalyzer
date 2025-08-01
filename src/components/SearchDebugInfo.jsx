import { useState } from 'react';
import { ChevronDown, ChevronUp, Info, Search, Zap, ArrowRight } from 'lucide-react';

export const SearchDebugInfo = ({ debugData }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState('hybrid');

  if (!debugData || !debugData.searchServiceDebug) {
    return null;
  }

  const { searchServiceDebug } = debugData;
  
  // Extract values from searchServiceDebug
  const hybridSearch = searchServiceDebug.hybridSearch || [];
  const searchRequest = searchServiceDebug.searchRequest || '';

  // Helper function to parse and format the search URL
  const formatSearchRequest = (url) => {
    if (!url) return [];
    
    try {
      // Extract the base URL and parameters
      const [baseUrl, paramsString] = url.split('?');
      if (!paramsString) return [{ key: 'URL', value: baseUrl }];
      
      // Parse parameters
      const params = paramsString.split('&').map(param => {
        const [key, value] = param.split('=');
        return { key: decodeURIComponent(key), value: decodeURIComponent(value || '') };
      });
      
      return [
        { key: 'Base URL', value: baseUrl },
        ...params
      ];
    } catch (e) {
      console.error('Error parsing search URL:', e);
      return [{ key: 'URL', value: url }];
    }
  };

  const parsedSearchRequest = formatSearchRequest(searchRequest);

  // Analyze hybrid search flow
  const hybridSearchFlow = hybridSearch.find(item => item.includes("Hybrid search is executed for"))?.split(" for ")[1] || "Unknown";
  
  // Extract important algorithm info
  const vectorAlgorithm = hybridSearch.find(item => item.includes("Vector search based on the algo"))?.split("algo ")[1]?.split(" with")[0] || "Unknown";
  const minReturnValue = hybridSearch.find(item => item.includes("minReturn as"))?.split("minReturn as ")[1]?.split(" for")[0] || "Unknown";
  
  return (
    <div className="bg-white border rounded-lg shadow-sm mb-6 overflow-hidden">
      <div 
        className="flex justify-between items-center p-4 cursor-pointer bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center">
          <Info className="h-5 w-5 text-blue-600 mr-2" />
          <h3 className="text-lg font-medium text-gray-800">Search Debug Information</h3>
        </div>
        {isExpanded ? <ChevronUp className="h-5 w-5 text-blue-500" /> : <ChevronDown className="h-5 w-5 text-blue-500" />}
      </div>
      
      {isExpanded && (
        <>
          <div className="border-b">
            <nav className="flex px-4" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('hybrid')}
                className={`px-3 py-2 text-sm font-medium border-b-2 ${
                  activeTab === 'hybrid' 
                    ? 'border-indigo-500 text-indigo-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center">
                  <Zap className="h-4 w-4 mr-1" />
                  Hybrid Search
                </div>
              </button>

              <button
                onClick={() => setActiveTab('request')}
                className={`ml-8 px-3 py-2 text-sm font-medium border-b-2 ${
                  activeTab === 'request' 
                    ? 'border-indigo-500 text-indigo-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center">
                  <Search className="h-4 w-4 mr-1" />
                  Search Request
                </div>
              </button>
            </nav>
          </div>
          
          <div className="p-4">
            {activeTab === 'hybrid' && (
              <div>
                <div className="bg-indigo-50 p-3 rounded-md mb-4">
                  <h4 className="text-sm font-medium text-indigo-800 mb-2">Hybrid Search Analysis</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="bg-white p-3 rounded border border-indigo-100">
                      <p className="text-xs text-gray-500">Search Flow</p>
                      <p className="font-medium text-indigo-900">{hybridSearchFlow}</p>
                    </div>
                    <div className="bg-white p-3 rounded border border-indigo-100">
                      <p className="text-xs text-gray-500">Vector Algorithm</p>
                      <p className="font-medium text-indigo-900">{vectorAlgorithm}</p>
                    </div>
                    <div className="bg-white p-3 rounded border border-indigo-100">
                      <p className="text-xs text-gray-500">Min Return Threshold</p>
                      <p className="font-medium text-indigo-900">{minReturnValue}</p>
                    </div>
                  </div>
                </div>
                
                <h4 className="font-medium text-gray-700 mb-2 text-sm">Raw Debug Output:</h4>
                <ul className="bg-gray-50 p-3 rounded-md text-sm text-gray-600 space-y-1 max-h-60 overflow-auto">
                  {hybridSearch.map((item, index) => (
                    <li key={index} className="flex">
                      <ArrowRight className="h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5 mr-1" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            
            {activeTab === 'request' && (
              <div>
                <h4 className="font-medium text-gray-700 mb-2 text-sm">Search Request Parameters:</h4>
                <div className="bg-gray-50 rounded-md text-sm text-gray-600 max-h-80 overflow-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">Parameter</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-3/4">Value</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {parsedSearchRequest.map((param, index) => (
                        <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="px-3 py-2 whitespace-nowrap text-xs font-medium text-gray-800">{param.key}</td>
                          <td className="px-3 py-2 text-xs text-gray-500 break-all">{param.value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};