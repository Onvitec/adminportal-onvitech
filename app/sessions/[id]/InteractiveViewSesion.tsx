"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { VideoType, Question, Answer } from "@/lib/types";

export function InteractiveSessionView({ sessionId }: { sessionId: string }) {
  const [videos, setVideos] = useState<VideoType[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);

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
    return <div>Loading interactive session...</div>;
  }

  return (
    <div className="space-y-6">
      {videos.map((video) => {
        const videoQuestions = questions.filter((q) => q.video_id === video.id);

        return (
          <div key={video.id} className="border rounded-lg overflow-hidden">
            <div className="p-4 bg-white">
              <h3 className="text-lg font-medium">{video.title}</h3>
            </div>

            <div className="bg-gray-50 p-4 border-t">
              <div className="mb-4">
                <video
                  src={video.url}
                  controls
                  className="w-full aspect-video object-cover rounded-lg"
                />
              </div>

              {videoQuestions.length > 0 ? (
                <div className="space-y-4">
                  {videoQuestions.map((question) => (
                    <div
                      key={question.id}
                      className="bg-white p-4 rounded-lg border"
                    >
                      <h4 className="font-medium mb-3">
                        Question: {question.question_text}
                      </h4>

                      <div className="space-y-2">
                        <h5 className="text-sm font-medium text-gray-700">
                          Possible Answers:
                        </h5>
                        <ul className="space-y-2">
                          {question.answers.map((answer) => (
                            <li
                              key={answer.id}
                              className="flex items-start gap-2"
                            >
                              <span className="text-sm">
                                - {answer.answer_text}
                              </span>
                              {answer.destination_video && (
                                <span className="text-xs text-gray-500">
                                  (Leads to: {answer.destination_video.title})
                                </span>
                              )}
                            </li>
                          ))}
                        </ul>
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
        );
      })}
    </div>
  );
}
