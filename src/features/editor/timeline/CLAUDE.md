# src/features/editor/timeline — canvas timeline

Wraps the `@designcombo/timeline` engine (canvas-based, not DOM). `index.ts` re-exports `timeline.tsx`.

- `timeline.tsx` — instantiates the engine, registers it into `use-store` (`setTimeline`), and resizes it (driven by `editor.tsx`'s `handleTimelineResize`, sized off `#timeline-container`).
- `header.tsx`, `ruler.tsx`, `playhead.tsx` — DOM chrome around the canvas (zoom controls, time ruler, playhead).
- `items/` — per-type timeline drawables (`video.ts`, `audio.ts`, `image.ts`, `text.ts`, `caption.ts`, `track.ts`, `timeline.ts`) plus audio-bar variants (`hill-`, `lineal-`, `radial-`, `wave-audio-bars.ts`) and `preview-drag-item.ts`. These are imperative canvas drawing classes, not React.
- `controls/` — selection/resize handle drawing (`controls.ts`, `draw.ts`).
- `types.ts` — timeline-local types.

Seeking emits `TIMELINE_SEEK`; `../hooks/use-timeline-events.ts` syncs it to the player. Scale/scroll/zoom state lives in `use-store` (`scale`, `scroll`).
