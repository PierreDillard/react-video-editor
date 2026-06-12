# src/features/editor/hooks — event bridges & interaction hooks

The glue between the `@designcombo` event bus / engines and React.

- `use-timeline-events.ts` — subscribes to `PLAYER_*` and `TIMELINE_*` events and translates them onto the Remotion `PlayerRef` (seek/play/pause), and `LAYER_SELECTION` → `activeIds`. Also pushes timeline state into the store. Called once from `editor.tsx`.
- `use-state-manager-events.ts` — mirrors `StateManager` state (tracks, items, transitions) into `use-store`.
- `use-player-events.ts` — player playback subscriptions.
- `use-current-frame.tsx` — current frame from the player.
- `use-zoom.tsx` — scene pinch/zoom, exposes `recalculateZoom` (called via `SceneRef`).
- `use-resizable-timeline.ts`, `use-timeline-offset.ts` — timeline panel sizing/offset.
- `use-pointer-drag.tsx`, `is-dragging-over-timeline.tsx` — drag interactions.
- `useClickOutside.ts`, `use-update-ansestors.tsx` — UI helpers.

Pattern: `subject.pipe(filter(({ key }) => key.startsWith(PREFIX)))` then `.subscribe(...)`, always unsubscribed in the effect cleanup.
