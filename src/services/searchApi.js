import { mockSearchResponse } from '../data/mockData.js';

// Real API service implementation
export const searchProducts = async (query, filters = {}, page = 1) => {
  try {
    // Calculate start parameter based on page (for pagination)
    const rows = 30;
    const start = (page - 1) * rows;
    
    // Build the API URL with the Rich Relevance API endpoint
    const apiUrl = `https://recs.richrelevance.com/rrserver/api/find/v1/5db612dbf0548888?rcs=&sessionId=&placement=search_page.find&query=${encodeURIComponent(query)}&rows=${rows}&start=${start}&lang=en&facetDepth=2&region=5-en&ssl=true&log=false&fl=name,imageId`;
    
    console.log(`Fetching search results from: ${apiUrl}`);
    
    return await fetchAndProcessResponse(apiUrl);
  } catch (error) {
    console.error('Error fetching search results:', error);
    
    // Fallback to mock data if API call fails
    console.warn('Falling back to mock data');
    return mockSearchResponse;
  }
};

// Search using a full URL provided by the user
export const searchByUrl = async (url) => {
  try {
    console.log(`Fetching search results from user-provided URL: ${url}`);
    
    return await fetchAndProcessResponse(url);
  } catch (error) {
    console.error('Error fetching search results from provided URL:', error);
    
    // Fallback to mock data if API call fails
    console.warn('Falling back to mock data');
    return mockSearchResponse;
  }
};

// Common function to fetch and process the response
const fetchAndProcessResponse = async (url) => {
  // Make the API call
  const response = await fetch(url);
  
  // Check if the request was successful
  if (!response.ok) {
    throw new Error(`API request failed with status: ${response.status}`);
  }
  
  // Parse the JSON response
  const data = await response.json();
  
  // Transform the API response to match our application's expected format
  const transformedResponse = {
    docs: data?.placements?.[0]?.docs || [],
    numFound: data?.placements?.[0]?.numFound || 0,
    facets: data?.placements?.[0]?.facets || [],
    // Extract debug information
    debug: {
      searchServiceDebug: data?.placements?.[0]?.debug?.searchServiceDebug || {},
      solrDebug: data?.placements?.[0]?.debug?.solrDebug || {}
    }
  };
  
  console.log('Search returned:', transformedResponse.numFound, 'results');
  return transformedResponse;
};

// Helper function to transform facets into a more usable format for our UI
export const transformFacets = (facets) => {
  const transformedFacets = {
    brands: [],
    sizeUnits: [],
    categories: [],
    priceRanges: []
  };
  
  if (!facets || facets.length === 0) return transformedFacets;
  
  facets.forEach(facet => {
    switch(facet.facet) {
      case 'brand':
        transformedFacets.brands = facet.values.map(v => ({
          name: v.value,
          count: v.count,
          filter: v.filter
        }));
        break;
      case 'size_unit':
        transformedFacets.sizeUnits = facet.values.map(v => ({
          value: v.value,
          count: v.count,
          filter: v.filter
        }));
        break;
      case 'categoryName':
        transformedFacets.categories = facet.values.map(v => ({
          name: v.value,
          count: v.count,
          filter: v.filter,
          subcategories: v.child?.values?.map(sub => ({
            name: sub.value,
            count: sub.count,
            filter: sub.filter
          })) || []
        }));
        break;
      case 'product_pricecents':
      case 'product_effectiveprice_cents':
      case 'product_saleprice_cents':
        const values = facet.values.map(v => ({
          range: v.value,
          count: v.count,
          filter: v.filter
        }));
        
        // Only add if we don't already have price ranges
        if (transformedFacets.priceRanges.length === 0) {
          transformedFacets.priceRanges = values;
        }
        break;
      default:
        break;
    }
  });
  
  return transformedFacets;
};


