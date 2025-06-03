"use client";
import { SolutionCard } from "@/components/SolutionCard";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { Solution, SolutionCategory } from "@/lib/types";
import { ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import React, { useEffect, useState } from "react";

type Props = {};
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

function LinearSessionEmbed({ sessionId }: { sessionId: string }) {
  const [modules, setModules] = useState<Module[]>([]);
  const [currentVideo, setCurrentVideo] = useState<Video | null>(null);
  const [watchedVideos, setWatchedVideos] = useState<Set<string>>(new Set());
  const [isSolutionCollapsed, setIsSolutionCollapsed] = useState(true);
  const [videoProgress, setVideoProgress] = useState<{ [key: string]: number }>(
    {}
  );
  const [solutions, setSolutions] = useState<Solution[]>([]);
  const [solutionCategories, setSolutionCategories] = useState<
    SolutionCategory[]
  >([]);
  const [allVideosCompleted, setAllVideosCompleted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSessionData();
  }, [sessionId]);

  const fetchSessionData = async () => {
    setIsLoading(true);
    setError(null);
    try {
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
      }
    } catch (error) {
      console.error("Error fetching session data:", error);
      setError("Failed to load session data. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVideoEnd = (videoId: string) => {
    const newWatched = new Set(watchedVideos);
    newWatched.add(videoId);
    setWatchedVideos(newWatched);

    const totalVideos = modules.reduce(
      (count, module) => count + module.videos.length,
      0
    );
    if (newWatched.size === totalVideos) {
      setAllVideosCompleted(true);
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
      setCurrentVideo(nextVideo);
    }
  };

  const handleVideoProgress = (videoId: string, progress: number) => {
    setVideoProgress((prev) => ({
      ...prev,
      [videoId]: progress,
    }));
  };

  const isVideoUnlocked = (video: Video) => {
    if (
      modules.length > 0 &&
      modules[0].videos.length > 0 &&
      modules[0].videos[0].id === video.id
    ) {
      return true;
    }

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

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <p className="text-lg font-medium">Loading session content...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium mb-2 text-red-500">{error}</h3>
        <Button
          onClick={fetchSessionData}
          variant="outline"
          className="mt-4"
        >
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

  return (
    <div className="overflow-y-scroll max-h-screen">
      {/* Current Video Player */}
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

      {/* Solutions Section */}
      <div className="border rounded-lg overflow-hidden mt-6">
        <div className="flex items-center justify-between py-4 px-4 bg-white">
          <h2 className="text-xl font-bold">Solution Type</h2>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setIsSolutionCollapsed(!isSolutionCollapsed)}
          >
            {isSolutionCollapsed ? (
              <ChevronUp className="h-5 w-5" />
            ) : (
              <ChevronDown className="h-5 w-5" />
            )}
          </Button>
        </div>

        {isSolutionCollapsed && (
          <div className="bg-gray-50 py-4 border-t">
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
              <p className="text-sm text-gray-500 text-center py-4">
                No solutions added
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default LinearSessionEmbed;