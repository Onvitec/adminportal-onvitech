import { useState, useRef, useEffect, memo, useCallback, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, Clock, Move, Eye, EyeOff } from "lucide-react";
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
import { Button } from "@/components/ui/button";

type VideoLink = {
  id: string;
  timestamp_seconds: number;
  label: string;
  url?: string;
  video_id?: string;
  destination_video_id?: string;
  link_type: "url" | "video";
  position_x: number;
  position_y: number;
};

// Enhanced Video Player Component that works with both local and remote videos
function VideoPlayerWithDraggableButtons({
  videoUrl,
  links,
  isEditMode = false,
  onButtonMove,
  showPreview = false,
}: {
  videoUrl: string;
  links: VideoLink[];
  isEditMode?: boolean;
  onButtonMove?: (linkId: string, x: number, y: number) => void;
  showPreview?: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isDragging, setIsDragging] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateDuration = () => setDuration(video.duration);
    const updateTime = () => setCurrentTime(video.currentTime);

    video.addEventListener("loadedmetadata", updateDuration);
    video.addEventListener("timeupdate", updateTime);

    return () => {
      video.removeEventListener("loadedmetadata", updateDuration);
      video.removeEventListener("timeupdate", updateTime);
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

  const handleMouseDown = useCallback(
    (e: React.MouseEvent, linkId: string) => {
      if (!isEditMode) return;

      e.preventDefault();
      e.stopPropagation();
      setIsDragging(linkId);

      const button = e.currentTarget as HTMLElement;
      const rect = button.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    },
    [isEditMode]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !videoContainerRef.current || !onButtonMove) return;

      const containerRect = videoContainerRef.current.getBoundingClientRect();
      const x =
        ((e.clientX - containerRect.left - dragOffset.x) /
          containerRect.width) *
        100;
      const y =
        ((e.clientY - containerRect.top - dragOffset.y) /
          containerRect.height) *
        100;

      // Constrain to container bounds
      const constrainedX = Math.max(0, Math.min(85, x));
      const constrainedY = Math.max(0, Math.min(85, y));

      onButtonMove(isDragging, constrainedX, constrainedY);
    },
    [isDragging, dragOffset, onButtonMove]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(null);
    setDragOffset({ x: 0, y: 0 });
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);

      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const handleButtonClick = useCallback(
    (link: VideoLink, e: React.MouseEvent) => {
      if (isDragging || isEditMode) {
        e.preventDefault();
        return;
      }

      if (link.link_type === "url" && link.url) {
        window.open(link.url, "_blank");
      }
    },
    [isDragging, isEditMode]
  );

  // Filter links based on current time or show all in preview mode
  const visibleLinks = useMemo(() => {
    if (showPreview || isEditMode) {
      return links;
    }
    return links.filter((link) => currentTime >= link.timestamp_seconds);
  }, [links, currentTime, showPreview, isEditMode]);

  return (
    <div className="relative">
      <div ref={videoContainerRef} className="relative inline-block w-full">
        <video
          ref={videoRef}
          src={videoUrl}
          controls={!isEditMode}
          className="w-full h-auto max-h-96 rounded-lg"
          key={videoUrl}
          muted={isEditMode} // Mute in edit mode to prevent interruptions
        />

        {/* Overlay buttons */}
        {visibleLinks.map((link) => (
          <Button
            key={link.id}
            className={`absolute z-10 text-sm px-3 py-1 ${
              link.link_type === "url"
                ? "bg-blue-600 hover:bg-blue-700"
                : "bg-green-600 hover:bg-green-700"
            } text-white rounded transition-all duration-200 ${
              isEditMode
                ? "cursor-move border-2 border-yellow-400 shadow-lg"
                : "cursor-pointer"
            } ${isDragging === link.id ? "opacity-70 scale-105" : ""} ${
              showPreview ? "opacity-90" : ""
            }`}
            style={{
              left: `${link.position_x}%`,
              top: `${link.position_y}%`,
              transform: isDragging === link.id ? "scale(1.05)" : "none",
              pointerEvents: isEditMode ? "auto" : "auto",
            }}
            onMouseDown={(e) => handleMouseDown(e, link.id)}
            onClick={(e) => handleButtonClick(link, e)}
            title={
              isEditMode ? `Drag to reposition • ${link.label}` : link.label
            }
          >
            {link.label}
            {showPreview && (
              <span className="ml-1 text-xs opacity-75">
                @{formatTime(link.timestamp_seconds)}
              </span>
            )}
          </Button>
        ))}

        {/* Edit mode overlay */}
        {isEditMode && (
          <div className="absolute inset-0 bg-blue-100 bg-opacity-20 rounded-lg pointer-events-none">
            <div className="absolute top-2 left-2 bg-yellow-400 text-black px-2 py-1 text-xs rounded font-medium">
              Edit Mode: Drag buttons to reposition
            </div>
          </div>
        )}
      </div>

      {/* Timeline with markers (only show when not in edit mode) */}
      {duration > 0 && links.length > 0 && !isEditMode && !showPreview && (
        <div className="relative h-6 mt-2 bg-gray-100 rounded-md overflow-hidden">
          {/* Current time indicator */}
          <div
            className="absolute top-0 w-1 h-full bg-red-500 z-20"
            style={{ left: `${(currentTime / duration) * 100}%` }}
          />

          {links.map((link) => (
            <div
              key={link.id}
              className="absolute top-0 h-full flex flex-col items-center z-10"
              style={{ left: `${(link.timestamp_seconds / duration) * 100}%` }}
            >
              <Clock
                className={`w-3 h-3 ${
                  link.link_type === "url" ? "text-blue-500" : "text-green-500"
                }`}
              />
              <div
                className={`w-px h-3 ${
                  link.link_type === "url" ? "bg-blue-500" : "bg-green-500"
                }`}
              />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  seekToTime(link.timestamp_seconds);
                }}
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

type VideoUploadWithLinksProps = {
  video: {
    id: string;
    title: string;
    file: File | null;
    url: string;
    duration: number;
    links: VideoLink[];
  };
  availableVideos: Array<{ id: string; title: string }>;
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
  const [isEditMode, setIsEditMode] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const [buttonForms, setButtonForms] = useState<
    {
      id?: string;
      label: string;
      url: string;
      timestamp: string;
      linkType: "url" | "video";
      destinationVideoId: string;
      position_x: number;
      position_y: number;
    }[]
  >([]);

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
            position_x: link.position_x || 20,
            position_y: link.position_y || 20,
          }))
        );
      } else {
        setButtonForms([]);
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
    (
      index: number,
      field: keyof (typeof buttonForms)[0],
      value: string | number
    ) => {
      setButtonForms((prev) =>
        prev.map((form, i) => {
          if (i !== index) return form;

          let updated = { ...form, [field]: value };

          if (typeof value === "string") {
            if (field === "url" && value) {
              updated.linkType = "url";
              updated.destinationVideoId = "";
            } else if (field === "destinationVideoId" && value) {
              updated.linkType = "video";
              updated.url = "";
            }
          }

          return updated;
        })
      );
    },
    []
  );

  const handleButtonMove = useCallback(
    (linkId: string, x: number, y: number) => {
      setButtonForms((prev) =>
        prev.map((form) => {
          // Match by ID if it exists, otherwise match by index for new buttons
          const isMatch =
            form.id === linkId ||
            (!form.id && buttonForms.length === 1) ||
            (linkId.startsWith("temp_") &&
              !form.id &&
              buttonForms.indexOf(form) === parseInt(linkId.split("_")[1]));

          return isMatch
            ? { ...form, position_x: Math.round(x), position_y: Math.round(y) }
            : form;
        })
      );
    },
    [buttonForms]
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
        position_x: 20,
        position_y: 20,
      },
    ]);
  }, []);

  const handleRemoveForm = useCallback((index: number) => {
    setButtonForms((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleRemoveAllForms = useCallback(() => {
    setButtonForms([]);
    onLinksChange([]);
  }, [onLinksChange]);

  const handleSaveButton = useCallback(() => {
    const updatedLinks: VideoLink[] = [];

    for (const formData of buttonForms) {
      const ts = parseInt(formData.timestamp);

      // Basic validation
      if (!formData.label || isNaN(ts) || ts < 0) {
        alert("Please fill all fields with valid details.");
        return;
      }

      if (video.duration && ts > video.duration) {
        alert(
          `Timestamp cannot exceed video duration of ${video.duration} seconds.`
        );
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
        position_x: formData.position_x,
        position_y: formData.position_y,
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
    setIsEditMode(false);
  }, [buttonForms, video.duration, onLinksChange]);

  // Get video URL - works for both local files and remote URLs
  const videoUrl = useMemo(() => {
    if (video.file) {
      return URL.createObjectURL(video.file);
    } else if (video.url) {
      return video.url;
    }
    return "";
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

  // Create preview links from current form state
  const previewLinks = useMemo(() => {
    return buttonForms
      .filter((form) => form.label && form.timestamp)
      .map(
        (form, index) =>
          ({
            id: form.id || `temp_${index}`,
            timestamp_seconds: parseInt(form.timestamp) || 0,
            label: form.label,
            url: form.url,
            destination_video_id: form.destinationVideoId,
            link_type: form.linkType,
            position_x: form.position_x,
            position_y: form.position_y,
          } as VideoLink)
      );
  }, [buttonForms]);

  const videoPlayerSection = useMemo(
    () => (
      <VideoPlayerWithDraggableButtons
        videoUrl={videoUrl}
        links={
          isModalOpen && (isEditMode || showPreview)
            ? previewLinks
            : video.links
        }
        isEditMode={isModalOpen && isEditMode}
        onButtonMove={handleButtonMove}
        showPreview={showPreview || (isModalOpen && !isEditMode)}
      />
    ),
    [
      videoUrl,
      video.links,
      isModalOpen,
      isEditMode,
      previewLinks,
      handleButtonMove,
      showPreview,
    ]
  );

  const hasVideoContent = video.file || video.url;

  return (
    <Card className="mb-6">
      <CardContent className="relative">
        {!hasVideoContent ? uploadSection : videoPlayerSection}

        <div className="absolute top-4 right-4 flex space-x-2">
          {hasVideoContent && video?.links.length > 0 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowPreview(!showPreview)}
              className="bg-white"
            >
              {showPreview ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
          )}
          {hasVideoContent && (
            <Button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="bg-white text-black hover:bg-gray-100"
            >
              {video.links.length > 0 ? "Edit Buttons" : "Add Buttons"}
            </Button>
          )}
        </div>
      </CardContent>

      {/* Enhanced Modal */}
      <Dialog
        open={isModalOpen}
        onOpenChange={(open) => {
          setIsModalOpen(open);
          if (!open) {
            setIsEditMode(false);
          }
        }}
      >
        <DialogContent className="sm:max-w-6xl overflow-y-auto max-h-[90vh]">
          <DialogHeader className="border-b py-4">
            <DialogTitle className="flex items-center justify-between">
              <span>Add / Edit Buttons</span>
              <div className="flex items-center space-x-2">
                <Button
                  type="button"
                  variant={isEditMode ? "default" : "outline"}
                  size="sm"
                  onClick={() => setIsEditMode(!isEditMode)}
                  disabled={buttonForms.length === 0}
                >
                  <Move className="h-4 w-4 mr-1" />
                  {isEditMode ? "Exit Edit" : "Position Mode"}
                </Button>
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="flex gap-6 my-4">
            {/* Left side - Video Preview */}
            {hasVideoContent && (
              <div className="flex-1">
                <Label className="font-bold mb-2 block">Video Preview</Label>
                <VideoPlayerWithDraggableButtons
                  videoUrl={videoUrl}
                  links={previewLinks}
                  isEditMode={isEditMode}
                  onButtonMove={handleButtonMove}
                  showPreview={true}
                />
                {isEditMode && (
                  <p className="text-sm text-gray-600 mt-2">
                    💡 Drag the buttons to position them where you want them to
                    appear on the video.
                  </p>
                )}
              </div>
            )}

            {/* Right side - Form Controls */}
            <div className="flex-1 space-y-6 pr-2 max-h-[60vh] overflow-y-auto">
              {buttonForms.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No buttons added yet.</p>
                  <Button onClick={handleAddForm} className="mt-4">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Button
                  </Button>
                </div>
              ) : (
                buttonForms.map((formData, index) => (
                  <div
                    key={index}
                    className="space-y-4 rounded-lg p-3 border border-gray-200 bg-gray-50"
                  >
                    <div className="flex justify-between items-center">
                      <h4 className="font-medium text-gray-700">
                        Button {index + 1}
                      </h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveForm(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Timestamp */}
                    <div className="flex flex-col gap-2">
                      <Label className="font-bold">Timestamp (seconds)</Label>
                      <Input
                        type="number"
                        placeholder={`0${
                          video.duration ? ` - ${video.duration}` : ""
                        }`}
                        value={formData.timestamp}
                        onChange={(e) =>
                          handleFormChange(index, "timestamp", e.target.value)
                        }
                      />
                    </div>

                    {/* Button Label */}
                    <div className="flex flex-col gap-2">
                      <Label className="font-bold">Button Label</Label>
                      <Input
                        placeholder="Click here"
                        value={formData.label}
                        onChange={(e) =>
                          handleFormChange(index, "label", e.target.value)
                        }
                      />
                    </div>

                    {/* Position Controls */}
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <Label className="font-bold">X Position (%)</Label>
                        <Input
                          type="number"
                          min="0"
                          max="90"
                          value={formData.position_x}
                          onChange={(e) =>
                            handleFormChange(
                              index,
                              "position_x",
                              parseInt(e.target.value) || 0
                            )
                          }
                        />
                      </div>
                      <div className="flex-1">
                        <Label className="font-bold">Y Position (%)</Label>
                        <Input
                          type="number"
                          min="0"
                          max="90"
                          value={formData.position_y}
                          onChange={(e) =>
                            handleFormChange(
                              index,
                              "position_y",
                              parseInt(e.target.value) || 0
                            )
                          }
                        />
                      </div>
                    </div>

                    {/* Button Action */}
                    <div className="space-y-3">
                      <div>
                        <Label className="font-bold">URL</Label>
                        <Input
                          placeholder="https://example.com"
                          value={formData.url}
                          disabled={!!formData.destinationVideoId}
                          onChange={(e) =>
                            handleFormChange(index, "url", e.target.value)
                          }
                        />
                      </div>

                      <div className="text-center text-gray-500 font-medium">
                        OR
                      </div>

                      <div>
                        <Label className="font-bold">Destination Video</Label>
                        <Select
                          value={formData.destinationVideoId}
                          onValueChange={(value) =>
                            handleFormChange(index, "destinationVideoId", value)
                          }
                          disabled={!!formData.url}
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
                ))
              )}

              {buttonForms.length > 0 && (
                <div className="w-full flex justify-center">
                  <Button onClick={handleAddForm}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Another Button
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <DialogFooter className="flex justify-between p-0 w-full">
            <Button
              variant="destructive"
              onClick={handleRemoveAllForms}
              disabled={buttonForms.length === 0}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete All Buttons
            </Button>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveButton}>Save All</Button>
            </div>
          </DialogFooter>
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
      JSON.stringify(nextProps.availableVideos)
  );
};

export const VideoUploadWithLinks = memo(
  VideoUploadWithLinksComponent,
  arePropsEqual
);
