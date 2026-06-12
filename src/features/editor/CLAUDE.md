# src/features/editor — The editor

The whole application. `index.ts` re-exports `editor.tsx`.

## editor.tsx — composition root

- Creates the single `StateManager` instance (size 1080×1920) used everywhere.
- Wires the responsive layout: `Sidebar` (`MenuList` + `ControlItem`) + `SceneContainer` (`Scene` + `Timeline`) on large screens; horizontal variants on small screens (`useIsLargeScreen()`).
- Calls `useTimelineEvents()` once to bridge events ↔ store, loads fonts, syncs `activeIds` → selected `trackItem`.
- A commented-out `dispatch(DESIGN_LOAD, ...)` + `mock.ts` (`design`) show how to preload a design.

## Mental model

Mutate via `dispatch(EVENT, { payload })` from `@designcombo/events`; read via the Zustand `store/use-store.ts` which is kept in sync by the subscriptions in `hooks/`. See the root `CLAUDE.md` for the full data-flow description.

## Map

- `store/` — Zustand stores (read-model + UI state). See `store/CLAUDE.md`.
- `hooks/` — event-bus ↔ store bridges, player/timeline/zoom hooks. See `hooks/CLAUDE.md`.
- `scene/` — the editable canvas (Remotion player + Moveable interactions). See `scene/CLAUDE.md`.
- `player/` — Remotion composition & per-type item rendering. See `player/CLAUDE.md`.
- `timeline/` — canvas timeline rendering (the `@designcombo/timeline` engine). See `timeline/CLAUDE.md`.
- `menu-item/` — left-panel "add content" tabs (videos, images, text, audio, captions…). See `menu-item/CLAUDE.md`.
- `control-item/` — right/inspector panel for the selected item's properties. See `control-item/CLAUDE.md`.
- `constants/` — event names (`events.ts`), fonts, layout constants.
- `data/` — static seed data (fonts list, default audio/images/transitions/languages).
- `interfaces/` — local TS interfaces (`editor.ts`, `captions.ts`, `layout.ts`); shared model types come from `@designcombo/types`.
- `utils/` — fonts loading, time/frame conversion, etc.
- `ai-video/` — shared AI video generation form (used by the AI Video sidebar tab and the "Transform to video" dialog on images). Model registry: `data/ai-video-models.ts`; cost math: `utils/ai-video-cost.ts`; jobs/costs store: `store/use-ai-video-store.ts`; status polling: `hooks/use-ai-video-polling.ts` (mounted once in `editor.tsx`).
- `crop-modal/`, `navbar.tsx`, `shortcuts-modal.tsx`, `download-progress-modal.tsx`, `mock.ts` — supporting UI/data.

There are vertical and horizontal twins of several files (`control-item.tsx`/`control-item-horizontal.tsx`, `menu-list.tsx`/`menu-list-horizontal.tsx`) for the two layouts — keep them in sync.
