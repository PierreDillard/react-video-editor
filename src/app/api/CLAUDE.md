# src/app/api — Route handlers

Server-side proxies that keep secret API keys off the client. Each `route.ts` reads keys from `process.env` and forwards to an external service.

- `render/route.ts` + `render/[id]/route.ts` — POST creates a project then triggers export on the DesignCombo cloud API (`api.designcombo.dev`, auth `Bearer ${COMBO_SK}`); `[id]` polls export status. **This is how final video export works** (not local Remotion rendering).
- `pexels/route.ts`, `pexels-videos/route.ts` — Pexels stock search (`PEXELS_API_KEY`).
- `uploads/presign/route.ts`, `uploads/url/route.ts` — upload presigning (`COMBO_SH_JWT`).
- `transcribe/route.ts` + `transcribe/[id]/route.ts` — captions/transcription jobs.
- `voices/route.ts` — AI voice list / TTS (`VOICE_API_TOKEN`).
- `ai-video/route.ts` + `ai-video/[id]/route.ts` — AI video generation via the fal.ai queue API (`FAL_KEY`): POST submits a job (model registry in `features/editor/data/ai-video-models.ts` validates model/mode and builds the input), GET polls status and returns `{ status, videoUrl }` with statuses mapped to `pending|running|completed|failed`.

Conventions: return `NextResponse.json(...)` and propagate the upstream HTTP status on failure (`{ message }` + `{ status }`). Never expose env secrets in responses.
