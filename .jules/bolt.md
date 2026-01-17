## 2024-05-22 - [Reuse Cloud Clients]
**Learning:** Initializing cloud SDK clients (like BigQuery or PubSub) is expensive as it may involve authentication or connection setup. Doing this inside a high-frequency loop or stream handler kills performance.
**Action:** Always instantiate cloud clients globally or efficiently (lazy singleton) and reuse them across requests/events.
