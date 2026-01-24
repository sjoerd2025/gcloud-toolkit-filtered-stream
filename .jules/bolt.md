## 2024-10-24 - Reuse GCP Clients
**Learning:** Initializing GCP clients (like BigQuery) inside frequently called functions causes significant performance overhead due to repeated authentication and connection setup.
**Action:** Always instantiate GCP clients globally or as singletons and reuse them across function calls.

## 2026-01-22 - Double Serialization in Stream Pipeline
**Learning:** Sending `JSON.stringify(string)` creates a double-quoted string (e.g. `'"{\"key\":...}"'`), forcing the receiver to parse twice. This wastes CPU and increases payload size.
**Action:** Always inspect the type of the payload before stringifying. If it is already a JSON string, send it as-is. Ensure the consumer can handle the raw format.

## 2024-10-24 - Blocking I/O in Service Layer
**Learning:** The service layer used `fs.readFileSync` for loading schemas. Since services are invoked by request handlers, this blocks the entire Node.js event loop, degrading throughput for all users.
**Action:** Always scan service initialization and data loading methods for synchronous `fs` calls and replace them with `fs.promises`.
