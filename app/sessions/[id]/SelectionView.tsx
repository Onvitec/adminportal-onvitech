"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Video = {
  id: string;
  title: string;
  url: string;
  session_id: string;
  order_index: number;
  is_solution: boolean;
};

type Question = {
  id: string;
  question_text: string;
  video_id: string;
  answers: Answer[];
};

type Answer = {
  id: string;
  answer_text: string;
  question_id: string;
};

type AnswerCombination = {
  id: string;
  session_id: string;
  destination_video_id: string;
  destination_video: Video;
  combination_answers: {
    answer_id: string;
    answer: Answer & {
      question: Question & {
        video: Video;
      };
    };
  }[];
};

export default function SelectionSessionView({
  sessionId,
}: {
  sessionId: string;
}) {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [solutionVideos, setSolutionVideos] = useState<Video[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [combinations, setCombinations] = useState<AnswerCombination[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (sessionId) {
      fetchSessionData();
    }
  }, [sessionId]);

  const fetchSessionData = async () => {
    setLoading(true);
    try {
      // Fetch session details
      const { data: sessionData, error: sessionError } = await supabase
        .from("sessions")
        .select("*")
        .eq("id", sessionId)
        .single();

      if (sessionError || !sessionData) {
        throw sessionError || new Error("Session not found");
      }

      setSession(sessionData);

      // Fetch all videos (both regular and solution)
      const { data: videosData, error: videosError } = await supabase
        .from("videos")
        .select("*")
        .eq("session_id", sessionId)
        .order("order_index", { ascending: true });

      if (videosError) throw videosError;

      // Separate regular videos from solution videos
      const regularVideos = (videosData || []).filter((v) => !v.is_solution);
      const solutionVideos = (videosData || []).filter((v) => v.is_solution);

      setVideos(regularVideos);
      setSolutionVideos(solutionVideos);

      // Fetch questions for these videos
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

          return {
            ...question,
            answers: answersData || [],
          };
        })
      );

      setQuestions(questionsWithAnswers);

      // Fetch answer combinations
      const { data: combinationsData, error: combinationsError } =
        await supabase
          .from("answer_combinations")
          .select(
            `
          *,
          destination_video:destination_video_id(*),
          combination_answers(
            *,
            answer:answer_id(
              *,
              question:question_id(
                *,
                video:video_id(*)
              )
            )
          )
        `
          )
          .eq("session_id", sessionId);

      if (combinationsError) throw combinationsError;

      setCombinations(combinationsData || []);
    } catch (error) {
      console.error("Error fetching session data:", error);
      router.push("/sessions");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8 max-w-4xl">
        <div className="flex justify-center items-center min-h-[300px]">
          <div className="animate-pulse text-muted-foreground">
            Loading session details...
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="container mx-auto py-8 max-w-4xl">
        <div className="text-center py-12 ">
          <h3 className="text-lg font-medium mb-2">Session not found</h3>
          <Button onClick={() => router.push("/sessions")} className="mt-4">
            Back to Sessions
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <Card className="border-none shadow-none px-4">
        <CardHeader className="px-0">
          <CardTitle className="text-2xl font-semibold">
            Session details
          </CardTitle>
          <p className="text-sm text-gray-600">
            Below are the details of the selection-based session.
          </p>
        </CardHeader>

        <CardContent className="px-0 space-y-6">
          {/* Session Info Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-lg">
            <div>
              <h3 className="text-sm font-medium text-gray-500">
                Session Name
              </h3>
              <p className="text-base font-medium">{session.title}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">
                Session Type
              </h3>
              <p className="text-base font-medium">Selection-Based</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">User ID</h3>
              <p className="text-base font-medium">{session.created_by}</p>
            </div>
          </div>

          {/* Content Videos Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Content Videos</h3>
            {videos.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {videos.map((video) => {
                  const videoQuestions = questions.filter(
                    (q) => q.video_id === video.id
                  );
                  return (
                    <div
                      key={video.id}
                      className="border rounded-lg overflow-hidden"
                    >
                      <video
                        src={video.url}
                        controls
                        className="w-full aspect-video object-cover"
                      />
                      <div className="p-3 bg-white">
                        <h4 className="text-sm font-medium">{video.title}</h4>
                        {videoQuestions.length > 0 && (
                          <p className="text-xs text-gray-500 mt-1">
                            {videoQuestions.length} question
                            {videoQuestions.length !== 1 ? "s" : ""}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">
                No content videos added
              </p>
            )}
          </div>

          {/* Solution Videos Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Solution Videos</h3>
            {solutionVideos.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {solutionVideos.map((video) => (
                  <div
                    key={video.id}
                    className="border rounded-lg overflow-hidden"
                  >
                    <video
                      src={video.url}
                      controls
                      className="w-full aspect-video object-cover"
                    />
                    <div className="p-3 bg-white">
                      <h4 className="text-sm font-medium">{video.title}</h4>
                      <p className="text-xs text-blue-600 mt-1">
                        Solution Video
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">
                No solution videos added
              </p>
            )}
          </div>

          {/* Questions Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Questions & Answers</h3>
            {questions.length > 0 ? (
              <div className="space-y-6">
                {questions.map((question) => {
                  const video =
                    videos.find((v) => v.id === question.video_id) ||
                    solutionVideos.find((v) => v.id === question.video_id);
                  return (
                    <div
                      key={question.id}
                      className="border rounded-lg overflow-hidden"
                    >
                      <div className="p-4 bg-white">
                        <div className="flex items-start gap-4">
                          {video && (
                            <video
                              src={video.url}
                              controls
                              className="w-1/3 aspect-video object-cover rounded"
                            />
                          )}
                          <div className="flex-1">
                            <h4 className="font-medium">
                              Question: {question.question_text}
                            </h4>
                            <div className="mt-3 space-y-2">
                              <h5 className="text-sm font-medium text-gray-700">
                                Possible Answers:
                              </h5>
                              <ul className="space-y-1">
                                {question.answers.map((answer) => (
                                  <li key={answer.id} className="text-sm">
                                    - {answer.answer_text}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">
                No questions added
              </p>
            )}
          </div>

          {/* Answer Combinations Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Answer Combinations</h3>
            {combinations.length > 0 ? (
              <div className="space-y-4">
                {combinations.map((combination) => (
                  <div
                    key={combination.id}
                    className="border rounded-lg overflow-hidden"
                  >
                    <div className="p-4 bg-white">
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        {combination.combination_answers.map((ca, index) => (
                          <div key={index} className="flex items-center gap-2">
                            {index > 0 && (
                              <span className="text-gray-400">→</span>
                            )}
                            <div className="bg-gray-100 px-3 py-1 rounded-full text-sm">
                              <span className="font-medium">
                                {ca.answer.question.video.title}:
                              </span>{" "}
                              {ca.answer.answer_text}
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">Leads to:</span>
                        {combination.destination_video ? (
                          <div className="flex items-center gap-2">
                            <video
                              src={combination.destination_video.url}
                              controls
                              className="w-24 aspect-video object-cover rounded"
                            />
                            <span className="text-sm">
                              {combination.destination_video.title}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500">
                            No destination set
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">
                No answer combinations configured
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => router.push("/sessions")}>
              Back
            </Button>
            <Button onClick={() => router.push(`/sessions/edit/${sessionId}`)}>
              Edit Session
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
