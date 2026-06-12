import { useEffect, useRef } from "react";
import { useAiVideoStore } from "../store/use-ai-video-store";

const POLL_INTERVAL_MS = 5000;

// Polls the status of pending/running AI video jobs and updates the store.
// Mounted once in editor.tsx so generations keep progressing whatever panel is open.
const useAiVideoPolling = () => {
	const inFlight = useRef<Set<string>>(new Set());

	useEffect(() => {
		const poll = async () => {
			const { jobs, updateJob } = useAiVideoStore.getState();
			const activeJobs = jobs.filter(
				(job) => job.status === "pending" || job.status === "running"
			);

			for (const job of activeJobs) {
				if (inFlight.current.has(job.id)) continue;
				inFlight.current.add(job.id);

				try {
					const response = await fetch(
						`/api/ai-video/${job.id}?modelId=${job.modelId}&mode=${job.mode}`
					);
					if (!response.ok) continue;

					const data = await response.json();
					if (data.status && data.status !== job.status) {
						updateJob(job.id, {
							status: data.status,
							videoUrl: data.videoUrl,
							error: data.error,
							...(data.status === "failed" ? { cost: 0 } : {})
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
