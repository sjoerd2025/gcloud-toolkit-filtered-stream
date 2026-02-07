const Module = require('module');
const originalRequire = Module.prototype.require;
const fs = require('fs');
const path = require('path');

// Mock BigQuery and PubSub BEFORE requiring gcp-infra.js
Module.prototype.require = function(id) {
    if (id === '@google-cloud/bigquery') {
        return {
            BigQuery: class BigQuery {
                constructor() {}
                dataset(id) {
                    return {
                        createTable: async (tableId, options) => {
                            // Simulate async work
                            await new Promise(resolve => setTimeout(resolve, 10));
                            return [{ id: tableId }];
                        },
                        table: (tableId) => ({
                            insert: async (rows) => []
                        }),
                        delete: (opts, cb) => cb && cb(null, {})
                    };
                }
                createDataset(id, opts) {
                     return Promise.resolve([{ id }]);
                }
                static datetime(d) { return d; }
            }
        };
    }
    if (id === '@google-cloud/pubsub') {
        return {
            PubSub: class PubSub {
                topic() { return { createSubscription: async () => {}, delete: async () => {}, publish: async () => {} }; }
                subscription() { return { delete: async () => {} }; }
                createTopic() { return Promise.resolve(); }
            },
            v1: { SubscriberClient: class SubscriberClient {} }
        };
    }
    return originalRequire.apply(this, arguments);
};

// Load the module under test
let gcpInfra;
try {
    gcpInfra = require('../services/gcp-infra.js');
} catch (e) {
    console.error("Error loading gcp-infra.js:", e);
    process.exit(1);
}

if (!gcpInfra.createTables) {
    console.error("createTables is not exported from gcp-infra.js");
    process.exit(1);
}

async function measureBlocking(fn) {
    const interval = 5; // Check every 5ms
    let maxLag = 0;
    let last = Date.now();
    let running = true;

    const ticker = setInterval(() => {
        if (!running) return;
        const now = Date.now();
        // Expected time since last check is 'interval'
        // Lag is the difference between actual elapsed time and expected time
        const lag = (now - last) - interval;
        if (lag > maxLag) maxLag = lag;
        last = now;
    }, interval);

    const start = Date.now();
    try {
        await fn();
    } finally {
        running = false;
        clearInterval(ticker);
    }
    const duration = Date.now() - start;

    return { maxLag, duration };
}

(async () => {
    console.log('Starting Benchmark...');

    try {
        // Run createTables 100 times to get measurable blocking
        const iterations = 100;

        const { maxLag, duration } = await measureBlocking(async () => {
            for (let i = 0; i < iterations; i++) {
                await gcpInfra.createTables('test_dataset');
            }
        });

        console.log(`Execution Time (${iterations} runs): ${duration}ms`);
        console.log(`Max Event Loop Lag: ${maxLag}ms`);

    } catch (err) {
        console.error('Benchmark failed:', err);
        process.exit(1);
    }
})();
