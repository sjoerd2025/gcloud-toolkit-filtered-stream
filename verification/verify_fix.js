const Module = require('module');
const originalRequire = Module.prototype.require;

// Mocks
const mockBigQueryInstance = {
    dataset: (id) => ({
        createTable: async () => [{}],
        table: (tableId) => ({
            insert: async (rows) => {
                console.log('BigQuery Insert Called with:', JSON.stringify(rows, null, 2));
                return rows;
            }
        })
    }),
    createDataset: async () => [{}],
    datetime: (val) => {
        return { value: val, type: 'DATETIME' };
    }
};

const mockPubSubInstance = {
    topic: () => ({
        createSubscription: async () => {},
        publish: async () => {},
        delete: async () => {}
    }),
    subscription: () => ({
        delete: async () => {}
    })
};

const mockSubClientInstance = {
    subscriptionPath: () => 'projects/p/subscriptions/s',
    pull: async () => {
        return [{
            receivedMessages: [
                {
                    ackId: '1',
                    message: {
                        data: Buffer.from(JSON.stringify({
                            data: {
                                id: '123',
                                text: 'Hello',
                                created_at: '2023-01-01T00:00:00.000Z'
                            }
                        }))
                    }
                }
            ]
        }];
    },
    acknowledge: async () => {}
};

Module.prototype.require = function(path) {
    if (path === '@google-cloud/bigquery') {
        class BigQueryMock {
            constructor() { return mockBigQueryInstance; }
            static datetime(v) { return { value: v, type: 'DATETIME_WRAPPER' }; }
        }
        return { BigQuery: BigQueryMock };
    }
    if (path === '@google-cloud/pubsub') {
        return {
            PubSub: class { constructor() { return mockPubSubInstance; } },
            v1: { SubscriberClient: class { constructor() { return mockSubClientInstance; } } }
        };
    }
    return originalRequire.apply(this, arguments);
};

// Now load the service
const infra = require('../services/gcp-infra.js');

// Test
async function run() {
    console.log('Starting verification...');
    try {
        await infra.synchronousPull('project', 'sub', 1);
        console.log('Verification finished.');
    } catch (e) {
        console.error('Verification failed', e);
    }
}

run();
