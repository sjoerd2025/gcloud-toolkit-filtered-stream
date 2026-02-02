## 2024-10-24 - Reuse GCP Clients
**Learning:** Initializing GCP clients (like BigQuery) inside frequently called functions causes significant performance overhead due to repeated authentication and connection setup.
**Action:** Always instantiate GCP clients globally or as singletons and reuse them across function calls.

## 2026-01-22 - Double Serialization in Stream Pipeline
**Learning:** Sending `JSON.stringify(string)` creates a double-quoted string (e.g. `'"{\"key\":...}"'`), forcing the receiver to parse twice. This wastes CPU and increases payload size.
**Action:** Always inspect the type of the payload before stringifying. If it is already a JSON string, send it as-is. Ensure the consumer can handle the raw format.

## 2026-01-22 - Redundant Date Parsing for BigQuery
**Learning:** `BigQuery.datetime()` accepts ISO 8601 strings directly. Parsing an ISO string with `new Date()` just to call `.toISOString()` is redundant and adds significant overhead (observed ~680x slower in microbenchmarks).
**Action:** When working with ISO 8601 timestamps (like Twitter API's `created_at`), pass them directly to `BigQuery.datetime()` without intermediate `Date` object creation.
