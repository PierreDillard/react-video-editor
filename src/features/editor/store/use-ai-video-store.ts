import { create } from "zustand";
import { persist } from "zustand/middleware";
import { AiVideoMode } from "../data/ai-video-models";
import { AiVideoJob, estimateCost } from "../utils/ai-video-cost";

interface SubmitJobParams {
	modelId: string;
	prompt?: string;
	imageUrl?: string;
	durationSec: number;
}

interface IAiVideoStore {
	jobs: AiVideoJob[];
	submitJob: (params: SubmitJobParams) => Promise<void>;
	updateJob: (id: string, patch: Partial<AiVideoJob>) => void;
	removeJob: (id: string) => void;
}

export const useAiVideoStore = create<IAiVideoStore>()(
	persist(
		(set) => ({
			jobs: [],

			submitJob: async ({ modelId, prompt, imageUrl, durationSec }) => {
				const mode: AiVideoMode = imageUrl
					? "image-to-video"
					: "text-to-video";

				const response = await fetch("/api/ai-video", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ modelId, mode, prompt, imageUrl, durationSec })
				});

				if (!response.ok) {
					const error = await response.json().catch(() => null);
					throw new Error(error?.message || "Failed to submit generation");
				}

				const { requestId } = await response.json();

				const job: AiVideoJob = {
					id: requestId,
					modelId,
					mode,
					prompt,
					imageUrl,
					durationSec,
					status: "pending",
					cost: estimateCost(modelId, durationSec),
					createdAt: Date.now()
				};

				set((state) => ({ jobs: [job, ...state.jobs] }));
			},

			updateJob: (id, patch) =>
				set((state) => ({
					jobs: state.jobs.map((job) =>
						job.id === id ? { ...job, ...patch } : job
					)
				})),

			removeJob: (id) =>
				set((state) => ({
					jobs: state.jobs.filter((job) => job.id !== id)
				}))
		}),
		{ name: "ai-video-jobs" }
	)
);
