"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { VideoType, Question, Answer, Solution, VideoLink } from "@/lib/types";
import { Answers, DestinationVedio, Questions } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Clock } from "lucide-react";
import { SolutionCard } from "@/components/SolutionCard";
import { Loader } from "@/components/Loader";

export function InteractiveSessionView({ sessionId }: { sessionId: string }) {
  const [videos, setVideos] = useState<VideoType[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [videoLinks, setVideoLinks] = useState<Record<string, VideoLink[]>>({});
  const [loading, setLoading] = useState(true);
  const [solutions, setSolutions] = useState<Solution[]>([]);
  const [solutionsExpanded, setSolutionsExpanded] = useState(true);
  const [activeLinks, setActiveLinks] = useState<Record<string, VideoLink[]>>(
    {}
  );
  const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({});
  const [hoveredLinkId, setHoveredLinkId] = useState<string | null>(null);
  const [currentTimes, setCurrentTimes] = useState<Record<string, number>>({});
  const [sessionData, setSessionData] = useState();
  const [destinationVideos, setDestinationVideos] = useState<
    Record<string, VideoType>
  >({});

  useEffect(() => {
    const fetchData = async () => {
      try {

        // Fetch videos
        const { data: videosData, error: videosError } = await supabase
          .from("videos")
          .select("*")
          .eq("session_id", sessionId)
          .order("order_index", { ascending: true });

        if (videosError) throw videosError;

        setVideos(videosData || []);

        // Create a mapping of destination videos
        const destVideos: Record<string, VideoType> = {};

        // First, get all destination video IDs
        const destinationVideoIds = new Set<string>();

        for (const video of videosData || []) {
          if (video.destination_video_id) {
            destinationVideoIds.add(video.destination_video_id);
          }
        }

        // Fetch destination videos
        if (destinationVideoIds.size > 0) {
          const { data: destVideosData, error: destVideosError } =
            await supabase
              .from("videos")
              .select("*")
              .in("id", Array.from(destinationVideoIds));

          if (!destVideosError && destVideosData) {
            destVideosData.forEach((video) => {
              destVideos[video.id] = video;
            });
          }
        }

        setDestinationVideos(destVideos);

        // Fetch video links for each video
        const linksByVideo: Record<string, VideoLink[]> = {};

        for (const video of videosData || []) {
          const { data: linksData, error: linksError } = await supabase
            .from("video_links")
            .select("*")
            .eq("video_id", video.id)
            .order("timestamp_seconds", { ascending: true });

          if (!linksError && linksData) {
            linksByVideo[video.id] = linksData.map((link) => ({
              id: link.id.toString(),
              timestamp_seconds: link.timestamp_seconds,
              label: link.label,
              url: link.url || undefined,
              video_id: link.video_id,
              destination_video_id: link.destination_video_id || undefined,
              link_type:
                (link.link_type as "url" | "video" | "form") ||
                (link.url ? "url" : "video"),
              position_x: link.position_x || 20,
              position_y: link.position_y || 20,
              normal_state_image: link.normal_state_image || undefined,
              hover_state_image: link.hover_state_image || undefined,
              normal_image_width: link.normal_image_width || 100,
              normal_image_height: link.normal_image_height || 100,
              hover_image_width: link.hover_image_width || 100,
              hover_image_height: link.hover_image_height || 100,
            }));
          }
        }

        setVideoLinks(linksByVideo);
        setActiveLinks({});

        // Fetch questions
        const { data: questionsData, error: questionsError } = await supabase
          .from("questions")
          .select("*")
          .in("video_id", videosData?.map((v) => v.id) || []);

        if (questionsError) throw questionsError;

        // Fetch answers for these questions
        const questionsWithAnswers = await Promise.all(
          (questionsData || []).map(async (question) => {
            const { data: answersData, error: answersError } = await supabase
              .from("answers")
              .select("*")
              .eq("question_id", question.id);

            if (answersError) throw answersError;

            // Get destination video details for each answer
            const answersWithDestinations = await Promise.all(
              (answersData || []).map(async (answer) => {
                if (!answer.destination_video_id) {
                  return { ...answer };
                }

                const { data: videoData, error: videoError } = await supabase
                  .from("videos")
                  .select("*")
                  .eq("id", answer.destination_video_id)
                  .single();

                if (videoError) {
                  console.error(
                    "Error fetching destination video:",
                    videoError
                  );
                  return { ...answer };
                }

                return {
                  ...answer,
                  destination_video: videoData,
                };
              })
            );

            return {
              ...question,
              answers: answersWithDestinations,
            };
          })
        );

        // Fetch solutions and categories
        const { data: solutionsData, error: solutionsError } = await supabase
          .from("solutions")
          .select("*")
          .eq("session_id", sessionId);

        if (solutionsError) throw solutionsError;

        const { data: categoriesData, error: categoriesError } = await supabase
          .from("solution_categories")
          .select("*");

        if (categoriesError) throw categoriesError;

        setSolutions(solutionsData || []);
        setQuestions(questionsWithAnswers);
      } catch (error) {
        console.error("Error fetching interactive session data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [sessionId]);

  // Setup timeupdate listeners for each video
  useEffect(() => {
    const timeUpdateHandlers: Record<string, (e: Event) => void> = {};

    Object.keys(videoRefs.current).forEach((videoId) => {
      const videoEl = videoRefs.current[videoId];
      if (!videoEl) return;

      const links = videoLinks[videoId] || [];

      timeUpdateHandlers[videoId] = (e: Event) => {
        const video = e.target as HTMLVideoElement;
        const currentTime = Math.floor(video.currentTime);

        // Update current time for this video
        setCurrentTimes((prev) => ({
          ...prev,
          [videoId]: currentTime,
        }));

        // Show links that are active within a 3-second window
        const visibleLinks = links.filter(
          (link) =>
            currentTime >= link.timestamp_seconds &&
            currentTime <= link.timestamp_seconds + 3
        );

        setActiveLinks((prev) => ({
          ...prev,
          [videoId]: visibleLinks,
        }));
      };

      videoEl.addEventListener("timeupdate", timeUpdateHandlers[videoId]);
    });

    return () => {
      Object.keys(timeUpdateHandlers).forEach((videoId) => {
        const videoEl = videoRefs.current[videoId];
        if (videoEl) {
          videoEl.removeEventListener(
            "timeupdate",
            timeUpdateHandlers[videoId]
          );
        }
      });
    };
  }, [videoLinks]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
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

  const seekToTime = (videoId: string, time: number) => {
    const videoEl = videoRefs.current[videoId];
    if (videoEl) {
      videoEl.currentTime = time;
      videoEl.play();
    }
  };

  if (loading) {
    return (
      <div className="p-6 text-center">
        <Loader size="md" />
      </div>
    );
  }

  return (
    <div className="space-y-8 py-6">
      {videos.map((video) => {
        const videoQuestions = questions.filter((q) => q.video_id === video.id);
        const links = videoLinks[video.id] || [];
        const currentActiveLinks = activeLinks[video.id] || [];
        const currentTime = currentTimes[video.id] || 0;
        const duration = video.duration || 0;
        const destinationVideo = video.destination_video_id
          ? destinationVideos[video.destination_video_id]
          : null;

        return (
          <div
            key={video.id}
            className="border rounded-lg overflow-hidden bg-white shadow-sm"
          >
            <div className="p-4 border-b bg-gray-50">
              <h3 className="text-lg font-medium">
                {video.title || "Video Name"}
              </h3>
            </div>

            <div className="flex flex-col md:flex-row">
              {/* Video on the left */}
              <div className="w-full md:w-2/5 p-4">
                <div className="relative">
                  <video
                    ref={(el: any) => (videoRefs.current[video.id] = el)}
                    src={video.url}
                    controls
                    className="w-full aspect-video object-cover rounded-lg bg-black"
                  />

                  {/* Display active video links as overlay images */}
                  {currentActiveLinks.map(
                    (link) =>
                      link.normal_state_image && (
                        <div
                          key={link.id}
                          className="absolute z-10 cursor-pointer transition-all duration-200 hover:opacity-90 hover:scale-105"
                          style={{
                            left: `${link.position_x}%`,
                            top: `${link.position_y}%`,
                            transform: "translate(-50%, -50%)",
                          }}
                          onMouseEnter={() => setHoveredLinkId(link.id)}
                          onMouseLeave={() => setHoveredLinkId(null)}
                          title={`${link.label} - ${formatTime(
                            link.timestamp_seconds
                          )}`}
                        >
                          <img
                            src={getImageUrl(link)}
                            alt={link.label}
                            style={{
                              width: `${getImageDimensions(link).width}px`,
                              height: `${getImageDimensions(link).height}px`,
                            }}
                            className="object-cover rounded shadow-lg border-2 border-yellow-400"
                            draggable={false}
                          />
                        </div>
                      )
                  )}
                </div>

                {/* Video Playback Behavior */}
                <div className="mt-4 p-3 bg-gray-50 rounded-md border">
                  <h4 className="text-sm font-medium mb-2">
                    Playback Behavior
                  </h4>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {video.freezeAtEnd ? (
                        <>
                          <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                          <span className="text-sm">Freeze at end</span>
                        </>
                      ) : (
                        <>
                          <div className="w-3 h-3 rounded-full bg-green-500"></div>
                          <span className="text-sm">Autoplay next video</span>
                        </>
                      )}
                    </div>

                    {!video.freezeAtEnd && destinationVideo ? (
                      <div className="text-sm text-gray-600">
                        Next:{" "}
                        <span className="font-medium">
                          {destinationVideo.title}
                        </span>
                      </div>
                    ) : (
                      <div> No video</div>
                    )}
                  </div>
                </div>

                {/* Timeline with markers below the video */}
                {duration > 0 && links.length > 0 && (
                  <div className="relative mt-4 bg-gray-100 rounded-md overflow-hidden p-2">
                    {/* Current time indicator */}
                    <div
                      className="absolute top-0 w-1 h-full bg-red-500 z-20"
                      style={{ left: `${(currentTime / duration) * 100}%` }}
                    />

                    <div className="flex justify-between items-center h-8 relative">
                      {links.map((link) => (
                        <div
                          key={link.id}
                          className="absolute flex flex-col items-center z-10"
                          style={{
                            left: `${
                              (link.timestamp_seconds / duration) * 100
                            }%`,
                            transform: "translateX(-50%)",
                          }}
                        >
                          {/* Image on timeline */}
                          {link.normal_state_image && (
                            <div className="mb-1">
                              <img
                                src={link.normal_state_image}
                                alt={link.label}
                                className="object-cover h-6 w-6 rounded border cursor-pointer hover:scale-110 transition-transform"
                                onClick={() =>
                                  seekToTime(video.id, link.timestamp_seconds)
                                }
                                title={`${link.label} - ${formatTime(
                                  link.timestamp_seconds
                                )}`}
                              />
                            </div>
                          )}
                          {/* Time indicator */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              seekToTime(video.id, link.timestamp_seconds);
                            }}
                            className={`text-xs px-2 py-1 rounded ${
                              link.link_type === "url"
                                ? "bg-blue-100 text-blue-800 hover:bg-blue-200"
                                : "bg-green-100 text-green-800 hover:bg-green-200"
                            } whitespace-nowrap`}
                            title={`${link.label} - ${formatTime(
                              link.timestamp_seconds
                            )} (${
                              link.link_type === "url" ? "Link" : "Video"
                            })`}
                          >
                            {formatTime(link.timestamp_seconds)}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Questions on the right */}
              <div className="w-full md:w-3/5 p-4">
                {videoQuestions.length > 0 ? (
                  <div className="space-y-6">
                    {videoQuestions.map((question) => (
                      <div key={question.id} className="space-y-4">
                        {/* Question section with border bottom */}
                        <div className="flex items-start gap-3 pb-3 border-b border-gray-200">
                          <div className="pt-1">
                            <Questions className="w-[15px] h-[14.35px] text-[#6096BA]" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium text-[12px] text-[#242B42]">
                              Question
                            </h4>
                            <p className="text-[#242B42] text-[16px] font-semibold mt-1">
                              {question.question_text}
                            </p>
                          </div>
                        </div>

                        {/* Answers section */}
                        <div className="space-y-3">
                          {question.answers.map((answer, index) => (
                            <div
                              key={answer.id}
                              className="grid grid-cols-10 gap-2"
                            >
                              {/* Answer (70% width) */}
                              <div className="col-span-7">
                                <div className="flex items-start gap-3 bg-[#EBEEF4] rounded-md p-3 border border-[#EBEEF4]">
                                  <div className="pt-1">
                                    <Answers className="w-[15px] h-[14.35px" />
                                  </div>
                                  <div className="flex-1">
                                    <h5 className="font-medium text-[12px] text-[#242B42]">
                                      Answer {index + 1}
                                    </h5>
                                    <p className="text-[#242B42] text-[16px] font-semibold">
                                      {answer.answer_text}
                                    </p>
                                  </div>
                                </div>
                              </div>

                              {/* Destination Video (30% width) */}
                              {answer.destination_video && (
                                <div className="col-span-3">
                                  <div className="flex items-start gap-3 bg-[#EBEEF4] rounded-md p-3 border border-[#EBEEF4] h-full">
                                    <div className="pt-1">
                                      <DestinationVedio className="w-[15px] h-[14.35px" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <h5 className="font-medium text-[12px] text-gray-800 truncate">
                                        Destination Video
                                      </h5>
                                      <p className="text-gray-600 text-[16px] font-semibold truncate">
                                        {answer.destination_video.title}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">
                    This video has no questions
                  </p>
                )}
              </div>
            </div>
          </div>
        );
      })}
      {/* Solutions Section */}
      <div className="border rounded-lg overflow-hidden">
        <div className="flex items-center justify-between py-4 px-4 bg-white">
          <h2 className="text-xl font-bold">Solution Type</h2>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setSolutionsExpanded(!solutionsExpanded)}
            className="cursor-pointer"
          >
            {solutionsExpanded ? (
              <ChevronUp className="h-5 w-5" />
            ) : (
              <ChevronDown className="h-5 w-5" />
            )}
          </Button>
        </div>

        {solutionsExpanded && (
          <div className="bg-gray-50 py-4 border-t">
            {solutions.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 px-4">
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
