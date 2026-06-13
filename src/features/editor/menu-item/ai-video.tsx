import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { dispatch } from "@designcombo/events";
import { ADD_VIDEO } from "@designcombo/state";
import { generateId } from "@designcombo/timeline";
import { Loader2, PlusIcon, Sparkles, X } from "lucide-react";
import { GenerateVideoForm } from "../ai-video/generate-video-form";
import { getAiVideoModel } from "../data/ai-video-models";
import { useAiVideoStore } from "../store/use-ai-video-store";
import {
	AiVideoJob,
	costByModel,
	pendingCost,
	totalCost,
} from "../utils/ai-video-cost";

export const AiVideo = () => {
	const jobs = useAiVideoStore((state) => state.jobs);
	const removeJob = useAiVideoStore((state) => state.removeJob);

	const handleAddToTimeline = (job: AiVideoJob) => {
		dispatch(ADD_VIDEO, {
			payload: {
				id: generateId(),
				details: {
					src: job.videoUrl,
				},
				metadata: {
					previewUrl: job.imageUrl,
				},
			},
			options: {
				resourceId: "main",
				scaleMode: "fit",
			},
		});
	};

	return (
		<div className="flex flex-1 flex-col max-w-full">
			<div className="text-text-primary flex h-12 flex-none items-center px-4 text-sm font-medium">
				AI Video
			</div>

			<ScrollArea className="flex-1 px-4 max-h-full">
				<div className="space-y-4 pb-4">
					<GenerateVideoForm />

					<CostSummary jobs={jobs} />

					<div className="space-y-2">
						<Label className="font-sans text-xs font-semibold">
							Generations
						</Label>
						{jobs.length === 0 && (
							<p className="text-xs text-muted-foreground">
								Generated videos will appear here, ready to be added to the
								timeline.
							</p>
						)}
						{jobs.map((job) => (
							<JobItem
								key={job.id}
								job={job}
								onAdd={() => handleAddToTimeline(job)}
								onRemove={() => removeJob(job.id)}
							/>
						))}
					</div>
				</div>
			</ScrollArea>
		</div>
	);
};

const CostSummary = ({ jobs }: { jobs: AiVideoJob[] }) => {
	const byModel = costByModel(jobs);
	const pending = pendingCost(jobs);

	return (
		<div className="space-y-1 rounded-md border border-border/80 p-3">
			<div className="flex justify-between text-xs font-semibold">
				<span>Total spend</span>
				<span>${totalCost(jobs).toFixed(2)}</span>
			</div>
			{Object.entries(byModel).map(([modelId, cost]) => (
				<div
					key={modelId}
					className="flex justify-between text-xs text-muted-foreground"
				>
					<span>{getAiVideoModel(modelId)?.name ?? modelId}</span>
					<span>${cost.toFixed(2)}</span>
				</div>
			))}
			{pending > 0 && (
				<div className="flex justify-between text-xs text-muted-foreground">
					<span>In progress (est.)</span>
					<span>+${pending.toFixed(2)}</span>
				</div>
			)}
		</div>
	);
};

const JobItem = ({
	job,
	onAdd,
	onRemove,
}: {
	job: AiVideoJob;
	onAdd: () => void;
	onRemove: () => void;
}) => {
	const model = getAiVideoModel(job.modelId);
	const isLoading = job.status === "pending" || job.status === "running";
	const canAdd = job.status === "completed" && !!job.videoUrl;

	return (
		<div className="flex gap-3 rounded-md border border-border/80 p-2">
			<div className="relative h-16 w-16 flex-none overflow-hidden rounded-md bg-muted">
				{job.videoUrl ? (
					<video
						src={job.videoUrl}
						className="h-full w-full object-cover"
						muted
						preload="metadata"
					/>
				) : job.imageUrl ? (
					<img
						src={job.imageUrl}
						alt="Source"
						className={`h-full w-full object-cover ${isLoading ? "opacity-50" : ""}`}
					/>
				) : (
					<div className="flex h-full w-full items-center justify-center">
						<Sparkles className="h-5 w-5 text-muted-foreground" />
					</div>
				)}
				{isLoading && (
					<div className="absolute inset-0 flex items-center justify-center bg-black/40">
						<Loader2 className="h-5 w-5 animate-spin text-white" />
					</div>
				)}
			</div>

			<div className="flex min-w-0 flex-1 flex-col justify-between">
				<div>
					<div className="truncate text-xs font-medium">
						{model?.name ?? job.modelId}
					</div>
					<div className="truncate text-xs text-muted-foreground">
						{job.prompt || "Image to video"}
					</div>
					{job.status === "failed" && (
						<div className="truncate text-xs text-red-500">
							{job.error || "Generation failed"}
						</div>
					)}
				</div>
				<div className="flex items-center justify-between gap-2">
					<span className="text-xs text-muted-foreground">
						{job.status === "pending"
							? "Queued..."
							: job.status === "running"
								? "Generating..."
								: `$${job.cost.toFixed(2)}`}
					</span>
					{canAdd && (
						<Button
							size="sm"
							variant="secondary"
							className="h-6 gap-1 px-2 text-xs"
							onClick={onAdd}
						>
							<PlusIcon className="h-3 w-3" />
							Add
						</Button>
					)}
				</div>
			</div>

			<Button
				size="icon"
				variant="ghost"
				className="h-6 w-6 flex-none"
				onClick={onRemove}
			>
				<X className="h-3 w-3" />
			</Button>
		</div>
	);
};
