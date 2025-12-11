"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import {
  VideoType,
  VideoLink,
  FormSolutionData,
  FormElement,
} from "@/lib/types";
import { ChevronLeft, Loader2, RefreshCw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface CommonVideoPlayerProps {
  currentVideo: VideoType | null;
  videoLinks: Record<string, VideoLink[]>;
  onVideoEnd: () => void;
  onVideoLinkClick: (link: VideoLink) => void;
  onBackNavigation?: () => void;
  showBackButton?: boolean;
  hoveredLinkId?: string | null;
  setHoveredLinkId?: (id: string | null) => void;
  currentForm?: FormSolutionData | null;
  onFormSubmit?: any;
  onFormLoading?: boolean;
  currentFormLink?: VideoLink | null;
  onFormCancel?: () => void;
  isPaused?: boolean;
  children?: React.ReactNode;
  onVideoRestart?: () => void;
  hasQuestions?: boolean;
}

// Form Display Component (unchanged)
function FormDisplay({
  formData,
  onSubmit,
  onFormLoading = false,
  formLink,
  onCancel,
}: {
  formData: FormSolutionData;
  onSubmit: (data: Record<string, any>) => void;
  onFormLoading?: boolean;
  formLink?: VideoLink | null;
  onCancel: () => void;
}) {
  const [formValues, setFormValues] = useState<Record<string, any>>({});

  const handleInputChange = (elementId: string, value: any) => {
    setFormValues((prev) => ({ ...prev, [elementId]: value }));
  };

  const handleCheckboxChange = (
    elementId: string,
    optionId: string,
    checked: boolean
  ) => {
    setFormValues((prev) => {
      const currentValues = prev[elementId] || [];
      if (checked) {
        return { ...prev, [elementId]: [...currentValues, optionId] };
      } else {
        return {
          ...prev,
          [elementId]: currentValues.filter((id: string) => id !== optionId),
        };
      }
    });
  };

  const handleRadioChange = (elementId: string, optionId: string) => {
    setFormValues((prev) => ({ ...prev, [elementId]: optionId }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const rawValues = { ...formValues };
    const formattedValues: Record<string, any> = {};
    formData.elements.forEach((element) => {
      const rawValue = formValues[element.id];

      if (rawValue !== undefined) {
        if (element.type === "checkbox" && Array.isArray(rawValue)) {
          formattedValues[element.label] = rawValue
            .map(
              (id: string) =>
                element.options?.find((opt) => opt.id === id)?.label || id
            )
            .join(", ");
        } else if (element.type === "radio" || element.type === "dropdown") {
          formattedValues[element.label] =
            element.options?.find((opt) => opt.id === rawValue)?.label ||
            rawValue;
        } else {
          formattedValues[element.label] = rawValue;
        }
      }
    });

    const finalPayload = {
      title: formData.title,
      email: formData.email,
      description: formData.description,
      elements: formData.elements,
      values: {
        raw: rawValues,
        formatted: formattedValues,
      },
    };

    onSubmit(finalPayload);
  };

  const renderFormElement = (element: FormElement) => {
    switch (element.type) {
      case "text":
      case "email":
      case "number":
        return (
          <Input
            id={element.id}
            type={element.type}
            placeholder={element.placeholder}
            value={formValues[element.id] || ""}
            onChange={(e) => handleInputChange(element.id, e.target.value)}
            className="w-full bg-white/80 backdrop-blur-sm"
          />
        );

      case "textarea":
        return (
          <textarea
            id={element.id}
            placeholder={element.placeholder}
            value={formValues[element.id] || ""}
            onChange={(e) => handleInputChange(element.id, e.target.value)}
            className="w-full p-2 border rounded-md bg-white/80 backdrop-blur-sm"
            rows={4}
          />
        );

      case "dropdown":
        return (
          <select
            id={element.id}
            value={formValues[element.id] || ""}
            onChange={(e) => handleInputChange(element.id, e.target.value)}
            className="w-full p-2 border rounded-md bg-white/80 backdrop-blur-sm"
          >
            <option value="">Select an option</option>
            {element.options?.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        );

      case "checkbox":
        return (
          <div className="space-y-2">
            {element.options?.map((option) => (
              <div key={option.id} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id={option.id}
                  checked={(formValues[element.id] || []).includes(option.id)}
                  onChange={(e) =>
                    handleCheckboxChange(
                      element.id,
                      option.id,
                      e.target.checked
                    )
                  }
                  className="h-4 w-4"
                />
                <Label htmlFor={option.id} className="font-normal text-white">
                  {option.label}
                </Label>
              </div>
            ))}
          </div>
        );

      case "radio":
        return (
          <div className="space-y-2">
            {element.options?.map((option) => (
              <div key={option.id} className="flex items-center space-x-2">
                <input
                  type="radio"
                  id={option.id}
                  name={element.id}
                  value={option.id}
                  checked={formValues[element.id] === option.id}
                  onChange={(e) =>
                    handleRadioChange(element.id, e.target.value)
                  }
                  className="h-4 w-4"
                />
                <Label htmlFor={option.id} className="font-normal text-white">
                  {option.label}
                </Label>
              </div>
            ))}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="absolute inset-0 flex items-center justify-center z-50">
      <div className="w-[90%] max-w-2xl overflow-y-auto h-[90%] bg-white/30 backdrop-blur-sm rounded-lg p-6 shadow-lg border border-white/60 flex flex-col max-h-[80vh] hide-scrollbar">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">
            {formData.title || "Form"}
          </h2>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="text-white hover:bg-white/20"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex-1 flex flex-col overflow-hidden"
        >
          <div className="flex-1 overflow-y-auto pr-2 space-y-4">
            {formData.elements.map((element) => (
              <div key={element.id} className="space-y-2">
                <Label htmlFor={element.id} className="text-white">
                  {element.label}
                </Label>
                {renderFormElement(element)}
              </div>
            ))}
          </div>

          <div className="flex gap-2 pt-4 mt-4 border-t border-white/20">
            <Button
              type="button"
              variant="outline"
              disabled={onFormLoading}
              onClick={onCancel}
              className="flex-1 bg-white/20 text-black hover:bg-white/30"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={onFormLoading}
              className="flex-1 bg-white/30 text-black hover:bg-white/40 flex items-center justify-center gap-2"
            >
              {onFormLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                "Submit"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function CommonVideoPlayer({
  currentVideo,
  videoLinks,
  onVideoEnd,
  onVideoLinkClick,
  onBackNavigation,
  showBackButton = false,
  hoveredLinkId,
  currentForm,
  onFormSubmit,
  onFormCancel,
  onFormLoading = false,
  currentFormLink,
  onVideoRestart,
  isPaused = false,
  children,
  hasQuestions = false,
}: CommonVideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [mouseActive, setMouseActive] = useState(false);
  const [activeLinks, setActiveLinks] = useState<VideoLink[]>([]);
  const [showFreezeControls, setShowFreezeControls] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const mouseTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Video rect state for fullscreen positioning
  const [videoRect, setVideoRect] = useState<{
    width: number;
    height: number;
    left: number;
    top: number;
    scale: number;
  } | null>(null);

  const calculateVideoRect = useCallback(() => {
    const video = videoRef.current;
    const container = videoContainerRef.current;
    if (!video || !container) return null;

    const containerRect = container.getBoundingClientRect();
    const containerW = containerRect.width;
    const containerH = containerRect.height;
    const vW = video.videoWidth || 0;
    const vH = video.videoHeight || 0;
    if (!vW || !vH) return null;

    const ar = vW / vH;
    let fitH = containerH;
    let fitW = fitH * ar;
    if (fitW > containerW) {
      fitW = containerW;
      fitH = fitW / ar;
    }

    const left = Math.max(0, (containerW - fitW) / 2);
    const top = Math.max(0, (containerH - fitH) / 2);

    const rect = {
      width: fitW,
      height: fitH,
      left,
      top,
      scale: vW ? fitW / vW : 1,
    };

    setVideoRect(rect);
    return rect;
  }, []);

  // Enhanced video rect calculation for true fullscreen
  useEffect(() => {
    const video = videoRef.current;
    const container = videoContainerRef.current;
    if (!video || !container) return;

    const calculateAndSetRect = () => {
      setTimeout(() => {
        calculateVideoRect();
      }, 100);
    };

    const resizeObserver = new ResizeObserver(calculateAndSetRect);
    resizeObserver.observe(container);

    video.addEventListener("loadedmetadata", calculateAndSetRect);
    video.addEventListener("canplay", calculateAndSetRect);
    video.addEventListener("loadeddata", calculateAndSetRect);
    video.addEventListener("resize", calculateAndSetRect);
    window.addEventListener("resize", calculateAndSetRect);

    const checkContainerSize = () => {
      if (container.getBoundingClientRect().width > 0) {
        calculateAndSetRect();
      } else {
        setTimeout(checkContainerSize, 50);
      }
    };

    checkContainerSize();

    return () => {
      resizeObserver.disconnect();
      video.removeEventListener("loadedmetadata", calculateAndSetRect);
      video.removeEventListener("canplay", calculateAndSetRect);
      video.removeEventListener("loadeddata", calculateAndSetRect);
      video.removeEventListener("resize", calculateAndSetRect);
      window.removeEventListener("resize", calculateAndSetRect);
    };
  }, [currentVideo, calculateVideoRect]);

  // Track timestamps for video links
  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl || !currentVideo) return;

    const handleTimeUpdate = () => {
      const links = videoLinks[currentVideo.id] || [];
      const currentTime = videoEl.currentTime;

      const visibleLinks = links.filter((link) => {
        const startTime = link.timestamp_seconds;
        const durationSeconds = (link.duration_ms || 3000) / 1000;
        const endTime = startTime + durationSeconds;

        return currentTime >= startTime && currentTime <= endTime;
      });

      setActiveLinks((prev) => {
        if (
          prev.length !== visibleLinks.length ||
          !prev.every((link, i) => link.id === visibleLinks[i]?.id)
        ) {
          return visibleLinks;
        }
        return prev;
      });
    };

    videoEl.addEventListener("timeupdate", handleTimeUpdate);
    return () => {
      videoEl.removeEventListener("timeupdate", handleTimeUpdate);
    };
  }, [currentVideo, videoLinks]);

  // Handle pausing when form is shown
  useEffect(() => {
    if (videoRef.current) {
      if (isPaused) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else if (!isPlaying && !isPaused) {
        videoRef.current.play();
        setIsPlaying(true);
      }
    }
  }, [isPaused]);

  // Reset freeze controls when video changes
  useEffect(() => {
    setShowFreezeControls(false);
  }, [currentVideo]);

  // Get image position - UPDATED FOR TRUE FULLSCREEN
  const getImagePosition = useCallback(
    (link: VideoLink) => {
      if (!videoRect) {
        return { left: `${link.position_x}%`, top: `${link.position_y}%` };
      }

      // Calculate position relative to the actual rendered video bounds
      const left = videoRect.left + (link.position_x / 100) * videoRect.width;
      const top = videoRect.top + (link.position_y / 100) * videoRect.height;

      return { left: `${left}px`, top: `${top}px` };
    },
    [videoRect]
  );

  // Get scaled image dimensions for fullscreen
  const getScaledImageDimensions = useCallback(
    (link: VideoLink) => {
      if (!videoRect) {
        return {
          width: link.normal_image_width || 100,
          height: link.normal_image_height || 100,
        };
      }

      const baseWidth = link.normal_image_width || 100;
      const baseHeight = link.normal_image_height || 100;

      // Scale dimensions according to video scaling
      const scaledWidth = baseWidth * videoRect.scale;
      const scaledHeight = baseHeight * videoRect.scale;

      // For hover state
      if (
        hoveredLinkId === link.id &&
        (link.hover_image_width || link.hover_image_height)
      ) {
        const hoverBaseWidth = link.hover_image_width || baseWidth;
        const hoverBaseHeight = link.hover_image_height || baseHeight;
        return {
          width: hoverBaseWidth * videoRect.scale,
          height: hoverBaseHeight * videoRect.scale,
        };
      }

      return {
        width: scaledWidth,
        height: scaledHeight,
      };
    },
    [videoRect, hoveredLinkId]
  );

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
        setShowControls(true);
      } else {
        const p = videoRef.current.play();
        if (p && typeof (p as Promise<void>).catch === "function") {
          (p as Promise<void>).catch((err) => {
            console.warn("Autoplay blocked; awaiting user gesture", err);
            setIsPlaying(false);
            setShowControls(true);
          });
        } else {
          setIsPlaying(true);
        }
        setIsPlaying(true);
        setMouseActive(true);
        resetMouseTimeout();
        setShowFreezeControls(false);
      }
    }
  };

  const handleMouseMove = () => {
    setMouseActive(true);
    setShowControls(true);
    resetMouseTimeout();
  };

  const resetMouseTimeout = () => {
    if (mouseTimeoutRef.current) {
      clearTimeout(mouseTimeoutRef.current);
    }
    mouseTimeoutRef.current = setTimeout(() => {
      setMouseActive(false);
      if (isPlaying) {
        setShowControls(false);
      }
    }, 2000);
  };

  const getImageUrl = (link: VideoLink) => {
    if (hoveredLinkId === link.id && link.hover_state_image) {
      return link.hover_state_image;
    }
    return link.normal_state_image;
  };

  const handleVideoEnd = () => {
    const shouldFreeze = !hasQuestions && currentVideo?.freezeAtEnd;

    if (shouldFreeze) {
      setShowFreezeControls(true);
      setIsPlaying(false);
      setShowControls(true);
    } else {
      onVideoEnd();
    }
  };

  const handleRestartVideo = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      const p = videoRef.current.play();
      if (p && typeof (p as Promise<void>).catch === "function") {
        (p as Promise<void>).catch((err) => {
          console.warn("Autoplay blocked on restart; awaiting user gesture", err);
          setIsPlaying(false);
          setShowControls(true);
        });
      } else {
        setIsPlaying(true);
      }
      setIsPlaying(true);
      setShowFreezeControls(false);
      setMouseActive(true);
      resetMouseTimeout();
    }
  };

  useEffect(() => {
    return () => {
      if (mouseTimeoutRef.current) {
        clearTimeout(mouseTimeoutRef.current);
      }
    };
  }, []);

  if (!currentVideo) {
    return null;
  }

  return (
    <div
      ref={videoContainerRef}
      className="fixed inset-0 bg-black flex items-center justify-center"
      onMouseMove={handleMouseMove}
      onMouseEnter={() => {
        setMouseActive(true);
        setShowControls(true);
      }}
      onMouseLeave={() => {
        setMouseActive(false);
        if (isPlaying) {
          setShowControls(false);
        }
      }}
    >
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        src={currentVideo.url}
        className="object-contain cursor-pointer"
        style={{
          width: videoRect ? `${videoRect.width}px` : undefined,
          height: videoRect ? `${videoRect.height}px` : undefined,
        }}
        controls={false}
        onClick={togglePlayPause}
        onEnded={handleVideoEnd}
        onPlay={() => {
          setIsPlaying(true);
          if (videoRef.current?.currentTime === 0) {
            onVideoRestart?.();
          }
        }}
        onPause={() => {
          setIsPlaying(false);
          setShowControls(true);
        }}
        onLoadStart={() => setTimeout(() => calculateVideoRect(), 100)}
        onCanPlay={() => setTimeout(() => calculateVideoRect(), 100)}
        onResize={() => setTimeout(() => calculateVideoRect(), 100)}
      />

      {showBackButton && onBackNavigation && !isPlaying && (
        <div
          className={`absolute left-4 top-4 z-[999] bg-white/30 backdrop-blur-sm rounded-lg p-2 shadow-lg border border-white/60 cursor-pointer hover:bg-white/40 transition-all duration-200 hover:scale-110 ${
            showControls ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
          onClick={onBackNavigation}
        >
          <ChevronLeft className="w-6 h-6 text-white font-bold" />
        </div>
      )}

      {/* Freeze at end controls */}
      {showFreezeControls && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 backdrop-blur-sm z-40">
          <div className="bg-white/30 backdrop-blur-sm rounded-lg p-6 shadow-lg border border-white/60 text-center max-w-md">
            <h3 className="text-white text-lg font-semibold mb-4">
              Video Completed
            </h3>
            <p className="text-white mb-6">What would you like to do next?</p>
            <div className="flex flex-col gap-3">
              <Button
                onClick={handleRestartVideo}
                className="bg-white/30 text-white hover:bg-white/40"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Watch Again
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Play/Pause overlay */}
      {!isPlaying && !showFreezeControls && (
        <div
          className={`absolute inset-0 flex items-center justify-center cursor-pointer transition-opacity duration-300 ${
            mouseActive || !isPlaying ? "opacity-100" : "opacity-0"
          }`}
          onClick={togglePlayPause}
        >
          <div
            className={`bg-white/30 backdrop-blur-sm rounded-full p-4 shadow-lg border border-white/60 flex items-center justify-center transform transition-all duration-300 hover:scale-110`}
          >
            {isPlaying ? (
              <div className="w-10 h-10 flex items-center justify-center">
                <div className="w-2 h-8 bg-white mx-1"></div>
                <div className="w-2 h-8 bg-white mx-1"></div>
              </div>
            ) : (
              <svg
                className="w-10 h-10 text-white"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </div>
        </div>
      )}

      {/* Form Display */}
      {currentForm && onFormSubmit && onFormCancel && (
        <FormDisplay
          formLink={currentFormLink}
          onFormLoading={onFormLoading}
          formData={currentForm}
          onSubmit={onFormSubmit}
          onCancel={onFormCancel}
        />
      )}

      {/* Video Link Buttons - UPDATED FOR TRUE FULLSCREEN */}
      {activeLinks.length > 0 && (
        <>
          {activeLinks.map((link) => {
            const imageUrl = getImageUrl(link);
            const dimensions = getScaledImageDimensions(link);
            const position = getImagePosition(link);

            return imageUrl ? (
              <div
                key={link.id}
                className="absolute z-10 cursor-pointer transition-transform duration-200 group"
                style={{
                  ...position,
                }}
                onClick={() => onVideoLinkClick(link)}
                title={
                  link.link_type === "url"
                    ? `Open link: ${link.url}`
                    : link.link_type === "video"
                    ? `Go to video: ${link.destination_video_id}`
                    : `Fill form: ${link.label}`
                }
              >
                <div className="relative">
                  {/* Normal image */}
                  {link.normal_state_image && (
                    <img
                      src={link.normal_state_image}
                      alt={link.label}
                      style={{
                        width: `${dimensions.width}px`,
                        height: `${dimensions.height}px`,
                      }}
                      className={`object-contain rounded block ${
                        link.hover_state_image ? "group-hover:hidden" : ""
                      }`}
                      draggable={false}
                    />
                  )}

                  {/* Hover image */}
                  {link.hover_state_image && (
                    <img
                      src={link.hover_state_image}
                      alt={link.label}
                      style={{
                        width: `${dimensions.width}px`,
                        height: `${dimensions.height}px`,
                      }}
                      className="object-contain rounded hidden group-hover:block"
                      draggable={false}
                    />
                  )}
                </div>
              </div>
            ) : null;
          })}
        </>
      )}

      {children}
    </div>
  );
}
