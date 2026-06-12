import { AiVideoMode, getAiVideoModel } from "../data/ai-video-models";

export type AiVideoJobStatus = "pending" | "running" | "completed" | "failed";

export interface AiVideoJob {
	id: string;
	modelId: string;
	mode: AiVideoMode;
	prompt?: string;
	imageUrl?: string;
	durationSec: number;
	status: AiVideoJobStatus;
	videoUrl?: string;
	error?: string;
	cost: number;
	createdAt: number;
}

export const estimateCost = (modelId: string, durationSec: number): number => {
	const model = getAiVideoModel(modelId);
	if (!model) return 0;
	const durationPrice = model.priceByDurationSec?.[durationSec];
	if (durationPrice !== undefined) return durationPrice;
	return Number((model.pricePerSecond * durationSec).toFixed(4));
};

// Only completed generations are counted as spent
export const totalCost = (jobs: AiVideoJob[]): number =>
	Number(
		jobs
			.filter((job) => job.status === "completed")
			.reduce((sum, job) => sum + job.cost, 0)
			.toFixed(4)
	);

export const costByModel = (jobs: AiVideoJob[]): Record<string, number> => {
	const costs: Record<string, number> = {};
	for (const job of jobs) {
		if (job.status !== "completed") continue;
		costs[job.modelId] = Number(
			((costs[job.modelId] ?? 0) + job.cost).toFixed(4)
		);
	}
	return costs;
};

export const pendingCost = (jobs: AiVideoJob[]): number =>
	Number(
		jobs
			.filter((job) => job.status === "pending" || job.status === "running")
			.reduce((sum, job) => sum + job.cost, 0)
			.toFixed(4)
	);

// fal.ai queue status/result URLs use the full endpoint path.
export const falQueueBase = (endpoint: string): string =>
	endpoint;
