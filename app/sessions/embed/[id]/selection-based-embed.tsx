"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { VideoType, Question, Answer, Solution, VideoLink, FormSolutionData } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { Questions, Answers } from "@/components/icons";
import { SolutionDisplay } from "../SolutionDisplay";
import { CommonVideoPlayer } from "../CommonVideoPlaye";
import { buildEmailTemplate } from "@/lib/utils";

type AnswerCombination = {
  id: string;
  answers: string[];
  solution_id: string | null;
};

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

export function SelectionSessionEmbed({ sessionId }: { sessionId: string }) {
  const [videos, setVideos] = useState<VideoType[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [solutions, setSolutions] = useState<Solution[]>([]);
  const [combinations, setCombinations] = useState<AnswerCombination[]>([]);
  const [currentVideo, setCurrentVideo] = useState<VideoType | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<
    Record<string, string>
  >({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showQuestions, setShowQuestions] = useState(false);
  const [currentSolution, setCurrentSolution] = useState<Solution | null>(null);
  const [videoLinks, setVideoLinks] = useState<Record<string, VideoLink[]>>({});
  const [videoHistory, setVideoHistory] = useState<VideoType[]>([]);
  const [hoveredLinkId, setHoveredLinkId] = useState<string | null>(null);

  // ADDED NAVIGATION STATE FROM INTERACTIVE EMBED
  const [navigationButton, setNavigationButton] = useState<{
    image_url: string;
    video_url: string;
    video_title: string;
    video_data?: VideoType & { freezeAtEnd?: boolean };
    video_links?: VideoLink[];
  } | null>(null);
  const [showNavigationVideo, setShowNavigationVideo] = useState(false);
  const [navigationVideo, setNavigationVideo] = useState<VideoType | null>(null);
  const [allVideosLookup, setAllVideosLookup] = useState<Record<string, VideoType>>({});
  const [currentForm, setCurrentForm] = useState<FormSolutionData | null>(null);
  const [isFormSubmitting, setIsFormSubmitting] = useState(false);
  const [isVideoPaused, setIsVideoPaused] = useState(false);
  const [showPlayButton, setIsShowPlayButton] = useState(true);
  const [currentFormLink, setCurrentFormLink] = useState<VideoLink | null>(null);

  // User journey tracking
  const [userJourney, setUserJourney] = useState<UserJourney>({
    sessionId,
    steps: [],
  });
  const userJourneyRef = useRef<UserJourney>(userJourney);
  const lastVideoIdRef = useRef<string | null>(null);

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

  // ADDED FROM INTERACTIVE EMBED: Save lead data function
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

  // ADDED FROM INTERACTIVE EMBED: Watch time tracking system
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

  // ADDED FROM INTERACTIVE EMBED: Function to add a clicked element to journey
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

  // ADDED FROM INTERACTIVE EMBED: Function to add a video to journey (without click) - only if it's new
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

  // ADDED FROM INTERACTIVE EMBED: Function to get journey summary
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

        // ✅ CREATE COMPREHENSIVE VIDEO LOOKUP AT HIGHER SCOPE
        const allVideosLookup: Record<string, VideoType> = {};

        // Add regular videos
        videosData.forEach((video) => {
          allVideosLookup[video.id] = video;
        });

        // Fetch navigation video data separately
        if (sessionData.navigation_button_video_id) {
          // Fetch navigation video details
          const { data: navVideoData, error: navVideoError } = await supabase
            .from("videos")
            .select("*")
            .eq("id", sessionData.navigation_button_video_id)
            .single();

          if (!navVideoError && navVideoData) {
            // ✅ Add navigation video to the lookup
            allVideosLookup[navVideoData.id] = navVideoData;

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
                    // ✅ Look in the comprehensive video lookup
                    const destinationVideo =
                      allVideosLookup[link.destination_video_id];

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

        // Fetch answers
        const questionsWithAnswers = await Promise.all(
          (questionsData || []).map(async (question) => {
            const { data: answersData, error: answersError } = await supabase
              .from("answers")
              .select("*")
              .eq("question_id", question.id);

            if (answersError) throw answersError;

            return {
              ...question,
              answers: answersData || [],
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
              // ✅ Use the same comprehensive lookup approach
              const destinationVideo =
                allVideosLookup[link.destination_video_id];

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

        // Fetch solutions
        const { data: solutionsData, error: solutionsError } = await supabase
          .from("solutions")
          .select("*")
          .eq("session_id", sessionId);

        if (solutionsError) throw solutionsError;
        setSolutions(solutionsData || []);

        // Fetch answer combinations
        const { data: combinationsData, error: combinationsError } =
          await supabase
            .from("answer_combinations")
            .select("*, combination_answers(answer_id)")
            .eq("session_id", sessionId);

        if (combinationsError) throw combinationsError;

        const processedCombinations =
          combinationsData?.map((combo) => ({
            id: combo.id,
            answers: combo.combination_answers.map((ca: any) => ca.answer_id),
            solution_id: combo.solution_id,
          })) || [];

        setCombinations(processedCombinations);

        // Group links by video_id
        const groupedLinks: Record<string, VideoLink[]> = {};
        linksWithDestinations.forEach((link) => {
          if (!groupedLinks[link.video_id!]) groupedLinks[link.video_id!] = [];
          groupedLinks[link.video_id!].push(link);
        });
        setVideoLinks(groupedLinks);
        setQuestions(questionsWithAnswers);

        // ✅ STORE ALL VIDEOS LOOKUP IN STATE FOR USE IN HANDLERS
        setAllVideosLookup(allVideosLookup);
      } catch (error) {
        console.error("Error fetching selection session data:", error);
        setError(error instanceof Error ? error.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [sessionId, addVideoToJourney]);

  // ADDED FROM INTERACTIVE EMBED: Views counter
  useEffect(() => {
    const incrementViews = async () => {
      try {
        // First get the current session data
        const { data: sessionData, error: fetchError } = await supabase
          .from("sessions")
          .select("total_views")
          .eq("id", sessionId)
          .single();

        if (fetchError) throw fetchError;

        const currentViews = sessionData?.total_views || 0;
        const newViews = currentViews + 1;

        // Update with the incremented value
        const { error: updateError } = await supabase
          .from("sessions")
          .update({ total_views: newViews })
          .eq("id", sessionId);

        if (updateError) {
          console.error("Error incrementing session views:", updateError);
        }
      } catch (err) {
        console.error("Error in incrementViews:", err);
      }
    };

    incrementViews();
  }, [sessionId]);

  // ADDED FROM INTERACTIVE EMBED: Add destination videos to journey when they load
  useEffect(() => {
    if (currentVideo && currentVideo.id !== lastVideoIdRef.current) {
      addVideoToJourney(currentVideo);
      lastVideoIdRef.current = currentVideo.id;
    }
  }, [currentVideo, addVideoToJourney]);

  useEffect(() => {
    if (currentVideo && questions.length > 0) {
      const videoQuestion = questions.find(
        (q) => q.video_id === currentVideo.id
      );
      setCurrentQuestion(videoQuestion || null);
      setShowQuestions(false);
    }
  }, [currentVideo, questions]);

  const handleVideoEnd = () => {
    if (currentQuestion) {
      setShowQuestions(true);
    } else {
      const currentIndex = videos.findIndex((v) => v.id === currentVideo?.id);
      if (currentIndex < videos.length - 1) {
        if (currentVideo) {
          setVideoHistory((prev) => [...prev, currentVideo]);
        }
        setCurrentVideo(videos[currentIndex + 1]);
      }
    }
  };

  // ADDED FROM INTERACTIVE EMBED: Handle video link clicks
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
        let url = link.url.trim();

        // Add https:// if missing
        if (!/^https?:\/\//i.test(url)) {
          url = `https://${url}`;
        }

        window.open(url, "_blank", "noopener,noreferrer");
      } else if (link.link_type === "video" && link.destination_video_id) {
        setShowNavigationVideo(false);

        // ✅ Use the stored allVideosLookup
        const destinationVideo = allVideosLookup[link.destination_video_id];

        if (destinationVideo) {
          if (currentVideo) {
            setVideoHistory((prev) => [...prev, currentVideo]);
          }
          setCurrentVideo(destinationVideo);
          setShowQuestions(false);
        } else {
          console.warn(
            "Destination video not found:",
            link.destination_video_id
          );
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
      currentVideo,
      addClickToJourney,
      getJourneySummary,
      allVideosLookup,
    ]
  );

  // ADDED FROM INTERACTIVE EMBED: Handle form submission
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
          sessionName: "Selection Session", // You might want to fetch actual session name
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
        const destinationVideo = allVideosLookup[currentFormLink.destination_video_id];

        if (destinationVideo) {
          if (currentVideo) {
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
      currentVideo,
      sessionId,
      allVideosLookup,
    ]
  );

  // ADDED FROM INTERACTIVE EMBED: Handle form cancellation
  const handleFormCancel = () => {
    setIsVideoPaused(false);
    isVideoPlayingRef.current = true;
    setCurrentForm(null);
    setCurrentFormLink(null);
  };

  // ADDED FROM INTERACTIVE EMBED: Function to handle navigation button click
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

  // ADDED FROM INTERACTIVE EMBED: Function to close navigation video and return to main content
  const handleCloseNavigationVideo = useCallback(() => {
    console.log("Closing navigation video, returning to main content");
    setShowNavigationVideo(false);
    setNavigationVideo(null);
    console.log(
      "Navigation video closed, main session should show with navigation button"
    );
  }, []);

  // ADDED FROM INTERACTIVE EMBED: Separate handler for navigation video end
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

  const handleAnswerSelect = (answerId: string) => {
    if (!currentQuestion) return;

    // Update selected answers
    const newSelectedAnswers = {
      ...selectedAnswers,
      [currentQuestion.id]: answerId,
    };
    setSelectedAnswers(newSelectedAnswers);

    // Check if we have answers for all questions
    const allQuestionsAnswered = questions.every(
      (q) => newSelectedAnswers[q.id] !== undefined
    );

    if (allQuestionsAnswered) {
      // Find the matching combination
      const selectedAnswerIds = questions.map((q) => newSelectedAnswers[q.id]);
      const matchingCombination = combinations.find((combo) =>
        combo.answers.every((answerId) => selectedAnswerIds.includes(answerId))
      );

      if (matchingCombination?.solution_id) {
        const solution = solutions.find(
          (s) => s.id === matchingCombination.solution_id
        );
        setCurrentSolution(solution || null);
        return;
      }
    }

    // Move to next video with a question
    const currentIndex = videos.findIndex((v) => v.id === currentVideo?.id);
    const nextVideo = videos
      .slice(currentIndex + 1)
      .find((v) => questions.some((q) => q.video_id === v.id));

    if (nextVideo) {
      if (currentVideo) {
        setVideoHistory((prev) => [...prev, currentVideo]);
      }
      setCurrentVideo(nextVideo);
    } else {
      // No more videos with questions - show solution if we have one
      const selectedAnswerIds = questions.map((q) => newSelectedAnswers[q.id]);
      const finalCombination = combinations.find((combo) =>
        combo.answers.every((answerId) => selectedAnswerIds.includes(answerId))
      );

      if (finalCombination?.solution_id) {
        const solution = solutions.find(
          (s) => s.id === finalCombination.solution_id
        );
        setCurrentSolution(solution || null);
      }
    }

    setShowQuestions(false);
  };

  const goToPreviousVideo = () => {
    if (videoHistory.length === 0) return;
    const previousVideo = videoHistory[videoHistory.length - 1];
    setVideoHistory((prev) => prev.slice(0, -1));
    setCurrentVideo(previousVideo);
    setShowQuestions(false);
  };

  const goToFirstVideo = () => {
    if (videos.length > 0) {
      setCurrentVideo(videos[0]);
      setCurrentSolution(null);
      setSelectedAnswers({});
      setShowQuestions(false);
      setVideoHistory([]);
    }
  };

  const isFirstVideo = () => videoHistory.length === 0;

  if (loading) {
    return null;
  }

  if (error) {
    return <div className="text-center p-4 text-red-500">{error}</div>;
  }

  if (currentSolution) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-20">
        <h2 className="text-2xl font-bold mb-4">Session Complete</h2>
        <p className="text-gray-600 mb-6">
          Based on your selections, here is your solution:
        </p>
        <div className="w-full max-w-3xl">
          <SolutionDisplay solution={currentSolution} />
        </div>
        <div className="mt-6">
          <Button
            onClick={goToFirstVideo}
            className="bg-white/90 hover:bg-white text-gray-900"
          >
            Start Over
          </Button>
        </div>
      </div>
    );
  }

  // ADDED FROM INTERACTIVE EMBED: If navigation video is showing, render it with proper handlers and links
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
        showBackButton={!isFirstVideo()}
        hoveredLinkId={String(hoveredLinkId)}
        setHoveredLinkId={setHoveredLinkId}
        currentForm={currentForm}
        onFormSubmit={handleFormSubmit}
        onFormLoading={isFormSubmitting}
        onFormCancel={handleFormCancel}
        isPaused={isVideoPaused}
        currentFormLink={currentFormLink}
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
        {showQuestions && currentQuestion && (
          <div className="absolute right-4 top-1/2 transform -translate-y-1/2 w-96 space-y-4">
            <div className="bg-white/30 backdrop-blur-sm rounded-lg p-4 shadow-lg border border-white/60">
              <div className="flex items-center gap-2 mb-2">
                <Questions className="text-white" />
                <span className="text-white font-semibold text-sm uppercase tracking-wider">
                  Question
                </span>
              </div>
              <h3 className="text-lg text-white text-[16px] font-bold pl-2">
                {currentQuestion.question_text}
              </h3>
            </div>

            <hr className="border-white/60 w-full" />

            <div className="space-y-4">
              {currentQuestion.answers.map((answer) => (
                <div
                  key={answer.id}
                  className="bg-white/30 backdrop-blur-sm rounded-lg p-4 shadow-lg border border-white/60 cursor-pointer 
                            hover:bg-white/40 transition-colors duration-200"
                  onClick={() => handleAnswerSelect(answer.id)}
                >
                  <div className="flex items-center gap-3">
                    <Answers className="text-white" />
                    <p className="text-white font-semibold text-[16px]">
                      {answer.answer_text}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CommonVideoPlayer>
    </div>
  );
}