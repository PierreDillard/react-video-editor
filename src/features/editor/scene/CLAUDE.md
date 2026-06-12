# src/features/editor/scene — editable canvas

The WYSIWYG preview surface. `index.ts` re-exports `scene.tsx`.

- `scene.tsx` — `forwardRef<SceneRef>`, hosts the Remotion `Player` (from `../player`), applies `useZoom` scaling to a `size.width × size.height` board, shows `empty.tsx` when there are no items, and exposes `recalculateZoom()` to `editor.tsx` via `useImperativeHandle`.
- `board.tsx` — the scaled stage that the player renders into.
- `interactions.tsx` (`SceneInteractions`) — Moveable-based drag/resize/rotate of selected items; emits `EDIT_OBJECT` / selection events.
- `droppable.tsx` — drop target for dragging media from the menu onto the canvas.
- `scene.types.ts` — `SceneRef` and related types.

Zoom is recomputed on timeline resize (debounced from `editor.tsx`'s `handleTimelineResize`).
