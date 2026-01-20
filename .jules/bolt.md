## 2024-10-24 - Reuse GCP Clients
**Learning:** Initializing GCP clients (like BigQuery) inside frequently called functions causes significant performance overhead due to repeated authentication and connection setup.
**Action:** Always instantiate GCP clients globally or as singletons and reuse them across function calls.

## 2024-10-24 - Avoid Promise Constructor Anti-Pattern
**Learning:** Wrapping functions that already return promises (like GCP client methods) in `new Promise` adds unnecessary complexity and overhead.
**Action:** Return the existing promise directly or use `async/await` instead of manual promise wrapping.
