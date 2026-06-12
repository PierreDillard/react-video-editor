# src/app — Next.js App Router

Thin routing layer. All real UI lives in `src/features/editor`; pages here just mount `<Editor>`.

- `page.tsx` — home `/`, renders `<Editor>` + `<InvitationModal>` (client component).
- `edit/page.tsx` — `/edit`, blank editor.
- `edit/[...id]/page.tsx` — `/edit/<sceneId>/…`, awaits `params`, passes the first segment as `id` to `<Editor id={sceneId}>`.
- `layout.tsx` — root layout, providers, fonts, analytics.
- `globals.css` — Tailwind v4 entry + shadcn CSS variables (this is the `tailwind.css` referenced by `components.json`; there is no `tailwind.config`).

`api/` — server routes; see `api/CLAUDE.md`.

When adding a route, keep the page a server/client shell that delegates into a feature module — don't grow editor logic here.
