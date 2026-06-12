# src/features/editor/store — Zustand stores

These hold the React-facing read-model and UI state. Design data is **not** owned here — it is mirrored from `@designcombo/state`'s `StateManager` by the subscriptions in `../hooks`. To change design data, `dispatch()` an event; don't `set()` it here.

- `use-store.ts` — the main store: `tracks`, `trackItemsMap`, `transitionsMap`, `trackItemIds`, `activeIds`, `duration`, `fps`, `scale`/`scroll`, `size`, `background`, plus refs (`timeline`, `playerRef`, `sceneMoveableRef`). `setState` shallow-merges (used by the event bridges).
- `use-data-state.ts` — fonts/compact-fonts and other loaded reference data.
- `use-layout-store.ts` — UI layout state (selected `trackItem`, floating-control type/label, panel visibility).
- `use-crop-store.ts`, `use-download-state.ts`, `use-upload-store.ts`, `use-folder.ts` — feature-local UI state for crop modal, export progress, uploads.
- `use-ai-video-store.ts` — AI video generation jobs + cost tracking, persisted to localStorage (`persist`, key `ai-video-jobs`). `submitJob` POSTs to `/api/ai-video`; statuses are advanced by `hooks/use-ai-video-polling.ts`. Cost math lives in `utils/ai-video-cost.ts` (tested).

Project-level scene state lives one level up in `src/store/use-scene-store.ts`.
