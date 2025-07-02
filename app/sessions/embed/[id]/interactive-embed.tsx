"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { VideoType, Question, Answer, Solution } from "@/lib/types";
import { Answers, DestinationVedio, Questions } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";
import { SolutionCard } from "@/components/SolutionCard";

export function InteractiveVideoPlayer({ sessionId }: { sessionId: string }) {
  const [videos, setVideos] = useState<VideoType[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentVideoId, setCurrentVideoId] = useState<string | null>(null);
  const [solutions, setSolutions] = useState<Solution[]>([]);
  const [solutionsExpanded, setSolutionsExpanded] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

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
        if (videosData && videosData.length > 0) {
          setCurrentVideoId(videosData[0].id);
        }

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

        // Fetch solutions
        const { data: solutionsData, error: solutionsError } = await supabase
          .from("solutions")
          .select("*")
          .eq("session_id", sessionId);

        if (solutionsError) throw solutionsError;

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

  const handleAnswerClick = (destinationVideoId: string | null) => {
    if (destinationVideoId) {
      setCurrentVideoId(destinationVideoId);
      // Scroll to the top to see the new video
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const currentVideo = videos.find(video => video.id === currentVideoId);
  const currentVideoQuestions = questions.filter(q => q.video_id === currentVideoId);

  if (loading) {
    return <div className="p-6 text-center">Loading interactive session...</div>;
  }

  if (!currentVideo) {
    return <div className="p-6 text-center">No videos found</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-8">
      {/* Current Video Player */}
      <div className="border rounded-lg overflow-hidden bg-white shadow-sm">
        <div className="p-4 border-b bg-gray-50">
          <h3 className="text-lg font-medium">
            {currentVideo.title || "Video Name"}
          </h3>
        </div>
        
        <div className="p-4">
          <video
            ref={videoRef}
            src={currentVideo.url}
            controls
            autoPlay
            className="w-full aspect-video object-cover rounded-lg bg-black"
          />
        </div>
      </div>

      {/* Questions for current video */}
      {currentVideoQuestions.length > 0 && (
        <div className="border rounded-lg overflow-hidden bg-white shadow-sm">
          <div className="p-4 border-b bg-gray-50">
            <h3 className="text-lg font-medium">Questions</h3>
          </div>
          
          <div className="p-4 space-y-6">
            {currentVideoQuestions.map((question) => (
              <div key={question.id} className="space-y-4">
                <div className="flex items-start gap-3 pb-3 border-b border-gray-200">
                  <div className="pt-1">
                    <Questions className="w-[15px] h-[14.35px]" />
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

                <div className="space-y-3">
                  {question.answers.map((answer, index) => (
                    <button
                      key={answer.id}
                      className="w-full text-left"
                      onClick={() => handleAnswerClick(answer.destination_video_id)}
                    >
                      <div className="flex items-start gap-3 bg-[#EBEEF4] rounded-md p-3 border border-[#EBEEF4] hover:bg-[#D6E0F0] transition-colors">
                        <div className="pt-1">
                          <Answers className="w-[15px] h-[14.35px]" />
                        </div>
                        <div className="flex-1">
                          <h5 className="font-medium text-[12px] text-[#242B42]">
                            Answer {index + 1}
                          </h5>
                          <p className="text-[#242B42] text-[16px] font-semibold">
                            {answer.answer_text}
                          </p>
                          {answer.destination_video && (
                            <p className="text-sm text-gray-500 mt-1">
                              Goes to: {answer.destination_video.title}
                            </p>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Solutions Section - Only show after last video */}
      {solutions.length > 0 && (
        <div className="border rounded-lg overflow-hidden">
          <div className="flex items-center justify-between py-4 px-4 bg-white">
            <h2 className="text-xl font-bold">Solutions</h2>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setSolutionsExpanded(!solutionsExpanded)}
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
              <div className="grid grid-cols-1 gap-4 px-4">
                {solutions.map((solution) => (
                  <SolutionCard
                    key={solution.id}
                    solution={solution}
                    readOnly={true}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}