# src — source root

- `app/` — Next.js App Router pages + API route handlers (thin shell over the editor).
- `features/editor/` — the entire editor application (start here for any editing feature).
- `components/` — shared UI: shadcn/ui (`ui/`), color picker, shared widgets.
- `store/` — app-level Zustand stores (`use-scene-store.ts`). Editor-specific stores live in `features/editor/store/`.
- `hooks/` — app-level hooks (`use-media-query.ts`, `use-pexels-*`, `use-copy-to-clipboard.ts`, `use-autosize-textarea.ts`). Editor-specific hooks live in `features/editor/hooks/`.
- `lib/` — `utils.ts` (`cn()`) and shared `types.ts`.
- `constants/`, `utils/` — app-level constants and helpers.

Import alias: `@/*` → `src/*`. See the root `CLAUDE.md` for the overall architecture and data-flow model.
