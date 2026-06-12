# src/features/editor/player — Remotion preview rendering

Renders the design as a Remotion composition for live preview (export is server-side; see `app/api`).

- `player.tsx` — wraps `@remotion/player`'s `Player`; `durationInFrames = round(duration/1000 * fps)`; registers its `PlayerRef` into `use-store` so events can drive it. (fps hardcoded to 30 on the element.)
- `composition.tsx` — top-level Remotion component; iterates tracks/items and renders each as a `Sequence`.
- `sequence-item.tsx` + `base-sequence.tsx` — map a track item to the right renderer, handle in/out timing and trims.
- `items/` — per-type renderers (video, image, text, audio, caption) including `audio-bars/` visualizations.
- `transitions/` — transition `presentations/` and `timings/`; `transition-presentations.tsx` selects them.
- `animated/` — animated text (`text-animated-types/` with `animations-in`, `animations-out`, `animations-loop`).
- `motion-text.tsx`, `media-background.tsx`, `lib/`, `styles.ts` — supporting render logic.

Frame math: design times are in **ms**; convert with `fps` (`ms/1000*fps`). Keep this consistent with `utils/time.ts` and the timeline.
