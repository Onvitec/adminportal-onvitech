"use client";
import { PlayButton } from "@/components/icons";
import { SolutionCard } from "@/components/SolutionCard";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { Solution, SolutionCategory, VideoLink } from "@/lib/types";
import React, { useEffect, useState, useRef } from "react";
import { ExternalLink, Play, ChevronLeft } from "lucide-react";

type Video = {
  id: string;
  title: string;
  url: string;
  module_id: string;
  order_index: number;
  duration?: number;
  links: VideoLink[];
};

type Module = {
  id: string;
  title: string;
  order_index: number;
  videos: Video[];
};

function LinearSessionEmbed({ sessionId }: { sessionId: string }) {
  const [modules, setModules] = useState<Module[]>([]);
  const [currentVideo, setCurrentVideo] = useState<Video | null>(null);
  const [watchedVideos, setWatchedVideos] = useState<Set<string>>(new Set());
  const [videoProgress, setVideoProgress] = useState<{ [key: string]: number }>(
    {}
  );
  const [solutions, setSolutions] = useState<Solution[]>([]);
  const [solutionCategories, setSolutionCategories] = useState<
    SolutionCategory[]
  >([]);
  const [allVideosCompleted, setAllVideosCompleted] = useState(false);
  const [sessionName, setSessionName] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoHistory, setVideoHistory] = useState<Video[]>([]);
  const [isBackNavigation, setIsBackNavigation] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);

  // Enhanced video link state management from InteractiveSessionEmbed
  const [videoLinks, setVideoLinks] = useState<Record<string, VideoLink[]>>({});
  const [activeLinks, setActiveLinks] = useState<VideoLink[]>([]);
  const [showControls, setShowControls] = useState(true);
  const [mouseActive, setMouseActive] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const mouseTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchSessionData();

    return () => {
      if (mouseTimeoutRef.current) {
        clearTimeout(mouseTimeoutRef.current);
      }
    };
  }, [sessionId]);

  const fetchSessionData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Get session name
      const { data: sessionData } = await supabase
        .from("sessions")
        .select("title")
        .eq("id", sessionId)
        .single();
      if (sessionData) setSessionName(sessionData.title);

      // Fetch modules
      const { data: modulesData, error: modulesError } = await supabase
        .from("modules")
        .select("*")
        .eq("session_id", sessionId)
        .order("order_index", { ascending: true });

      if (modulesError) throw modulesError;

      const modulesWithVideos = await Promise.all(
        (modulesData || []).map(async (module) => {
          const { data: videosData, error: videosError } = await supabase
            .from("videos")
            .select("*")
            .eq("module_id", module.id)
            .order("order_index", { ascending: true });

          if (videosError) throw videosError;

          return {
            ...module,
            videos: videosData || [],
          };
        })
      );

      // Enhanced video links fetching logic from InteractiveSessionEmbed
      const allVideos = modulesWithVideos.flatMap((m) => m.videos);
      const { data: linksData, error: linksError } = await supabase
        .from("video_links")
        .select("*")
        .in(
          "video_id",
          allVideos.map((v) => v.id)
        );

      if (linksError) throw linksError;

      // Process links and fetch destination videos for video-type links
      const linksWithDestinations = await Promise.all(
        (linksData || []).map(async (link): Promise<VideoLink> => {
          if (link.link_type === "video" && link.destination_video_id) {
            // Find the destination video from our already loaded videos
            const destinationVideo = allVideos.find(
              (v) => v.id === link.destination_video_id
            );

            return {
              ...link,
              destination_video: destinationVideo,
            };
          }

          return link;
        })
      );

      console.log("Fetched video links:", linksWithDestinations);

      // Group links by video_id
      const groupedLinks: Record<string, VideoLink[]> = {};
      linksWithDestinations.forEach((link) => {
        if (!groupedLinks[link.video_id!]) groupedLinks[link.video_id!] = [];
        groupedLinks[link.video_id!].push(link);
      });

      setVideoLinks(groupedLinks);

      // Fetch solutions
      const { data: solutionsData, error: solutionsError } = await supabase
        .from("solutions")
        .select("*")
        .eq("session_id", sessionId);
      if (solutionsError) throw solutionsError;

      const { data: categoriesData, error: categoriesError } = await supabase
        .from("solution_categories")
        .select("*");
      if (categoriesError) throw categoriesError;

      setModules(modulesWithVideos);
      setSolutions(solutionsData || []);
      setSolutionCategories(categoriesData || []);

      if (
        modulesWithVideos.length > 0 &&
        modulesWithVideos[0].videos.length > 0
      ) {
        setCurrentVideo(modulesWithVideos[0].videos[0]);
        setVideoHistory([]);
        setIsBackNavigation(false);
      }
    } catch (error) {
      console.error("Error fetching session data:", error);
      setError("Failed to load session data. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Enhanced video link tracking from InteractiveSessionEmbed
  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl) return;

    const handleTimeUpdate = () => {
      if (!currentVideo) return;
      const links = videoLinks[currentVideo.id] || [];
      const currentTime = Math.floor(videoEl.currentTime);
      setCurrentTime(currentTime);

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

  // Find video by ID across all modules
  const findVideoById = (videoId: string): Video | null => {
    for (const module of modules) {
      const video = module.videos.find((v) => v.id === videoId);
      if (video) return video;
    }
    return null;
  };

  // Enhanced video link click handler from InteractiveSessionEmbed
  const handleVideoLinkClick = (link: VideoLink) => {
    if (link.link_type === "url" && link.url) {
      // Open external URL in new tab
      window.open(link.url, "_blank", "noopener,noreferrer");
    } else if (link.link_type === "video" && link.destination_video) {
      // Navigate to destination video
      if (currentVideo) {
        setVideoHistory((prev) => [...prev, currentVideo]);
      }
      setCurrentVideo(link.destination_video as any); // todo: might cause error
      setIsBackNavigation(false);

      // Reset video state
      if (videoRef.current) {
        videoRef.current.pause();
        setIsPlaying(false);
        setShowControls(true);
      }
    }
  };

  // Mouse interaction handlers from InteractiveSessionEmbed
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

  const handleVideoEnd = (videoId: string) => {
    const newWatched = new Set(watchedVideos);
    newWatched.add(videoId);
    setWatchedVideos(newWatched);
    setIsPlaying(false);
    setShowControls(true);

    const totalVideos = modules.reduce(
      (count, module) => count + module.videos.length,
      0
    );

    if (newWatched.size === totalVideos) {
      setAllVideosCompleted(true);
      setCurrentVideo(null);
      return;
    }

    let nextVideo: Video | null = null;
    let foundCurrent = false;

    for (const module of modules) {
      for (const video of module.videos) {
        if (foundCurrent) {
          nextVideo = video;
          break;
        }
        if (video.id === videoId) {
          foundCurrent = true;
        }
      }
      if (nextVideo) break;
    }

    if (nextVideo) {
      if (isBackNavigation) {
        setVideoHistory([]);
        setIsBackNavigation(false);
      } else {
        if (currentVideo) {
          setVideoHistory((prev) => [...prev, currentVideo]);
        }
      }
      setCurrentVideo(nextVideo);

      // Auto-play the next video after state updates
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.play();
          setIsPlaying(true);
          setMouseActive(true);
          resetMouseTimeout();
        }
      }, 100); // small delay to let DOM update
    }
  };

  const handleVideoProgress = (videoId: string, progress: number) => {
    setVideoProgress((prev) => ({
      ...prev,
      [videoId]: progress,
    }));
  };

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

  const goToPreviousVideo = () => {
    if (videoHistory.length === 0) return;
    const previousVideo = videoHistory[videoHistory.length - 1];
    setVideoHistory((prev) => prev.slice(0, -1));
    setCurrentVideo(previousVideo);
    setIsBackNavigation(true);

    // Reset video state
    if (videoRef.current) {
      videoRef.current.pause();
      setIsPlaying(false);
      setShowControls(true);
    }
  };

  // Navigate to first video function from InteractiveSessionEmbed
  const goToFirstVideo = () => {
    if (modules.length > 0 && modules[0].videos.length > 0) {
      setCurrentVideo(modules[0].videos[0]);
      setVideoHistory([]);
      setIsBackNavigation(false);
      if (videoRef.current) {
        videoRef.current.pause();
        setIsPlaying(false);
        setShowControls(true);
      }
    }
  };

  const isFirstVideo = () => videoHistory.length === 0;

  if (isLoading) {
    return null;
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium mb-2 text-red-500">{error}</h3>
        <Button onClick={fetchSessionData} variant="outline" className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  if (modules.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium mb-2">No content available</h3>
      </div>
    );
  }

  const currentVideoIndex = modules
    .flatMap((m) => m.videos)
    .findIndex((v) => v.id === currentVideo?.id);
  const isNotFirstVideoInSession = currentVideoIndex > 0;

  return (
    <div className="overflow-y-scroll max-h-screen">
      {/* Enhanced Video Player with Interactive Controls */}
      {!allVideosCompleted && currentVideo && (
        <div className="mb-4">
          <div
            className="relative bg-black rounded-xl overflow-hidden"
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
            {/* Back to Previous Video Button */}
            {!isFirstVideo() && !isPlaying&& (
              <div
                className={`absolute left-4 top-4 z-20 bg-white/30 backdrop-blur-sm rounded-lg p-2 shadow-lg border border-white/60 cursor-pointer hover:bg-white/40 transition-all duration-200 ${
                  showControls ? "opacity-100" : "opacity-0 pointer-events-none"
                }`}
                onClick={goToPreviousVideo}
              >
                <ChevronLeft className="w-6 h-6 text-white font-bold" />
              </div>
            )}

            <video
              ref={videoRef}
              key={currentVideo.id}
              src={currentVideo.url}
              className="w-full h-full object-contain rounded-xl cursor-pointer"
              controls={false}
              onClick={togglePlayPause}
              onEnded={() => handleVideoEnd(currentVideo.id)}
              onTimeUpdate={(e) => {
                const video = e.target as HTMLVideoElement;
                const progress =
                  video.duration > 0
                    ? (video.currentTime / video.duration) * 100
                    : 0;
                setCurrentTime(video.currentTime);
                handleVideoProgress(currentVideo.id, progress);
              }}
              onPlay={() => setIsPlaying(true)}
              onPause={() => {
                setIsPlaying(false);
                setShowControls(true);
              }}
            />

            {/* Enhanced Play/Pause Button Overlay */}
            {(!isPlaying) && (
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
                    onClick={() => handleVideoLinkClick(link)}
                    className={`absolute px-3 py-2 rounded-lg shadow-lg text-sm font-medium transition-colors ${
                      link.link_type === "url"
                        ? "bg-blue-600 text-white hover:bg-blue-700"
                        : "bg-green-600 text-white hover:bg-green-700"
                    }`}
                    style={{
                      left: `${link.position_x}%`,
                      top: `${link.position_y}%`,
                      transform: "translate(-50%, -50%)", // centers button
                    }}
                    title={
                      link.link_type === "url"
                        ? `Open link: ${link.url}`
                        : `Go to video: ${
                            link.destination_video?.title || "Unknown"
                          }`
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
          </div>
        </div>
      )}

      {allVideosCompleted && (
        <div className="flex flex-col items-center justify-center text-center py-20">
          <h2 className="text-2xl font-bold mb-4">
            You have finished the session "{sessionName}"
          </h2>
          <p className="text-gray-600 mb-6">
            Great job! Here are the solutions for this session:
          </p>
          <div className="bg-gray-50 p-4 rounded-lg w-full max-w-2xl">
            {solutions.length > 0 ? (
              <div className="grid grid-cols-1 gap-4">
                {solutions.map((solution) => (
                  <SolutionCard
                    key={solution.id}
                    solution={solution}
                    readOnly={true}
                  />
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No solutions added yet.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default LinearSessionEmbed;
