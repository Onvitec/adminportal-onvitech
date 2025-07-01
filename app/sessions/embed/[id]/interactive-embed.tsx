"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { VideoType, Question, Answer } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Loader2 } from "lucide-react";

export function InteractiveSessionEmbed({ sessionId }: { sessionId: string }) {
  const [videos, setVideos] = useState<VideoType[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentVideo, setCurrentVideo] = useState<VideoType | null>(null);
  const [currentQuestions, setCurrentQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showQuestions, setShowQuestions] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

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
        setCurrentVideo(videosData[0]); // Set first video as current

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
  }, [sessionId]);

  useEffect(() => {
    if (currentVideo && questions.length > 0) {
      const videoQuestions = questions.filter(q => q.video_id === currentVideo.id);
      setCurrentQuestions(videoQuestions);
      setShowQuestions(false);
    }
  }, [currentVideo, questions]);

  const handleVideoEnd = () => {
    setIsPlaying(false);
    if (currentQuestions.length > 0) {
      setShowQuestions(true);
    } else {
      // If no questions, proceed to next video in order
      const currentIndex = videos.findIndex(v => v.id === currentVideo?.id);
      if (currentIndex < videos.length - 1) {
        setCurrentVideo(videos[currentIndex + 1]);
      }
    }
  };

  const handleAnswerSelect = (answer: Answer & { destination_video?: VideoType }) => {
    if (answer.destination_video) {
      setCurrentVideo(answer.destination_video);
      setIsPlaying(true);
    } else {
      // If no destination video, proceed to next video in order
      const currentIndex = videos.findIndex(v => v.id === currentVideo?.id);
      if (currentIndex < videos.length - 1) {
        setCurrentVideo(videos[currentIndex + 1]);
        setIsPlaying(true);
      }
    }
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
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
    <div className="flex flex-col h-full">
      {/* Video Player */}
      <div className="relative bg-black">
        <video
          ref={videoRef}
          src={currentVideo.url}
          className="w-full aspect-video"
          controls={false}
          onEnded={handleVideoEnd}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        />

        {!isPlaying && (
          <div 
            className="absolute inset-0 flex items-center justify-center cursor-pointer"
            onClick={togglePlayPause}
          >
            <div className="w-16 h-16 bg-white/70 rounded-full flex items-center justify-center">
              <svg
                className="w-8 h-8 text-black"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          </div>
        )}
      </div>

      {/* Video Title */}
      <div className="p-4 bg-white border-b">
        <h2 className="text-lg font-medium">{currentVideo.title}</h2>
      </div>

      {/* Questions & Answers (shown after video ends) */}
      {showQuestions && currentQuestions.length > 0 && (
        <div className="p-4 bg-gray-50 flex-1 overflow-y-auto">
          {currentQuestions.map((question) => (
            <div key={question.id} className="mb-6">
              <h3 className="text-lg font-medium mb-3">{question.question_text}</h3>
              <div className="space-y-2">
                {question.answers.map((answer) => (
                  <Button
                    key={answer.id}
                    variant="outline"
                    className="w-full text-left justify-start py-4 px-4 border-gray-300 hover:bg-gray-100"
                    onClick={() => handleAnswerSelect(answer)}
                  >
                    {answer.answer_text}
                  </Button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Progress Indicator */}
      <div className="p-2 bg-white border-t text-sm text-gray-500 text-center">
        Video {videos.findIndex(v => v.id === currentVideo.id) + 1} of {videos.length}
      </div>
    </div>
  );
}