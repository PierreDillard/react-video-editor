import React, { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { ImagePlus, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import {
  getAiVideoModel,
  getModelsForMode
} from "../data/ai-video-models";
import { estimateCost } from "../utils/ai-video-cost";
import { useAiVideoStore } from "../store/use-ai-video-store";

interface GenerateVideoFormProps {
  // When set (e.g. opened from an image on the timeline), the image is locked
  fixedImageUrl?: string;
  onSubmitted?: () => void;
}

// fal.ai must be able to fetch the image: local/relative URLs (e.g. /uploads/...)
// are inlined as data URLs before submission
const toFalReachableUrl = async (url: string): Promise<string> => {
  const isRemote =
    /^https?:\/\//.test(url) &&
    !url.includes("localhost") &&
    !url.includes("127.0.0.1");
  if (url.startsWith("data:") || isRemote) return url;

  const blob = await (await fetch(url)).blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Failed to read image"));
    reader.readAsDataURL(blob);
  });
};

const formatModelPrice = (modelId: string) => {
  const model = getAiVideoModel(modelId);
  if (!model) return "";

  if (model.priceByDurationSec) {
    return model.durations
      .map((duration) => `$${estimateCost(model.id, duration).toFixed(2)}/${duration}s`)
      .join(" · ");
  }

  return `$${model.pricePerSecond.toFixed(3)}/s`;
};

export const GenerateVideoForm = ({
  fixedImageUrl,
  onSubmitted
}: GenerateVideoFormProps) => {
  const submitJob = useAiVideoStore((state) => state.submitJob);
  const [prompt, setPrompt] = useState("");
  const [pickedImageUrl, setPickedImageUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const imageUrl = fixedImageUrl ?? pickedImageUrl ?? undefined;
  const mode = imageUrl ? "image-to-video" : "text-to-video";
  const models = useMemo(() => getModelsForMode(mode), [mode]);
  const previousModeRef = useRef(mode);

  const [modelId, setModelId] = useState(models[0]?.id ?? "");
  useEffect(() => {
    if (previousModeRef.current !== mode) {
      previousModeRef.current = mode;
      setModelId(models[0]?.id ?? "");
      return;
    }

    if (!models.some((model) => model.id === modelId)) {
      setModelId(models[0]?.id ?? "");
    }
  }, [mode, modelId, models]);

  const model = getAiVideoModel(modelId);
  const [durationSec, setDurationSec] = useState(model?.defaultDuration ?? 5);
  useEffect(() => {
    if (model && !model.durations.includes(durationSec)) {
      setDurationSec(model.defaultDuration);
    }
  }, [modelId]);

  const handlePickImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPickedImageUrl(reader.result as string);
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const canSubmit =
    !!model &&
    !submitting &&
    (mode === "image-to-video" ? !!imageUrl : !!prompt.trim());

  const handleSubmit = async () => {
    if (!model) return;
    setSubmitting(true);
    try {
      await submitJob({
        modelId: model.id,
        prompt: prompt.trim() || undefined,
        imageUrl: imageUrl ? await toFalReachableUrl(imageUrl) : undefined,
        durationSec
      });
      toast.success("Video generation started");
      setPrompt("");
      setPickedImageUrl(null);
      onSubmitted?.();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to start generation"
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Image source */}
      <div className="space-y-2">
        <Label className="font-sans text-xs font-semibold">
          {fixedImageUrl ? "Source image" : "Image (optional)"}
        </Label>
        {imageUrl ? (
          <div className="relative w-fit">
            <img
              src={imageUrl}
              alt="Source"
              className="h-20 rounded-md object-cover"
            />
            {!fixedImageUrl && (
              <Button
                size="icon"
                variant="secondary"
                className="absolute -right-2 -top-2 h-5 w-5 rounded-full"
                onClick={() => setPickedImageUrl(null)}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        ) : (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePickImage}
            />
            <Button
              variant="outline"
              size="sm"
              className="w-full gap-2"
              onClick={() => fileInputRef.current?.click()}
            >
              <ImagePlus className="h-4 w-4" />
              Add image to animate
            </Button>
          </>
        )}
      </div>

      {/* Prompt */}
      <div className="space-y-2">
        <Label className="font-sans text-xs font-semibold">
          Prompt{mode === "image-to-video" ? " (optional)" : ""}
        </Label>
        <Textarea
          placeholder={
            mode === "image-to-video"
              ? "Describe the motion you want..."
              : "Describe the video you want to generate..."
          }
          value={prompt}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
            setPrompt(e.target.value)
          }
          className="min-h-[80px] resize-none"
          disabled={submitting}
        />
      </div>

      {/* Model */}
      <div className="space-y-2">
        <Label className="font-sans text-xs font-semibold">Model</Label>
        <Select value={modelId} onValueChange={setModelId}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select model" />
          </SelectTrigger>
          <SelectContent>
            {models.map((m) => (
              <SelectItem key={m.id} value={m.id}>
                {m.name} · {formatModelPrice(m.id)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Duration */}
      <div className="space-y-2">
        <Label className="font-sans text-xs font-semibold">Duration</Label>
        <Select
          value={String(durationSec)}
          onValueChange={(v) => setDurationSec(Number(v))}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(model?.durations ?? []).map((d) => (
              <SelectItem key={d} value={String(d)}>
                {d}s
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Estimated cost</span>
        <span>~${estimateCost(modelId, durationSec).toFixed(2)}</span>
      </div>

      <Button
        onClick={handleSubmit}
        disabled={!canSubmit}
        className="flex w-full items-center gap-2"
        size="sm"
      >
        {submitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Starting...
          </>
        ) : (
          "Generate Video"
        )}
      </Button>
    </div>
  );
};
