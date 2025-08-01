import { useState } from 'react';
import { X, ChevronDown, ChevronRight, Plus, ArrowRight } from 'lucide-react';

// Enhanced analyze scoring function focusing only on explain node
const analyzeScoring = (scoreData) => {
  if (!scoreData || !scoreData.nvPairs) return null;

  try {
    const result = {
      totalScore: 0,
      firstPassScore: 0,
      secondPassScore: 0,
      thresholdScore: 0,
      fieldWeights: [],
      brandBoosts: [],
      lexicalScores: [],
      maxPlusOthersGroups: [], // For "max plus 0.5 times others" logic
      categoryBoosts: [], // For category boosts
      productAttributes: [], // For all product attributes contributing to score
      functionQueries: [], // For function queries like global rank, discount amount
      rangeQueries: [], // For range queries like discount amount, cut size
      debugInfo: [] // For debugging
    };

    // Helper function to format scores to 2 decimal places
    const formatScore = (score) => {
      return typeof score === 'number' ? parseFloat(score.toFixed(2)) : 0;
    };

    // Extract main scores from the nvPairs - ONLY from explain node
    const extractScores = (nvPairs, depth = 0, parentContext = '') => {
      for (let i = 0; i < nvPairs.length; i += 2) {
        if (i + 1 >= nvPairs.length) continue;
        
        const key = nvPairs[i];
        const value = nvPairs[i + 1];
        
        // Debug logging
        if (key === 'description' && typeof value === 'string') {
          result.debugInfo.push({ depth, description: value, hasDetails: false });
        }
        
        // Capture the top-level value as the total score
        if (depth === 0 && key === 'value' && typeof value === 'number') {
          result.totalScore = formatScore(value);
        }
        
        // Look for first pass score
        if (key === 'description' && value === 'first pass score') {
          const scoreValue = nvPairs[i - 1];
          if (typeof scoreValue === 'number') {
            result.firstPassScore = formatScore(scoreValue);
          }
        }
        
        // Look for second pass score
        if (key === 'description' && value === 'second pass score') {
          const scoreValue = nvPairs[i - 1];
          if (typeof scoreValue === 'number') {
            result.secondPassScore = formatScore(scoreValue);
          }
        }
        
        // Look for threshold score
        if (key === 'description' && value === 'Score above threshold') {
          const scoreValue = nvPairs[i - 1];
          if (typeof scoreValue === 'number') {
            result.thresholdScore = formatScore(scoreValue);
          }
        }
        
        // Extract ALL scoring components from descriptions
        if (key === 'description' && typeof value === 'string') {
          
          // Extract range queries (discount amount, cut size, etc.)
          const rangeQueryMatch = value.match(/(ff_\w+|fl_\w+):\[([^\]]+)\](?:\^([\d.]+))?/);
          if (rangeQueryMatch) {
            const scoreValue = nvPairs[i - 1];
            if (typeof scoreValue === 'number') {
              result.rangeQueries.push({
                field: rangeQueryMatch[1],
                range: rangeQueryMatch[2],
                boost: rangeQueryMatch[3] ? parseFloat(rangeQueryMatch[3]) : 1.0,
                score: formatScore(scoreValue),
                description: value,
                type: 'range_query'
              });
            }
          }
          
          // Extract function queries (global rank, product functions)
          const functionQueryMatch = value.match(/FunctionQuery\(([^)]+)\)/);
          if (functionQueryMatch && !value.includes('if(query')) { // Exclude category boosts
            const scoreValue = nvPairs[i - 1];
            if (typeof scoreValue === 'number') {
              result.functionQueries.push({
                function: functionQueryMatch[1],
                score: formatScore(scoreValue),
                description: value,
                type: 'function_query'
              });
            }
          }
          
          // Extract exact match product attributes (search_exact_*)
          const exactMatchPattern = value.match(/search_exact_(\w+):([^)^]+)(?:\^([\d.]+))?/);
          if (exactMatchPattern) {
            const scoreValue = nvPairs[i - 1];
            if (typeof scoreValue === 'number') {
              result.productAttributes.push({
                attribute: exactMatchPattern[1],
                value: exactMatchPattern[2],
                boost: exactMatchPattern[3] ? parseFloat(exactMatchPattern[3]) : 1.0,
                score: formatScore(scoreValue),
                description: value,
                type: 'exact_match'
              });
            }
          }
          
          // Extract standard field matches (fs_*, without search_syns_ prefix)
          const standardFieldMatch = value.match(/weight\((fs_\w+):([^)]+)\s+in\s+\d+\)/);
          if (standardFieldMatch) {
            const scoreValue = nvPairs[i - 1];
            if (typeof scoreValue === 'number') {
              result.productAttributes.push({
                attribute: standardFieldMatch[1].replace('fs_', ''),
                value: standardFieldMatch[2].trim(),
                boost: 1.0,
                score: formatScore(scoreValue),
                description: value,
                type: 'standard_field'
              });
            }
          }
          
          // Check for "max plus X times others of:" pattern
          const maxPlusOthersMatch = value.match(/max plus ([\d.]+) times others of:/);
          if (maxPlusOthersMatch) {
            const scoreValue = nvPairs[i - 1];
            const multiplier = parseFloat(maxPlusOthersMatch[1]);
            
            console.log('Found max plus others pattern:', value, 'Score:', scoreValue);
            
            if (typeof scoreValue === 'number') {
              // This indicates a lexical scoring group
              const lexicalGroup = {
                totalScore: formatScore(scoreValue),
                multiplier: multiplier,
                fields: [],
                description: value
              };
              
              // Look for details to extract individual field scores
              const detailsIndex = i + 1;
              if (detailsIndex < nvPairs.length && nvPairs[detailsIndex + 1] && 
                  Array.isArray(nvPairs[detailsIndex + 1]) && nvPairs[detailsIndex] === 'details') {
                
                console.log('Found details array with', nvPairs[detailsIndex + 1].length, 'items');
                result.debugInfo[result.debugInfo.length - 1].hasDetails = true;
                
                // Extract field details from the details array
                nvPairs[detailsIndex + 1].forEach(detail => {
                  if (detail && detail.nvPairs) {
                    extractFieldsFromDetails(detail.nvPairs, lexicalGroup);
                  }
                });
                
                // If details array was empty, search in the broader context
                if (lexicalGroup.fields.length === 0) {
                  console.log('Details array was empty, searching in broader context');
                  // Search in the current nvPairs context for field weights
                  searchForFieldsRecursively(nvPairs, lexicalGroup);
                }
              } else {
                // No details array found, search in the current context
                console.log('No details array found, searching in current context');
                findFieldsInSiblingNodes(nvPairs, lexicalGroup, i);
              }
              
              console.log('Lexical group has', lexicalGroup.fields.length, 'fields');
              result.maxPlusOthersGroups.push(lexicalGroup);
            }
          }
          
          // Extract ALL field weights (both in and out of lexical groups)
          const fieldMatch = value.match(/weight\(([^:]+):([^)]+)\s+in\s+\d+\)/);
          if (fieldMatch) {
            const scoreValue = nvPairs[i - 1];
            if (typeof scoreValue === 'number') {
              result.fieldWeights.push({
                field: fieldMatch[1],
                term: fieldMatch[2].trim(),
                score: formatScore(scoreValue),
                description: value,
                inLexicalGroup: false // We'll mark this later
              });
            }
          }
          
          // Check for brand boosts - Only look for applied ones in explain
          const brandMatch = value.match(/weight\(fs_product_brand:([^)]+)\s+in\s+\d+\)/);
          if (brandMatch) {
            const scoreValue = nvPairs[i - 1];
            if (typeof scoreValue === 'number' && scoreValue > 0) { // Only applied boosts
              result.brandBoosts.push({
                brand: brandMatch[1].trim(),
                score: formatScore(scoreValue),
                applied: true,
                description: value
              });
            }
          }
          
          // Check for category boosts - FunctionQuery patterns
          const categoryBoostMatch = value.match(/FunctionQuery\(if\(query\(\+\(\+fms_product_category_external_id:(\d+)\),def=0\.0\),const\(0\),const\((\d+)\)\)\), product of:/);
          if (categoryBoostMatch) {
            const scoreValue = nvPairs[i - 1];
            const categoryId = categoryBoostMatch[1];
            const boostValue = parseInt(categoryBoostMatch[2]);
            
            if (typeof scoreValue === 'number') {
              result.categoryBoosts.push({
                categoryId: categoryId,
                boostValue: boostValue,
                score: formatScore(scoreValue),
                applied: scoreValue > 0,
                description: value
              });
              console.log('Found category boost:', categoryId, 'Boost:', boostValue, 'Score:', scoreValue);
            }
          }
        }
        
        // Recursively process nested details
        if (key === 'details' && Array.isArray(value)) {
          value.forEach(detail => {
            if (detail && detail.nvPairs) {
              extractScores(detail.nvPairs, depth + 1, typeof nvPairs[i - 1] === 'string' ? nvPairs[i - 1] : '');
            }
          });
        }
      }
    };

    // Helper function to extract field details from lexical groups
    const extractFieldsFromDetails = (nvPairs, lexicalGroup) => {
      for (let i = 0; i < nvPairs.length; i += 2) {
        if (i + 1 >= nvPairs.length) continue;
        
        const key = nvPairs[i];
        const value = nvPairs[i + 1];
        
        if (key === 'description' && typeof value === 'string') {
          const fieldMatch = value.match(/weight\(([^:]+):([^)]+)\s+in\s+\d+\)/);
          if (fieldMatch) {
            const scoreValue = nvPairs[i - 1];
            if (typeof scoreValue === 'number') {
              lexicalGroup.fields.push({
                field: fieldMatch[1],
                term: fieldMatch[2].trim(),
                rawScore: formatScore(scoreValue),
                description: value
              });
              console.log('Added field to lexical group:', fieldMatch[1], 'Score:', scoreValue);
            }
          }
        }
        
        // Recursively process nested details
        if (key === 'details' && Array.isArray(value)) {
          value.forEach(detail => {
            if (detail && detail.nvPairs) {
              extractFieldsFromDetails(detail.nvPairs, lexicalGroup);
            }
          });
        }
      }
    };

    // NEW: Function to find fields in the broader context when details array is empty
    const findFieldsInSiblingNodes = (nvPairs, lexicalGroup, startIndex) => {
      // Look backwards and forwards from the "max plus others" node to find field weights
      // This handles cases where the field details are not nested under the "max plus others" node
      
      console.log('Searching for fields in sibling nodes around index', startIndex);
      
      // Search in the broader context (parent level)
      for (let i = 0; i < nvPairs.length; i += 2) {
        if (i + 1 >= nvPairs.length) continue;
        
        const key = nvPairs[i];
        const value = nvPairs[i + 1];
        
        if (key === 'description' && typeof value === 'string') {
          const fieldMatch = value.match(/weight\(([^:]+):([^)]+)\s+in\s+\d+\)/);
          if (fieldMatch) {
            const scoreValue = nvPairs[i - 1];
            if (typeof scoreValue === 'number') {
              lexicalGroup.fields.push({
                field: fieldMatch[1],
                term: fieldMatch[2].trim(),
                rawScore: formatScore(scoreValue),
                description: value
              });
              console.log('Found field in sibling nodes:', fieldMatch[1], 'Score:', scoreValue);
            }
          }
        }
        
        // Also check nested details at this level
        if (key === 'details' && Array.isArray(value)) {
          value.forEach(detail => {
            if (detail && detail.nvPairs) {
              searchForFieldsRecursively(detail.nvPairs, lexicalGroup);
            }
          });
        }
      }
    };

    // NEW: Recursive function to search for fields at any level
    const searchForFieldsRecursively = (nvPairs, lexicalGroup) => {
      for (let i = 0; i < nvPairs.length; i += 2) {
        if (i + 1 >= nvPairs.length) continue;
        
        const key = nvPairs[i];
        const value = nvPairs[i + 1];
        
        if (key === 'description' && typeof value === 'string') {
          const fieldMatch = value.match(/weight\(([^:]+):([^)]+)\s+in\s+\d+\)/);
          if (fieldMatch) {
            const scoreValue = nvPairs[i - 1];
            if (typeof scoreValue === 'number') {
              // Avoid duplicate entries
              const exists = lexicalGroup.fields.some(f => 
                f.field === fieldMatch[1] && f.term === fieldMatch[2].trim()
              );
              
              if (!exists) {
                lexicalGroup.fields.push({
                  field: fieldMatch[1],
                  term: fieldMatch[2].trim(),
                  rawScore: formatScore(scoreValue),
                  description: value
                });
                console.log('Found field recursively:', fieldMatch[1], 'Score:', scoreValue);
              }
            }
          }
        }
        
        // Continue recursive search
        if (key === 'details' && Array.isArray(value)) {
          value.forEach(detail => {
            if (detail && detail.nvPairs) {
              searchForFieldsRecursively(detail.nvPairs, lexicalGroup);
            }
          });
        }
      }
    };

    // Create lexical groups from individual field weights if no "max plus others" found
    const createLexicalGroupsFromFields = () => {
      if (result.maxPlusOthersGroups.length === 0 && result.fieldWeights.length > 0) {
        console.log('No lexical groups found, creating from', result.fieldWeights.length, 'field weights');
        
        // Group all field weights into a single lexical group with 0.5 multiplier (common default)
        const lexicalGroup = {
          totalScore: result.fieldWeights.reduce((sum, field) => sum + field.score, 0),
          multiplier: 0.5, // Default multiplier
          fields: result.fieldWeights.map(field => ({
            field: field.field,
            term: field.term,
            rawScore: field.score,
            description: field.description
          })),
          description: 'Inferred lexical group from field weights'
        };
        
        result.maxPlusOthersGroups.push(lexicalGroup);
      } else if (result.maxPlusOthersGroups.length > 0) {
        // Check if any lexical groups have no fields and populate them from fieldWeights
        result.maxPlusOthersGroups.forEach(group => {
          if (group.fields.length === 0 && result.fieldWeights.length > 0) {
            console.log('Populating empty lexical group with', result.fieldWeights.length, 'field weights');
            group.fields = result.fieldWeights.map(field => ({
              field: field.field,
              term: field.term,
              rawScore: field.score,
              description: field.description
            }));
            // Recalculate total score based on the lexical logic
            const maxScore = Math.max(...group.fields.map(f => f.rawScore));
            const othersSum = group.fields.reduce((sum, f) => sum + f.rawScore, 0) - maxScore;
            group.totalScore = formatScore(maxScore + (group.multiplier * othersSum));
          }
        });
      }
    };

    // Calculate weighted scores for lexical groups
    const calculateLexicalWeights = () => {
      result.maxPlusOthersGroups.forEach(group => {
        if (group.fields.length > 0) {
          // Sort fields by score to identify max
          const sortedFields = group.fields.sort((a, b) => b.rawScore - a.rawScore);
          const maxField = sortedFields[0];
          const otherFields = sortedFields.slice(1);
          
          // Calculate: max + multiplier × sum(others)
          const maxScore = maxField.rawScore;
          const othersSum = otherFields.reduce((sum, field) => sum + field.rawScore, 0);
          const calculatedTotal = maxScore + (group.multiplier * othersSum);
          
          // Mark the max field and calculate weighted scores
          group.fields.forEach(field => {
            field.isMax = field === maxField;
            field.weightedScore = field.isMax ? field.rawScore : formatScore(field.rawScore * group.multiplier);
            field.contribution = formatScore((field.weightedScore / calculatedTotal) * 100);
          });
          
          group.calculatedTotal = formatScore(calculatedTotal);
          group.maxScore = maxScore;
          group.othersSum = formatScore(othersSum);
          group.weightedOthersSum = formatScore(othersSum * group.multiplier);
        }
      });
    };

    extractScores(scoreData.nvPairs);
    createLexicalGroupsFromFields(); // Create groups if none found
    calculateLexicalWeights();
    
    console.log('Analysis result:', {
      totalFields: result.fieldWeights.length,
      productAttributes: result.productAttributes.length,
      functionQueries: result.functionQueries.length,
      rangeQueries: result.rangeQueries.length,
      lexicalGroups: result.maxPlusOthersGroups.length,
      debugInfo: result.debugInfo
    });
    
    return result;
  } catch (error) {
    console.error('Error analyzing scoring:', error);
    return null;
  }
};

