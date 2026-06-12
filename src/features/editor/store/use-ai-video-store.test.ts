import { beforeEach, describe, expect, it, vi } from "vitest";

// zustand persist reads localStorage at import time: stub it first
vi.hoisted(() => {
	const storage = new Map<string, string>();
	(globalThis as any).localStorage = {
		getItem: (key: string) => storage.get(key) ?? null,
		setItem: (key: string, value: string) => storage.set(key, value),
		removeItem: (key: string) => storage.delete(key),
		clear: () => storage.clear(),
		key: () => null,
		length: 0
	};
});

import { useAiVideoStore } from "./use-ai-video-store";

describe("useAiVideoStore", () => {
	beforeEach(() => {
		useAiVideoStore.setState({ jobs: [] });
		vi.restoreAllMocks();
	});

	it("submitJob posts to the API and adds a pending job with estimated cost", async () => {
		const fetchMock = vi.fn().mockResolvedValue({
			ok: true,
			json: async () => ({ requestId: "req-1" })
		});
		vi.stubGlobal("fetch", fetchMock);

		await useAiVideoStore.getState().submitJob({
			modelId: "kling-2.1-standard",
			prompt: "a cat",
			imageUrl: "https://example.com/cat.png",
			durationSec: 5
		});

		expect(fetchMock).toHaveBeenCalledWith(
			"/api/ai-video",
			expect.objectContaining({ method: "POST" })
		);
		const body = JSON.parse(fetchMock.mock.calls[0][1].body);
		expect(body.mode).toBe("image-to-video");

		const [job] = useAiVideoStore.getState().jobs;
		expect(job.id).toBe("req-1");
		expect(job.status).toBe("pending");
		expect(job.cost).toBe(0.25);
	});

	it("submitJob uses text-to-video mode when no image is given", async () => {
		const fetchMock = vi.fn().mockResolvedValue({
			ok: true,
			json: async () => ({ requestId: "req-2" })
		});
		vi.stubGlobal("fetch", fetchMock);

		await useAiVideoStore.getState().submitJob({
			modelId: "veo-3-fast",
			prompt: "a dog",
			durationSec: 8
		});

		expect(useAiVideoStore.getState().jobs[0].mode).toBe("text-to-video");
	});

	it("submitJob throws the API error message and adds no job", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue({
				ok: false,
				json: async () => ({ message: "FAL_KEY is not configured" })
			})
		);

		await expect(
			useAiVideoStore.getState().submitJob({
				modelId: "veo-3-fast",
				prompt: "a dog",
				durationSec: 8
			})
		).rejects.toThrow("FAL_KEY is not configured");
		expect(useAiVideoStore.getState().jobs).toHaveLength(0);
	});

	it("updateJob patches a job and removeJob deletes it", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue({
				ok: true,
				json: async () => ({ requestId: "req-3" })
			})
		);
		await useAiVideoStore.getState().submitJob({
			modelId: "veo-3-fast",
			prompt: "a dog",
			durationSec: 8
		});

		useAiVideoStore.getState().updateJob("req-3", {
			status: "completed",
			videoUrl: "https://example.com/out.mp4"
		});
		expect(useAiVideoStore.getState().jobs[0]).toMatchObject({
			status: "completed",
			videoUrl: "https://example.com/out.mp4"
		});

		useAiVideoStore.getState().removeJob("req-3");
		expect(useAiVideoStore.getState().jobs).toHaveLength(0);
	});
});
