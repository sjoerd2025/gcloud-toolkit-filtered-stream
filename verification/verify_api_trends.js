const Module = require('module');
const originalRequire = Module.prototype.require;

let queryCalled = false;
const mockBigQueryInstance = {
    query: async (options) => {
        console.log("Mock BigQuery.query called with:", options);
        queryCalled = true;
        // BigQuery query returns [rows, ...]
        return [ [{ ENTITY: 'test', count: 1 }] ];
    }
};

const MockBigQuery = class {
    constructor() {
        return mockBigQueryInstance;
    }
};

Module.prototype.require = function(request) {
    if (request === '@google-cloud/bigquery') {
        return { BigQuery: MockBigQuery };
    }
    // Mock config to avoid loading real config which might have missing secrets
    if (request.endsWith('config.js') || request.endsWith('/config.js')) {
        return {
            gcp_infra: {
                bq: {
                    dataSetId: 'test_dataset',
                    table: { tweets: 'tweets_table' }
                }
            }
        };
    }
    // Allow utils.js to load normally or mock it if needed?
    // utils.js is relative require './utils.js'.
    // If we let it load, it might be fine.

    return originalRequire.apply(this, arguments);
};

// Load api.js
// Note: api.js instantiates BigQuery at top level, so our mock must be ready.
const apiService = require('../services/api.js');

async function runTest() {
    console.log("Testing getTrends...");
    try {
        const result = await apiService.getTrends(60);
        console.log("Result:", JSON.stringify(result));

        if (queryCalled && Array.isArray(result) && result[0].length > 0) {
            console.log("SUCCESS: getTrends returned expected result.");
        } else {
            console.error("FAIL: getTrends did not return expected result or query not called.");
            process.exit(1);
        }
    } catch (error) {
        console.error("FAIL: getTrends threw error:", error);
        process.exit(1);
    }
}

runTest();