export const ProductScoreDetail = ({ 
  product, 
  scoreData, 
  onClose,
  productIndex 
}) => {
  const [expandedSections, setExpandedSections] = useState({
    overview: true,
    lexicalScores: true,
    productAttributes: false,
    functionQueries: false,
    brandBoosts: false,
    categoryBoosts: false
  });

  if (!product) return null;

  const analysis = analyzeScoring(scoreData);

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Helper function to clean field names by removing search_syns_ prefix
  const cleanFieldName = (fieldName) => {
    if (fieldName.startsWith('search_syns_')) {
      return fieldName.substring('search_syns_'.length);
    }
    return fieldName;
  };

  const SectionHeader = ({ title, sectionKey, count = null }) => (
    <button
      onClick={() => toggleSection(sectionKey)}
      className="flex items-center justify-between w-full p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
    >
      <div className="flex items-center gap-2">
        {expandedSections[sectionKey] ? (
          <ChevronDown className="w-4 h-4 text-gray-600" />
        ) : (
          <ChevronRight className="w-4 h-4 text-gray-600" />
        )}
        <span className="font-medium text-gray-900">{title}</span>
        {count !== null && (
          <span className="text-sm text-gray-500">({count})</span>
        )}
      </div>
    </button>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-blue-600 text-white p-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Score Analysis</h2>
            <p className="text-blue-100 text-sm">
              {product.name} (Product #{productIndex + 1})
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-blue-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          {analysis ? (
            <div className="space-y-6">
              {/* Score Overview */}
              <div>
                <SectionHeader title="Score Overview" sectionKey="overview" />
                {expandedSections.overview && (
                  <div className="mt-3 bg-white border rounded-lg p-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">
                          {analysis.totalScore.toFixed(2)}
                        </div>
                        <div className="text-sm text-gray-600">Total Score</div>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">
                          {analysis.firstPassScore.toFixed(2)}
                        </div>
                        <div className="text-sm text-gray-600">First Pass</div>
                      </div>
                      <div className="text-center p-3 bg-purple-50 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">
                          {analysis.secondPassScore.toFixed(2)}
                        </div>
                        <div className="text-sm text-gray-600">Second Pass</div>
                      </div>
                      <div className="text-center p-3 bg-orange-50 rounded-lg">
                        <div className="text-2xl font-bold text-orange-600">
                          {analysis.thresholdScore.toFixed(2)}
                        </div>
                        <div className="text-sm text-gray-600">Threshold</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Field Match Scores - Table Format */}
              {analysis.maxPlusOthersGroups.length > 0 ? (
                <div>
                  <SectionHeader 
                    title="Field Match Scores" 
                    sectionKey="lexicalScores"
                    count={analysis.maxPlusOthersGroups.reduce((total, group) => total + group.fields.length, 0)}
                  />
                  {expandedSections.lexicalScores && (
                    <div className="mt-3 space-y-4">
                      {analysis.maxPlusOthersGroups.map((group, groupIndex) => (
                        <div key={groupIndex} className="bg-white border rounded-lg overflow-hidden">
                          <div className="bg-blue-50 p-4 border-b">
                            <h4 className="font-medium text-gray-900 mb-2">
                              Lexical Group {groupIndex + 1}: Max + {group.multiplier}× Others
                            </h4>
                            <div className="text-sm text-gray-700">
                              <strong>Formula:</strong> Max field score + {group.multiplier} × sum of other field scores = {group.calculatedTotal?.toFixed(2)}
                            </div>
                          </div>
                          
                          <div className="overflow-x-auto">
                            <table className="w-full">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Field Name
                                  </th>
                                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actual Weight
                                  </th>
                                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Considered Weight
                                  </th>
                                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Role
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {group.fields.map((field, fieldIndex) => (
                                  <tr key={fieldIndex} className={field.isMax ? 'bg-green-50' : ''}>
                                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                      {cleanFieldName(field.field)}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-right font-semibold">
                                      {field.rawScore.toFixed(2)}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-right font-semibold text-blue-600">
                                      {field.weightedScore.toFixed(2)}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                      {field.isMax ? (
                                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">
                                          MAX
                                        </span>
                                      ) : (
                                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium">
                                          ×{group.multiplier}
                                        </span>
                                      )}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                              <tfoot className="bg-gray-50">
                                <tr>
                                  <td colSpan="2" className="px-4 py-3 text-sm font-medium text-gray-900">
                                    Total Contribution:
                                  </td>
                                  <td className="px-4 py-3 text-sm text-right font-bold text-blue-600">
                                    {group.calculatedTotal?.toFixed(2)}
                                  </td>
                                  <td className="px-4 py-3"></td>
                                </tr>
                              </tfoot>
                            </table>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <SectionHeader title="Field Match Scores" sectionKey="lexicalScores" />
                  {expandedSections.lexicalScores && (
                    <div className="mt-3 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <div className="text-sm text-yellow-800">
                        <strong>Debug Information:</strong>
                      </div>
                      <div className="text-xs text-yellow-700 mt-2 space-y-1">
                        <div>Total field weights found: {analysis?.fieldWeights?.length || 0}</div>
                        <div>Product attributes found: {analysis?.productAttributes?.length || 0}</div>
                        <div>Function queries found: {analysis?.functionQueries?.length || 0}</div>
                        <div>Range queries found: {analysis?.rangeQueries?.length || 0}</div>
                        <div>Lexical groups found: {analysis?.maxPlusOthersGroups?.length || 0}</div>
                        <div>Debug entries: {analysis?.debugInfo?.length || 0}</div>
                        {analysis?.debugInfo?.slice(0, 3).map((info, index) => (
                          <div key={index} className="ml-2">
                            • Depth {info.depth}: {info.description.substring(0, 60)}...
                            {info.hasDetails && " (has details)"}
                          </div>
                        ))}
                        {analysis?.productAttributes?.slice(0, 3).map((attr, index) => (
                          <div key={index} className="ml-2 text-green-700">
                            • {attr.type.toUpperCase()}: {attr.attribute} = {attr.value} ({attr.score})
                          </div>
                        ))}
                        {analysis?.functionQueries?.slice(0, 2).map((func, index) => (
                          <div key={index} className="ml-2 text-purple-700">
                            • FUNCTION: {func.function.substring(0, 40)}... = {func.score}
                          </div>
                        ))}
                      </div>
                      <button
                        onClick={() => console.log('Full analysis:', analysis)}
                        className="mt-2 px-2 py-1 bg-yellow-200 text-yellow-800 rounded text-xs hover:bg-yellow-300"
                      >
                        Log Full Analysis to Console
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Product Attributes Contributing to Score */}
              {analysis.productAttributes.length > 0 && (
                <div>
                  <SectionHeader 
                    title="Product Attributes" 
                    sectionKey="productAttributes"
                    count={analysis.productAttributes.length}
                  />
                  {expandedSections.productAttributes && (
                    <div className="mt-3 bg-white border rounded-lg overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Attribute
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Value
                              </th>
                              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Type
                              </th>
                              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Boost
                              </th>
                              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Score
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {analysis.productAttributes.map((attr, index) => (
                              <tr key={index} className={attr.type === 'exact_match' ? 'bg-green-50' : ''}>
                                <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                  {attr.attribute}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-700">
                                  {attr.value}
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                                    attr.type === 'exact_match' 
                                      ? 'bg-green-100 text-green-800' 
                                      : 'bg-blue-100 text-blue-800'
                                  }`}>
                                    {attr.type === 'exact_match' ? 'EXACT' : 'FIELD'}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-sm text-right">
                                  {attr.boost > 1 ? `×${attr.boost}` : '—'}
                                </td>
                                <td className="px-4 py-3 text-sm text-right font-semibold text-blue-600">
                                  {attr.score.toFixed(2)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Function Queries & Range Queries */}
              {(analysis.functionQueries.length > 0 || analysis.rangeQueries.length > 0) && (
                <div>
                  <SectionHeader 
                    title="Function & Range Queries" 
                    sectionKey="functionQueries"
                    count={analysis.functionQueries.length + analysis.rangeQueries.length}
                  />
                  {expandedSections.functionQueries && (
                    <div className="mt-3 space-y-4">
                      {/* Function Queries */}
                      {analysis.functionQueries.length > 0 && (
                        <div className="bg-white border rounded-lg">
                          <div className="bg-purple-50 p-3 border-b">
                            <h4 className="font-medium text-gray-900">Function Queries</h4>
                          </div>
                          <div className="divide-y">
                            {analysis.functionQueries.map((func, index) => (
                              <div key={index} className="p-4">
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex-1">
                                    <div className="font-medium text-gray-900 text-sm">
                                      {func.function.length > 60 
                                        ? func.function.substring(0, 60) + '...'
                                        : func.function
                                      }
                                    </div>
                                  </div>
                                  <div className="text-right ml-4">
                                    <div className="font-semibold text-lg text-purple-600">
                                      {func.score.toFixed(4)}
                                    </div>
                                  </div>
                                </div>
                                <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded font-mono">
                                  {func.description}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Range Queries */}
                      {analysis.rangeQueries.length > 0 && (
                        <div className="bg-white border rounded-lg">
                          <div className="bg-orange-50 p-3 border-b">
                            <h4 className="font-medium text-gray-900">Range Queries</h4>
                          </div>
                          <div className="divide-y">
                            {analysis.rangeQueries.map((range, index) => (
                              <div key={index} className="p-4">
                                <div className="flex items-center justify-between mb-2">
                                  <div>
                                    <div className="font-medium text-gray-900">
                                      {range.field}
                                    </div>
                                    <div className="text-sm text-gray-600">
                                      Range: {range.range}
                                      {range.boost > 1 && (
                                        <span className="ml-2 text-orange-600">
                                          (×{range.boost} boost)
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <div className="font-semibold text-lg text-orange-600">
                                      {range.score.toFixed(2)}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Applied Category Boosts */}
              {analysis.categoryBoosts.length > 0 && (
                <div>
                  <SectionHeader 
                    title="Applied Category Boosts" 
                    sectionKey="categoryBoosts"
                    count={analysis.categoryBoosts.length}
                  />
                  {expandedSections.categoryBoosts && (
                    <div className="mt-3 bg-white border rounded-lg">
                      <div className="divide-y">
                        {analysis.categoryBoosts.map((boost, index) => (
                          <div key={index} className="p-4">
                            <div className="flex items-center justify-between mb-2">
                              <div>
                                <span className="font-medium text-gray-900">
                                  Category ID: {boost.categoryId}
                                </span>
                                <span className={`ml-2 ${boost.applied ? 'text-green-600' : 'text-gray-500'}`}>
                                  {boost.applied ? '✓ Applied' : '○ Not Applied'}
                                </span>
                                <div className="text-sm text-gray-600 mt-1">
                                  Boost Value: +{boost.boostValue}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className={`font-semibold text-lg ${boost.applied ? 'text-green-600' : 'text-gray-400'}`}>
                                  +{boost.score.toFixed(2)}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {boost.applied ? 'Applied boost' : 'No boost'}
                                </div>
                              </div>
                            </div>
                            <div className={`text-sm p-2 rounded ${
                              boost.applied 
                                ? 'text-green-600 bg-green-50' 
                                : 'text-gray-600 bg-gray-50'
                            }`}>
                              {boost.applied 
                                ? `✓ This product belongs to category ${boost.categoryId}` 
                                : `○ This product does not belong to category ${boost.categoryId}`
                              }
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Applied Brand Boosts */}
              {analysis.brandBoosts.length > 0 && (
                <div>
                  <SectionHeader 
                    title="Applied Brand Boosts" 
                    sectionKey="brandBoosts"
                    count={analysis.brandBoosts.length}
                  />
                  {expandedSections.brandBoosts && (
                    <div className="mt-3 bg-white border rounded-lg">
                      <div className="divide-y">
                        {analysis.brandBoosts.map((boost, index) => (
                          <div key={index} className="p-4">
                            <div className="flex items-center justify-between mb-2">
                              <div>
                                <span className="font-medium text-gray-900">
                                  Brand: {boost.brand}
                                </span>
                                <span className="text-green-600 ml-2">
                                  ✓ Applied
                                </span>
                              </div>
                              <div className="text-right">
                                <div className="font-semibold text-lg text-green-600">
                                  +{boost.score.toFixed(2)}
                                </div>
                                <div className="text-xs text-gray-500">
                                  Brand boost
                                </div>
                              </div>
                            </div>
                            <div className="text-sm text-green-600 bg-green-50 p-2 rounded">
                              ✓ This product matches the "{boost.brand}" brand
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Raw Data Section */}
              <div>
                <SectionHeader title="Raw Debug Data" sectionKey="rawData" />
                {expandedSections.rawData && (
                  <div className="mt-3 bg-gray-50 border rounded-lg p-4">
                    <pre className="text-xs text-gray-600 overflow-auto max-h-60">
                      {JSON.stringify(scoreData, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-500">
                <X className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p className="text-lg">No scoring data available</p>
                <p className="text-sm">
                  This product may not have detailed scoring information in the debug response.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-3 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};