import { useState, useRef, useEffect, memo, useCallback, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Plus,
  Trash2,
  Clock,
  Move,
  Eye,
  EyeOff,
  Upload,
  X,
} from "lucide-react";
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
import { VideoLink, VideoType } from "@/lib/types";
import { EnhancedFormBuilder, FormSolutionData } from "./form-builder";
import { toast } from "sonner";

// Enhanced Video Player Component with image support
function VideoPlayerWithDraggableImages({
  videoUrl,
  links,
  isEditMode = false,
  onImageMove,
  showPreview = false,
}: {
  videoUrl: string;
  links: VideoLink[];
  isEditMode?: boolean;
  onImageMove?: (linkId: string, x: number, y: number) => void;
  showPreview?: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isDragging, setIsDragging] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [hoveredImageId, setHoveredImageId] = useState<string | null>(null);
  const [videoRect, setVideoRect] = useState<{
    width: number;
    height: number;
    left: number;
    top: number;
  } | null>(null);

  // Calculate actual video dimensions within container
  const calculateVideoRect = useCallback(() => {
    const video = videoRef.current;
    const container = videoContainerRef.current;
    if (!video || !container || video.videoWidth === 0) return null;

    const containerRect = container.getBoundingClientRect();
    const videoAspect = video.videoWidth / video.videoHeight;
    const containerAspect = containerRect.width / containerRect.height;

    let actualVideoWidth, actualVideoHeight, offsetLeft, offsetTop;

    if (containerAspect > videoAspect) {
      // Container is wider, video height matches container
      actualVideoHeight = containerRect.height;
      actualVideoWidth = actualVideoHeight * videoAspect;
      offsetLeft = (containerRect.width - actualVideoWidth) / 2;
      offsetTop = 0;
    } else {
      // Container is taller, video width matches container
      actualVideoWidth = containerRect.width;
      actualVideoHeight = actualVideoWidth / videoAspect;
      offsetLeft = 0;
      offsetTop = (containerRect.height - actualVideoHeight) / 2;
    }

    const rect = {
      width: actualVideoWidth,
      height: actualVideoHeight,
      left: offsetLeft,
      top: offsetTop,
    };

    setVideoRect(rect);
    return rect;
  }, []);

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

  useEffect(() => {
    const video = videoRef.current;
    const container = videoContainerRef.current;
    if (!video || !container) return;

    const handleLoadedMetadata = () => {
      calculateVideoRect();
      setDuration(video.duration);
    };

    const handleResize = () => {
      calculateVideoRect();
    };

    const handleTimeUpdate = () => setCurrentTime(video.currentTime);

    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    video.addEventListener("timeupdate", handleTimeUpdate);
    window.addEventListener("resize", handleResize);

    // Also calculate when video dimensions become available
    const checkVideoDimensions = setInterval(() => {
      if (video.videoWidth > 0 && video.videoHeight > 0) {
        calculateVideoRect();
        clearInterval(checkVideoDimensions);
      }
    }, 100);

    return () => {
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      video.removeEventListener("timeupdate", handleTimeUpdate);
      window.removeEventListener("resize", handleResize);
      clearInterval(checkVideoDimensions);
    };
  }, [videoUrl, calculateVideoRect]);

  const seekToTime = useCallback((time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
  }, []);

  const formatTime = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;

    // Format seconds with up to 1 decimal place
    const formattedSecs = secs.toFixed(1);

    return `${mins}:${formattedSecs.padStart(4, "0")}`; // padStart(4) to account for decimal
  }, []);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent, linkId: string) => {
      if (!isEditMode || !videoRect) return;

      e.preventDefault();
      e.stopPropagation();
      setIsDragging(linkId);

      const image = e.currentTarget as HTMLElement;
      const rect = image.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    },
    [isEditMode, videoRect]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (
        !isDragging ||
        !videoContainerRef.current ||
        !videoRect ||
        !onImageMove
      )
        return;

      const containerRect = videoContainerRef.current.getBoundingClientRect();

      // Calculate position relative to actual video area
      const relativeX = e.clientX - containerRect.left - videoRect.left;
      const relativeY = e.clientY - containerRect.top - videoRect.top;

      // Convert to percentage of video dimensions
      const x = (relativeX / videoRect.width) * 100;
      const y = (relativeY / videoRect.height) * 100;

      // Constrain to video bounds (0-100%)
      const constrainedX = Math.max(0, Math.min(100, x));
      const constrainedY = Math.max(0, Math.min(100, y));

      onImageMove(isDragging, constrainedX, constrainedY);
    },
    [isDragging, videoRect, onImageMove]
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

  const handleImageClick = useCallback(
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

  // Get the appropriate image URL - prioritize preview URLs for editing, then database URLs
  const getImageUrl = useCallback((link: VideoLink, isHovered: boolean) => {
    if (isHovered && (link.hoverImagePreview || link.hover_state_image)) {
      return link.hoverImagePreview || link.hover_state_image;
    }
    return link.normalImagePreview || link.normal_state_image;
  }, []);

  const getImageDimensions = useCallback(
    (link: VideoLink, isHovered: boolean) => {
      if (isHovered && (link.hover_image_width || link.hover_image_height)) {
        return {
          width: link.hover_image_width || 100,
          height: link.hover_image_height || 100,
        };
      }
      return {
        width: link.normal_image_width || 100,
        height: link.normal_image_height || 100,
      };
    },
    []
  );

  // Convert percentage position to actual pixels based on videoRect
  const getImagePosition = useCallback(
    (link: VideoLink) => {
      if (!videoRect) {
        // Fallback to percentages if videoRect not available
        return { left: `${link.position_x}%`, top: `${link.position_y}%` };
      }

      // Convert percentage positions to actual pixels within video area
      const left = videoRect.left + (link.position_x / 100) * videoRect.width;
      const top = videoRect.top + (link.position_y / 100) * videoRect.height;

      return { left: `${left}px`, top: `${top}px` };
    },
    [videoRect]
  );

  useEffect(() => {
    const video = videoRef.current;
    const container = videoContainerRef.current;
    if (!video || !container) return;

    const calculateAndSetRect = () => {
      // Small delay to ensure browser has rendered the video
      setTimeout(() => {
        calculateVideoRect();
      }, 50);
    };

    // More comprehensive event listeners
    video.addEventListener("loadedmetadata", calculateAndSetRect);
    video.addEventListener("canplay", calculateAndSetRect);
    video.addEventListener("resize", calculateAndSetRect);
    video.addEventListener("loadeddata", calculateAndSetRect);

    // CSS transitions might affect positioning
    container.addEventListener("transitionend", calculateAndSetRect);

    window.addEventListener("resize", calculateAndSetRect);

    // Initial calculation
    calculateAndSetRect();

    // More aggressive checking for video dimensions
    const videoCheckInterval = setInterval(() => {
      if (video.videoWidth > 0 && video.videoHeight > 0) {
        calculateAndSetRect();
        // Clear after we get valid dimensions
        if (video.videoWidth > 0) {
          clearInterval(videoCheckInterval);
        }
      }
    }, 100);

    return () => {
      video.removeEventListener("loadedmetadata", calculateAndSetRect);
      video.removeEventListener("canplay", calculateAndSetRect);
      video.removeEventListener("resize", calculateAndSetRect);
      video.removeEventListener("loadeddata", calculateAndSetRect);
      container.removeEventListener("transitionend", calculateAndSetRect);
      window.removeEventListener("resize", calculateAndSetRect);
      clearInterval(videoCheckInterval);
    };
  }, [videoUrl, calculateVideoRect]);
  return (
    <div className="relative flex-1 bg-black rounded-xl video-player-container">
      <div
        ref={videoContainerRef}
        className="relative w-full"
        style={{ lineHeight: 0 }}
      >
        <video
          ref={videoRef}
          src={videoUrl}
          controls={!isEditMode}
          className="w-full h-auto max-h-[500px] object-contain rounded-xl cursor-pointer"
          key={videoUrl}
          muted={isEditMode}
          onLoadStart={() => setTimeout(() => calculateVideoRect(), 100)}
          onCanPlay={() => setTimeout(() => calculateVideoRect(), 100)}
          onResize={() => setTimeout(() => calculateVideoRect(), 100)}
        />

        {/* Overlay images */}
        {visibleLinks.map((link) => {
          const isHovered = hoveredImageId === link.id;
          const imageUrl = getImageUrl(link, isHovered);
          const dimensions = getImageDimensions(link, isHovered);
          const position = getImagePosition(link);

          return imageUrl ? (
            <div
              key={link.id}
              className={`absolute z-10 transition-all duration-200 ${
                isEditMode
                  ? "cursor-move border-2 border-red-500 shadow-lg"
                  : "cursor-pointer"
              } ${isDragging === link.id ? "opacity-70" : ""} ${
                showPreview ? "opacity-90" : ""
              }`}
              style={{
                ...position,
                // transform: "translate(-50%, -50%)", // Center the image on the position
                pointerEvents: isEditMode ? "auto" : "auto",
              }}
              onMouseDown={(e) => handleMouseDown(e, link.id)}
              onClick={(e) => handleImageClick(link, e)}
              onMouseEnter={() => {
                if (link.hoverImagePreview || link.hover_state_image) {
                  setHoveredImageId(link.id);
                }
              }}
              onMouseLeave={() => setHoveredImageId(null)}
              title={
                isEditMode ? `Drag to reposition • ${link.label}` : link.label
              }
            >
              <img
                src={imageUrl}
                alt={link.label}
                style={{
                  width: `${dimensions.width}px`,
                  height: `${dimensions.height}px`,
                }}
                className="rounded"
                draggable={false}
              />
              {showPreview && (
                <div className="absolute -bottom-6 left-0 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                  @{formatTime(link.timestamp_seconds)}
                </div>
              )}
            </div>
          ) : null;
        })}

        {/* Edit mode overlay with video area indicator */}
        {isEditMode && videoRect && (
          <div
            className="absolute border-2 border-dashed border-yellow-400 pointer-events-none"
            style={{
              left: `${videoRect.left}px`,
              top: `${videoRect.top}px`,
              width: `${videoRect.width}px`,
              height: `${videoRect.height}px`,
            }}
          >
            <div className="absolute -top-8 left-0 bg-yellow-500 text-white px-2 py-1 text-xs rounded font-medium">
              Video Area: {Math.round(videoRect.width)}×
              {Math.round(videoRect.height)}px
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
              style={{ left: `${(link.timestamp_seconds / duration) * 100}%` }} // ✅ UNCOMMENT THIS LINE
            >
              <Clock
                className={`w-3 h-3 ${
                  link.link_type === "url"
                    ? "text-blue-500"
                    : link.link_type === "video"
                    ? "text-green-500"
                    : "text-purple-500"
                }`}
              />
              <div
                className={`w-px h-3 ${
                  link.link_type === "url"
                    ? "bg-blue-500"
                    : link.link_type === "video"
                    ? "bg-green-500"
                    : "bg-purple-500"
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
                    : link.link_type === "video"
                    ? "text-green-600 hover:text-green-800"
                    : "text-purple-600 hover:text-purple-800"
                } mt-1 whitespace-nowrap`}
                title={`${link.label} - ${formatTime(
                  link.timestamp_seconds
                )} (${link.link_type})`}
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

// Fixed Image upload component
function ImageUploader({
  label,
  imageUrl,
  previewUrl,
  onImageChange,
  onDimensionsChange,
  width,
  height,
}: {
  label: string;
  imageUrl?: string; // Database URL
  previewUrl?: string; // Preview URL (blob or temporary)
  onImageChange: (file: File | null, url?: string) => void;
  onDimensionsChange: (width?: number, height?: number) => void;
  width?: number;
  height?: number;
}) {
  // Track whether we've explicitly removed the image
  const [isRemoved, setIsRemoved] = useState(false);

  // Determine which URL to display - prioritize preview, but respect removal state
  const displayUrl = isRemoved ? undefined : previewUrl || imageUrl;
  const isBlobUrl = previewUrl?.startsWith("blob:");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        alert("Please select a valid image file");
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert("Image size should be less than 5MB");
        return;
      }

      const url = URL.createObjectURL(file);
      setIsRemoved(false); // Reset removal state when new file is selected

      // Get image dimensions
      const img = new Image();
      img.onload = () => {
        onDimensionsChange(img.width, img.height);
      };
      img.src = url;

      onImageChange(file, url);
    }
  };

  const handleRemoveImage = () => {
    // Clean up blob URL if it exists
    if (previewUrl && isBlobUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setIsRemoved(true); // Mark as removed
    onImageChange(null);
    onDimensionsChange(0, 0);
  };

  // Reset removal state when imageUrl changes (e.g., when modal reopens)
  useEffect(() => {
    if (imageUrl) {
      setIsRemoved(false);
    }
  }, [imageUrl]);

  return (
    <div className="space-y-2">
      <Label className="font-bold">{label}</Label>

      {displayUrl ? (
        <div className="relative inline-block">
          {/* Fixed container */}
          <div className="w-32 h-32 border rounded flex items-center justify-center bg-gray-50">
            <img src={displayUrl} alt="Preview" className="" />
          </div>

          <button
            type="button"
            onClick={handleRemoveImage}
            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
          >
            <X className="h-3 w-3" />
          </button>

          <div className="mt-1 text-xs text-gray-500">
            {width}x{height}px
            {!isBlobUrl && imageUrl && " (from database)"}
            {isBlobUrl && " (local file)"}
          </div>
        </div>
      ) : (
        <div className="border-2 w-full border-dashed border-gray-300 rounded-lg p-4 text-center w-32 h-32 flex flex-col justify-center">
          <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
          <p className="text-sm text-gray-500 mb-2">Upload {label}</p>
          <Button variant="outline" size="sm" className="relative">
            Choose Image
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
          </Button>
          <p className="text-xs text-gray-400 mt-1">PNG, JPG, GIF up to 5MB</p>
        </div>
      )}
      {displayUrl && (
        <div className="flex gap-2">
          {/* Width Input */}
          <div className="flex-1">
            <Label className="text-xs">Width (px)</Label>
            <Input
              type="number"
              min={0}
              max={500}
              value={width ?? ""}
              onChange={(e) => {
                const val = e.target.value;
                if (val === "") {
                  onDimensionsChange(undefined, height); // ✅ allow clearing
                  return;
                }
                const num = parseInt(val, 10);
                if (!isNaN(num)) {
                  onDimensionsChange(num, height);
                }
              }}
              onBlur={(e) => {
                const val = e.target.value;
                if (val === "") {
                  onDimensionsChange(undefined, height); // ✅ allow clearing on blur too
                  return;
                }
                const num = parseInt(val, 10);
                if (!isNaN(num)) {
                  onDimensionsChange(
                    Math.min(Math.max(num, 0), 500), // ✅ clamp to 0–500 (removed minimum of 10)
                    height
                  );
                }
              }}
              placeholder="Width"
              className="h-8"
              step={1}
            />
          </div>

          {/* Height Input */}
          <div className="flex-1">
            <Label className="text-xs">Height (px)</Label>
            <Input
              type="number"
              min={0}
              max={500}
              value={height ?? ""}
              onChange={(e) => {
                const val = e.target.value;
                if (val === "") {
                  onDimensionsChange(width, undefined); // ✅ allow clearing
                  return;
                }
                const num = parseInt(val, 10);
                if (!isNaN(num)) {
                  onDimensionsChange(width, num);
                }
              }}
              onBlur={(e) => {
                const val = e.target.value;
                if (val === "") {
                  onDimensionsChange(width, undefined); // ✅ allow clearing on blur too
                  return;
                }
                const num = parseInt(val, 10);
                if (!isNaN(num)) {
                  onDimensionsChange(
                    width,
                    Math.min(Math.max(num, 0), 500) // ✅ clamp to 0–500 (removed minimum of 10)
                  );
                }
              }}
              placeholder="Height"
              className="h-8"
              step={1}
            />
          </div>
        </div>
      )}
    </div>
  );
}

type VideoUploadWithLinksProps = {
  video: VideoType;
  availableVideos: Array<{ id: string; title: string }>;
  onFileChange: (file: File | null, duration: number) => void;
  onLinksChange: (links: VideoLink[]) => void;
  onDelete: () => void;
  uploadImageToSupabase?: (file: File, path: string) => Promise<string>;
  onButtonFormsChange?: (forms: any) => void;
};

function VideoUploadWithLinksComponent({
  video,
  availableVideos,
  onFileChange,
  onLinksChange,
  onDelete,
  uploadImageToSupabase,
  onButtonFormsChange,
}: VideoUploadWithLinksProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [buttonForms, setButtonForms] = useState<
    {
      id?: string;
      label: string;
      url: string;
      timestamp: string;
      linkType: "url" | "video" | "form";
      destinationVideoId: string;
      position_x: number;
      position_y: number;
      normalImageFile: File | null;
      hoverImageFile: File | null;
      normal_image_width: number;
      normal_image_height: number;
      hover_image_width: number;
      hover_image_height: number;
      normal_state_image?: string;
      hover_state_image?: string;
      normalImagePreview?: string;
      hoverImagePreview?: string;
      duration_ms?: number;
      formData?: FormSolutionData;
    }[]
  >([]);
  const [formErrors, setFormErrors] = useState<{ [key: number]: string[] }>({});

  // Ref to track unsaved changes
  const unsavedChangesRef = useRef<typeof buttonForms>([]);

  const handleImageUpload = useCallback(
    (
      index: number,
      type: "normal" | "hover",
      file: File | null,
      url?: string
    ) => {
      setButtonForms((prev) =>
        prev.map((form, i) => {
          if (i !== index) return form;

          // If file is null (removed), clear all related fields
          if (file === null) {
            if (type === "normal") {
              if (form.normalImagePreview?.startsWith("blob:")) {
                URL.revokeObjectURL(form.normalImagePreview);
              }
              return {
                ...form,
                normalImageFile: null,
                normalImagePreview: undefined,
                normal_state_image: undefined, // Also clear the database reference
                normal_image_width: 0,
                normal_image_height: 0,
              };
            } else {
              if (form.hoverImagePreview?.startsWith("blob:")) {
                URL.revokeObjectURL(form.hoverImagePreview);
              }
              return {
                ...form,
                hoverImageFile: null,
                hoverImagePreview: undefined,
                hover_state_image: undefined, // Also clear the database reference
                hover_image_width: 0,
                hover_image_height: 0,
              };
            }
          }

          // Clean up old blob URL if it exists
          if (type === "normal") {
            if (form.normalImagePreview?.startsWith("blob:")) {
              URL.revokeObjectURL(form.normalImagePreview);
            }
            return {
              ...form,
              normalImageFile: file,
              normalImagePreview: url,
              normal_state_image: form.normal_state_image || undefined,
              hover_state_image: form.hover_state_image || undefined,
            };
          } else {
            if (form.hoverImagePreview?.startsWith("blob:")) {
              URL.revokeObjectURL(form.hoverImagePreview);
            }
            return {
              ...form,
              hoverImageFile: file,
              hoverImagePreview: url,
            };
          }
        })
      );
    },
    []
  );

  const areFormsDifferentFromLinks = useCallback(
    (forms: typeof buttonForms, links: VideoLink[]) => {
      if (forms.length !== links.length) return true;

      return forms.some((form, index) => {
        const link = links[index];
        if (!link) return true;

        return (
          form.id !== link.id ||
          form.label !== link.label ||
          form.timestamp !== String(link.timestamp_seconds) ||
          form.linkType !== link.link_type ||
          form.url !== (link.url || "") ||
          form.destinationVideoId !== (link.destination_video_id || "") ||
          form.position_x !== (link.position_x || 20) ||
          form.position_y !== (link.position_y || 20) ||
          form.duration_ms !== (link.duration_ms || "") ||
          form.normal_image_width !== (link.normal_image_width || 100) ||
          form.normal_image_height !== (link.normal_image_height || 100) ||
          form.hover_image_width !== (link.hover_image_width || 100) ||
          form.hover_image_height !== (link.hover_image_height || 100) ||
          JSON.stringify(form.formData) !== JSON.stringify(link.form_data)
        );
      });
    },
    []
  );

  useEffect(() => {
    if (isModalOpen) {
      if (unsavedChangesRef.current.length > 0) {
        // Restore unsaved changes and regenerate blob URLs for files
        const formsWithRegeneratedBlobs = unsavedChangesRef.current.map(
          (form) => {
            let newForm = { ...form };

            // Regenerate blob URLs for files that still exist
            if (form.normalImageFile) {
              const newBlobUrl = URL.createObjectURL(form.normalImageFile);
              newForm.normalImagePreview = newBlobUrl;
            }

            if (form.hoverImageFile) {
              const newBlobUrl = URL.createObjectURL(form.hoverImageFile);
              newForm.hoverImagePreview = newBlobUrl;
            }

            return newForm;
          }
        );

        setButtonForms(formsWithRegeneratedBlobs);
      } else if (video.links && video.links.length > 0) {
        // Initialize from saved video links - ALWAYS sync from props when no unsaved changes
        setButtonForms(
          video.links.map((link) => ({
            id: link.id,
            label: link.label,
            url: link.url || "",
            timestamp: link.timestamp_seconds.toString(),
            linkType: link.link_type,
            destinationVideoId: link.destination_video_id || "",
            position_x: link.position_x || 20,
            position_y: link.position_y || 20,
            duration_ms: link.duration_ms,
            normalImageFile: link.normalImageFile || null,
            hoverImageFile: link.hoverImageFile || null,
            normal_image_width: link.normal_image_width || 100,
            normal_image_height: link.normal_image_height || 100,
            hover_image_width: link.hover_image_width || 100,
            hover_image_height: link.hover_image_height || 100,
            normal_state_image: link.normal_state_image,
            hover_state_image: link.hover_state_image,
            normalImagePreview: link.normalImageFile
              ? URL.createObjectURL(link.normalImageFile)
              : link.normalImagePreview,
            hoverImagePreview: link.hoverImageFile
              ? URL.createObjectURL(link.hoverImageFile)
              : link.hoverImagePreview,
            formData: link.form_data as FormSolutionData | undefined,
          }))
        );
      } else {
        setButtonForms([]);
      }
    }
  }, [isModalOpen, video.links]); // Keep video.links as dependency

  useEffect(() => {
    // Only sync when modal is closed and we have no unsaved changes
    if (!isModalOpen && unsavedChangesRef.current.length === 0) {
      // This ensures that when other videos update, this component stays in sync
      if (video.links && video.links.length > 0) {
        // Don't update buttonForms here, just clear unsaved changes
        // The modal will sync from video.links when it opens
      }
    }
  }, [video.links, isModalOpen]);

  const validateForms = (
    forms: typeof buttonForms
  ): { [key: number]: string[] } => {
    const errors: { [key: number]: string[] } = {};

    forms.forEach((form, index) => {
      const formErrors: string[] = [];

      if (!form.label.trim()) {
        formErrors.push("label");
      }

      if (!form.timestamp || isNaN(parseFloat(form.timestamp))) {
        formErrors.push("timestamp");
      }

      if (form.linkType === "form") {
        const email = form.formData?.email;
        if (!email) {
          formErrors.push("formEmail");
        } else {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(email)) {
            formErrors.push("formEmail");
          }
        }
      }

      if (formErrors.length > 0) {
        errors[index] = formErrors;
      }
    });

    return errors;
  };

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
        const selectedFile = e.target.files[0];
        const sizeInMB = selectedFile.size / (1024 * 1024);

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
    (index: number, field: string, value: any) => {
      setButtonForms((prev) =>
        prev.map((form, i) => {
          if (i !== index) return form;

          let updated = { ...form, [field]: value };

          if (field === "timestamp") {
            // Allow empty string
            if (value === "") {
              return { ...form, timestamp: "" };
            }

            // Parse as float to handle decimals
            const timestampValue = parseFloat(value);

            // Only update if it's a valid number
            if (!isNaN(timestampValue)) {
              const maxTimestamp = video.duration || Infinity;
              const clampedValue = Math.max(
                0,
                Math.min(timestampValue, maxTimestamp)
              );
              return { ...form, timestamp: clampedValue.toString() };
            }
            return form; // Don't update if invalid
          }

          // Handle link type specific logic
          if (field === "url" && value) {
            // If URL is set, ensure link type is URL and clear other fields
            updated.linkType = "url";
            updated.destinationVideoId = "";
            updated.formData = undefined;
          } else if (field === "destinationVideoId" && value) {
            // If destination video is set, ensure proper link type
            updated.url = "";
            if (updated.linkType === "url") {
              updated.linkType = "video";
            }
            if (updated.linkType !== "form") {
              updated.formData = undefined;
            }
          } else if (field === "linkType") {
            // Handle link type changes
            if (value === "form") {
              // Initialize form data if switching to form type
              if (!updated.formData) {
                updated.formData = {
                  title: "",
                  elements: [
                    {
                      id: `elem-${Date.now()}`,
                      type: "text",
                      label: "Name",
                      placeholder: "Enter your name",
                    },
                    {
                      id: `elem-${Date.now() + 1}`,
                      type: "email",
                      label: "Email",
                      placeholder: "Enter your email",
                    },
                  ],
                };
              }
              updated.url = "";
              updated.destinationVideoId = "";
            } else if (value === "url") {
              // Clear form and video data when switching to URL type
              updated.formData = undefined;
              updated.destinationVideoId = "";
            } else if (value === "video") {
              // Clear form and URL data when switching to video type
              updated.formData = undefined;
              updated.url = "";
            }
          } else if (field === "timestamp") {
            // Ensure timestamp is within video bounds
            const timestampValue = parseInt(value) || 0;
            const maxTimestamp = video.duration || Infinity;
            updated.timestamp = Math.max(
              0,
              Math.min(timestampValue, maxTimestamp)
            ).toString();
          } else if (field === "position_x") {
            // Ensure position is within reasonable bounds (0-90%)
            updated.position_x = Math.max(
              0,
              Math.min(90, parseInt(value) || 20)
            );
          } else if (field === "position_y") {
            // Ensure position is within reasonable bounds (0-90%)
            updated.position_y = Math.max(
              0,
              Math.min(90, parseInt(value) || 20)
            );
          } else if (
            field === "normal_image_width" ||
            field === "normal_image_height"
          ) {
            // Ensure image dimensions are reasonable
            const dimensionValue = parseInt(value) || 0;
            updated[field] = Math.max(0, Math.min(500, dimensionValue));
          } else if (
            field === "hover_image_width" ||
            field === "hover_image_height"
          ) {
            // Ensure image dimensions are reasonable
            const dimensionValue = parseInt(value) || 0;
            updated[field] = Math.max(0, Math.min(500, dimensionValue));
          }

          return updated;
        })
      );

      // Clear errors for this field when user starts typing
      if (formErrors[index]?.length > 0) {
        setFormErrors((prev) => {
          const newErrors = { ...prev };
          if (newErrors[index]) {
            newErrors[index] = newErrors[index].filter(
              (error) => error !== field
            );
            if (newErrors[index].length === 0) {
              delete newErrors[index];
            }
          }
          return newErrors;
        });
      }
    },
    [video.duration, formErrors]
  );

  const handleImageMove = useCallback(
    (linkId: string, x: number, y: number) => {
      setButtonForms((prev) =>
        prev.map((form, formIndex) => {
          const isMatch =
            form.id === linkId ||
            (!form.id && buttonForms.length === 1) ||
            (linkId.startsWith("temp_") &&
              !form.id &&
              formIndex === parseInt(linkId.split("_")[1]));

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
        normalImageFile: null,
        hoverImageFile: null,
        normal_image_width: 0,
        normal_image_height: 0,
        hover_image_width: 0,
        hover_image_height: 0,
        duration_ms: 0,
        formData: undefined,
      },
    ]);
  }, []);

  const handleRemoveForm = useCallback((index: number) => {
    setButtonForms((prev) => {
      const formToRemove = prev[index];
      // Clean up blob URLs before removing
      if (formToRemove.normalImagePreview?.startsWith("blob:")) {
        URL.revokeObjectURL(formToRemove.normalImagePreview);
      }
      if (formToRemove.hoverImagePreview?.startsWith("blob:")) {
        URL.revokeObjectURL(formToRemove.hoverImagePreview);
      }
      return prev.filter((_, i) => i !== index);
    });

    // Remove errors for this form
    setFormErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[index];
      // Reindex remaining errors
      const reindexedErrors: { [key: number]: string[] } = {};
      Object.keys(newErrors).forEach((key) => {
        const oldIndex = parseInt(key);
        if (oldIndex > index) {
          reindexedErrors[oldIndex - 1] = newErrors[oldIndex];
        } else {
          reindexedErrors[oldIndex] = newErrors[oldIndex];
        }
      });
      return reindexedErrors;
    });
  }, []);

  const handleRemoveAllForms = useCallback(() => {
    // Clean up all blob URLs
    buttonForms.forEach((form) => {
      if (form.normalImagePreview?.startsWith("blob:")) {
        URL.revokeObjectURL(form.normalImagePreview);
      }
      if (form.hoverImagePreview?.startsWith("blob:")) {
        URL.revokeObjectURL(form.hoverImagePreview);
      }
    });
    setButtonForms([]);
    setFormErrors({});
    onLinksChange([]);
    unsavedChangesRef.current = [];
  }, [buttonForms, onLinksChange]);

  const handleSaveButton = useCallback(async () => {
    setIsUploading(true);

    // Validate all forms
    const errors = validateForms(buttonForms);
    setFormErrors(errors);

    if (Object.keys(errors).length > 0) {
      setIsUploading(false);
      return;
    }

    try {
      const updatedLinks: VideoLink[] = [];

      for (const formData of buttonForms) {
        const ts = parseFloat(formData.timestamp);

        const linkData: VideoLink = {
          id: formData.id ?? Math.random().toString(36).substr(2, 9),
          timestamp_seconds: ts,
          label: formData.label.trim(),
          link_type: formData.linkType,
          position_x: formData.position_x,
          position_y: formData.position_y,
          duration_ms: formData.duration_ms,
          normal_state_image: formData.normal_state_image,
          hover_state_image: formData.hover_state_image,
          normal_image_width: formData.normal_image_width,
          normal_image_height: formData.normal_image_height,
          hover_image_width: formData.hover_image_width,
          hover_image_height: formData.hover_image_height,
          normalImageFile: formData.normalImageFile,
          hoverImageFile: formData.hoverImageFile,
          normalImagePreview: formData.normalImagePreview,
          hoverImagePreview: formData.hoverImagePreview,
        };

        if (formData.linkType === "url") {
          linkData.url = formData.url.startsWith("http")
            ? formData.url
            : `https://${formData.url}`;
        } else if (
          formData.linkType === "video" ||
          formData.linkType === "form"
        ) {
          linkData.destination_video_id = formData.destinationVideoId;
        }

        if (formData.linkType === "form") {
          linkData.form_data = formData.formData as any;
        }

        updatedLinks.push(linkData);
      }

      // Clear unsaved changes FIRST
      unsavedChangesRef.current = [];

      // Then update parent
      onLinksChange(updatedLinks);

      // Close modal
      setIsModalOpen(false);
      setIsEditMode(false);
    } catch (error) {
      console.error("Error saving links:", error);
      alert("Error saving links. Please try again.");
      // Restore unsaved changes on error
      unsavedChangesRef.current = buttonForms;
    } finally {
      setIsUploading(false);
    }
  }, [buttonForms, onLinksChange]);

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
            timestamp_seconds: parseFloat(form.timestamp) || 0,
            label: form.label,
            url: form.url,
            destination_video_id: form.destinationVideoId,
            link_type: form.linkType,
            position_x: form.position_x,
            position_y: form.position_y,
            duration_ms: form.duration_ms,
            form_data: form.formData as any,
            // Use preview URLs if available, otherwise use database URLs
            normal_state_image: form.normal_state_image,
            hover_state_image: form.hover_state_image,
            normalImagePreview: form.normalImagePreview,
            hoverImagePreview: form.hoverImagePreview,
            normal_image_width: form.normal_image_width,
            normal_image_height: form.normal_image_height,
            hover_image_width: form.hover_image_width,
            hover_image_height: form.hover_image_height,
          } as VideoLink)
      );
  }, [buttonForms]);

  // In VideoUploadWithLinksComponent render method
  const videoPlayerSection = useMemo(
    () => (
      <div className="common-video-player">
        <VideoPlayerWithDraggableImages
          videoUrl={videoUrl}
          links={
            isModalOpen && (isEditMode || showPreview)
              ? previewLinks
              : video.links || []
          }
          isEditMode={isModalOpen && isEditMode}
          onImageMove={handleImageMove}
          showPreview={showPreview || (isModalOpen && !isEditMode)}
        />
      </div>
    ),
    [
      videoUrl,
      video.links,
      isModalOpen,
      isEditMode,
      previewLinks,
      handleImageMove,
      showPreview,
    ]
  );

  const hasVideoContent = video.file || video.url;

  // Helper function to check if a field has error
  const hasError = (formIndex: number, fieldName: string) => {
    return formErrors[formIndex]?.includes(fieldName);
  };

  return (
    <Card className="mb-6">
      <CardContent className="relative">
        {!hasVideoContent ? uploadSection : videoPlayerSection}

        <div className="absolute top-0 right-4 flex space-x-2">
          {hasVideoContent && video?.links && video.links.length > 0 && (
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowPreview(!showPreview)}
              className="bg-white mt-2"
            >
              {showPreview ? (
                <EyeOff className="h-10 w-10" />
              ) : (
                <Eye className="h-10 w-10" />
              )}
            </Button>
          )}
          {hasVideoContent && (
            <Button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="bg-white text-black hover:bg-gray-100 mr-4 mt-2"
            >
              {video.links && video.links.length > 0
                ? "Edit Buttons"
                : "Add Buttons"}
            </Button>
          )}
        </div>
      </CardContent>

      {/* Enhanced Modal */}
      <Dialog
        open={isModalOpen}
        onOpenChange={(open) => {
          if (!open) {
            // Check if there are unsaved changes
            const hasChanges = areFormsDifferentFromLinks(
              buttonForms,
              video.links || []
            );

            if (hasChanges && buttonForms.length > 0) {
              // Show confirmation dialog before closing

              // User confirmed, clean up blob URLs and reset state
              buttonForms.forEach((form) => {
                if (form.normalImagePreview?.startsWith("blob:")) {
                  URL.revokeObjectURL(form.normalImagePreview);
                }
                if (form.hoverImagePreview?.startsWith("blob:")) {
                  URL.revokeObjectURL(form.hoverImagePreview);
                }
              });

              // Reset to original state
              if (video.links && video.links.length > 0) {
                setButtonForms(
                  video.links.map((link) => ({
                    id: link.id,
                    label: link.label,
                    url: link.url || "",
                    timestamp: link.timestamp_seconds.toString(),
                    linkType: link.link_type,
                    destinationVideoId: link.destination_video_id || "",
                    position_x: link.position_x || 20,
                    position_y: link.position_y || 20,
                    duration_ms: link.duration_ms,
                    normalImageFile: link.normalImageFile || null,
                    hoverImageFile: link.hoverImageFile || null,
                    normal_image_width: link.normal_image_width || 100,
                    normal_image_height: link.normal_image_height || 100,
                    hover_image_width: link.hover_image_width || 100,
                    hover_image_height: link.hover_image_height || 100,
                    normal_state_image: link.normal_state_image,
                    hover_state_image: link.hover_state_image,
                    normalImagePreview: link.normalImageFile
                      ? URL.createObjectURL(link.normalImageFile)
                      : link.normalImagePreview,
                    hoverImagePreview: link.hoverImageFile
                      ? URL.createObjectURL(link.hoverImageFile)
                      : link.hoverImagePreview,
                    formData: link.form_data as FormSolutionData | undefined,
                  }))
                );
              } else {
                setButtonForms([]);
              }
            }

            // Clear unsaved changes reference
            unsavedChangesRef.current = [];
          }

          setIsModalOpen(open);
          if (!open) {
            setIsEditMode(false);
            setFormErrors({});
          }
        }}
      >
        <DialogContent className="min-w-[90vw] min-h-[90vh] max-w-none overflow-y-auto">
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

          <div className="flex gap-6 my-4 h-full">
            {/* Left side - Video Preview */}
            {hasVideoContent && (
              <div className="flex-1">
                <Label className="font-bold mb-2 block">Video Preview</Label>
                <VideoPlayerWithDraggableImages
                  videoUrl={videoUrl}
                  links={previewLinks}
                  isEditMode={isEditMode}
                  onImageMove={handleImageMove}
                  showPreview={true}
                />
                {isEditMode && (
                  <p className="text-sm text-gray-600 mt-2">
                    💡 Drag the images to position them where you want them to
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
                    Add Your First button
                  </Button>
                </div>
              ) : (
                buttonForms.map((formData, index) => (
                  <div
                    key={index}
                    className="space-y-4 rounded-lg p-4 border border-gray-200 bg-gray-50"
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

                    <div className="flex gap-3 items-center justify-center">
                      {/* Timestamp */}
                      <div className="flex flex-col gap-2 w-36 relative min-h-[70px]">
                        <Label className="font-bold">Timestamp</Label>
                        <Input
                          type="number"
                          step="0.1"
                          min={0}
                          max={video.duration || undefined}
                          placeholder={`0${
                            video.duration ? ` - ${video.duration}` : ""
                          }`}
                          value={formData.timestamp}
                          onKeyDown={(e) => {
                            if (["-", "+", "e", "E"].includes(e.key))
                              e.preventDefault();
                          }}
                          onChange={(e) => {
                            const rawValue = e.target.value;
                            if (rawValue === "")
                              return handleFormChange(index, "timestamp", "");
                            const floatValue = parseFloat(rawValue);
                            if (!isNaN(floatValue)) {
                              let clampedValue = Math.min(
                                Math.max(floatValue, 0),
                                video.duration || floatValue
                              );
                              handleFormChange(
                                index,
                                "timestamp",
                                clampedValue.toString()
                              );
                            }
                          }}
                          onBlur={(e) => {
                            const value = e.target.value;
                            if (value && !value.includes(".")) {
                              handleFormChange(
                                index,
                                "timestamp",
                                value + ".0"
                              );
                            }
                          }}
                          className={
                            hasError(index, "timestamp") ? "border-red-500" : ""
                          }
                        />
                        {hasError(index, "timestamp") && (
                          <p className="text-red-500 text-xs mt-1 absolute -bottom-2 left-0">
                            timestamp required
                          </p>
                        )}
                      </div>

                      {/* Duration */}
                      <div className="flex flex-col gap-2 w-36 relative min-h-[70px]">
                        <Label className="font-bold">Duration</Label>
                        <Input
                          type="number"
                          step="0.1"
                          min={0}
                          max={video.duration || undefined}
                          value={
                            formData.duration_ms !== undefined
                              ? formData.duration_ms / 1000
                              : ""
                          }
                          onKeyDown={(e) => {
                            if (["-", "+", "e", "E"].includes(e.key))
                              e.preventDefault();
                          }}
                          onChange={(e) => {
                            const rawValue = e.target.value;
                            if (rawValue === "")
                              return handleFormChange(
                                index,
                                "duration_ms",
                                undefined
                              );
                            const secondsValue = parseFloat(rawValue);
                            if (!isNaN(secondsValue)) {
                              let clampedSeconds = Math.min(
                                Math.max(secondsValue, 0),
                                video.duration || secondsValue
                              );
                              handleFormChange(
                                index,
                                "duration_ms",
                                clampedSeconds * 1000
                              );
                            }
                          }}
                          onBlur={(e) => {
                            const value = e.target.value;
                            if (value && !value.includes(".")) {
                              const secondsValue = parseFloat(value);
                              if (!isNaN(secondsValue)) {
                                handleFormChange(
                                  index,
                                  "duration_ms",
                                  secondsValue * 1000
                                );
                              }
                            }
                          }}
                          placeholder={`0${
                            video.duration ? ` - ${video.duration}` : ""
                          }`}
                        />
                      </div>

                      {/* Image Label */}
                      <div className="flex flex-col gap-2 flex-1 relative min-h-[70px]">
                        <Label className="font-bold">Image Label</Label>
                        <Input
                          placeholder="Add Image label"
                          value={formData.label}
                          onChange={(e) =>
                            handleFormChange(index, "label", e.target.value)
                          }
                          className={
                            hasError(index, "label") ? "border-red-500" : ""
                          }
                        />
                        {hasError(index, "label") && (
                          <p className="text-red-500 text-xs mt-1 absolute -bottom-2 left-0">
                            Label is required
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Position Controls */}
                    <div className="flex gap-3">
                      <div className="flex flex-col gap-2 flex-1">
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
                      <div className="flex flex-col gap-2 flex-1">
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

                    {/* Image Uploads */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <ImageUploader
                        label="Normal State Image"
                        imageUrl={formData.normal_state_image}
                        previewUrl={formData.normalImagePreview}
                        onImageChange={(file, url) =>
                          handleImageUpload(index, "normal", file, url)
                        }
                        onDimensionsChange={(width, height) => {
                          handleFormChange(index, "normal_image_width", width);
                          handleFormChange(
                            index,
                            "normal_image_height",
                            height
                          );
                        }}
                        width={formData.normal_image_width}
                        height={formData.normal_image_height}
                      />
                      <ImageUploader
                        label="Hover State Image"
                        imageUrl={formData.hover_state_image}
                        previewUrl={formData.hoverImagePreview}
                        onImageChange={(file, url) =>
                          handleImageUpload(index, "hover", file, url)
                        }
                        onDimensionsChange={(width, height) => {
                          handleFormChange(index, "hover_image_width", width);
                          handleFormChange(index, "hover_image_height", height);
                        }}
                        width={formData.hover_image_width}
                        height={formData.hover_image_height}
                      />
                    </div>

                    {/* Link Action */}
                    <div className="space-y-3">
                      <div>
                        <Label className="font-bold">Link Type</Label>
                        <div className="flex gap-4 mt-2">
                          <div className="flex items-center space-x-2">
                            <input
                              type="radio"
                              id={`url-${index}`}
                              name={`linkType-${index}`}
                              value="url"
                              checked={formData.linkType === "url"}
                              onChange={(e) =>
                                handleFormChange(
                                  index,
                                  "linkType",
                                  e.target.value
                                )
                              }
                            />
                            <Label htmlFor={`url-${index}`}>URL</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input
                              type="radio"
                              id={`video-${index}`}
                              name={`linkType-${index}`}
                              value="video"
                              checked={formData.linkType === "video"}
                              onChange={(e) =>
                                handleFormChange(
                                  index,
                                  "linkType",
                                  e.target.value
                                )
                              }
                            />
                            <Label htmlFor={`video-${index}`}>Video</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input
                              type="radio"
                              id={`form-${index}`}
                              name={`linkType-${index}`}
                              value="form"
                              checked={formData.linkType === "form"}
                              onChange={(e) =>
                                handleFormChange(
                                  index,
                                  "linkType",
                                  e.target.value
                                )
                              }
                            />
                            <Label htmlFor={`form-${index}`}>Form</Label>
                          </div>
                        </div>
                      </div>

                      {formData.linkType === "url" && (
                        <div className="flex flex-col gap-2">
                          <Label className="font-bold">URL</Label>
                          <Input
                            placeholder="https://example.com"
                            value={formData.url}
                            onChange={(e) =>
                              handleFormChange(index, "url", e.target.value)
                            }
                          />
                        </div>
                      )}

                      {formData.linkType === "video" && (
                        <div className="flex flex-col gap-2">
                          <Label className="font-bold">Destination Video</Label>
                          <Select
                            value={formData.destinationVideoId ?? "no"}
                            onValueChange={(value) =>
                              handleFormChange(
                                index,
                                "destinationVideoId",
                                value === "no" ? null : value
                              )
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select destination video" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="no">No video</SelectItem>
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
                      )}

                      {formData.linkType === "form" && (
                        <>
                          <div className="flex flex-col gap-2 my-2">
                            <Label className="font-bold">
                              Destination Video (After Form Submission)
                            </Label>
                            <Select
                              value={formData.destinationVideoId ?? "no"}
                              onValueChange={(value) =>
                                handleFormChange(
                                  index,
                                  "destinationVideoId",
                                  value === "no" ? null : value
                                )
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select destination video after form submission" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="no">No video</SelectItem>
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

                          {formData.formData && (
                            <div className="space-y-4">
                              {/* Add form title input field */}
                              <div className="flex flex-col gap-2">
                                <Label className="font-bold">Form Title</Label>
                                <Input
                                  placeholder="Enter form title"
                                  value={formData.formData.title || ""}
                                  onChange={(e) => {
                                    const newFormData = {
                                      ...formData.formData,
                                      title: e.target.value,
                                    };
                                    handleFormChange(
                                      index,
                                      "formData",
                                      newFormData
                                    );
                                  }}
                                />
                              </div>
                              <div className="flex flex-col gap-2">
                                <Label className="font-bold">Form Email</Label>
                                <Input
                                  placeholder="Enter email"
                                  value={formData.formData.email || ""}
                                  onChange={(e) => {
                                    const newFormData = {
                                      ...formData.formData,
                                      email: e.target.value,
                                    };
                                    handleFormChange(
                                      index,
                                      "formData",
                                      newFormData
                                    );
                                  }}
                                  className={
                                    hasError(index, "formEmail")
                                      ? "border-red-500"
                                      : ""
                                  }
                                />
                                {hasError(index, "formEmail") && (
                                  <p className="text-red-500 text-xs">
                                    Valid email is required
                                  </p>
                                )}
                              </div>

                              <EnhancedFormBuilder
                                formData={formData.formData}
                                onChange={(newFormData) =>
                                  handleFormChange(
                                    index,
                                    "formData",
                                    newFormData
                                  )
                                }
                              />
                            </div>
                          )}
                        </>
                      )}
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
          <DialogFooter className="flex justify-between items-center border-t pt-4 mt-4">
            <Button
              variant="destructive"
              onClick={handleRemoveAllForms}
              disabled={buttonForms.length === 0}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete All buttons
            </Button>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveButton} disabled={isUploading}>
                {isUploading ? "Uploading..." : "Save All"}
              </Button>
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
