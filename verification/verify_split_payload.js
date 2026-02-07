const assert = require('assert');
const EventEmitter = require('events');

// Mock dependencies
const mockGcpInfra = {
    publishMessage: (topic, message) => {
        console.log(`[MOCK] publishMessage called with: ${message}`);
        mockGcpInfra.lastPublishedMessage = message;
        mockGcpInfra.callCount++;
    },
    lastPublishedMessage: null,
    callCount: 0,
    provisionDB: async () => {},
    setupMsgInfra: async () => {},
    cleanUp: () => {},
    synchronousPull: async () => {},
};

const mockNeedle = {
    get: () => {
        const stream = new EventEmitter();
        mockNeedle.stream = stream;
        return stream;
    },
    stream: null
};

const mockExpress = {
    Router: () => ({
        get: () => {},
    }),
};

// Override require
const Module = require('module');
const originalRequire = Module.prototype.require;
Module.prototype.require = function(path) {
    if (path.includes('services/gcp-infra.js')) {
        return mockGcpInfra;
    }
    if (path === 'needle') {
        return mockNeedle;
    }
    if (path === 'express') {
        return mockExpress;
    }
    if (path.includes('config.js')) {
        return {
            filtered_stream: { host: '', path: '', tweet_fields: '', user_fields: '', expansions: '', media_fields: '', place_fields: '', poll_fields: '' },
            gcp_infra: { topicName: 'test-topic', subscriptionName: 'test-sub', bq: { dataSetId: 'test-dataset', table: { tweets: 'tweets', users: 'users' } } },
            twitter_bearer_token: 'test-token'
        };
    }
    return originalRequire.apply(this, arguments);
};

// Load the controller
const streamController = require('../controllers/stream.js');

async function verify() {
    console.log('Starting verification...');

    // Start streaming
    streamController.streamTweets();

    // Ensure mock stream was created
    if (!mockNeedle.stream) {
        console.error('FAIL: streamTweets did not create a stream (mockNeedle.get not called).');
        process.exit(1);
    }

    const part1 = '{"data": {"id": "123", "text": "Hello ';
    const part2 = 'World"}}';

    console.log('Emitting part 1...');
    try {
        mockNeedle.stream.emit('data', part1);
    } catch (e) {
        console.error('Caught error during part 1 emission:', e);
    }

    console.log('Emitting part 2...');
    try {
        mockNeedle.stream.emit('data', part2);
    } catch (e) {
        console.error('Caught error during part 2 emission:', e);
    }

    if (mockGcpInfra.callCount === 0) {
        console.error('FAIL: publishMessage was never called.');
        process.exit(1);
    } else {
        const published = mockGcpInfra.lastPublishedMessage;
        console.log('Last published message:', published);

        try {
            // Check if it's double encoded
            let parsed = JSON.parse(published);
            if (typeof parsed === 'string') {
                console.log('Result is double-encoded string. Parsing again.');
                parsed = JSON.parse(parsed);
            }

            if (parsed.data && parsed.data.text === "Hello World") {
                console.log('PASS: Split payload handled correctly!');
                process.exit(0);
            } else {
                console.error('FAIL: Content mismatch.');
                console.log('Expected: Hello World');
                console.log('Actual:', parsed.data ? parsed.data.text : 'undefined');
                process.exit(1);
            }
        } catch (e) {
            console.error('FAIL: Could not parse published message:', e);
            process.exit(1);
        }
    }
}

verify();
