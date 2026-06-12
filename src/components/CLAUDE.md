# src/components — shared UI

- `ui/` — **shadcn/ui** (new-york style, zinc base, 38 components). Reuse and extend these; add new ones via the shadcn CLI rather than hand-writing. Configured by `components.json`.
- `shared/` — app-wide shared widgets: `draggable.tsx`, `icons.tsx`, `logos.tsx`.
- `color-picker/` — custom color/gradient picker (`solid/`, `gradient/`, `color-panel/`, `gradient-panel/`, `utils/`).
- `invitation-modal.tsx` — rendered alongside the editor on the home page.

Use `cn()` from `@/lib/utils` for class merging. Import via `@/components/...`.