// Extract scoring information for a product by index instead of ID
export const extractScoringInfoByIndex = (docs, solrDebug, productIndex) => {
  console.log('=== extractScoringInfoByIndex Debug ===');
  console.log('Docs:', docs);
  console.log('SolrDebug:', solrDebug);
  console.log('Product Index:', productIndex);
  
  if (!solrDebug || !solrDebug.explain) {
    console.log('No solrDebug or explain data available');
    return null;
  }
  
  if (!docs || productIndex >= docs.length || productIndex < 0) {
    console.log('Product index out of bounds or no docs');
    return null;
  }

  try {
    const product = docs[productIndex];
    console.log(`Looking for scoring info for product at index ${productIndex}, ID: ${product.id}, Name: ${product.name}`);
    
    const explain = solrDebug.explain;
    console.log('Explain structure:', explain);
    
    // Handle different possible structures of the explain data
    if (explain.nvPairs) {
      console.log('Found nvPairs in explain');
      
      // The nvPairs array contains alternating product IDs and their scoring data
      // Format: [productId1, scoringData1, productId2, scoringData2, ...]
      const nvPairs = explain.nvPairs;
      console.log('nvPairs length:', nvPairs.length);
      
      // For single product responses, the structure might be different
      if (nvPairs.length >= 2) {
        // Check if first element is the product ID we're looking for
        const firstId = nvPairs[0];
        console.log('First ID in nvPairs:', firstId);
        console.log('Product ID we are looking for:', product.id);
        
        if (firstId === product.id) {
          console.log('Found matching product ID at index 0');
          const scoreData = nvPairs[1];
          console.log('Score data:', scoreData);
          return scoreData;
        }
        
        // If not found directly, try to find by iterating through pairs
        for (let i = 0; i < nvPairs.length; i += 2) {
          if (i + 1 >= nvPairs.length) break;
          
          const id = nvPairs[i];
          const data = nvPairs[i + 1];
          
          console.log(`Checking pair ${i/2}: ID ${id} vs Product ID ${product.id}`);
          
          if (id === product.id) {
            console.log(`Found matching product ID at pair index ${i/2}`);
            return data;
          }
        }
      }
      
      // If we can't find by ID, try to use the position in the array
      // This assumes the explain data is in the same order as the docs array
      if (productIndex * 2 + 1 < nvPairs.length) {
        console.log(`Trying positional lookup at index ${productIndex * 2 + 1}`);
        const scoreData = nvPairs[productIndex * 2 + 1];
        console.log('Positional score data:', scoreData);
        return scoreData;
      }
      
      // Last resort: if it's a single product response, return the second element
      if (nvPairs.length === 2 && productIndex === 0) {
        console.log('Single product response, returning second element');
        return nvPairs[1];
      }
    }
    
    // Alternative structure check
    if (explain[product.id]) {
      console.log('Found scoring data using product ID as key');
      return explain[product.id];
    }
    
    console.log(`No scoring info found for product at index ${productIndex}`);
    return null;
  } catch (error) {
    console.error('Error extracting scoring info:', error);
    return null;
  }
};

// Helper function to debug the explain structure
export const debugExplainStructure = (solrDebug) => {
  if (!solrDebug || !solrDebug.explain) {
    console.log('No explain data to debug');
    return;
  }
  
  console.log('=== Debug Explain Structure ===');
  console.log('Explain keys:', Object.keys(solrDebug.explain));
  
  if (solrDebug.explain.nvPairs) {
    const nvPairs = solrDebug.explain.nvPairs;
    console.log('nvPairs length:', nvPairs.length);
    console.log('nvPairs structure:');
    
    for (let i = 0; i < Math.min(nvPairs.length, 6); i += 2) {
      if (i + 1 < nvPairs.length) {
        console.log(`  Pair ${i/2}: ID=${nvPairs[i]}, DataType=${typeof nvPairs[i + 1]}`);
      }
    }
  }
};

// Legacy function for backward compatibility
export const extractScoringInfo = (solrDebug, productId) => {
  console.warn('extractScoringInfo is deprecated. Use extractScoringInfoByIndex instead.');
  return null;
};

// If you need to fetch facets separately
export const getFacets = async (query) => {
  try {
    const data = await searchProducts(query, {}, 1);
    return transformFacets(data.facets);
  } catch (error) {
    console.error('Error fetching facets:', error);
    return {
      brands: [],
      sizeUnits: [],
      categories: [],
      priceRanges: []
    };
  }
};