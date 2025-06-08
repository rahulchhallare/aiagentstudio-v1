import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { X } from "lucide-react";

interface VideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoUrl: string;
  title?: string;
}

export default function VideoModal({
  isOpen,
  onClose,
  videoUrl,
  title = "Demo Video",
}: VideoModalProps) {
  // Check if it's a local file or external URL
  const isLocalFile = videoUrl.startsWith("/") || videoUrl.startsWith("./");

  // Convert Google Drive share URL to embeddable format
  const getEmbedUrl = (url: string) => {
    const fileIdMatch = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (fileIdMatch) {
      return `https://drive.google.com/file/d/${fileIdMatch[1]}/preview`;
    }
    return url;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-full max-h-[90vh] p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-0 flex-shrink-0">
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="flex-1 p-6 pt-0 overflow-hidden">
          <div className="w-full h-[60vh] max-h-[500px]">
            {isLocalFile ? (
              <video
                className="w-full h-full rounded-lg object-contain"
                controls
                autoPlay
                preload="metadata"
              >
                <source src={videoUrl} type="video/mp4" />
                <source src={videoUrl} type="video/quicktime" />
                <source src={videoUrl} type="video/mov" />
                Your browser does not support the video tag.
              </video>
            ) : (
              <iframe
                src={getEmbedUrl(videoUrl)}
                className="w-full h-full rounded-lg border-0"
                allow="autoplay"
                title={title}
              />
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}