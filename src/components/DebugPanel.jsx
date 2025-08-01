// Add this component to your App.jsx or create a separate DebugPanel.jsx file

import { debugExplainStructure } from '../services/searchApi.js';

export const DebugPanel = ({ results, debug }) => {
  const handleDebugClick = () => {
    console.log('=== FULL DEBUG INFO ===');
    console.log('Results object:', results);
    console.log('Debug object:', debug);
    
    if (debug && debug.solrDebug) {
      debugExplainStructure(debug.solrDebug);
    }
    
    if (results && results.docs) {
      console.log('Products:');
      results.docs.forEach((doc, index) => {
        console.log(`  ${index}: ID=${doc.id}, Name=${doc.name}, Score=${doc.score}`);
      });
    }
  };

  // Only show in development mode
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
      <h3 className="text-sm font-medium text-yellow-800 mb-2">Debug Panel</h3>
      <div className="space-y-2 text-xs text-yellow-700">
        <div>Results available: {results ? 'Yes' : 'No'}</div>
        <div>Debug available: {debug ? 'Yes' : 'No'}</div>
        <div>Solr debug: {debug?.solrDebug ? 'Yes' : 'No'}</div>
        <div>Explain data: {debug?.solrDebug?.explain ? 'Yes' : 'No'}</div>
        <div>Products count: {results?.docs?.length || 0}</div>
        <button
          onClick={handleDebugClick}
          className="mt-2 px-2 py-1 bg-yellow-200 text-yellow-800 rounded text-xs hover:bg-yellow-300"
        >
          Log Debug Info to Console
        </button>
      </div>
    </div>
  );
};