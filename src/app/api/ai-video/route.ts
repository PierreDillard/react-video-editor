import { NextResponse } from "next/server";
import {
	AiVideoMode,
	getAiVideoModel
} from "@/features/editor/data/ai-video-models";

const FAL_QUEUE_URL = "https://queue.fal.run";

export async function POST(request: Request) {
	try {
		if (!process.env.FAL_KEY) {
			return NextResponse.json(
				{ message: "FAL_KEY is not configured" },
				{ status: 500 }
			);
		}

		const body = await request.json();
		const { modelId, mode, prompt, imageUrl, durationSec } = body as {
			modelId: string;
			mode: AiVideoMode;
			prompt?: string;
			imageUrl?: string;
			durationSec: number;
		};

		const model = getAiVideoModel(modelId);
		if (!model) {
			return NextResponse.json(
				{ message: `Unknown model: ${modelId}` },
				{ status: 400 }
			);
		}

		const endpoint = model.endpoints[mode];
		if (!endpoint) {
			return NextResponse.json(
				{ message: `Model ${model.name} does not support ${mode}` },
				{ status: 400 }
			);
		}

		if (mode === "image-to-video" && !imageUrl) {
			return NextResponse.json(
				{ message: "imageUrl is required for image-to-video" },
				{ status: 400 }
			);
		}
		if (mode === "text-to-video" && !prompt?.trim()) {
			return NextResponse.json(
				{ message: "prompt is required for text-to-video" },
				{ status: 400 }
			);
		}

		const falResponse = await fetch(`${FAL_QUEUE_URL}/${endpoint}`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Key ${process.env.FAL_KEY}`
			},
			body: JSON.stringify(model.buildInput({ prompt, imageUrl, durationSec }))
		});

		if (!falResponse.ok) {
			const falError = await falResponse.json().catch(() => null);
			return NextResponse.json(
				{ message: falError?.detail || "Failed to submit generation job" },
				{ status: falResponse.status }
			);
		}

		const data = await falResponse.json();
		return NextResponse.json({
			requestId: data.request_id,
			statusUrl: data.status_url,
			responseUrl: data.response_url
		});
	} catch (error) {
		console.error("Error submitting AI video job:", error);
		return NextResponse.json(
			{ message: "Internal server error" },
			{ status: 500 }
		);
	}
}
