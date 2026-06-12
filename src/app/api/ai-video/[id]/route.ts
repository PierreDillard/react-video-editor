import { NextRequest, NextResponse } from "next/server";
import {
	AiVideoMode,
	getAiVideoModel
} from "@/features/editor/data/ai-video-models";
import { falQueueBase } from "@/features/editor/utils/ai-video-cost";

const FAL_QUEUE_URL = "https://queue.fal.run";

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const { id } = await params;
		const modelId = request.nextUrl.searchParams.get("modelId") ?? "";
		const mode = request.nextUrl.searchParams.get("mode") as AiVideoMode;

		const endpoint = getAiVideoModel(modelId)?.endpoints[mode];
		if (!endpoint) {
			return NextResponse.json(
				{ message: "Invalid modelId or mode" },
				{ status: 400 }
			);
		}

		const base = falQueueBase(endpoint);
		const headers = { Authorization: `Key ${process.env.FAL_KEY}` };

		const statusResponse = await fetch(
			`${FAL_QUEUE_URL}/${base}/requests/${id}/status`,
			{ headers }
		);

		if (!statusResponse.ok) {
			const statusError = await statusResponse.json().catch(() => null);
			return NextResponse.json(
				{
					status: "failed",
					error: statusError?.detail || "Failed to fetch job status"
				},
				{ status: 200 }
			);
		}

		const statusData = await statusResponse.json();

		if (statusData.status === "IN_QUEUE") {
			return NextResponse.json({ status: "pending" });
		}
		if (statusData.status === "IN_PROGRESS") {
			return NextResponse.json({ status: "running" });
		}

		// COMPLETED: fetch the result to get the video URL
		const resultResponse = await fetch(
			`${FAL_QUEUE_URL}/${base}/requests/${id}`,
			{ headers }
		);
		const resultData = await resultResponse.json().catch(() => null);
		const videoUrl = resultData?.video?.url;

		if (!resultResponse.ok || !videoUrl) {
			return NextResponse.json({
				status: "failed",
				error: resultData?.detail || "Generation completed without a video"
			});
		}

		return NextResponse.json({ status: "completed", videoUrl });
	} catch (error) {
		console.error("Error fetching AI video job status:", error);
		return NextResponse.json(
			{ message: "Internal server error" },
			{ status: 500 }
		);
	}
}
