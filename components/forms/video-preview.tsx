"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { VideoLink } from "@/lib/types";

interface VideoPreviewProps {
  videoUrl: string;
  videoLinks: VideoLink[];
  onLinkClick?: (link: VideoLink) => void;
  hoveredLinkId?: string | null;
  setHoveredLinkId?: (id: string | null) => void;
  currentTime?: number;
  isPlaying?: boolean;
}

export function VideoPreview({
  videoUrl,
  videoLinks,
  onLinkClick,
  hoveredLinkId,
  setHoveredLinkId,
  currentTime = 0,
  isPlaying = false,
}: VideoPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [videoRect, setVideoRect] = useState<{
    width: number;
    height: number;
    left: number;
    top: number;
    scale: number;
  } | null>(null);

  // Match the EXACT same calculation as CommonVideoPlayer
  const calculateVideoRect = useCallback(() => {
    const video = videoRef.current;
    const container = containerRef.current;
    if (!video || !container) return null;

    const containerRect = container.getBoundingClientRect();
    
    // EXACT SAME LOGIC as CommonVideoPlayer - true fullscreen
    const rect = {
      width: containerRect.width,
      height: containerRect.height,
      left: 0,
      top: 0,
      scale: containerRect.width / (video.videoWidth || 1920) // Fallback to common aspect ratio
    };

    console.log("Preview VideoRect:", {
      container: { width: containerRect.width, height: containerRect.height },
      video: { width: video.videoWidth, height: video.videoHeight },
      calculated: rect
    });

    setVideoRect(rect);
    return rect;
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    const container = containerRef.current;
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

    // Initial calculation
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
  }, [calculateVideoRect]);

  // Get active links based on current time (same logic as CommonVideoPlayer)
  const activeLinks = videoLinks.filter((link) => {
    const startTime = link.timestamp_seconds;
    const durationSeconds = (link.duration_ms || 3000) / 1000;
    const endTime = startTime + durationSeconds;
    return currentTime >= startTime && currentTime <= endTime;
  });

  // EXACT SAME positioning logic as CommonVideoPlayer
  const getImagePosition = useCallback(
    (link: VideoLink) => {
      if (!videoRect) {
        return { left: `${link.position_x}%`, top: `${link.position_y}%` };
      }

      const left = (link.position_x / 100) * videoRect.width;
      const top = (link.position_y / 100) * videoRect.height;

      return { left: `${left}px`, top: `${top}px` };
    },
    [videoRect]
  );

  // EXACT SAME scaling logic as CommonVideoPlayer
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
      
      const scaledWidth = baseWidth * videoRect.scale;
      const scaledHeight = baseHeight * videoRect.scale;

      if (hoveredLinkId === link.id && (link.hover_image_width || link.hover_image_height)) {
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

  const getImageUrl = (link: VideoLink) => {
    if (hoveredLinkId === link.id && link.hover_state_image) {
      return link.hover_state_image;
    }
    return link.normal_state_image;
  };

  // Sync video time with parent component
  useEffect(() => {
    if (videoRef.current && !isPlaying) {
      videoRef.current.currentTime = currentTime;
    }
  }, [currentTime, isPlaying]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full bg-black rounded-lg overflow-hidden"
    >
      {/* Preview video - EXACT SAME styling as CommonVideoPlayer */}
      <video
        ref={videoRef}
        src={videoUrl}
        className="w-full h-full object-cover"
        controls={true}
        muted
        playsInline
        onLoadStart={() => setTimeout(() => calculateVideoRect(), 100)}
        onCanPlay={() => setTimeout(() => calculateVideoRect(), 100)}
      />

      {/* Debug overlay for preview */}
      <div className="absolute top-2 left-2 bg-black bg-opacity-75 text-white p-2 text-xs rounded z-50">
        <div>Preview Size: {Math.round(videoRect?.width || 0)}×{Math.round(videoRect?.height || 0)}</div>
        <div>Scale: {videoRect?.scale?.toFixed(2)}</div>
        <div>Active Links: {activeLinks.length}</div>
        <div>Time: {currentTime.toFixed(1)}s</div>
      </div>

      {/* Active links - EXACT SAME rendering as CommonVideoPlayer */}
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
              transform: 'translate(-50%, -50%)'
            }}
            onClick={() => onLinkClick?.(link)}
            onMouseEnter={() => setHoveredLinkId?.(link.id)}
            onMouseLeave={() => setHoveredLinkId?.(null)}
            title={link.label}
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

      {/* Time indicator for preview */}
      {!isPlaying && (
        <div className="absolute bottom-2 left-2 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-xs">
          {currentTime.toFixed(1)}s
        </div>
      )}
    </div>
  );
}