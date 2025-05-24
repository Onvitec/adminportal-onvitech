'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { SessionType } from "@/lib/types";

type Module = {
  id: string;
  title: string;
  session_id: string;
  order_index: number;
  videos: Video[];
};

type Video = {
  id: string;
  title: string;
  url: string;
  module_id: string;
  session_id: string;
  order_index: number;
  is_interactive: boolean;
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
  destination_video_id: string | null;
  destination_video?: Video;
};

export default function SessionViewPage() {
  const { id } = useParams();
  const router = useRouter();
  const [session, setSession] = useState<SessionType | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [interactiveVideos, setInteractiveVideos] = useState<Video[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchSessionData();
    }
  }, [id]);

  const fetchSessionData = async () => {
    setLoading(true);
    try {
      // Fetch session details
      const { data: sessionData, error: sessionError } = await supabase
        .from("sessions")
        .select("*")
        .eq("id", id)
        .single();

      if (sessionError || !sessionData) {
        throw sessionError || new Error("Session not found");
      }

      setSession(sessionData);

      if (sessionData.session_type === "linear") {
        // Fetch modules with their videos for linear sessions
        const { data: modulesData, error: modulesError } = await supabase
          .from("modules")
          .select("*")
          .eq("session_id", id)
          .order("order_index", { ascending: true });

        if (modulesError) throw modulesError;

        const modulesWithVideos = await Promise.all(
          (modulesData || []).map(async (module) => {
            const { data: videosData, error: videosError } = await supabase
              .from("videos")
              .select("*")
              .eq("module_id", module.id)
              .order("order_index", { ascending: true });

            if (videosError) throw videosError;

            return {
              ...module,
              videos: videosData || [],
            };
          })
        );

        setModules(modulesWithVideos);
      } else {
        // Fetch interactive videos and their questions/answers
        const { data: videosData, error: videosError } = await supabase
          .from("videos")
          .select("*")
          .eq("session_id", id)
          .order("order_index", { ascending: true });

        if (videosError) throw videosError;

        setInteractiveVideos(videosData || []);

        // Fetch questions for these videos
        const { data: questionsData, error: questionsError } = await supabase
          .from("questions")
          .select("*")
          .in("video_id", videosData?.map(v => v.id) || []);

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

        setQuestions(questionsWithAnswers);
      }
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
    <div className="container py-8 ">
      <Card className="border-none shadow-none px-4">
        <CardHeader className="px-0">
          <CardTitle className="text-2xl font-semibold">
            Session details
          </CardTitle>
          <p className="text-sm text-gray-600">
            Below are the details of the session you have added.
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
              <p className="text-base font-medium">
                {session.session_type === "linear"
                  ? "Linear Flow"
                  : "Interactive"}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">User ID</h3>
              <p className="text-base font-medium">{session.created_by}</p>
            </div>
          </div>

          {/* Content Section */}
          {session.session_type === "linear" ? (
            <div className="space-y-4">
              {modules.map((module) => (
                <ModuleCard key={module.id} module={module} />
              ))}
            </div>
          ) : (
            <InteractiveSessionView 
              videos={interactiveVideos} 
              questions={questions} 
            />
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => router.push("/sessions")}>
              Back
            </Button>
            <Button onClick={() => router.push(`/sessions/edit/${id}`)}>
              Edit Session
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ModuleCard({ module }: { module: Module }) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="flex items-center justify-between p-4 bg-white">
        <h3 className="text-lg font-medium">{module.title}</h3>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? (
            <ChevronUp className="h-5 w-5" />
          ) : (
            <ChevronDown className="h-5 w-5" />
          )}
        </Button>
      </div>

      {isExpanded && (
        <div className="bg-gray-50 p-4 border-t">
          {module.videos.length > 0 ? (
            <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {module.videos.map((video) => (
                <li
                  key={video.id}
                  className="bg-white rounded-lg overflow-hidden shadow-sm border"
                >
                  <video
                    src={video.url}
                    controls
                    className="w-full aspect-video object-cover"
                  />
                  <div className="p-3">
                    <h4 className="text-sm font-medium">{video.title}</h4>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500 text-center py-4">
              No videos added
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function InteractiveSessionView({ 
  videos, 
  questions 
}: { 
  videos: Video[], 
  questions: Question[] 
}) {
  return (
    <div className="space-y-6">
      {videos.map((video) => {
        const videoQuestions = questions.filter(q => q.video_id === video.id);
        
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
                    <div key={question.id} className="bg-white p-4 rounded-lg border">
                      <h4 className="font-medium mb-3">Question: {question.question_text}</h4>
                      
                      <div className="space-y-2">
                        <h5 className="text-sm font-medium text-gray-700">Possible Answers:</h5>
                        <ul className="space-y-2">
                          {question.answers.map((answer) => (
                            <li key={answer.id} className="flex items-start gap-2">
                              <span className="text-sm">- {answer.answer_text}</span>
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