# Patterns — tasks seen once, candidates for skills

### Publish a curated operations-photo showcase
- Trigger: Add approved operations or delivery photos to a public marketing gallery without exposing receipts, maps, customer details, or raw uploads.
- Steps: Inventory source media; require explicit approval and curated metadata; generate metadata-free responsive derivatives; expose a cursor-paginated public feed; lazy-load and visually verify the public UI; deploy both services and verify live headers and health.
- Gotchas: Never infer public approval from an upload, never expose auth-only media URLs, and keep oldest-item access independent of a fixed newest-row cap.
