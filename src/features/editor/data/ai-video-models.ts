export type AiVideoMode = "text-to-video" | "image-to-video";

export interface AiVideoGenerationParams {
	prompt?: string;
	imageUrl?: string;
	durationSec: number;
}

export interface AiVideoModel {
	id: string;
	name: string;
	// fal.ai queue endpoints, one per supported mode
	endpoints: Partial<Record<AiVideoMode, string>>;
	// Indicative price (USD) — adjust to match https://fal.ai/models pricing
	pricePerSecond: number;
	priceByDurationSec?: Partial<Record<number, number>>;
	durations: number[];
	defaultDuration: number;
	buildInput: (params: AiVideoGenerationParams) => Record<string, unknown>;
}

export const AI_VIDEO_MODELS: AiVideoModel[] = [
	{
		id: "pixverse-v4.5",
		name: "PixVerse v4.5",
		endpoints: {
			"text-to-video": "fal-ai/pixverse/v4.5/text-to-video",
			"image-to-video": "fal-ai/pixverse/v4.5/image-to-video"
		},
		pricePerSecond: 0.04,
		priceByDurationSec: {
			5: 0.2,
			8: 0.4
		},
		durations: [5, 8],
		defaultDuration: 5,
		buildInput: ({ prompt, imageUrl, durationSec }) => ({
			prompt: prompt || "Animate this image with natural motion.",
			image_url: imageUrl,
			duration: String(durationSec),
			resolution: "720p"
		})
	},
	{
		id: "kling-2.1-standard",
		name: "Kling 2.1 Standard",
		endpoints: {
			"image-to-video": "fal-ai/kling-video/v2.1/standard/image-to-video"
		},
		pricePerSecond: 0.05,
		durations: [5, 10],
		defaultDuration: 5,
		buildInput: ({ prompt, imageUrl, durationSec }) => ({
			prompt: prompt || "",
			image_url: imageUrl,
			duration: String(durationSec)
		})
	},
	{
		id: "kling-2.1-master",
		name: "Kling 2.1 Master",
		endpoints: {
			"text-to-video": "fal-ai/kling-video/v2.1/master/text-to-video",
			"image-to-video": "fal-ai/kling-video/v2.1/master/image-to-video"
		},
		pricePerSecond: 0.28,
		durations: [5, 10],
		defaultDuration: 5,
		buildInput: ({ prompt, imageUrl, durationSec }) => ({
			prompt: prompt || "",
			...(imageUrl ? { image_url: imageUrl } : {}),
			duration: String(durationSec)
		})
	},
	{
		id: "minimax-hailuo-02-standard",
		name: "MiniMax Hailuo 02",
		endpoints: {
			"text-to-video": "fal-ai/minimax/hailuo-02/standard/text-to-video",
			"image-to-video": "fal-ai/minimax/hailuo-02/standard/image-to-video"
		},
		pricePerSecond: 0.045,
		durations: [6, 10],
		defaultDuration: 6,
		buildInput: ({ prompt, imageUrl, durationSec }) => ({
			prompt: prompt || "",
			...(imageUrl ? { image_url: imageUrl } : {}),
			duration: String(durationSec)
		})
	},
	{
		id: "veo-3-fast",
		name: "Google Veo 3 Fast",
		endpoints: {
			"text-to-video": "fal-ai/veo3/fast",
			"image-to-video": "fal-ai/veo3/fast/image-to-video"
		},
		pricePerSecond: 0.4,
		durations: [8],
		defaultDuration: 8,
		buildInput: ({ prompt, imageUrl, durationSec }) => ({
			prompt: prompt || "",
			...(imageUrl ? { image_url: imageUrl } : {}),
			duration: `${durationSec}s`,
			generate_audio: true
		})
	}
];

export const getAiVideoModel = (modelId: string) =>
	AI_VIDEO_MODELS.find((model) => model.id === modelId);

export const getModelsForMode = (mode: AiVideoMode) =>
	AI_VIDEO_MODELS.filter((model) => model.endpoints[mode]);
