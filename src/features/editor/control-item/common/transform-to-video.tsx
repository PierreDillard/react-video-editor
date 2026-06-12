import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { useIsLargeScreen } from "@/hooks/use-media-query";
import { IImage, ITrackItem } from "@designcombo/types";
import { Sparkles } from "lucide-react";
import { GenerateVideoForm } from "../../ai-video/generate-video-form";
import useLayoutStore from "../../store/use-layout-store";

// Google Vids-like flow: click an image on the timeline, transform it to video,
// then follow the generation in the AI Video sidebar panel.
const TransformToVideo = ({
  trackItem
}: {
  trackItem: ITrackItem & IImage;
}) => {
  const [open, setOpen] = useState(false);
  const { setActiveMenuItem, setShowMenuItem, setDrawerOpen } =
    useLayoutStore();
  const isLargeScreen = useIsLargeScreen();

  const openAiVideoPanel = () => {
    setActiveMenuItem("ai-video");
    if (isLargeScreen) {
      setShowMenuItem(true);
    } else {
      setDrawerOpen(true);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary" size="sm" className="w-full gap-2">
          <Sparkles className="h-4 w-4" />
          Transform to video
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Transform image to video</DialogTitle>
          <DialogDescription>
            Generate an AI video from this image. Follow the progress in the AI
            Video panel.
          </DialogDescription>
        </DialogHeader>
        <GenerateVideoForm
          fixedImageUrl={trackItem.details.src}
          onSubmitted={() => {
            setOpen(false);
            openAiVideoPanel();
          }}
        />
      </DialogContent>
    </Dialog>
  );
};

export default TransformToVideo;
