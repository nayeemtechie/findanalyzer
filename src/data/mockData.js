// Mock search response with debug and scoring information
export const mockSearchResponse = {
  "docs": [
    {
      "score": 50.245537,
      "imageId": "https://images.todoorstep.com/product/100146389/En.jpg",
      "name": "SHEBA C/F S.CHICKEN BREAST 85G",
      "id": "41199"
    },
    {
      "score": 50.24143,
      "imageId": "https://images.todoorstep.com/product/100146381/En.jpg",
      "name": "SHEBA C/F CHICKEN W FINERFLAKE 85G",
      "id": "28940"
    },
    {
      "score": 50.23631,
      "imageId": "https://images.todoorstep.com/product/132150078/En.jpg",
      "name": "SHEBA FILETS CHKN SHRMP TNA60G",
      "id": "143272"
    }
  ],
  "numFound": 16,
  "facets": [
    {
      "values": [
        {"filter": "{!tag=brand_id}brand_id:\"784\"", "count": 12, "value": "784"},
        {"filter": "{!tag=brand_id}brand_id:\"1613\"", "count": 4, "value": "1613"}
      ],
      "facet": "brand_id"
    },
    {
      "values": [
        {"filter": "{!tag=product_brand}product_brand:\"Sheba\"", "count": 12, "value": "Sheba"},
        {"filter": "{!tag=product_brand}product_brand:\"Abu\\ Sheba\"", "count": 4, "value": "Abu Sheba"}
      ],
      "facet": "brand"
    }
  ],
  "debug": {
    "searchServiceDebug": {
      "globalRank": [
        "Days to Rank is missing thus skipping adding global rank fields like clicks, views, etc to fl",
        "GlobalRank config is missing thus skipping adding global rank fields like clicks, views, etc to fl"
      ],
      "hybridSearch": [
        "Hybrid search is executed for Main flow",
        "Metastore Solr Query to get vector info is rows=1&sort=score+desc&fl=smf_embeddings,id&fq=fs_itemType:queryvector&defType=lucene&q=search_exact_querytag_name:\"sheba\" from 2003-metastore-en collection",
        "Vector search based on the algo RR_VECTOR_SIMILARITY with minReturn as 0.71 for Main flow",
        "Hybrid search Threshold Flow is not executing as Num Found 16 is greater than Configured Min Doc count 0"
      ],
      "searchRequest": "http://example.com/search-service/query?q=sheba&debug=true"
    },
    "solrDebug": {
      "explain": {
        "nvPairs": [
          // First product ID and data (index 0 in docs array)
          "41199", {
            "nvPairs": [
              "match", true,
              "value", 50.245537,
              "description", "combined first and second pass score using class org.apache.solr.search.ReRankQParserPlugin$ReRankQueryRescorer",
              "details", [
                {
                  "nvPairs": [
                    "match", true,
                    "value", 50.245537,
                    "description", "first pass score",
                    "details", [
                      {
                        "nvPairs": [
                          "match", true,
                          "value", 50.245537,
                          "description", "sum of:",
                          "details", [
                            {
                              "nvPairs": [
                                "match", true,
                                "value", 0.74553657,
                                "description", "Score above threshold"
                              ]
                            },
                            {
                              "nvPairs": [
                                "match", true,
                                "value", 49.5,
                                "description", "sum of:",
                                "details", [
                                  {
                                    "nvPairs": [
                                      "match", true,
                                      "value", 9.5,
                                      "description", "max plus 0.5 times others of:",
                                      "details", [
                                        {
                                          "nvPairs": [
                                            "match", true,
                                            "value", 7.0,
                                            "description", "weight(search_syns_name_en:sheba in 113059)"
                                          ]
                                        },
                                        {
                                          "nvPairs": [
                                            "match", true,
                                            "value", 3.0,
                                            "description", "weight(search_syns_brand_en:sheba in 113059)"
                                          ]
                                        },
                                        {
                                          "nvPairs": [
                                            "match", true,
                                            "value", 1.0,
                                            "description", "weight(search_syns_product_name:sheba in 113059)"
                                          ]
                                        }
                                      ]
                                    ]
                                  },
                                  {
                                    "nvPairs": [
                                      "match", true,
                                      "value", 10.0,
                                      "description", "weight(search_exact_product_brand:sheba in 113059)"
                                    ]
                                  },
                                  {
                                    "nvPairs": [
                                      "match", true,
                                      "value", 30.0,
                                      "description", "weight(search_exact_brand_en:sheba in 113059)"
                                    ]
                                  }
                                ]
                              ]
                            }
                          ]
                        ]
                      }
                    ]
                  ]
                },
                {
                  "nvPairs": [
                    "match", true,
                    "value", 0.0,
                    "description", "second pass score",
                    "details", [
                      {
                        "nvPairs": [
                          "match", true,
                          "value", 0.0,
                          "description", "FunctionQuery(sum(query((fms_product_category_external_id:311)^2.0,def=0.0)=0.0,query((fms_product_category_external_id:352)^5.0,def=0.0)=0.0,query((fms_product_category_external_id:353)^4.0,def=0.0)=0.0,query((fms_product_category_external_id:354)^2.0,def=0.0)=0.0,query((fms_product_category_external_id:356)^4.0,def=0.0)=0.0,query((fms_product_category_external_id:350)^3.0,def=0.0)=0.0,query((fms_product_category_external_id:372)^3.0,def=0.0)=0.0))"
                        ]
                      }
                    ]
                  ]
                }
              ]
            ]
          },
          // Second product ID and data (index 1 in docs array) - with applied category boost
          "28940", {
            "nvPairs": [
              "match", true,
              "value", 52.24143,
              "description", "combined first and second pass score",
              "details", [
                {
                  "nvPairs": [
                    "match", true,
                    "value", 50.24143,
                    "description", "first pass score"
                  ]
                },
                {
                  "nvPairs": [
                    "match", true,
                    "value", 2.0,
                    "description", "second pass score",
                    "details", [
                      {
                        "nvPairs": [
                          "match", true,
                          "value", 2.0,
                          "description", "FunctionQuery(sum(query((fms_product_category_external_id:311)^2.0,def=0.0)=2.0,query((fms_product_category_external_id:352)^5.0,def=0.0)=0.0,query((fms_product_category_external_id:353)^4.0,def=0.0)=0.0))"
                        ]
                      }
                    ]
                  ]
                }
              ]
            ]
          },
          // Third product ID and data (index 2 in docs array)
          "143272", {
            "nvPairs": [
              "match", true,
              "value", 50.23631,
              "description", "combined score"
            ]
          }
        ]
      }
    }
  }
};

// Helper function to transform facets
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