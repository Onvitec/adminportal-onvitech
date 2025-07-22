"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { VideoType, Question, Answer, Solution } from "@/lib/types";
import { Answers, DestinationVedio, Questions } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";
import { SolutionCard } from "@/components/SolutionCard";
import { Loader } from "@/components/Loader";

export function InteractiveSessionView({ sessionId }: { sessionId: string }) {
  const [videos, setVideos] = useState<VideoType[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);

  const [solutions, setSolutions] = useState<Solution[]>([]);
  const [solutionsExpanded, setSolutionsExpanded] = useState(true);

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

  if (loading) {
    return (
      <div className="p-6 text-center"><Loader size="md"/></div>
    );
  }

  return (
    <div className="space-y-8  py-6">
      {videos.map((video) => {
        const videoQuestions = questions.filter((q) => q.video_id === video.id);

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
              <div className="w-full md:w-2/5 p-4 ">
                <video
                  src={video.url}
                  controls
                  className="w-full aspect-video object-cover rounded-lg bg-black h-[351px]"
                />
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
                                      <h5 className="font-medium text-gray-800 truncate">
                                        Destination Video
                                      </h5>
                                      <p className="text-gray-600 text-sm truncate">
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
              <div className="grid grid-cols-1 gap-4">
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
