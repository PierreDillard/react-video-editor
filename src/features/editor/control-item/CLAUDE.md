# src/features/editor/control-item — property inspector

The panel that edits the currently selected track item's properties. `index.tsx` / `control-item.tsx` pick the editor for the selected item's type (from `useLayoutStore`'s `trackItem`).

One editor per item type: `basic-video.tsx`, `basic-image.tsx`, `basic-text.tsx`, `basic-audio.tsx`, `basic-caption.tsx`, plus `animations.tsx`, `presets.tsx`, `smart.tsx`.

- `common/` — shared property widgets (sliders, color, position/size inputs).
- `floating-controls/` — the floating toolbar shown over a selected item (`floating-control.tsx`, driven by `useLayoutStore`'s floating-control type/label).

Pattern: read current values from the selected `ITrackItem`; on change **`dispatch(EDIT_OBJECT, { payload: { [id]: { details: {...} } } })`** (the dominant dispatch in the app). Reuse shadcn/ui primitives from `@/components/ui`.

Horizontal-layout counterpart: `../control-item-horizontal.tsx`. Keep both in sync.
