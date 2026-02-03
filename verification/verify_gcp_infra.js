const Module = require('module');
const originalRequire = Module.prototype.require;

// 1. Setup Mocks
let insertedRows = [];

const mockBigQueryInstance = {
    dataset: (id) => ({
        createTable: async () => [ { id: 'mock-table' } ],
        table: (tableId) => ({
            insert: async (rows) => {
                insertedRows.push(...rows);
                return rows;
            }
        })
    }),
    createDataset: async () => [ { id: 'mock-dataset' } ]
};

// Mocking the BigQuery class and static method
const MockBigQuery = class {
    constructor() {
        return mockBigQueryInstance;
    }
    static datetime(val) {
        return { type: 'DATETIME', value: val };
    }
};

const MockPubSub = class {
    constructor() {
        return {
             topic: () => ({
                 publish: async () => 'msg-id',
                 createSubscription: async () => {},
                 delete: async () => {}
             }),
             createTopic: async () => {},
             subscription: () => ({
                 delete: async () => {}
             })
        };
    }
};

const MockSubscriberClient = class {
    constructor() {
    }
    subscriptionPath(pid, sid) { return `projects/${pid}/subscriptions/${sid}`; }
    async pull(req) {
        // Return a mock response with tweets
        const tweetPayload = {
            data: {
                id: "123",
                text: "Hello World",
                created_at: "2023-10-27T10:00:00.000Z",
                author_id: "456"
            }
        };

        return [{
            receivedMessages: [
                {
                    message: {
                        data: Buffer.from(JSON.stringify(tweetPayload)),
                    },
                    ackId: "ack-1"
                }
            ]
        }];
    }
    async acknowledge() {}
};


Module.prototype.require = function(request) {
    if (request === '@google-cloud/bigquery') {
        return { BigQuery: MockBigQuery };
    }
    if (request === '@google-cloud/pubsub') {
        return { PubSub: MockPubSub, v1: { SubscriberClient: MockSubscriberClient } };
    }
    // Mock fs.readFileSync to avoid errors with schema files
    if (request === 'fs') {
        const originalFs = originalRequire.apply(this, arguments);
        return {
            ...originalFs,
            readFileSync: (path) => {
                if (path && path.includes && path.includes('json')) return '{}';
                return originalFs.readFileSync(path);
            }
        }
    }

    return originalRequire.apply(this, arguments);
};

// 2. Load the module
const gcpInfra = require('../services/gcp-infra.js');

// 3. Run the test
async function runTest() {
    console.log("Running synchronousPull...");

    // We mock config internally in the module via require, but here we rely on the file.
    // synchronousPull(projectId, subscriptionName, maxMessagesToPull)
    await gcpInfra.synchronousPull('proj', 'sub', 1);

    console.log("Inserted Rows:", JSON.stringify(insertedRows, null, 2));

    if (insertedRows.length === 0) {
        console.error("FAIL: No rows inserted.");
        process.exit(1);
    }

    const row = insertedRows[0];
    const createdAt = row.created_at;

    console.log("created_at object:", createdAt);

    // Check if it matches expected format
    if (createdAt.value === "2023-10-27T10:00:00.000Z") {
        console.log("SUCCESS: created_at is correct.");
    } else {
        console.error("FAIL: created_at mismatch.");
        console.log(`Expected: 2023-10-27T10:00:00.000Z`);
        console.log(`Actual:   ${createdAt.value}`);
        process.exit(1);
    }
}

runTest().catch(err => {
    console.error(err);
    process.exit(1);
});
