import { describe, expect, it } from "vitest";
import {
	AI_VIDEO_MODELS,
	getAiVideoModel,
	getModelsForMode
} from "../data/ai-video-models";
import {
	AiVideoJob,
	costByModel,
	estimateCost,
	falQueueBase,
	pendingCost,
	totalCost
} from "./ai-video-cost";

const job = (overrides: Partial<AiVideoJob>): AiVideoJob => ({
	id: "job-1",
	modelId: "kling-2.1-standard",
	mode: "image-to-video",
	durationSec: 5,
	status: "completed",
	cost: 0.25,
	createdAt: Date.now(),
	...overrides
});

describe("ai-video model registry", () => {
	it("every model has at least one endpoint, a price and durations", () => {
		for (const model of AI_VIDEO_MODELS) {
			expect(Object.keys(model.endpoints).length).toBeGreaterThan(0);
			expect(model.pricePerSecond).toBeGreaterThan(0);
			expect(model.durations.length).toBeGreaterThan(0);
			expect(model.durations).toContain(model.defaultDuration);
		}
	});

	it("getModelsForMode only returns models supporting the mode", () => {
		for (const model of getModelsForMode("text-to-video")) {
			expect(model.endpoints["text-to-video"]).toBeTruthy();
		}
		// kling standard is image-to-video only
		expect(
			getModelsForMode("text-to-video").map((m) => m.id)
		).not.toContain("kling-2.1-standard");
		expect(
			getModelsForMode("image-to-video").map((m) => m.id)
		).toContain("kling-2.1-standard");
	});

	it("buildInput includes the prompt and image url", () => {
		const model = getAiVideoModel("kling-2.1-master");
		expect(model).toBeDefined();
		const input = model?.buildInput({
			prompt: "a cat",
			imageUrl: "https://example.com/cat.png",
			durationSec: 5
		});
		expect(input?.prompt).toBe("a cat");
		expect(input?.image_url).toBe("https://example.com/cat.png");
		expect(input?.duration).toBe("5");
	});

	it("uses PixVerse v4.5 as the default image-to-video model", () => {
		expect(getModelsForMode("image-to-video")[0]?.id).toBe("pixverse-v4.5");
	});
});

describe("estimateCost", () => {
	it("multiplies price per second by duration", () => {
		expect(estimateCost("kling-2.1-standard", 5)).toBe(0.25);
		expect(estimateCost("kling-2.1-standard", 10)).toBe(0.5);
		expect(estimateCost("veo-3-fast", 8)).toBe(3.2);
	});

	it("uses duration-specific prices when a model defines them", () => {
		expect(estimateCost("pixverse-v4.5", 5)).toBe(0.2);
		expect(estimateCost("pixverse-v4.5", 8)).toBe(0.4);
	});

	it("returns 0 for unknown models", () => {
		expect(estimateCost("unknown-model", 5)).toBe(0);
	});
});

describe("cost aggregation", () => {
	const jobs: AiVideoJob[] = [
		job({ id: "a", modelId: "kling-2.1-standard", cost: 0.25 }),
		job({ id: "b", modelId: "kling-2.1-standard", cost: 0.5 }),
		job({ id: "c", modelId: "veo-3-fast", cost: 3.2 }),
		job({ id: "d", modelId: "veo-3-fast", cost: 3.2, status: "running" }),
		job({ id: "e", modelId: "veo-3-fast", cost: 0, status: "failed" })
	];

	it("totalCost only counts completed jobs", () => {
		expect(totalCost(jobs)).toBe(3.95);
	});

	it("costByModel groups completed jobs per model", () => {
		expect(costByModel(jobs)).toEqual({
			"kling-2.1-standard": 0.75,
			"veo-3-fast": 3.2
		});
	});

	it("pendingCost sums pending and running estimates", () => {
		expect(pendingCost(jobs)).toBe(3.2);
		expect(pendingCost([])).toBe(0);
	});
});

describe("falQueueBase", () => {
	it("keeps the full endpoint path", () => {
		expect(
			falQueueBase("fal-ai/kling-video/v2.1/standard/image-to-video")
		).toBe("fal-ai/kling-video/v2.1/standard/image-to-video");
		expect(falQueueBase("fal-ai/pixverse/v4.5/image-to-video")).toBe(
			"fal-ai/pixverse/v4.5/image-to-video"
		);
		expect(falQueueBase("fal-ai/veo3")).toBe("fal-ai/veo3");
	});
});
