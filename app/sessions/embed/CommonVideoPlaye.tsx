"use client";

import { useEffect, useState, useRef } from "react";
import { VideoType, VideoLink, Solution } from "@/lib/types";
import { ChevronLeft } from "lucide-react";

interface CommonVideoPlayerProps {
  currentVideo: VideoType | null;
  videoLinks: Record<string, VideoLink[]>;
  onVideoEnd: () => void;
  onVideoLinkClick: (link: VideoLink) => void;
  onBackNavigation?: () => void;
  showBackButton?: boolean;
  children?: React.ReactNode;
}

export function CommonVideoPlayer({
  currentVideo,
  videoLinks,
  onVideoEnd,
  onVideoLinkClick,
  onBackNavigation,
  showBackButton = false,
  children
}: CommonVideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [mouseActive, setMouseActive] = useState(false);
  const [activeLinks, setActiveLinks] = useState<VideoLink[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const mouseTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Track timestamps for video links
  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl || !currentVideo) return;

    const handleTimeUpdate = () => {
      const links = videoLinks[currentVideo.id] || [];
      const currentTime = Math.floor(videoEl.currentTime);

      // Show link if currentTime matches within window (3 seconds)
      const visible = links.filter(
        (l) =>
          currentTime >= l.timestamp_seconds &&
          currentTime <= l.timestamp_seconds + 3
      );
      setActiveLinks(visible);
    };

    videoEl.addEventListener("timeupdate", handleTimeUpdate);
    return () => {
      videoEl.removeEventListener("timeupdate", handleTimeUpdate);
    };
  }, [currentVideo, videoLinks]);

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
        setShowControls(true);
      } else {
        videoRef.current.play();
        setIsPlaying(true);
        setMouseActive(true);
        resetMouseTimeout();
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
      className="relative flex-1 bg-black rounded-xl"
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
        src={currentVideo.url}
        className="w-full h-full object-contain rounded-xl cursor-pointer"
        controls={false}
        onClick={togglePlayPause}
        onEnded={onVideoEnd}
        onPlay={() => {
          setIsPlaying(true);
        }}
        onPause={() => {
          setIsPlaying(false);
          setShowControls(true);
        }}
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

      {!isPlaying && (
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

      {/* Enhanced Video Link Buttons - Support both URL and Video navigation */}
      {activeLinks.length > 0 && (
        <>
          {activeLinks.map((link) => (
            <button
              key={link.id}
              onClick={() => onVideoLinkClick(link)}
              className={`absolute px-3 py-2 rounded-lg shadow-lg text-sm font-medium transition-colors ${
                link.link_type === "url"
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "bg-green-600 text-white hover:bg-green-700"
              }`}
              style={{
                left: `${link.position_x}%`,
                top: `${link.position_y}%`,
                transform: "translate(-50%, -50%)",
              }}
              title={
                link.link_type === "url"
                  ? `Open link: ${link.url}`
                  : `Go to video: ${link.destination_video?.title || "Unknown"}`
              }
            >
              {link.label}
              {link.link_type === "video" && (
                <span className="ml-1 text-xs opacity-75">▶</span>
              )}
            </button>
          ))}
        </>
      )}

      {children}
    </div>
  );
}