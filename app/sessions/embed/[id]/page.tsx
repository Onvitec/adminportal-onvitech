"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Module = {
  id: string;
  title: string;
  order_index: number;
  videos: Video[];
};

type Video = {
  id: string;
  title: string;
  url: string;
  module_id: string;
  order_index: number;
  duration?: number;
};

export default function EmbedSessionPage() {
  const { id } = useParams();
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentVideo, setCurrentVideo] = useState<Video | null>(null);
  const [watchedVideos, setWatchedVideos] = useState<Set<string>>(new Set());
  const [videoProgress, setVideoProgress] = useState<{[key: string]: number}>({});

  useEffect(() => {
    if (id) {
      fetchSessionData();
    }
  }, [id]);

  const fetchSessionData = async () => {
    setLoading(true);
    try {
      // Fetch modules with their videos
      const { data: modulesData, error: modulesError } = await supabase
        .from("modules")
        .select("*")
        .eq("session_id", id)
        .order("order_index", { ascending: true });

      if (modulesError) throw modulesError;

      // For each module, fetch its videos
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

      setModules(modulesWithVideos);
      
      // Set the first video as current if available
      if (modulesWithVideos.length > 0 && modulesWithVideos[0].videos.length > 0) {
        setCurrentVideo(modulesWithVideos[0].videos[0]);
      }
    } catch (error) {
      console.error("Error fetching session data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleVideoEnd = (videoId: string) => {
    // Mark video as watched
    const newWatched = new Set(watchedVideos);
    newWatched.add(videoId);
    setWatchedVideos(newWatched);

    // Find and set the next video
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
      setCurrentVideo(nextVideo);
    }
  };

  const handleVideoProgress = (videoId: string, progress: number) => {
    setVideoProgress(prev => ({
      ...prev,
      [videoId]: progress
    }));
  };

  const isVideoUnlocked = (video: Video) => {
    // First video is always unlocked
    if (modules.length > 0 && modules[0].videos.length > 0 && 
        modules[0].videos[0].id === video.id) {
      return true;
    }

    // Check if previous video is watched
    let foundCurrent = false;
    for (const module of modules) {
      for (const v of module.videos) {
        if (v.id === video.id) {
          foundCurrent = true;
          break;
        }
        if (!watchedVideos.has(v.id)) {
          return false;
        }
      }
      if (foundCurrent) break;
    }

    return true;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <div className="animate-pulse text-muted-foreground">
          Loading session...
        </div>
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

  return (
    <div className="max-w-4xl mx-auto p-4">
      {/* Current Video Player (large) */}
      {currentVideo && (
        <div className="mb-8">
          <div className="aspect-w-16 aspect-h-9 bg-black rounded-lg overflow-hidden">
            <video
              key={currentVideo.id}
              src={currentVideo.url}
              controls
              className="w-full h-full object-contain"
              onEnded={() => handleVideoEnd(currentVideo.id)}
              onTimeUpdate={(e) => {
                const video = e.target as HTMLVideoElement;
                const progress = (video.currentTime / video.duration) * 100;
                handleVideoProgress(currentVideo.id, progress);
              }}
              autoPlay
            />
          </div>
          <h2 className="text-xl font-semibold mt-4">{currentVideo.title}</h2>
        </div>
      )}

      {/* Modules and Videos List */}
      <div className="space-y-6">
        {modules.map((module) => (
          <div key={module.id} className="border rounded-lg overflow-hidden">
            <div className="p-4 bg-gray-50">
              <h3 className="text-lg font-medium">{module.title}</h3>
            </div>

            <div className="bg-white p-4">
              <ul className="space-y-3">
                {module.videos.map((video) => {
                  const isUnlocked = isVideoUnlocked(video);
                  const progress = videoProgress[video.id] || 0;
                  const isCurrent = currentVideo?.id === video.id;

                  return (
                    <li
                      key={video.id}
                      className={`p-3 rounded-lg border ${
                        isCurrent
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200"
                      } ${
                        !isUnlocked
                          ? "opacity-60 cursor-not-allowed"
                          : "cursor-pointer hover:bg-gray-50"
                      }`}
                      onClick={() => {
                        if (isUnlocked) setCurrentVideo(video);
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0 w-16 h-16 bg-black rounded overflow-hidden">
                          {isUnlocked ? (
                            <video
                              src={video.url}
                              className="w-full h-full object-cover"
                              preload="metadata"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-200">
                              <svg
                                className="w-6 h-6 text-gray-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 15l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"
                                />
                              </svg>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium truncate">
                            {video.title}
                          </h4>
                          {progress > 0 && (
                            <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                              <div
                                className="bg-blue-600 h-1.5 rounded-full"
                                style={{ width: `${progress}%` }}
                              ></div>
                            </div>
                          )}
                        </div>
                        {isUnlocked ? (
                          <svg
                            className="w-5 h-5 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 5l7 7-7 7"
                            />
                          </svg>
                        ) : (
                          <svg
                            className="w-5 h-5 text-gray-400"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}