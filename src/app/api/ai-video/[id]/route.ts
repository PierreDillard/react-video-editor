import {
	AiVideoMode,
	getAiVideoModel,
} from "@/features/editor/data/ai-video-models";
import { falQueueBase } from "@/features/editor/utils/ai-video-cost";
import { NextRequest, NextResponse } from "next/server";

const FAL_QUEUE_URL = "https://queue.fal.run";

const safeFalUrl = (url: string | null) =>
	url?.startsWith(`${FAL_QUEUE_URL}/`) ? url : null;

const appendFalResponsePath = (url: string | null) => {
	const safeUrl = safeFalUrl(url);
	if (!safeUrl) return null;
	return safeUrl.endsWith("/response") ? safeUrl : `${safeUrl}/response`;
};

const uniqueUrls = (...urls: Array<string | null | undefined>) =>
	Array.from(new Set(urls.filter((url): url is string => !!url)));

const isVideoUrl = (url: string) => /\.(mp4|mov|webm|m4v)(\?|#|$)/i.test(url);

const getFileUrl = (file: any): string | undefined => {
	if (!file || typeof file !== "object" || typeof file.url !== "string") {
		return undefined;
	}

	const contentType = String(file.content_type ?? file.contentType ?? "");
	const fileName = String(file.file_name ?? file.fileName ?? file.name ?? "");
	if (
		contentType.startsWith("video/") ||
		isVideoUrl(file.url) ||
		isVideoUrl(fileName)
	) {
		return file.url;
	}

	return undefined;
};

const getVideoUrl = (data: any, depth = 0): string | undefined => {
	if (!data || depth > 5) return undefined;

	if (typeof data.video_url === "string") return data.video_url;
	if (typeof data.videoUrl === "string") return data.videoUrl;

	const directVideo = getFileUrl(data.video) ?? getFileUrl(data);
	if (directVideo) return directVideo;

	if (Array.isArray(data.videos)) {
		for (const video of data.videos) {
			const videoUrl = getFileUrl(video);
			if (videoUrl) return videoUrl;
		}
	}

	for (const key of ["data", "payload", "output", "result"]) {
		const videoUrl = getVideoUrl(data[key], depth + 1);
		if (videoUrl) return videoUrl;
	}

	return undefined;
};

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const { id } = await params;
		const modelId = request.nextUrl.searchParams.get("modelId") ?? "";
		const mode = request.nextUrl.searchParams.get("mode") as AiVideoMode;
		const statusUrl = safeFalUrl(request.nextUrl.searchParams.get("statusUrl"));
		const responseUrl = safeFalUrl(
			request.nextUrl.searchParams.get("responseUrl"),
		);

		const endpoint = getAiVideoModel(modelId)?.endpoints[mode];
		if (!endpoint) {
			return NextResponse.json(
				{ message: "Invalid modelId or mode" },
				{ status: 400 },
			);
		}

		const base = falQueueBase(endpoint);
		const headers = { Authorization: `Key ${process.env.FAL_KEY}` };
		const fallbackStatusUrl = `${FAL_QUEUE_URL}/${base}/requests/${id}/status`;
		const fallbackResponseUrl = `${FAL_QUEUE_URL}/${base}/requests/${id}/response`;

		const statusResponse = await fetch(statusUrl ?? fallbackStatusUrl, {
			headers,
		});

		if (!statusResponse.ok) {
			const statusError = await statusResponse.json().catch(() => null);
			const message =
				statusError?.detail ||
				statusError?.message ||
				statusError?.error ||
				`Failed to fetch job status (${statusResponse.status})`;
			return NextResponse.json(
				{
					status: "failed",
					error: message,
				},
				{ status: 200 },
			);
		}

		const statusData = await statusResponse.json();
		const statusResponseUrl = safeFalUrl(statusData.response_url);

		if (statusData.status === "IN_QUEUE") {
			return NextResponse.json({ status: "pending" });
		}
		if (statusData.status === "IN_PROGRESS") {
			return NextResponse.json({ status: "running" });
		}
		if (statusData.status === "FAILED") {
			return NextResponse.json({
				status: "failed",
				error: statusData.error || "Generation failed",
			});
		}

		// COMPLETED: fetch the result to get the video URL. Some fal endpoints
		// return a response_url with /response, while PixVerse returns the result
		// directly at /requests/:id.
		let lastError = "Generation completed without a video";
		const resultUrls = uniqueUrls(
			responseUrl,
			statusResponseUrl,
			fallbackResponseUrl,
			appendFalResponsePath(responseUrl),
			appendFalResponsePath(statusResponseUrl),
		);

		for (const resultUrl of resultUrls) {
			const resultResponse = await fetch(resultUrl, { headers });
			const resultData = await resultResponse.json().catch(() => null);
			const videoUrl = getVideoUrl(resultData);

			if (resultResponse.ok && videoUrl) {
				return NextResponse.json({ status: "completed", videoUrl });
			}

			lastError =
				resultData?.detail ||
				resultData?.message ||
				resultData?.error ||
				lastError;
		}

		return NextResponse.json({
			status: "failed",
			error: lastError,
		});
	} catch (error) {
		console.error("Error fetching AI video job status:", error);
		return NextResponse.json(
			{ message: "Internal server error" },
			{ status: 500 },
		);
	}
}
