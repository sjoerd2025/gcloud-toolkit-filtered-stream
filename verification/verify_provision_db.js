const Module = require('module');
const originalRequire = Module.prototype.require;

// Mock logging to keep output clean
const consoleLog = console.log;
// console.log = () => {};

let readFileSyncCalled = false;
let readFileAsyncCalled = false;

Module.prototype.require = function(path) {
  if (path === '@google-cloud/bigquery') {
    return {
        BigQuery: class {
            constructor() {}
            createDataset() { return Promise.resolve([{id: 'mock_dataset'}]); }
            dataset() {
                return {
                    createTable: () => Promise.resolve([{id: 'mock_table'}]),
                    delete: (opts, cb) => { cb && cb() }
                };
            }
        }
    };
  }
  if (path === '@google-cloud/pubsub') {
    return {
        v1: { SubscriberClient: class {
            subscriptionPath() { return 'path'; }
            pull() { return Promise.resolve([{receivedMessages: []}]); }
            acknowledge() { return Promise.resolve(); }
        }},
        PubSub: class {
            createTopic() { return Promise.resolve(); }
            topic() { return {
                createSubscription: () => Promise.resolve(),
                publish: () => Promise.resolve('msg_id'),
                delete: () => Promise.resolve()
            }}
            subscription() { return { delete: () => Promise.resolve() } }
        }
    };
  }
  if (path === 'fs') {
      return {
          readFileSync: (p) => {
              consoleLog('Called fs.readFileSync');
              readFileSyncCalled = true;
              return '{"fields": []}';
          },
          promises: {
              readFile: async (p) => {
                  consoleLog('Called fs.promises.readFile');
                  readFileAsyncCalled = true;
                  return '{"fields": []}';
              }
          }
      };
  }
  return originalRequire.apply(this, arguments);
};

// Import the service
const gcp_infra = require('../services/gcp-infra.js');

async function runTest() {
    consoleLog('--- Starting ProvisionDB Verification ---');
    try {
        await gcp_infra.provisionDB();
        consoleLog('provisionDB completed successfully');
    } catch (e) {
        consoleLog('provisionDB failed', e);
    }

    if (readFileSyncCalled) {
        consoleLog('VERDICT: Uses synchronous I/O (Blocking)');
    } else if (readFileAsyncCalled) {
        consoleLog('VERDICT: Uses asynchronous I/O (Non-blocking)');
    } else {
        consoleLog('VERDICT: Uncertain (No file read detected)');
    }
}

runTest();
