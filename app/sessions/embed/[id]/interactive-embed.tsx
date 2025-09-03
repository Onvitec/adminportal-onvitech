"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { VideoType, Question, Answer, VideoLink, Solution } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Loader2, ChevronLeft } from "lucide-react";
import { Questions } from "@/components/icons";
import { CommonVideoPlayer } from "../CommonVideoPlaye";
import { SolutionDisplay } from "../SolutionDisplay";

export function InteractiveSessionEmbed({ sessionId }: { sessionId: string }) {
  const [videos, setVideos] = useState<VideoType[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentVideo, setCurrentVideo] = useState<VideoType | null>(null);
  const [currentQuestions, setCurrentQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showQuestions, setShowQuestions] = useState(false);
  const [videoLinks, setVideoLinks] = useState<Record<string, VideoLink[]>>({});
  const [videoHistory, setVideoHistory] = useState<VideoType[]>([]);
  const [isNavigatingBack, setIsNavigatingBack] = useState(false);
  const [currentSolution, setCurrentSolution] = useState<Solution | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch videos
        const { data: videosData, error: videosError } = await supabase
          .from("videos")
          .select("*")
          .eq("session_id", sessionId)
          .order("order_index", { ascending: true });

        if (videosError) throw videosError;

        if (!videosData || videosData.length === 0) {
          throw new Error("No videos found for this session");
        }

        setVideos(videosData);
        setCurrentVideo(videosData[0]);

        // Fetch questions
        const { data: questionsData, error: questionsError } = await supabase
          .from("questions")
          .select("*")
          .in(
            "video_id",
            videosData.map((v) => v.id)
          );

        if (questionsError) throw questionsError;

        // Fetch answers with destination videos
        const questionsWithAnswers = await Promise.all(
          (questionsData || []).map(async (question) => {
            const { data: answersData, error: answersError } = await supabase
              .from("answers")
              .select("*")
              .eq("question_id", question.id);

            if (answersError) throw answersError;

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
                  console.error("Error fetching destination video:", videoError);
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

        // Fetch video links with enhanced logic for video-type links
        const { data: linksData, error: linksError } = await supabase
          .from("video_links")
          .select("*")
          .in(
            "video_id",
            videosData.map((v) => v.id)
          );

        if (linksError) throw linksError;

        // Process links and fetch destination videos for video-type links
        const linksWithDestinations = await Promise.all(
          (linksData || []).map(async (link): Promise<VideoLink> => {
            if (link.link_type === "video" && link.destination_video_id) {
              // Find the destination video from our already loaded videos
              const destinationVideo = videosData.find(
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

        const { data: solutionData, error: solutionError } = await supabase
          .from("solutions")
          .select("*")
          .eq("session_id", sessionId)
          .single();

        if (solutionError) {
          console.error("Error fetching solution:", solutionError);
        } else {
          setCurrentSolution(solutionData);
        }

        // Group links by video_id
        const groupedLinks: Record<string, VideoLink[]> = {};
        linksWithDestinations.forEach((link) => {
          if (!groupedLinks[link.video_id!]) groupedLinks[link.video_id!] = [];
          groupedLinks[link.video_id!].push(link);
        });
        setVideoLinks(groupedLinks);
        setQuestions(questionsWithAnswers);
      } catch (error) {
        console.error("Error fetching interactive session data:", error);
        setError(error instanceof Error ? error.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [sessionId]);

  useEffect(() => {
    if (currentVideo && questions.length > 0) {
      const videoQuestions = questions.filter(
        (q) => q.video_id === currentVideo.id
      );
      setCurrentQuestions(videoQuestions);
      setShowQuestions(false);
    }
  }, [currentVideo, questions]);

  const showSolution = () => {
    if (currentSolution) {
      setShowQuestions(false);
      setCurrentVideo(null);
    }
  };

  const handleVideoEnd = () => {
    if (currentQuestions.length > 0) {
      setShowQuestions(true);
    } else {
      const currentIndex = videos.findIndex((v) => v.id === currentVideo?.id);
      if (currentIndex < videos.length - 1) {
        // has next video → play it
        const nextVideo = videos[currentIndex + 1];
        if (currentVideo && !isNavigatingBack) {
          setVideoHistory((prev) => [...prev, currentVideo]);
        }
        setCurrentVideo(nextVideo);
      } else {
        // ❌ no next video → show solution
        showSolution();
      }
    }
  };

  const handleAnswerSelect = (
    answer: Answer & { destination_video?: VideoType }
  ) => {
    if (answer.destination_video) {
      // go to destination video
      if (currentVideo && !isNavigatingBack) {
        setVideoHistory((prev) => [...prev, currentVideo]);
      }
      setCurrentVideo(answer.destination_video);
      setShowQuestions(false);
    } else {
      // ❌ no destination video → show solution
      showSolution();
    }
  };

  // Handle video link clicks
  const handleVideoLinkClick = (link: VideoLink) => {
    if (link.link_type === "url" && link.url) {
      // Open external URL in new tab
      window.open(link.url, "_blank", "noopener,noreferrer");
    } else if (link.link_type === "video" && link.destination_video) {
      // Save current video to history
      if (currentVideo && !isNavigatingBack) {
        setVideoHistory((prev) => [...prev, currentVideo]);
      }

      // Switch to destination video
      setCurrentVideo(link.destination_video as VideoType);
      setShowQuestions(false);
    }
  };

  const goToPreviousVideo = () => {
    if (videoHistory.length === 0) return;
    
    setIsNavigatingBack(true);
    const lastVideo = videoHistory[videoHistory.length - 1];

    // Set previous video as current
    setCurrentVideo(lastVideo);

    // Remove last from history
    setVideoHistory((prev) => prev.slice(0, -1));

    // Reset UI state
    setShowQuestions(false);

    // Reset navigation flag after a short delay
    setTimeout(() => setIsNavigatingBack(false), 100);
  };

  if (loading) {
    return null;
  }

  if (error) {
    return <div className="text-center p-4 text-red-500">{error}</div>;
  }

  if (currentSolution && !currentVideo) {
    return <SolutionDisplay solution={currentSolution} />;
  }

  if (!currentVideo) {
    return <div className="text-center p-4">No video content available</div>;
  }

  return (
    <div className="flex flex-col h-full rounded-xl overflow-hidden">
      <CommonVideoPlayer
        currentVideo={currentVideo}
        videoLinks={videoLinks}
        onVideoEnd={handleVideoEnd}
        onVideoLinkClick={handleVideoLinkClick}
        onBackNavigation={goToPreviousVideo}
        showBackButton={videoHistory.length > 0}
      >
        {showQuestions && currentQuestions.length > 0 && (
          <div className="absolute right-4 top-1/2 transform -translate-y-1/2 w-96 space-y-4">
            {currentQuestions.map((question) => (
              <div key={question.id} className="space-y-4">
                <div className="bg-white/30 backdrop-blur-sm rounded-lg p-4 shadow-lg border border-white/60">
                  <div className="flex items-center gap-2 mb-2">
                    <Questions className="text-white" />
                    <span className="text-white font-semibold text-sm uppercase tracking-wider">
                      Question
                    </span>
                  </div>
                  <h3 className="text-lg text-white text-[16px] font-bold pl-2">
                    {question.question_text}
                  </h3>
                </div>

                <hr className="border-white/60 w-full" />

                <div className="space-y-4">
                  {question.answers.map((answer) => (
                    <div
                      key={answer.id}
                      className="bg-white/30 backdrop-blur-sm rounded-lg p-4 shadow-lg border border-white/60 cursor-pointer 
                                hover:bg-white/40 transition-colors duration-200"
                      onClick={() => handleAnswerSelect(answer)}
                    >
                      <p className="text-white font-semibold text-[16px]">
                        {answer.answer_text}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </CommonVideoPlayer>
    </div>
  );
}