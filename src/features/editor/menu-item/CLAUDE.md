# src/features/editor/menu-item — "add content" panel

The left-sidebar tabs that let users add media to the timeline. `menu-item.tsx` is the container; `index.tsx` routes to the active tab driven by `MenuList`.

One file per content source: `videos.tsx`, `images.tsx`, `texts.tsx`, `audios.tsx` (+ `audio-item.tsx`), `sfx.tsx`, `elements.tsx`, `transitions.tsx`, `uploads.tsx`, `captions.tsx`, `voice-over.tsx`, `ai-voice.tsx`.

Pattern: list items (from `../data/*` or a Pexels/AI API via `src/hooks/use-pexels-*` and `app/api/*`), and on click **`dispatch(ADD_VIDEO | ADD_IMAGE | ADD_TEXT | …, { payload })`** to insert onto the timeline. Don't mutate stores directly here.

Horizontal-layout counterpart: `menu-list-horizontal.tsx` (small screens). Keep tab parity.
