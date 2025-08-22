"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { VideoType, Question, Answer } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Loader2, ChevronLeft } from "lucide-react";
import { Questions } from "@/components/icons";

export function InteractiveSessionEmbed({ sessionId }: { sessionId: string }) {
  const [videos, setVideos] = useState<VideoType[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentVideo, setCurrentVideo] = useState<VideoType | null>(null);
  const [currentQuestions, setCurrentQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showQuestions, setShowQuestions] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [mouseActive, setMouseActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const mouseTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
          .in("video_id", videosData.map((v) => v.id));

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

        setQuestions(questionsWithAnswers);
      } catch (error) {
        console.error("Error fetching interactive session data:", error);
        setError(error instanceof Error ? error.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    return () => {
      if (mouseTimeoutRef.current) {
        clearTimeout(mouseTimeoutRef.current);
      }
    };
  }, [sessionId]);

  useEffect(() => {
    if (currentVideo && questions.length > 0) {
      const videoQuestions = questions.filter(q => q.video_id === currentVideo.id);
      setCurrentQuestions(videoQuestions);
      setShowQuestions(false);
      
      if (videoRef.current) {
        videoRef.current.pause();
        setIsPlaying(false);
        setShowControls(true);
      }
    }
  }, [currentVideo, questions]);

  const handleVideoEnd = () => {
    setIsPlaying(false);
    setShowControls(true);
    if (currentQuestions.length > 0) {
      setShowQuestions(true);
    } else {
      const currentIndex = videos.findIndex(v => v.id === currentVideo?.id);
      if (currentIndex < videos.length - 1) {
        setCurrentVideo(videos[currentIndex + 1]);
      }
    }
  };

  const handleAnswerSelect = (answer: Answer & { destination_video?: VideoType }) => {
    if (answer.destination_video) {
      setCurrentVideo(answer.destination_video);
    } else {
      const currentIndex = videos.findIndex(v => v.id === currentVideo?.id);
      if (currentIndex < videos.length - 1) {
        setCurrentVideo(videos[currentIndex + 1]);
      }
    }
    setShowQuestions(false);
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

  const goToFirstVideo = () => {
    if (videos.length > 0) {
      setCurrentVideo(videos[0]);
      setShowQuestions(false);
      if (videoRef.current) {
        videoRef.current.pause();
        setIsPlaying(false);
        setShowControls(true);
      }
    }
  };

  if (loading) {
  return null;
}

  if (error) {
    return (
      <div className="text-center p-4 text-red-500">
        {error}
      </div>
    );
  }

  if (!currentVideo) {
    return (
      <div className="text-center p-4">
        No video content available
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full rounded-xl overflow-hidden">
      <div 
        className="relative flex-1 bg-black rounded-xl"
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
        <video
          ref={videoRef}
          src={currentVideo.url}
          className="w-full h-full object-contain rounded-xl cursor-pointer"
          controls={false}
          onClick={togglePlayPause}
          onEnded={handleVideoEnd}
          onPlay={() => setIsPlaying(true)}
          onPause={() => {
            setIsPlaying(false);
            setShowControls(true);
          }}
        />

        {videos.findIndex(v => v.id === currentVideo?.id) > 0 && (
          <div 
            className={`absolute left-4 top-4 bg-white/30 backdrop-blur-sm rounded-lg p-2 shadow-lg border border-white/60 cursor-pointer hover:bg-white/40 transition-all duration-200 ${
              showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
            onClick={goToFirstVideo}
          >
            <ChevronLeft className="w-6 h-6 text-white font-bold" />
          </div>
        )}

        {(showControls || !isPlaying) && (
          <div 
            className={`absolute inset-0 flex items-center justify-center cursor-pointer transition-opacity duration-300 ${
              (mouseActive || !isPlaying) ? 'opacity-100' : 'opacity-0'
            }`}
            onClick={togglePlayPause}
          >
            <div className={`bg-white/30 backdrop-blur-sm rounded-full p-4 shadow-lg border border-white/60 flex items-center justify-center transform transition-all duration-300 hover:scale-110`}>
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

        {showQuestions && currentQuestions.length > 0 && (
          <div className="absolute right-4 top-1/2 transform -translate-y-1/2 w-96 space-y-4">
            {currentQuestions.map((question) => (
              <div key={question.id} className="space-y-4">
                <div className="bg-white/30 backdrop-blur-sm rounded-lg p-4 shadow-lg border border-white/60">
                  <div className="flex items-center gap-2 mb-2">
                    <Questions className="text-white"/>
                    <span className="text-white font-semibold text-sm uppercase tracking-wider">Question</span>
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
                      <p className="text-white font-semibold text-[16px]">{answer.answer_text}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}