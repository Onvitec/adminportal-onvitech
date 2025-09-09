"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import {
  VideoType,
  Question,
  Answer,
  VideoLink,
  Solution,
  FormSolutionData,
} from "@/lib/types";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Loader2, ChevronLeft, X } from "lucide-react";
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
  const [hoveredLinkId, setHoveredLinkId] = useState<string | null>(null);
  const [currentForm, setCurrentForm] = useState<FormSolutionData | null>(null);
  const [isVideoPaused, setIsVideoPaused] = useState(false);
  const [destinationVideos, setDestinationVideos] = useState<Record<string, VideoType>>({});

  // Modify the video link click handler to store the form link
  const [currentFormLink, setCurrentFormLink] = useState<VideoLink | null>(
    null
  );

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
          const { data: destVideosData, error: destVideosError } = await supabase
            .from("videos")
            .select("*")
            .in("id", Array.from(destinationVideoIds));

          if (!destVideosError && destVideosData) {
            destVideosData.forEach(video => {
              destVideos[video.id] = video;
            });
          }
        }

        setDestinationVideos(destVideos);

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
            if (
              (link.link_type === "video" || link.link_type === "form") &&
              link.destination_video_id
            ) {
              // Find the destination video from our already loaded videos
              const destinationVideo = videosData.find(
                (v) => v.id === link.destination_video_id
              ) || destVideos[link.destination_video_id];

              const result = {
                ...link,
                destination_video: destinationVideo, // Store the video object
              };

              // Parse form data if it's a form link
              if (link.link_type === "form" && link.form_data) {
                try {
                  const formData =
                    typeof link.form_data === "string"
                      ? JSON.parse(link.form_data)
                      : link.form_data;

                  result.form_data = formData;
                } catch (error) {
                  console.error("Error parsing form data:", error);
                }
              }

              return result;
            } else if (link.link_type === "form" && link.form_data) {
              // Parse form data for form links without destination video
              try {
                const formData =
                  typeof link.form_data === "string"
                    ? JSON.parse(link.form_data)
                    : link.form_data;

                return {
                  ...link,
                  form_data: formData,
                };
              } catch (error) {
                console.error("Error parsing form data:", error);
                return link;
              }
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
      // Check if current video has a destination video
      if (currentVideo?.destination_video_id && !currentVideo.freezeAtEnd) {
        const destinationVideo = destinationVideos[currentVideo.destination_video_id] || 
                                videos.find(v => v.id === currentVideo.destination_video_id);
        
        if (destinationVideo) {
          // Go to destination video
          if (currentVideo && !isNavigatingBack) {
            setVideoHistory((prev) => [...prev, currentVideo]);
          }
          setCurrentVideo(destinationVideo);
          setShowQuestions(false);
          return;
        }
      }
      
      // If no destination video or freezeAtEnd is true, check for next video in order
      const currentIndex = videos.findIndex((v) => v.id === currentVideo?.id);
      if (currentIndex < videos.length - 1 && !currentVideo?.freezeAtEnd) {
        // has next video → play it
        const nextVideo = videos[currentIndex + 1];
        if (currentVideo && !isNavigatingBack) {
          setVideoHistory((prev) => [...prev, currentVideo]);
        }
        setCurrentVideo(nextVideo);
      } else {
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
      showSolution();
    }
  };

  // Handle video link clicks
  const handleVideoLinkClick = useCallback(
    (link: VideoLink) => {
      console.log("Link clicked:", link);

      if (link.link_type === "url" && link.url) {
        window.open(link.url, "_blank", "noopener,noreferrer");
      } else if (link.link_type === "video" && link.destination_video_id) {
        const destinationVideo = destinationVideos[link.destination_video_id] || 
                                videos.find(v => v.id === link.destination_video_id);

        if (destinationVideo) {
          if (currentVideo && !isNavigatingBack) {
            setVideoHistory((prev) => [...prev, currentVideo]);
          }
          setCurrentVideo(destinationVideo);
          setShowQuestions(false);
        }
      } else if (link.link_type === "form" && link.form_data) {
        console.log("Form link clicked, pausing video");
        setIsVideoPaused(true);
        setCurrentForm(link.form_data);
        setCurrentFormLink(link);
      }
    },
    [videos, currentVideo, isNavigatingBack, destinationVideos]
  );

  // Handle form submission
  const handleFormSubmit = useCallback(
    (data: Record<string, any>) => {
      console.log("Form data submitted:", data);

      if (currentFormLink && currentFormLink.destination_video_id) {
        const destinationVideo = destinationVideos[currentFormLink.destination_video_id] || 
                                videos.find(v => v.id === currentFormLink.destination_video_id);

        if (destinationVideo) {
          if (currentVideo && !isNavigatingBack) {
            setVideoHistory((prev) => [...prev, currentVideo]);
          }
          setCurrentVideo(destinationVideo);
        }
      }

      // Always resume playback and close form
      setIsVideoPaused(false);
      setCurrentForm(null);
      setCurrentFormLink(null);
    },
    [currentFormLink, videos, currentVideo, isNavigatingBack, destinationVideos]
  );

  // Handle form cancellation
  const handleFormCancel = () => {
    // Resume video playback
    setIsVideoPaused(false);
    setCurrentForm(null);
    setCurrentFormLink(null);
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
        hoveredLinkId={hoveredLinkId}
        setHoveredLinkId={setHoveredLinkId}
        currentForm={currentForm}
        onFormSubmit={handleFormSubmit}
        onFormCancel={handleFormCancel}
        isPaused={isVideoPaused}
        currentFormLink={currentFormLink}
        hasQuestions={currentQuestions.length > 0}
        onVideoRestart={() => {
          setShowQuestions(false);
          setCurrentForm(null);
          setCurrentFormLink(null);
        }}
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