## 2024-10-24 - Reuse GCP Clients
**Learning:** Initializing GCP clients (like BigQuery) inside frequently called functions causes significant performance overhead due to repeated authentication and connection setup.
**Action:** Always instantiate GCP clients globally or as singletons and reuse them across function calls.

## 2026-01-22 - Double Serialization in Stream Pipeline
**Learning:** Sending `JSON.stringify(string)` creates a double-quoted string (e.g. `'"{\"key\":...}"'`), forcing the receiver to parse twice. This wastes CPU and increases payload size.
**Action:** Always inspect the type of the payload before stringifying. If it is already a JSON string, send it as-is. Ensure the consumer can handle the raw format.

## 2024-10-27 - Unnecessary Date Parsing
**Learning:** Parsing ISO 8601 strings into Date objects only to call `.toISOString()` is redundant and expensive (~400x slower).
**Action:** When the source (like Twitter API) guarantees ISO format, pass the string directly to BigQuery/Database.

## 2024-10-31 - Blocking Synchronous I/O
**Learning:** `fs.readFileSync` blocks the Node.js event loop completely, preventing other tasks (like network requests or timers) from executing. This causes significant latency in high-concurrency environments.
**Action:** Always use `fs.promises` or callback-based `fs` methods for file operations within async functions to allow the event loop to proceed.
