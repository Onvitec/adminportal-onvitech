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
import { Questions } from "@/components/icons";
import { CommonVideoPlayer } from "../CommonVideoPlaye";
import { SolutionDisplay } from "../SolutionDisplay";
import { buildEmailTemplate } from "@/lib/utils";

export interface UserJourneyStep {
  videoId: string;
  videoTitle: string;
  clickedElement?: {
    id: string;
    label: string;
    type: "button" | "form" | "restart";
  };
  timestamp: number;
}

export interface UserJourney {
  sessionId: string;
  steps: UserJourneyStep[];
}

export function InteractiveSessionEmbed({ sessionId }: { sessionId: string }) {
  const [videos, setVideos] = useState<VideoType[]>([]);
  const [sessionName, setSessionName] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentVideo, setCurrentVideo] = useState<VideoType | null>(null);
  const [currentQuestions, setCurrentQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showQuestions, setShowQuestions] = useState(false);

  // Update the navigationButton state type
  const [navigationButton, setNavigationButton] = useState<{
    image_url: string;
    video_url: string;
    video_title: string;
    video_data?: VideoType & { freezeAtEnd?: boolean };
    video_links?: VideoLink[];
  } | null>(null);
  const [showNavigationVideo, setShowNavigationVideo] = useState(false);
  const [navigationVideo, setNavigationVideo] = useState<VideoType | null>(
    null
  );

  const [videoLinks, setVideoLinks] = useState<Record<string, VideoLink[]>>({});
  const [videoHistory, setVideoHistory] = useState<VideoType[]>([]);
  const [isNavigatingBack, setIsNavigatingBack] = useState(false);
  const [currentSolution, setCurrentSolution] = useState<Solution | null>(null);
  const [hoveredLinkId, setHoveredLinkId] = useState<string | null>(null);
  const [currentForm, setCurrentForm] = useState<FormSolutionData | null>(null);
  const [isFormSubmitting, setIsFormSubmitting] = useState(false);
  const [isVideoPaused, setIsVideoPaused] = useState(false);
  const [showPlayButton, setIsShowPlayButton] = useState(true);
  const [destinationVideos, setDestinationVideos] = useState<
    Record<string, VideoType>
  >({});

  const [userJourney, setUserJourney] = useState<UserJourney>({
    sessionId,
    steps: [],
  });
  const userJourneyRef = useRef<UserJourney>(userJourney);
  const lastVideoIdRef = useRef<string | null>(null);
  const [currentFormLink, setCurrentFormLink] = useState<VideoLink | null>(
    null
  );

  // Watch time tracking
  const watchTimeRef = useRef(0);
  const startTimeRef = useRef<number>(0);
  const hasSavedRef = useRef<boolean>(false);
  const isVideoPlayingRef = useRef<boolean>(true);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Update the ref whenever userJourney changes
  useEffect(() => {
    userJourneyRef.current = userJourney;
  }, [userJourney]);

  const saveLeadData = useCallback(async () => {
    hasSavedRef.current = true;

    try {
      const elapsedSeconds = Math.floor(
        (Date.now() - startTimeRef.current) / 1000
      );
      const finalWatchTime = Math.max(elapsedSeconds, watchTimeRef.current);

      if (finalWatchTime < 3) {
        console.log("⏰ Watch time too short, skipping save:", finalWatchTime);
        return;
      }

      console.log("💾 Final watch time to save:", finalWatchTime);

      const { data: sessionData } = await supabase
        .from("sessions")
        .select("associated_with")
        .eq("id", sessionId)
        .single();

      const companyId = sessionData?.associated_with;
      const payload = {
        session_id: sessionId,
        company_id: companyId,
        watch_time: finalWatchTime,
        form_data: currentFormLink?.form_data || null,
        user_journey: userJourneyRef.current,
      };

      const apiUrl = "/api/save-lead";
      const jsonBlob = new Blob([JSON.stringify(payload)], {
        type: "application/json",
      });

      localStorage.setItem("watch item 2", String(finalWatchTime));
      if (navigator.sendBeacon) {
        console.log("📡 Sending with sendBeacon");
        const success = navigator.sendBeacon(apiUrl, jsonBlob);
        if (!success) {
          throw new Error("sendBeacon failed");
        }
      } else {
        console.log("🧭 Using fetch with keepalive");
        await fetch(apiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          keepalive: true,
        });
      }

      console.log("✅ Lead saved with watch_time:", finalWatchTime);
    } catch (err) {
      console.error("❌ Error in saveLeadData:", err);
      hasSavedRef.current = false;
    }
  }, [sessionId, currentFormLink?.form_data]);

  // Watch time tracking system
  useEffect(() => {
    const startTime = Date.now();
    startTimeRef.current = startTime;

    const updateWatchTime = () => {
      watchTimeRef.current = Math.floor((Date.now() - startTime) / 1000);
    };

    timerRef.current = setInterval(updateWatchTime, 1000);

    const performFinalSave = () => {
      if (hasSavedRef.current) {
        console.log("⏩ Save already completed, skipping");
        return false;
      }

      console.log("🧾 Final save triggered");
      clearInterval(timerRef.current!);

      const finalWatchTime = Math.floor((Date.now() - startTime) / 1000);
      watchTimeRef.current = finalWatchTime;

      if (finalWatchTime < 3) {
        console.log("⏰ Watch time too short, skipping save");
        return false;
      }

      hasSavedRef.current = true;
      console.log("💾 Final watch time to save:", finalWatchTime);

      return finalWatchTime;
    };

    const handleUnloadSave = () => {
      const finalWatchTime = performFinalSave();
      if (!finalWatchTime) return;

      try {
        const payload = {
          session_id: sessionId,
          watch_time: finalWatchTime,
          form_data: currentFormLink?.form_data || null,
          user_journey: userJourneyRef.current,
        };

        const blob = new Blob([JSON.stringify(payload)], {
          type: "application/json",
        });
        if (navigator.sendBeacon("/api/save-lead", blob)) {
          console.log("✅ sendBeacon save completed");
          return;
        }

        console.log("🔄 sendBeacon failed, trying sync XHR");
        const xhr = new XMLHttpRequest();
        xhr.open("POST", "/api/save-lead", false);
        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.send(JSON.stringify(payload));
        console.log("✅ Sync XHR save completed");
      } catch (err) {
        console.error("❌ Unload save failed:", err);
      }
    };

    const handleAsyncSave = () => {
      const finalWatchTime = performFinalSave();
      if (!finalWatchTime) return;
      saveLeadData();
    };

    let visibilityTimeout: NodeJS.Timeout;
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        visibilityTimeout = setTimeout(() => {
          handleUnloadSave();
        }, 100);
      } else {
        clearTimeout(visibilityTimeout);
      }
    };

    window.addEventListener("beforeunload", handleUnloadSave);
    window.addEventListener("pagehide", handleUnloadSave);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(timerRef.current!);
      clearTimeout(visibilityTimeout);

      window.removeEventListener("beforeunload", handleUnloadSave);
      window.removeEventListener("pagehide", handleUnloadSave);
      document.removeEventListener("visibilitychange", handleVisibilityChange);

      if (!hasSavedRef.current) {
        console.log("🔚 Component unmounting (likely SPA navigation)");
        handleAsyncSave();
      }
    };
  }, [saveLeadData, sessionId, currentFormLink?.form_data]);

  // Function to add a clicked element to journey
  const addClickToJourney = useCallback(
    (
      video: VideoType,
      clickedElement: {
        id: string;
        label: string;
        type: "button" | "form" | "restart";
      }
    ) => {
      setUserJourney((prev) => {
        const lastStep = prev.steps[prev.steps.length - 1];
        const isNewVideo = !lastStep || lastStep.videoId !== video.id;

        const newSteps = [...prev.steps];

        if (isNewVideo) {
          newSteps.push({
            videoId: video.id,
            videoTitle: video.title || "Untitled Video",
            timestamp: Date.now(),
          });
        }

        newSteps.push({
          videoId: video.id,
          videoTitle: video.title || "Untitled Video",
          clickedElement,
          timestamp: Date.now(),
        });

        return {
          ...prev,
          steps: newSteps,
        };
      });
    },
    []
  );

  // Function to add a video to journey (without click) - only if it's new
  const addVideoToJourney = useCallback((video: VideoType) => {
    setUserJourney((prev) => {
      const lastStep = prev.steps[prev.steps.length - 1];

      if (!lastStep || lastStep.videoId !== video.id) {
        return {
          ...prev,
          steps: [
            ...prev.steps,
            {
              videoId: video.id,
              videoTitle: video.title || "Untitled Video",
              timestamp: Date.now(),
            },
          ],
        };
      }
      return prev;
    });
  }, []);

  // Function to get journey summary
  const getJourneySummary = useCallback(() => {
    return userJourney.steps
      .map((step) => {
        if (step.clickedElement) {
          if (step.clickedElement.label.startsWith("Submitted form:")) {
            return step.clickedElement.label;
          }
          if (step.clickedElement.type === "restart") {
            return `${step.videoTitle} (${step.clickedElement.label})`;
          }
          if (step.clickedElement.id == "navigation-video-completed") {
            return `Navigated Video Completed`;
          }
          if (step.clickedElement.label === "Navigation Button") {
            return `clicked: Navigation Button`;
          }
          return `clicked: ${step.clickedElement.label}`;
        }
        if (step.videoId.startsWith("navigation-video-")) {
          return `[Navigation video] ${step.videoTitle}`;
        }
        return step.videoTitle;
      })
      .join(" → ");
  }, [userJourney]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch session detail
        const { data: sessionData, error: sessionError } = await supabase
          .from("sessions")
          .select("*")
          .eq("id", sessionId)
          .single();

        if (sessionError) throw sessionError;
        setIsShowPlayButton(sessionData.showPlayButton);
        setSessionName(sessionData.title);

        // Fetch videos - EXCLUDE navigation videos
        const { data: videosData, error: videosError } = await supabase
          .from("videos")
          .select("*")
          .eq("session_id", sessionId)
          .eq("is_navigation_video", false)
          .order("order_index", { ascending: true });

        if (videosError) throw videosError;

        if (!videosData || videosData.length === 0) {
          throw new Error("No videos found for this session");
        }

        setVideos(videosData);
        setCurrentVideo(videosData[0]);
        lastVideoIdRef.current = videosData[0].id;

        // Initialize journey with first video
        addVideoToJourney(videosData[0]);

        // Create a mapping of destination videos
        const destVideos: Record<string, VideoType> = {};
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

        // Fetch navigation video data separately
        if (sessionData.navigation_button_video_id) {
          // Fetch navigation video details
          const { data: navVideoData, error: navVideoError } = await supabase
            .from("videos")
            .select("*")
            .eq("id", sessionData.navigation_button_video_id)
            .single();

          if (!navVideoError && navVideoData) {
            // Fetch navigation video links
            const { data: navLinksData, error: navLinksError } = await supabase
              .from("video_links")
              .select("*")
              .eq("video_id", sessionData.navigation_button_video_id);

            if (!navLinksError) {
              // Process navigation video links with destinations
              const navLinksWithDestinations = await Promise.all(
                (navLinksData || []).map(async (link): Promise<VideoLink> => {
                  if (
                    (link.link_type === "video" || link.link_type === "form") &&
                    link.destination_video_id
                  ) {
                    const destinationVideo =
                      videosData.find(
                        (v) => v.id === link.destination_video_id
                      ) || destVideos[link.destination_video_id];

                    const result = {
                      ...link,
                      destination_video: destinationVideo,
                    };

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

              // Set navigation button with video and links
              setNavigationButton({
                image_url: sessionData.navigation_button_image_url,
                video_url: navVideoData.url,
                video_title:
                  sessionData.navigation_button_video_title ||
                  "Navigation Video",
                video_data: {
                  ...navVideoData,
                  freezeAtEnd: true,
                },
                video_links: navLinksWithDestinations || [],
              });
            }
          }
        }

        // Fetch questions for regular videos only
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

        // Fetch video links for regular videos only
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
              const destinationVideo =
                videosData.find((v) => v.id === link.destination_video_id) ||
                destVideos[link.destination_video_id];

              const result = {
                ...link,
                destination_video: destinationVideo,
              };

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
  }, [sessionId, addVideoToJourney]);

  useEffect(() => {
    if (currentVideo && questions.length > 0) {
      const videoQuestions = questions.filter(
        (q) => q.video_id === currentVideo.id
      );
      setCurrentQuestions(videoQuestions);
      setShowQuestions(false);
    }
  }, [currentVideo, questions]);

  // Add destination videos to journey when they load
  useEffect(() => {
    if (currentVideo && currentVideo.id !== lastVideoIdRef.current) {
      addVideoToJourney(currentVideo);
      lastVideoIdRef.current = currentVideo.id;
    }
  }, [currentVideo, addVideoToJourney]);

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
        const destinationVideo =
          destinationVideos[currentVideo.destination_video_id] ||
          videos.find((v) => v.id === currentVideo.destination_video_id);

        if (destinationVideo) {
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
      if (currentVideo) {
        addClickToJourney(currentVideo, {
          id: link.id,
          label: link.label,
          type: link.link_type === "form" ? "form" : "button",
        });
      }

      if (link.link_type === "url" && link.url) {
        window.open(link.url, "_blank", "noopener,noreferrer");
      } else if (link.link_type === "video" && link.destination_video_id) {
        setShowNavigationVideo(false);
        const destinationVideo =
          destinationVideos[link.destination_video_id] ||
          videos.find((v) => v.id === link.destination_video_id);

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
        isVideoPlayingRef.current = false;
        setCurrentForm(link.form_data);
        setCurrentFormLink(link);
        console.log("User journey before form:", getJourneySummary());
      }
    },
    [
      videos,
      currentVideo,
      isNavigatingBack,
      destinationVideos,
      addClickToJourney,
      getJourneySummary,
    ]
  );

  const handleFormSubmit = useCallback(
    async (
      data: FormSolutionData & {
        values: {
          raw: Record<string, any>;
          formatted: Record<string, any>;
        };
      }
    ) => {
      try {
        let finalJourney: UserJourney;

        if (currentVideo && currentFormLink) {
          finalJourney = {
            ...userJourneyRef.current,
            steps: [
              ...userJourneyRef.current.steps,
              {
                videoId: currentVideo.id,
                videoTitle: currentVideo.title || "Untitled Video",
                clickedElement: {
                  id: `form-submitted-${currentFormLink.id}`,
                  label: `Submitted form: ${data.title}`,
                  type: "form" as const,
                },
                timestamp: Date.now(),
              },
            ],
          };
          setUserJourney(finalJourney);
        } else {
          finalJourney = userJourneyRef.current;
        }

        const journeySummary = finalJourney.steps
          .map((step) => {
            if (step.clickedElement) {
              const el = step.clickedElement;
              if (el.label?.startsWith("Submitted form:")) {
                return el.label;
              }
              if (el.type === "restart") {
                return `${step.videoTitle} (${el.label})`;
              }
              if (el.id === "navigation-video-completed") {
                return `Completed navigation video: ${step.videoTitle}`;
              }
              if (el.label === "Navigation Button") {
                return `Clicked: Navigation Button`;
              }
              return `Clicked: ${el.label}`;
            }
            if (step.videoId?.startsWith("navigation-video-")) {
              return `Started navigation video: ${step.videoTitle}`;
            }
            return step.videoTitle;
          })
          .join(" -> ");

        console.log("🎯 FINAL USER JOURNEY:", journeySummary);

        setIsFormSubmitting(true);

        try {
          const { data: sessionData } = await supabase
            .from("sessions")
            .select("associated_with")
            .eq("id", sessionId)
            .single();

          const companyId = sessionData?.associated_with;

          const { error: saveError } = await supabase.from("leads").insert({
            session_id: sessionId,
            company_id: companyId,
            form_title: data.title,
            form_data: data.values.formatted,
            user_journey: finalJourney,
            journey_summary: journeySummary,
            created_at: new Date().toISOString(),
          });

          if (saveError) {
            console.error("❌ Error saving form data:", saveError);
          } else {
            console.log("✅ Form data and user journey saved successfully");
          }
        } catch (dbError) {
          console.error("❌ Database save error:", dbError);
        }

        const message_html = buildEmailTemplate(data.title, {
          ...data.values.formatted,
          userJourney: journeySummary,
          sessionName: sessionName,
          completedAt: new Date().toLocaleString(),
        });

        const res = await fetch("/api/send-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: data.email,
            title: data.title,
            message_html,
            user_journey: journeySummary,
            journey_data: finalJourney,
          }),
        });

        setIsFormSubmitting(false);
      } catch (err) {
        console.error("❌ Failed to send email:", err);
        setIsFormSubmitting(false);
      }

      if (currentFormLink && currentFormLink.destination_video_id) {
        const destinationVideo =
          destinationVideos[currentFormLink.destination_video_id] ||
          videos.find((v) => v.id === currentFormLink.destination_video_id);

        if (destinationVideo) {
          if (currentVideo && !isNavigatingBack) {
            setVideoHistory((prev) => [...prev, currentVideo]);
          }
          setCurrentVideo(destinationVideo);
        }
      }

      setIsVideoPaused(false);
      isVideoPlayingRef.current = true;
      setCurrentForm(null);
      setCurrentFormLink(null);
    },
    [
      currentFormLink,
      videos,
      currentVideo,
      isNavigatingBack,
      destinationVideos,
      sessionName,
      sessionId,
    ]
  );

  // Handle form cancellation
  const handleFormCancel = () => {
    setIsVideoPaused(false);
    isVideoPlayingRef.current = true;
    setCurrentForm(null);
    setCurrentFormLink(null);
  };

  // Function to handle navigation button click
  const handleNavigationButtonClick = useCallback(() => {
    if (navigationButton && navigationButton.video_data) {
      console.log("Navigation button clicked, opening navigation video");

      const navVideo: VideoType = {
        ...navigationButton.video_data,
        id: "navigation-video-" + Date.now(),
        title: navigationButton.video_title,
        url: navigationButton.video_url,
        freezeAtEnd: true,
      };

      if (currentVideo) {
        addClickToJourney(currentVideo, {
          id: "navigation-button",
          label: "Navigation Button",
          type: "button",
        });
      }

      addVideoToJourney(navVideo);

      setShowQuestions(false);
      setCurrentForm(null);
      setCurrentFormLink(null);
      setIsVideoPaused(false);

      setNavigationVideo(navVideo);
      setShowNavigationVideo(true);

      console.log("Navigation video state set to show");
    }
  }, [navigationButton, addClickToJourney, addVideoToJourney, currentVideo]);

  // Function to close navigation video and return to main content
  const handleCloseNavigationVideo = useCallback(() => {
    console.log("Closing navigation video, returning to main content");
    setShowNavigationVideo(false);
    setNavigationVideo(null);
    console.log(
      "Navigation video closed, main session should show with navigation button"
    );
  }, []);

  // Separate handler for navigation video end
  const handleNavigationVideoEnd = useCallback(() => {
    console.log("Navigation video ended - keeping on last frame with buttons");

    if (navigationVideo) {
      addClickToJourney(navigationVideo, {
        id: "navigation-video-completed",
        label: "Navigation Video Completed",
        type: "button",
      });
    }

    // DO NOT return to current video - keep navigation video visible
    // The video will freeze at end (freezeAtEnd: true) and buttons remain functional
    setIsVideoPaused(true);
  }, [navigationVideo, addClickToJourney]);

  const goToPreviousVideo = () => {
    if (videoHistory.length === 0) return;

    setIsNavigatingBack(true);
    const lastVideo = videoHistory[videoHistory.length - 1];
    setCurrentVideo(lastVideo);
    setVideoHistory((prev) => prev.slice(0, -1));
    setShowQuestions(false);
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

  // If navigation video is showing, render it with proper handlers and links
  if (showNavigationVideo && navigationVideo && navigationButton) {
    return (
      <div className="flex flex-col h-full rounded-xl overflow-hidden">
        <CommonVideoPlayer
          currentVideo={navigationVideo}
          videoLinks={{
            [navigationVideo.id]: navigationButton.video_links || [],
          }}
          onVideoEnd={handleNavigationVideoEnd}
          onVideoLinkClick={handleVideoLinkClick}
          showBackButton={true}
          onBackNavigation={handleCloseNavigationVideo}
          sessionShowPlayButton={showPlayButton}
          onVideoRestart={() => {
            if (navigationVideo) {
              const videoEl = document.querySelector("video");
              if (videoEl) {
                videoEl.currentTime = 0;
                videoEl.play();
              }
            }
          }}
          // Don't show navigation button inside navigation video
          navigationButton={null}
          onNavigationButtonClick={undefined}
          currentForm={currentForm}
          onFormSubmit={handleFormSubmit}
          onFormLoading={isFormSubmitting}
          onFormCancel={handleFormCancel}
          isPaused={isVideoPaused}
          currentFormLink={currentFormLink}
          addClickToJourney={addClickToJourney}
          // CRITICAL: Mark this as a navigation video
          isNavigationVideo={true}
        />
      </div>
    );
  }
  // Main session rendering
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
        onFormLoading={isFormSubmitting}
        onFormCancel={handleFormCancel}
        isPaused={isVideoPaused}
        currentFormLink={currentFormLink}
        hasQuestions={currentQuestions.length > 0}
        sessionShowPlayButton={showPlayButton}
        addClickToJourney={addClickToJourney}
        onVideoRestart={() => {
          setShowQuestions(false);
          setCurrentForm(null);
          setCurrentFormLink(null);
        }}
        // Show navigation button only in main session
        navigationButton={navigationButton}
        onNavigationButtonClick={handleNavigationButtonClick}
        isNavigationVideo={false}
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
