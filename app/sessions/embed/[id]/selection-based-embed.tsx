"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { VideoType, Question, Answer, Solution, VideoLink } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { Questions, Answers } from "@/components/icons";
import { SolutionDisplay } from "../SolutionDisplay";
import { CommonVideoPlayer } from "../CommonVideoPlaye";

type AnswerCombination = {
  id: string;
  answers: string[];
  solution_id: string | null;
};

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
  const [hoveredLinkId, setHoveredLinkId] = useState<number | null>(null);

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

        // Fetch questions and answers
        const { data: questionsData, error: questionsError } = await supabase
          .from("questions")
          .select("*, answers(*)")
          .in(
            "video_id",
            videosData.map((v) => v.id)
          );

        if (questionsError) throw questionsError;

        setQuestions(questionsData || []);

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

        // Fetch video links
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

        // Group links by video_id
        const groupedLinks: Record<string, VideoLink[]> = {};
        linksWithDestinations.forEach((link) => {
          if (!groupedLinks[link.video_id!]) groupedLinks[link.video_id!] = [];
          groupedLinks[link.video_id!].push(link);
        });

        setVideoLinks(groupedLinks);
      } catch (error) {
        console.error("Error fetching selection session data:", error);
        setError(error instanceof Error ? error.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [sessionId]);

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

  const handleVideoLinkClick = (link: VideoLink) => {
    if (link.link_type === "url" && link.url) {
      // Open external URL in new tab
      window.open(link.url, "_blank", "noopener,noreferrer");
    } else if (link.link_type === "video" && link.destination_video) {
      // Navigate to destination video
      if (currentVideo) {
        setVideoHistory((prev) => [...prev, currentVideo]);
      }
      setCurrentVideo(link.destination_video as VideoType);
      setShowQuestions(false);
    }
  };

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
        hoverLinkedId={hoveredLinkId}
        setHoveredLinkId={setHoveredLinkId}
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
