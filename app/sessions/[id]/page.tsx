"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { SessionType, VideoType, Question, sessionTypes } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { LinearSessionView } from "./LinearViewSession";
import { InteractiveSessionView } from "./InteractiveViewSesion";
import SelectionSessionView from "./SelectionView";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { TreeViewSession } from "./TreeViewSession";
import { EditIcon } from "@/components/icons";

export default function SessionViewPage() {
  const { id } = useParams();
  const router = useRouter();
  const [session, setSession] = useState<SessionType | null>(null);
  const [videos, setVideos] = useState<VideoType[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [treeViewEnabled, setTreeViewEnabled] = useState(false);

  useEffect(() => {
    if (id) {
      fetchSession();
    }
  }, [id]);

  const fetchSession = async () => {
    setLoading(true);
    try {
      // Fetch session
      const { data: sessionData, error: sessionError } = await supabase
        .from("sessions")
        .select("*")
        .eq("id", id)
        .single();

      if (sessionError || !sessionData) {
        throw sessionError || new Error("Session not found");
      }

      setSession(sessionData);

      // Fetch videos
      const { data: videosData, error: videosError } = await supabase
        .from("videos")
        .select("*")
        .eq("session_id", id)
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
      console.error("Error fetching session:", error);
      router.push("/sessions");
    } finally {
      setLoading(false);
    }
  };

  const renderSessionContent = () => {
    if (treeViewEnabled) {
      return <TreeViewSession videos={videos} questions={questions} />;
    }

    switch (session?.session_type) {
      case "linear":
        return <LinearSessionView sessionId={session.id} />;
      case "interactive":
        return <InteractiveSessionView sessionId={session.id} />;
      case "selection":
        return <SelectionSessionView sessionId={session.id} />;
      default:
        return <div>Unknown session type</div>;
    }
  };

  if (loading) {
    return (
      <div className=" w-full mx-auto py-8">
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
      <div className=" w-full mx-auto py-8">
        <div className="text-center py-12">
          <h3 className="text-lg font-medium mb-2">Session not found</h3>
          <Button onClick={() => router.push("/sessions")} className="mt-4">
            Back to Sessions
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className=" py-4">
      <div className="flex items-center justify-between p-4">
  <div>
    <p 
      className="cursor-pointer hover:underline text-[13px] text-[#7E8B9F] font-medium" 
      onClick={() => router.push("/sessions")}
    >
      Back to Session Maker
    </p>
  </div>
  <div className="flex gap-4">
    <Button variant="outline" className="mt-4 cursor-pointer">
      Edit Session
    </Button>
    <Button className="mt-4 flex items-center gap-2 cursor-pointer">
      <EditIcon className="w-4 h-4 text-white "/> 
      Share Session
    </Button>
  </div>
</div>
      <Card className="border-none shadow-none">
        <CardHeader className="px-6 border-b border-gray-200 ">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle className="text-2xl font-semibold">
                Session details
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Below are the details of the session you have added.
              </p>
            </div>
            {session.session_type === sessionTypes.INTERACTIVE && (
              <div className="flex items-center space-x-2">
                <Switch
                  id="tree-view-mode"
                  checked={treeViewEnabled}
                  onCheckedChange={setTreeViewEnabled}
                />
                <Label htmlFor="tree-view-mode text-[16px] text-[#242B42] font-semibold">
                  Enable Tree View
                </Label>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="px-0 space-y-6">
          {/* Session Info Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 px-6  pb-8 border-b border-gray-200">
            <div>
              <h3 className="text-sm font-medium text-gray-500">
                Session Name
              </h3>
              <p className="text-base font-medium mt-1">{session.title}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">
                Session Type
              </h3>
              <p className="text-base font-medium mt-1 capitalize">
                {session.session_type}
              </p>
            </div>

             <div>
              <h3 className="text-sm font-medium text-gray-500">Session Id</h3>
              <p className="text-base font-medium mt-1 capitalize">
                {session.id}
              </p>
            </div>
          </div>

          {/* Content Section */}
          <div className="px-6">{renderSessionContent()}</div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 px-6 pt-4 border-t border-gray-200">
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
