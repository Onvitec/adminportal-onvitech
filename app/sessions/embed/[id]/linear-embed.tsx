"use client";
import { Loader } from "@/components/Loader";
import { SolutionCard } from "@/components/SolutionCard";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { Solution, SolutionCategory } from "@/lib/types";
import { Loader2 } from "lucide-react";
import React, { useEffect, useState } from "react";

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
  const videoRef = React.useRef<HTMLVideoElement>(null);

  useEffect(() => {
    fetchSessionData();
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

  const handleVideoEnd = (videoId: string) => {
    const newWatched = new Set(watchedVideos);
    newWatched.add(videoId);
    setWatchedVideos(newWatched);
    setIsPlaying(false);

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
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const goToPreviousVideo = () => {
    if (videoHistory.length === 0) return;
    const previousVideo = videoHistory[videoHistory.length - 1];
    setVideoHistory((prev) => prev.slice(0, -1));
    setCurrentVideo(previousVideo);
    setIsPlaying(true);
    setIsBackNavigation(true);
  };

  const isFirstVideo = () => videoHistory.length === 0;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <div>
          <Loader size="md" />
        </div>
      </div>
    );
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

  return (
    <div className="overflow-y-scroll max-h-screen">
      {/* Video Player */}
      {!allVideosCompleted && currentVideo && (
        <div className="mb-4 relative">
          {!isFirstVideo() && (
            <div className="absolute top-4 left-4 z-10">
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full bg-black/30 text-white hover:bg-black/50"
                onClick={goToPreviousVideo}
              >
                <img src={"/icons/back.png"} />
              </Button>
            </div>
          )}

          <div
            className="aspect-w-16 aspect-h-9 bg-black relative"
            onClick={togglePlayPause}
          >
            <video
              controls
              ref={videoRef}
              key={currentVideo.id}
              src={currentVideo.url}
              className="w-full h-full object-contain"
              onEnded={() => handleVideoEnd(currentVideo.id)}
              onTimeUpdate={(e) => {
                const video = e.target as HTMLVideoElement;
                const progress = (video.currentTime / video.duration) * 100;
                handleVideoProgress(currentVideo.id, progress);
              }}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
            />

            {!isPlaying && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative w-16 h-16 flex items-center justify-center">
                  <div className="relative z-10 w-16 h-16 bg-white/70 rounded-full flex items-center justify-center border border-white">
                    <img src="/icons/play.png" className="w-6 h-6" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {allVideosCompleted && (
        <div className="flex flex-col items-center justify-center text-center py-20">
          <h2 className="text-2xl font-bold mb-4">
            🎉 You have finished the session "{sessionName}"
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