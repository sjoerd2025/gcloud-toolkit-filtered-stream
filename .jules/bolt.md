## 2024-10-24 - Reuse GCP Clients
**Learning:** Initializing GCP clients (like BigQuery) inside frequently called functions causes significant performance overhead due to repeated authentication and connection setup.
**Action:** Always instantiate GCP clients globally or as singletons and reuse them across function calls.

## 2026-01-22 - Double Serialization in Stream Pipeline
**Learning:** Sending `JSON.stringify(string)` creates a double-quoted string (e.g. `'"{\"key\":...}"'`), forcing the receiver to parse twice. This wastes CPU and increases payload size.
**Action:** Always inspect the type of the payload before stringifying. If it is already a JSON string, send it as-is. Ensure the consumer can handle the raw format.

## 2026-01-24 - Zero-Copy Date Insertion for BigQuery
**Learning:** Twitter API v2 returns ISO 8601 strings for `created_at`. Parsing these into Date objects just to call `.toISOString()` for BigQuery insertion is redundant and costly (approx 500x slower in micro-benchmarks).
**Action:** Pass ISO date strings directly to `BigQuery.datetime()` without intermediate parsing.
