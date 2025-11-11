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
import { Textarea } from "@/components/ui/textarea";
import { motion, AnimatePresence } from "framer-motion";

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
  sessionShowPlayButton?: boolean;
  onVideoRestart?: () => void;
  hasQuestions?: boolean; // New prop to indicate if there are questions
  addClickToJourney?: any;
  navigationButton?: {
    image_url: string;
    video_url: string;
    video_title: string;
  } | null;
  onNavigationButtonClick?: () => void;
  isNavigationVideo?: boolean;
}

// Form Display Component
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
    // Convert null/undefined to empty string
    const sanitizedValue = value === null || value === undefined ? "" : value;
    setFormValues((prev) => ({ ...prev, [elementId]: sanitizedValue }));
  };

  const handleNumberChange = (elementId: string, value: string) => {
    // Remove any negative signs, commas, or other non-numeric characters except decimal point
    const cleanValue = value.replace(/[^-0-9.]/g, "");

    // Remove negative signs completely
    const positiveValue = cleanValue.replace(/-/g, "");

    // If empty string, set as empty, otherwise use the positive number
    const finalValue = positiveValue === "" ? "" : positiveValue;

    setFormValues((prev) => ({ ...prev, [elementId]: finalValue }));
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

    // keep raw values (ids/keys)
    const rawValues = { ...formValues };

    // build label-based values
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

    // final payload matches FormSolutionData + values
    const finalPayload = {
      title: formData.title,
      email: formData.email,
      description: formData.description,
      elements: formData.elements, // keep original structure if needed
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
      case "number":
        return (
          <Input
            id={element.id}
            type="text" // Use text type to have full control
            inputMode="decimal" // Show numeric keyboard on mobile
            placeholder={element.placeholder}
            value={formValues[element.id] || ""}
            onChange={(e) => handleNumberChange(element.id, e.target.value)}
            onWheel={(e) => e.currentTarget.blur()} // Prevent scroll wheel changes
            onKeyDown={(e) => {
              // Prevent negative sign, 'e' (scientific notation), and comma
              if (["-", "e", "E", ","].includes(e.key)) {
                e.preventDefault();
              }
            }}
            className="w-full bg-white/80 backdrop-blur-sm"
          />
        );
      case "textarea":
        return (
          <Textarea
            id={element.id}
            placeholder={element.placeholder}
            rows={8}
            value={formValues[element.id] || ""}
            onChange={(e) => handleInputChange(element.id, e.target.value)}
            className="w-full bg-white/80 backdrop-blur-sm"
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
      <div className="w-[90%] max-w-2xl overflow-y-auto h-[90%] bg-white/30 backdrop-blur-sm rounded-lg p-6 shadow-lg border border-white/60 flex flex-col hide-scrollbar">
        {/* Header */}
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
          {/* Scrollable fields */}
          <div className="flex-1 pr-2 space-y-4 hide-scrollbar">
            {formData.elements.map((element) => (
              <div key={element.id} className="space-y-2">
                <Label htmlFor={element.id} className="text-white">
                  {element.label}
                </Label>
                {renderFormElement(element)}
              </div>
            ))}
          </div>

          {/* Buttons (outside scroll area) */}
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
  sessionShowPlayButton = true,
  addClickToJourney,
  navigationButton,
  isNavigationVideo = false,

  onNavigationButtonClick,
}: CommonVideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [mouseActive, setMouseActive] = useState(false);
  const [activeLinks, setActiveLinks] = useState<VideoLink[]>([]);
  const [showFreezeControls, setShowFreezeControls] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const mouseTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isAtLastFrame, setIsAtLastFrame] = useState(false);

  const [videoRect, setVideoRect] = useState<{
    width: number;
    height: number;
    left: number;
    top: number;
  } | null>(null);

  // SIMPLIFIED: Sync video events with state
  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl) return;

    const handlePlay = () => {
      setIsPlaying(true);
      setShowFreezeControls(false);
      setIsAtLastFrame(false);
    };

    const handlePause = () => {
      setIsPlaying(false);
      setShowControls(true);
    };

    // Set up event listeners
    videoEl.addEventListener("play", handlePlay);
    videoEl.addEventListener("pause", handlePause);

    // Check initial state after a short delay to account for auto-play
    const checkInitialState = () => {
      if (!videoEl.paused) {
        setIsPlaying(true);
      }
    };

    setTimeout(checkInitialState, 100);

    return () => {
      videoEl.removeEventListener("play", handlePlay);
      videoEl.removeEventListener("pause", handlePause);
    };
  }, []);

  // Handle external pause requests (like forms)
  useEffect(() => {
    if (videoRef.current) {
      if (isPaused) {
        videoRef.current.pause();
      } else if (isPlaying && !isPaused) {
        // Only play if we're supposed to be playing and not paused externally
        videoRef.current.play().catch((error) => {
          console.log("Play failed:", error);
        });
      }
    }
  }, [isPaused, isPlaying]);

  // Reset state when video changes
  useEffect(() => {
    setShowFreezeControls(false);
    setIsAtLastFrame(false);
    // Don't reset isPlaying here - let the video element control it
  }, [currentVideo]);

  // Enhanced video rect calculation with better timing
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
      window.removeEventListener("resize", calculateAndSetRect);
    };
  }, [currentVideo]);

  // Track timestamps for video links
  // useEffect(() => {
  //   const videoEl = videoRef.current;
  //   if (!videoEl || !currentVideo) return;

  //   const handleTimeUpdate = () => {
  //     const links = videoLinks[currentVideo.id] || [];
  //     const currentTime = videoEl.currentTime;

  //     const visibleLinks = links.filter((link) => {
  //       const startTime = link.timestamp_seconds;
  //       const durationSeconds = (link.duration_ms || 3000) / 1000;
  //       const endTime = startTime + durationSeconds;

  //       return currentTime >= startTime && currentTime <= endTime;
  //     });

  //     setActiveLinks((prev) => {
  //       if (
  //         prev.length !== visibleLinks.length ||
  //         !prev.every((link, i) => link.id === visibleLinks[i]?.id)
  //       ) {
  //         return visibleLinks;
  //       }
  //       return prev;
  //     });
  //   };

  //   videoEl.addEventListener("timeupdate", handleTimeUpdate);
  //   return () => {
  //     videoEl.removeEventListener("timeupdate", handleTimeUpdate);
  //   };
  // }, [currentVideo, videoLinks]);

  // Track timestamps for video links
  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl || !currentVideo) return;

    const handleTimeUpdate = () => {
      const links = videoLinks[currentVideo.id] || [];
      const currentTime = videoEl.currentTime;
      const videoDuration = videoEl.duration;

      const visibleLinks = links.filter((link) => {
        const startTime = link.timestamp_seconds;
        const durationSeconds = (link.duration_ms || 3000) / 1000;
        const endTime = startTime + durationSeconds;

        // If video has ended or is frozen, keep links that should still be visible
        if (videoEl.ended || showFreezeControls) {
          // Show links that started before end AND whose duration extends to/past the end
          // Use 1 second tolerance to account for timing precision
          const tolerance = 1.0; // 1 second tolerance
          const extendsToEnd =
            currentTime >= startTime &&
            (endTime >= videoDuration - tolerance ||
              currentTime <= endTime + tolerance);
          return extendsToEnd;
        }

        // Normal behavior: show links within their time range
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
    videoEl.addEventListener("ended", handleTimeUpdate);

    return () => {
      videoEl.removeEventListener("timeupdate", handleTimeUpdate);
      videoEl.removeEventListener("ended", handleTimeUpdate);
    };
  }, [currentVideo, videoLinks, showFreezeControls]);

  // PERFECT Video rect calculation
  const calculateVideoRect = useCallback(() => {
    const video = videoRef.current;
    const container = videoContainerRef.current;
    if (!video || !container) return null;

    const containerRect = container.getBoundingClientRect();
    const videoAspect = video.videoWidth / video.videoHeight;
    const containerAspect = containerRect.width / containerRect.height;

    let actualVideoWidth, actualVideoHeight, offsetLeft, offsetTop;

    if (containerAspect > videoAspect) {
      actualVideoHeight = containerRect.height;
      actualVideoWidth = actualVideoHeight * videoAspect;
      offsetLeft = (containerRect.width - actualVideoWidth) / 2;
      offsetTop = 0;
    } else {
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

  // Navigation button position - always top right
  const getNavigationButtonPosition = useCallback(() => {
    if (!videoRect) {
      return { right: "20px", top: "20px" };
    }

    const right = 20;
    const top = 20;

    return { right: `${right}px`, top: `${top}px` };
  }, [videoRect]);

  // CRITICAL: Check if we should show navigation button
  const shouldShowNavigationButton = useCallback(() => {
    return (
      navigationButton &&
      onNavigationButtonClick &&
      !currentForm &&
      !showFreezeControls &&
      !isNavigationVideo
    );
  }, [
    navigationButton,
    onNavigationButtonClick,
    currentForm,
    showFreezeControls,
    isNavigationVideo,
  ]);

  const togglePlayPause = () => {
    if (videoRef.current && currentVideo) {
      const isRestartingFromEnd = videoRef.current.ended || showFreezeControls;

      if (isPlaying) {
        videoRef.current.pause();
        // Don't manually set isPlaying - let the 'pause' event handle it
      } else {
        videoRef.current.play().catch((error) => {
          console.log("Play failed:", error);
        });
        // Don't manually set isPlaying - let the 'play' event handle it
        setMouseActive(true);
        resetMouseTimeout();
        setShowFreezeControls(false);

        if (isRestartingFromEnd && addClickToJourney) {
          addClickToJourney(currentVideo, {
            id: `restart-${currentVideo.id}-${Date.now()}`,
            label: "Watch Again",
            type: "restart",
          });
        }
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

  const getImageDimensions = (link: VideoLink) => {
    if (
      hoveredLinkId === link.id &&
      (link.hover_image_width || link.hover_image_height)
    ) {
      return {
        width: link.hover_image_width || 100,
        height: link.hover_image_height || 100,
      };
    }
    return {
      width: link.normal_image_width || 100,
      height: link.normal_image_height || 100,
    };
  };

  const getImagePosition = useCallback(
    (link: VideoLink) => {
      if (!videoRect) {
        return { left: `${link.position_x}%`, top: `${link.position_y}%` };
      }

      const left = videoRect.left + (link.position_x / 100) * videoRect.width;
      const top = videoRect.top + (link.position_y / 100) * videoRect.height;

      return { left: `${left}px`, top: `${top}px` };
    },
    [videoRect]
  );
  const handleVideoEnd = () => {
    const shouldFreeze =
      !hasQuestions && currentVideo?.freezeAtEnd && !isNavigationVideo;

    if (shouldFreeze) {
      setShowFreezeControls(true);

      // Recalculate active links for frozen state
      const videoEl = videoRef.current;
      if (videoEl && currentVideo) {
        const links = videoLinks[currentVideo.id] || [];
        const currentTime = videoEl.currentTime;
        const videoDuration = videoEl.duration;

        const frozenLinks = links.filter((link) => {
          const startTime = link.timestamp_seconds;
          const durationSeconds = (link.duration_ms || 3000) / 1000;
          const endTime = startTime + durationSeconds;

          // Use 1 second tolerance for timing precision
          const tolerance = 1.0;

          // Keep links that:
          // 1. Started before the end of video
          // 2. AND either extend to/past video end OR are still within timeframe
          return (
            currentTime >= startTime &&
            (endTime >= videoDuration - tolerance ||
              currentTime <= endTime + tolerance)
          );
        });

        setActiveLinks(frozenLinks);
      }
    } else {
      if (isNavigationVideo) {
        setIsAtLastFrame(true);
      } else {
        onVideoEnd();
      }
    }
  };
  const handleRestartVideo = () => {
    if (videoRef.current && currentVideo) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch((error) => {
        console.log("Restart play failed:", error);
      });
      setShowFreezeControls(false);
      setIsAtLastFrame(false);
      setMouseActive(true);
      resetMouseTimeout();

      if (addClickToJourney && (showFreezeControls || videoRef.current.ended)) {
        addClickToJourney(currentVideo, {
          id: `restart-${currentVideo.id}-${Date.now()}`,
          label: "Watch Again",
          type: "restart",
        });
      }
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
      className="relative flex-1 bg-black rounded-xl video-player-container"
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
        src={currentVideo.url}
        className="w-full h-auto max-h-[500px] object-contain rounded-xl cursor-pointer"
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

      {/* CRITICAL FIX: Only show navigation button when conditions are met */}
      {shouldShowNavigationButton() && (
        <div
          className="absolute z-30 cursor-pointer transition-transform duration-200"
          style={getNavigationButtonPosition()}
          onClick={onNavigationButtonClick}
        >
          <div className="relative">
            <img
              src={navigationButton!.image_url}
              alt="Navigation"
              className="w-16 h-16 object-contain rounded-lg transition-all"
              draggable={false}
            />
          </div>
        </div>
      )}

      {showBackButton && onBackNavigation && !isPlaying && (
        <div
          className={`absolute left-4 top-4 z-[999] bg-white/30 backdrop-blur-sm rounded-lg p-2 shadow-lg border border-white/60 cursor-pointer hover:bg-white/40 transition-all duration-200 hover:scale-110 ${
            showControls ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
          onClick={onBackNavigation}
        >
          <ChevronLeft className="w-10 h-10 text-white font-bold" />
        </div>
      )}

      {/* Freeze at end controls */}
      {/* {showFreezeControls && (
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
      )} */}
      {showFreezeControls && <div></div>}

      {!isPlaying && !isNavigationVideo && !showFreezeControls && (
        <div
          className={`absolute inset-0 flex items-center justify-center cursor-pointer transition-opacity duration-300 ${
            mouseActive || !isPlaying ? "opacity-100" : "opacity-0"
          }`}
          onClick={togglePlayPause}
        >
          <div
            className={`bg-white/30 ${
              !sessionShowPlayButton && "opacity-0"
            } backdrop-blur-sm rounded-full p-4 shadow-lg border border-white/60 flex items-center justify-center transform transition-all duration-300 hover:scale-110`}
          >
            {isPlaying ? (
              <div className="w-10 h-10 flex items-center justify-center">
                <div className="w-2 h-8 bg-white mx-1"></div>
                <div className="w-2 h-8 bg-white mx-1"></div>
              </div>
            ) : (
              <div className="">
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
              </div>
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

      {/* Enhanced Video Link Buttons */}
      {activeLinks.length > 0 && (
        <>
          <AnimatePresence>
            {activeLinks.map((link) => {
              const imageUrl = getImageUrl(link);
              const dimensions = getImageDimensions(link);
              const position = getImagePosition(link);

              return imageUrl ? (
                <motion.div
                  key={link.id}
                  className="absolute z-10 cursor-pointer transition-transform duration-200 group"
                  style={{ ...position }}
                  onClick={() => onVideoLinkClick(link)}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.35, ease: "easeInOut" }}
                >
                  <div className="relative">
                    {/* Normal image (always shown) */}
                    {link.normal_state_image && (
                      <img
                        src={link.normal_state_image}
                        alt={link.label}
                        style={{
                          width: `${dimensions.width}px`,
                          height: `${dimensions.height}px`,
                        }}
                        className={`object-cover rounded block ${
                          link.hover_state_image ? "group-hover:hidden" : ""
                        }`}
                        draggable={false}
                      />
                    )}

                    {/* Hover image (optional, only rendered if available) */}
                    {link.hover_state_image && (
                      <img
                        src={link.hover_state_image}
                        alt={link.label}
                        style={{
                          width: `${dimensions.width}px`,
                          height: `${dimensions.height}px`,
                        }}
                        className="object-cover rounded hidden group-hover:block"
                        draggable={false}
                      />
                    )}
                  </div>
                </motion.div>
              ) : null;
            })}
          </AnimatePresence>
        </>
      )}

      {children}
    </div>
  );
}
