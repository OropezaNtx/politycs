# Politycs V2 — Implementation Plan

## Objective
Convert the current functional intelligence MVP into a client-ready V2 without breaking the existing dashboard.

## Scope
1. Time-window intelligence: 1h, 6h, 24h, 7d and 30d baseline.
2. Crisis Detection 2.0 with explainable multi-factor scoring.
3. Geo Intelligence with territorial aggregation and evidence.
4. Executive Intelligence Brief generated from live signals.
5. Evidence traceability from high-level signals to source posts.
6. Monitoring Projects for client-specific sources, keywords, topics and territories.

## Principles
- Preserve existing V1 endpoints.
- Add V2 under `/intelligence/v2` and `/projects`.
- Keep scoring explainable; heuristic indicators are not presented as predictive AI.
- Every signal should be traceable to source evidence.
- Empty datasets must return valid empty-safe payloads.

## Delivery phases
### A. Analytics core
Temporal windows, emerging acceleration, Crisis V2, Intelligence Brief.

### B. Territory and evidence
Geo rollups and evidence drill-down.

### C. Monitoring projects
Persistent project configuration and project-aware filtering.

### D. Dashboard V2
Executive brief, time-window controls, V2 signal cards, evidence drill-down and project selector.

## Validation
- `python -m compileall app`
- Backend starts successfully.
- Existing endpoints continue returning 200.
- New V2 endpoints return empty-safe responses.
- `npm run lint`
- `npm run build`
