const assert = require('assert');
const Module = require('module');
const originalRequire = Module.prototype.require;

// Mock dependencies
const mocks = {
  'express': () => {
    const app = {
      _handlers: {},
      use: function(path, middleware) {
        // console.log(`[Mock] app.use(${typeof path === 'string' ? path : 'middleware'})`);
      },
      get: function(path, handler) {
        console.log(`[Mock] app.get('${path}') registered`);
        this._handlers[path] = handler;
      },
      post: function(path, handler) {
        // console.log(`[Mock] app.post('${path}') registered`);
      },
      options: () => {},
      listen: (port, cb) => {
        console.log(`[Mock] app.listen called on port ${port}`);
        // Do not execute callback to avoid keeping process alive or logging confusing output
      }
    };
    app.Router = () => ({ get: () => {}, post: () => {} });
    return app;
  },
  'body-parser': {
    json: () => {},
    urlencoded: () => {}
  },
  'cors': () => () => {},
  // Mock local controllers to avoid loading them and their dependencies
  './controllers/stream': {},
  './controllers/rules': {},
  './controllers/api': {},
  './controllers/token': {},
  './controllers/stripe': {},
};

// Override require
Module.prototype.require = function(path) {
  if (mocks[path]) {
    return mocks[path];
  }
  // Handle relative paths for controllers if they use different pathing
  if (path.endsWith('/controllers/stream')) return mocks['./controllers/stream'];
  if (path.endsWith('/controllers/rules')) return mocks['./controllers/rules'];
  if (path.endsWith('/controllers/api')) return mocks['./controllers/api'];
  if (path.endsWith('/controllers/token')) return mocks['./controllers/token'];
  if (path.endsWith('/controllers/stripe')) return mocks['./controllers/stripe'];

  return originalRequire.apply(this, arguments);
};

console.log('Starting verification of index.js...');

try {
  const app = require('./index.js');

  if (app._handlers && app._handlers['/']) {
    console.log('SUCCESS: Root handler found.');

    // Verify content
    const res = {
        send: (content) => {
            if (typeof content === 'string' && content.includes('<title>Twitter API Toolkit</title>')) {
                console.log('SUCCESS: Content verified (contains expected title).');
            } else {
                console.error('FAILURE: Content does not match expected landing page.');
                console.error('Received:', content);
                process.exit(1);
            }
        }
    };

    // Execute the handler
    app._handlers['/']({}, res);

  } else {
    console.error('FAILURE: Root handler NOT found.');
    process.exit(1);
  }

} catch (e) {
  console.error('Error loading index.js:', e);
  process.exit(1);
}
