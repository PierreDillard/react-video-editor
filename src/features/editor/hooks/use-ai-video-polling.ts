import { useEffect, useRef } from "react";
import { useAiVideoStore } from "../store/use-ai-video-store";
import { estimateCost } from "../utils/ai-video-cost";

const POLL_INTERVAL_MS = 5000;
const RECOVERABLE_ERRORS = new Set([
	"Failed to fetch job status",
	"Generation completed without a video"
]);

// Polls the status of pending/running AI video jobs and updates the store.
// Mounted once in editor.tsx so generations keep progressing whatever panel is open.
const useAiVideoPolling = () => {
	const inFlight = useRef<Set<string>>(new Set());

	useEffect(() => {
		const poll = async () => {
			const { jobs, updateJob } = useAiVideoStore.getState();
			const activeJobs = jobs.filter(
				(job) =>
					job.status === "pending" ||
					job.status === "running" ||
					(job.status === "failed" &&
						!!job.responseUrl &&
						!job.videoUrl &&
						RECOVERABLE_ERRORS.has(job.error ?? ""))
			);

			for (const job of activeJobs) {
				if (inFlight.current.has(job.id)) continue;
				inFlight.current.add(job.id);

				try {
					const params = new URLSearchParams({
						modelId: job.modelId,
						mode: job.mode
					});
					if (job.statusUrl) params.set("statusUrl", job.statusUrl);
					if (job.responseUrl) params.set("responseUrl", job.responseUrl);

					const response = await fetch(
						`/api/ai-video/${job.id}?${params.toString()}`
					);
					if (!response.ok) continue;

					const data = await response.json();
					if (
						data.status &&
						(data.status !== job.status ||
							data.videoUrl !== job.videoUrl ||
							data.error !== job.error)
					) {
						updateJob(job.id, {
							status: data.status,
							videoUrl: data.videoUrl,
							error: data.error,
							...(data.status === "failed" ? { cost: 0 } : {}),
							...(data.status === "completed"
								? { cost: estimateCost(job.modelId, job.durationSec) }
								: {})
						});
					}
				} catch {
					// network hiccup: retry on next tick
				} finally {
					inFlight.current.delete(job.id);
				}
			}
		};

		poll();
		const interval = setInterval(poll, POLL_INTERVAL_MS);
		return () => clearInterval(interval);
	}, []);
};

export default useAiVideoPolling;
