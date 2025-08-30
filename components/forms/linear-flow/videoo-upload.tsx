"use client";

import { useState, useRef, useEffect, memo, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, Clock } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { VideoLink } from "@/lib/types";
// import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

type VideoPlayerWithLinksProps = {
  videoUrl: string;
  links: VideoLink[];
};

function VideoPlayerWithLinksComponent({
  videoUrl,
  links,
}: VideoPlayerWithLinksProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateDuration = () => setDuration(video.duration);
    video.addEventListener("loadedmetadata", updateDuration);

    return () => {
      video.removeEventListener("loadedmetadata", updateDuration);
    };
  }, [videoUrl]);

  const seekToTime = useCallback((time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
  }, []);

  const formatTime = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }, []);

  const videoElement = useMemo(
    () => (
      <video
        ref={videoRef}
        src={videoUrl}
        controls
        className="w-full h-auto max-h-96 rounded-lg"
        key={videoUrl}
      />
    ),
    [videoUrl]
  );

  return (
    <div className="relative">
      {videoElement}

      {duration > 0 && links.length > 0 && (
        <div className="relative h-6 mt-2 bg-gray-100 rounded-md overflow-hidden">
          {links.map((link) => (
            <div
              key={link.id}
              className="absolute top-0 h-full flex flex-col items-center"
              style={{ left: `${(link.timestamp_seconds / duration) * 100}%` }}
            >
              {/* Timestamp Icon */}
              {link.link_type === "url" ? (
                <Clock className="w-3 h-3 text-blue-500" />
              ) : (
                <Clock className="w-3 h-3 text-green-500" />
              )}

              {/* Vertical line */}
              <div
                className={`w-px h-3 ${
                  link.link_type === "url" ? "bg-blue-500" : "bg-green-500"
                }`}
              ></div>

              {/* Clickable timestamp */}
              <button
                onClick={() => seekToTime(link.timestamp_seconds)}
                className={`text-xs ${
                  link.link_type === "url"
                    ? "text-blue-600 hover:text-blue-800"
                    : "text-green-600 hover:text-green-800"
                } mt-1 whitespace-nowrap`}
                title={`${link.label} - ${formatTime(
                  link.timestamp_seconds
                )} (${link.link_type === "url" ? "Link" : "Video"})`}
              >
                {formatTime(link.timestamp_seconds)}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export const VideoPlayerWithLinks = memo(
  VideoPlayerWithLinksComponent,
  (prevProps, nextProps) => {
    return (
      prevProps.videoUrl === nextProps.videoUrl &&
      JSON.stringify(prevProps.links) === JSON.stringify(nextProps.links)
    );
  }
);

type VideoUploadWithLinksProps = {
  video: {
    id: string;
    title: string;
    file: File | null;
    url: string;
    duration: number;
    links: VideoLink[];
  };
  availableVideos: Array<{ id: string; title: string }>; // Add available videos prop
  onFileChange: (file: File | null, duration: number) => void;
  onLinksChange: (links: VideoLink[]) => void;
  onDelete: () => void;
};

function VideoUploadWithLinksComponent({
  video,
  availableVideos,
  onFileChange,
  onLinksChange,
  onDelete,
}: VideoUploadWithLinksProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Updated button forms to include link type
  const [buttonForms, setButtonForms] = useState<
    {
      id?: string;
      label: string;
      url: string;
      timestamp: string;
      linkType: "url" | "video";
      destinationVideoId: string;
    }[]
  >([
    {
      label: "",
      url: "",
      timestamp: "",
      linkType: "url",
      destinationVideoId: "",
    },
  ]);

  // Sync modal state with existing video.links when modal opens
  useEffect(() => {
    if (isModalOpen) {
      if (video.links && video.links.length > 0) {
        setButtonForms(
          video.links.map((link) => ({
            id: link.id,
            label: link.label,
            url: link.url || "",
            timestamp: String(link.timestamp_seconds),
            linkType: link.link_type,
            destinationVideoId: link.destination_video_id || "",
          }))
        );
      } else {
        setButtonForms([
          {
            label: "",
            url: "",
            timestamp: "",
            linkType: "url",
            destinationVideoId: "",
          },
        ]);
      }
    }
  }, [isModalOpen, video.links]);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
        const selectedFile = e.target.files[0];
        const sizeInMB = selectedFile.size / (1024 * 1024);

        if (sizeInMB > 50) {
          alert("File size exceeds 50mb. Please upload a smaller file.");
          return;
        }

        const videoElement = document.createElement("video");
        videoElement.preload = "metadata";

        videoElement.onloadedmetadata = function () {
          window.URL.revokeObjectURL(videoElement.src);
          const videoDuration = Math.round(videoElement.duration);
          onFileChange(selectedFile, videoDuration);
        };

        videoElement.src = URL.createObjectURL(selectedFile);
      }
    },
    [onFileChange]
  );

  const handleFormChange = useCallback(
    (index: number, field: keyof (typeof buttonForms)[0], value: string) => {
      setButtonForms((prev) =>
        prev.map((form, i) => {
          if (i !== index) return form;

          let updated = { ...form, [field]: value };

          // Auto-adjust linkType
          if (field === "url" && value) {
            updated.linkType = "url";
            updated.destinationVideoId = ""; // clear the other
          } else if (field === "destinationVideoId" && value) {
            updated.linkType = "video";
            updated.url = ""; // clear the other
          }

          return updated;
        })
      );
    },
    []
  );

  const handleAddForm = useCallback(() => {
    setButtonForms((prev) => [
      ...prev,
      {
        label: "",
        url: "",
        timestamp: "",
        linkType: "url",
        destinationVideoId: "",
      },
    ]);
  }, []);

  const handleRemoveForm = useCallback((index: number) => {
    setButtonForms((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleRemoveAllForms = useCallback(() => {
    setButtonForms([]);
  }, []);

  const handleSaveButton = useCallback(() => {
    const updatedLinks: VideoLink[] = [];

    for (const formData of buttonForms) {
      const ts = parseInt(formData.timestamp);

      // Basic validation
      if (!formData.label || isNaN(ts) || ts < 0 || ts > video.duration) {
        alert("Please fill all fields with valid details.");
        return;
      }

      // Type-specific validation
      if (formData.linkType === "url" && !formData.url) {
        alert("Please provide a URL for link buttons.");
        return;
      }

      if (formData.linkType === "video" && !formData.destinationVideoId) {
        alert("Please select a destination video for video buttons.");
        return;
      }

      const linkData: VideoLink = {
        id: formData.id ?? Math.random().toString(36).substr(2, 9),
        timestamp_seconds: ts,
        label: formData.label,
        link_type: formData.linkType,
      };

      if (formData.linkType === "url") {
        linkData.url = formData.url.startsWith("http")
          ? formData.url
          : `https://${formData.url}`;
      } else {
        linkData.destination_video_id = formData.destinationVideoId;
      }

      updatedLinks.push(linkData);
    }

    onLinksChange(updatedLinks);
    setIsModalOpen(false);
  }, [buttonForms, video.duration, onLinksChange]);

  const videoUrl = useMemo(() => {
    return video.file ? URL.createObjectURL(video.file) : video.url;
  }, [video.file, video.url]);

  const uploadSection = useMemo(
    () => (
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
        <div className="space-y-4">
          <p className="text-sm font-medium">Upload your video</p>
          <p className="text-xs text-gray-500">
            Supported Format: MP4 (50mb max)
          </p>
          <Button className="relative">
            Browse File
            <input
              type="file"
              accept="video/mp4,video/quicktime"
              onChange={handleFileSelect}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
          </Button>
        </div>
      </div>
    ),
    [handleFileSelect]
  );

  const videoPlayerSection = useMemo(
    () => <VideoPlayerWithLinks videoUrl={videoUrl} links={video.links} />,
    [videoUrl, video.links]
  );

  return (
    <Card className="mb-6">
      <CardContent className="relative">
        {!video.file && !video.url ? uploadSection : videoPlayerSection}
        <div
          onClick={() => setIsModalOpen(true)}
          className="absolute top-4 right-8 flex space-x-2"
        >
          <Button type="button" className="bg-white text-black">
            Add button
          </Button>
        </div>
      </CardContent>

      {/* Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-lg overflow-y-auto max-h-[80vh]">
          <DialogHeader className="border-b py-4">
            <DialogTitle>Add / Edit Buttons</DialogTitle>
          </DialogHeader>

          <div className="space-y-6 my-4 pr-2">
            {buttonForms.map((formData, index) => (
              <div
                key={index}
                className="space-y-4 rounded-lg p-2 border-gray-200 relative"
              >
                {/* Video Duration */}
                <div className="flex flex-col gap-2">
                  <Label className="font-bold">Video Duration</Label>
                  <Input
                    type="number"
                    placeholder={`0 - ${video.duration}`}
                    value={formData.timestamp}
                    onChange={(e) =>
                      handleFormChange(index, "timestamp", e.target.value)
                    }
                  />
                </div>

                {/* Button Name with Trash Icon */}
                <div className="flex flex-col gap-2 relative">
                  <Label className="mb-1 font-bold">Button Name</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="Click here"
                      value={formData.label}
                      onChange={(e) =>
                        handleFormChange(index, "label", e.target.value)
                      }
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveForm(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Button Action */}
                <div className="flex flex-col gap-2 -mb-3">
                  <div className="flex flex-col md:flex-row gap-4 items-center">
                    {/* URL Input */}
                    <div className="flex flex-col gap-1 flex-1">
                      <Label className="mb-1 font-bold">URL</Label>
                      <Input
                        placeholder="https://example.com"
                        value={formData.url}
                        disabled={!!formData.destinationVideoId} // disable if video selected
                        onChange={(e) =>
                          handleFormChange(index, "url", e.target.value)
                        }
                      />
                    </div>

                    <span className="text-black font-medium">OR</span>

                    {/* Destination Video */}
                    <div className="flex flex-col gap-1 flex-1">
                      <Label className="mb-1 font-bold">
                        Destination Video
                      </Label>
                      <Select
                        value={formData.destinationVideoId}
                        onValueChange={(value) =>
                          handleFormChange(index, "destinationVideoId", value)
                        }
                        disabled={!!formData.url} // disable if URL entered
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select destination video" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableVideos
                            .filter((v) => v.id !== video.id)
                            .map((v) => (
                              <SelectItem key={v.id} value={v.id}>
                                {v.title}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Add Button */}
            <div className="w-full flex justify-center items-center">
              <Button onClick={handleAddForm}>
                <Plus className="h-4 w-4 mr-2" />
                Add Button
              </Button>
            </div>
            <hr />
          </div>

          {/* Footer */}
          <div className="flex justify-between p-0 w-full">
            {/* Left side */}
            <Button variant="destructive" onClick={handleRemoveAllForms}>
              <Trash2 className="h-4 w-4 mr-1" />
              Delete buttons
            </Button>

            {/* Right side */}
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveButton}>Save All</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

const arePropsEqual = (
  prevProps: VideoUploadWithLinksProps,
  nextProps: VideoUploadWithLinksProps
) => {
  return (
    prevProps.video.id === nextProps.video.id &&
    prevProps.video.file === nextProps.video.file &&
    prevProps.video.url === nextProps.video.url &&
    prevProps.video.duration === nextProps.video.duration &&
    prevProps.video.title === nextProps.video.title &&
    JSON.stringify(prevProps.video.links) ===
      JSON.stringify(nextProps.video.links) &&
    JSON.stringify(prevProps.availableVideos) ===
      JSON.stringify(nextProps.availableVideos) &&
    prevProps.onFileChange === nextProps.onFileChange &&
    prevProps.onLinksChange === nextProps.onLinksChange &&
    prevProps.onDelete === nextProps.onDelete
  );
};

export const VideoUploadWithLinks = memo(
  VideoUploadWithLinksComponent,
  arePropsEqual
);
