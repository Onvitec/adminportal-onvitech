"use client";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { Solution, SolutionCategory, VideoLink, VideoType } from "@/lib/types";
import React, { useEffect, useState } from "react";
import { SolutionDisplay } from "../SolutionDisplay";
import { CommonVideoPlayer } from "../CommonVideoPlaye";

type Video = VideoType & {
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
  const [videoHistory, setVideoHistory] = useState<Video[]>([]);
  const [isBackNavigation, setIsBackNavigation] = useState(false);
  const [videoLinks, setVideoLinks] = useState<Record<string, VideoLink[]>>({});

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

      // Enhanced video links fetching logic
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

  // Enhanced video link click handler
  const handleVideoLinkClick = (link: VideoLink) => {
    if (link.link_type === "url" && link.url) {
      // Open external URL in new tab
      window.open(link.url, "_blank", "noopener,noreferrer");
    } else if (link.link_type === "video" && link.destination_video) {
      // Navigate to destination video
      if (currentVideo) {
        setVideoHistory((prev) => [...prev, currentVideo]);
      }
      setCurrentVideo(link.destination_video as Video);
      setIsBackNavigation(false);
    }
  };

  const handleVideoEnd = () => {
    if (!currentVideo) return;
    
    const newWatched = new Set(watchedVideos);
    newWatched.add(currentVideo.id);
    setWatchedVideos(newWatched);

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
        if (video.id === currentVideo.id) {
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

  const goToPreviousVideo = () => {
    if (videoHistory.length === 0) return;
    const previousVideo = videoHistory[videoHistory.length - 1];
    setVideoHistory((prev) => prev.slice(0, -1));
    setCurrentVideo(previousVideo);
    setIsBackNavigation(true);
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

  return (
    <div className="overflow-y-scroll max-h-screen">
      {/* Enhanced Video Player with Interactive Controls */}
      {!allVideosCompleted && currentVideo && (
        <div className="mb-4">
          <CommonVideoPlayer
            currentVideo={currentVideo}
            videoLinks={videoLinks}
            onVideoEnd={handleVideoEnd}
            onVideoLinkClick={handleVideoLinkClick}
            onBackNavigation={goToPreviousVideo}
            showBackButton={!isFirstVideo()}
          />
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
          <div className="w-full max-w-3xl">
            {solutions.length > 0 ? (
              <div className="grid grid-cols-1 gap-6">
                {solutions.map((solution) => (
                  <SolutionDisplay key={solution.id} solution={solution} />
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