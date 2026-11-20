# SynapseGrid

**A control room that lets AI data centers balance their loads on the power grid, cutting their electricity use on demand without losing training progress.**

## Why it exists

AI training campuses draw hundreds of megawatts, and the grid can't always supply that, especially on hot afternoons when demand peaks and reserve margins run thin. Utilities ask large customers to cut load during these events (demand response). For a data centre that's risky: pull power the wrong way and you lose days of model training.

SynapseGrid connects the two sides:

- **Grid signals** arrive from the utility (an OpenADR dispatch, say: "cut 80 MW within 3 minutes").
- **Compute responds safely:** checkpoint training jobs first, then lower GPU power caps, then defer or migrate low-priority batch work. Safety-critical inference is never touched.
- **Proof goes back to the utility** as signed meter readings, so the reduction can be verified and trusted.

It also looks ahead. It forecasts price, carbon and grid stress so work can be moved away from peak hours before the utility has to ask, and it watches cooling and electrical limits so throttling stays below hardware trip points.

## What's in the dashboard

| Tab                               | What operators do there                                                                                                                                                                               |
| --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Grid & Cluster Overview** | Check current power draw against the 250 MW cap and the grid's reserve margin, the active curtailment tier, and which workloads are capped, migrated or deferred.                                     |
| **Dispatch Studio**         | Rehearse a dispatch event end to end. Pick a reduction and deadline, then watch checkpoint → GPU cap → reschedule → signed telemetry play out before committing it live.                           |
| **48-h Forecast & Carbon**  | Plan around the next two days: price and carbon outlook, an hourly grid-stress heat map, a regression chart showing load cuts are predictable, and which regions are clean enough to migrate jobs to. |
| **Facility → Silicon**     | Follow heat and power from the building down to the chip: coolant units, busway loading, GPU junction temperatures and threshold alerts.                                                              |

The dashboard is a prototype. It runs on mock data plus a 48-hour telemetry CSV (`frontend/src/data/telemetry.csv`), so it works without any backend.

## Running the frontend

You need Node.js 22 or later.

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

Then open http://localhost:3000.

Other useful commands, run from `frontend/`:

| Command                              | What it does               |
| ------------------------------------ | -------------------------- |
| `npm run build` then `npm start` | Production build and serve |
| `npm run lint`                     | ESLint                     |
| `npm run typecheck`                | TypeScript check           |
| `npm run format`                   | Prettier                   |
