import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";

const makeRequest = (responseUrl: string) =>
	new NextRequest(
		`http://localhost/api/ai-video/req-1?modelId=pixverse-v4.5&mode=image-to-video&statusUrl=${encodeURIComponent(
			"https://queue.fal.run/fal-ai/pixverse/requests/req-1/status",
		)}&responseUrl=${encodeURIComponent(responseUrl)}`,
	);

describe("GET /api/ai-video/[id]", () => {
	beforeEach(() => {
		vi.restoreAllMocks();
		process.env.FAL_KEY = "test-key";
	});

	it("uses the exact fal response URL before trying /response fallbacks", async () => {
		const fetchMock = vi
			.fn()
			.mockResolvedValueOnce({
				ok: true,
				json: async () => ({ status: "COMPLETED" }),
			})
			.mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					video: {
						content_type: "video/mp4",
						url: "https://fal.media/files/output.mp4",
					},
				}),
			});
		vi.stubGlobal("fetch", fetchMock);

		const response = await GET(
			makeRequest("https://queue.fal.run/fal-ai/pixverse/requests/req-1"),
			{ params: Promise.resolve({ id: "req-1" }) },
		);

		await expect(response.json()).resolves.toEqual({
			status: "completed",
			videoUrl: "https://fal.media/files/output.mp4",
		});
		expect(fetchMock.mock.calls[1][0]).toBe(
			"https://queue.fal.run/fal-ai/pixverse/requests/req-1",
		);
	});

	it("extracts video URLs from wrapped fal result payloads", async () => {
		const fetchMock = vi
			.fn()
			.mockResolvedValueOnce({
				ok: true,
				json: async () => ({ status: "COMPLETED" }),
			})
			.mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					data: {
						video: {
							content_type: "video/mp4",
							url: "https://fal.media/files/output.mp4",
						},
					},
				}),
			});
		vi.stubGlobal("fetch", fetchMock);

		const response = await GET(
			makeRequest(
				"https://queue.fal.run/fal-ai/pixverse/requests/req-1/response",
			),
			{ params: Promise.resolve({ id: "req-1" }) },
		);

		await expect(response.json()).resolves.toEqual({
			status: "completed",
			videoUrl: "https://fal.media/files/output.mp4",
		});
		expect(fetchMock.mock.calls[1][0]).toBe(
			"https://queue.fal.run/fal-ai/pixverse/requests/req-1/response",
		);
	});
});
