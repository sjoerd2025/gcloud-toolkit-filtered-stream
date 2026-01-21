## 2024-10-24 - Reuse GCP Clients
**Learning:** Initializing GCP clients (like BigQuery) inside frequently called functions causes significant performance overhead due to repeated authentication and connection setup.
**Action:** Always instantiate GCP clients globally or as singletons and reuse them across function calls.

## 2024-10-24 - Avoid Double Serialization
**Learning:** `JSON.stringify` on an already stringified JSON payload creates a double-encoded string (e.g. `"{\"a\":1}"`), forcing the consumer to parse twice or causing type errors.
**Action:** Ensure data is only serialized once before transmission. If data is already a JSON string, send it directly.
