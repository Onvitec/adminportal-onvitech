"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  PlusCircle,
} from "lucide-react";
import {DropdownArrow, DropdownUpArrow, DeleteIcon, UploadFile, EditIcon} from "@/components/icons";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { SessionType } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter } from "next/navigation";

type Module = {
  id: string;
  title: string;
  session_id: string;
  order_index: number;
  videos: Video[];
  isExpanded: boolean;
};

type Video = {
  id: string;
  title: string;
  url: string;
  module_id?: string;
  session_id: string;
  order_index: number;
  is_interactive: boolean;
  file?: File | null;
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
};

export default function InteractiveEditPage({
  sessionId,
}: {
  sessionId: string;
}) {
  const [session, setSession] = useState<SessionType | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [interactiveVideos, setInteractiveVideos] = useState<Video[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchSessionData();
  }, [sessionId]);

  const fetchSessionData = async () => {
    setLoading(true);
    try {
      console.log("here?");

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

      if (sessionData.session_type === "linear") {
        // Fetch modules with their videos for linear sessions
        const { data: modulesData, error: modulesError } = await supabase
          .from("modules")
          .select("*")
          .eq("session_id", sessionId)
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
              isExpanded: true,
            };
          })
        );

        setModules(modulesWithVideos);
      } else {
        // Fetch interactive videos and their questions/answers
        const { data: videosData, error: videosError } = await supabase
          .from("videos")
          .select("*")
          .eq("session_id", sessionId)
          .order("order_index", { ascending: true });

        if (videosError) throw videosError;

        setInteractiveVideos(videosData || []);

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
      }
    } catch (error) {
      console.error("Error fetching session data:", error);
      router.push("/sessions");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (!session) return;

      // Update session details
      await supabase
        .from("sessions")
        .update({
          title: session.title,
          created_by: session.created_by,
        })
        .eq("id", session.id);

      if (session.session_type === "linear") {
        // Handle linear session updates
        for (const module of modules) {
          // Update module
          await supabase
            .from("modules")
            .update({
              title: module.title,
              order_index: module.order_index,
            })
            .eq("id", module.id);

          // Handle videos
          for (const video of module.videos) {
            if (video.file) {
              // Upload new video file
              const fileExt = video.file.name.split(".").pop();
              const filePath = `${session.created_by}/${session.id}/${video.id}.${fileExt}`;

              const { error: uploadError } = await supabase.storage
                .from("videos")
                .upload(filePath, video.file, { upsert: true });

              if (uploadError) throw uploadError;

              // Get public URL
              const { data: urlData } = supabase.storage
                .from("videos")
                .getPublicUrl(filePath);

              // Update video record with new URL
              await supabase
                .from("videos")
                .update({
                  title: video.title,
                  url: urlData.publicUrl,
                  order_index: video.order_index,
                })
                .eq("id", video.id);
            } else {
              // Just update video metadata
              await supabase
                .from("videos")
                .update({
                  title: video.title,
                  order_index: video.order_index,
                })
                .eq("id", video.id);
            }
          }
        }
      } else {
        // Handle interactive session updates
        for (const video of interactiveVideos) {
          if (video.file) {
            // Upload new video file
            const fileExt = video.file.name.split(".").pop();
            const filePath = `${session.created_by}/${session.id}/${video.id}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
              .from("videos")
              .upload(filePath, video.file, { upsert: true });

            if (uploadError) throw uploadError;

            // Get public URL
            const { data: urlData } = supabase.storage
              .from("videos")
              .getPublicUrl(filePath);

            // Update video record with new URL
            await supabase
              .from("videos")
              .update({
                title: video.title,
                url: urlData.publicUrl,
                order_index: video.order_index,
              })
              .eq("id", video.id);
          } else {
            // Just update video metadata
            await supabase
              .from("videos")
              .update({
                title: video.title,
                order_index: video.order_index,
              })
              .eq("id", video.id);
          }

          // Handle questions and answers
          const videoQuestions = questions.filter(
            (q) => q.video_id === video.id
          );
          for (const question of videoQuestions) {
            // Update or create question
            const { data: questionData } = await supabase
              .from("questions")
              .upsert({
                id: question.id,
                question_text: question.question_text,
                video_id: video.id,
              })
              .select()
              .single();

            // Handle answers
            for (const answer of question.answers) {
              await supabase.from("answers").upsert({
                id: answer.id,
                answer_text: answer.answer_text,
                question_id: questionData?.id || question.id,
                destination_video_id: answer.destination_video_id,
              });
            }
          }
        }
      }

      router.push(`/sessions/${sessionId}`);
    } catch (error) {
      console.error("Error saving session:", error);
      alert("Failed to save session. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  // Linear session edit handlers
  const updateModuleTitle = (moduleId: string, title: string) => {
    setModules(modules.map((m) => (m.id === moduleId ? { ...m, title } : m)));
  };

  const addModule = () => {
    setModules([
      ...modules,
      {
        id: uuidv4(),
        title: `Module ${modules.length + 1}`,
        session_id: sessionId as string,
        order_index: modules.length,
        videos: [],
        isExpanded: true,
      },
    ]);
  };

  const removeModule = (moduleId: string) => {
    if (modules.length <= 1) return;
    setModules(modules.filter((m) => m.id !== moduleId));
  };

  const toggleModuleExpand = (moduleId: string) => {
    setModules(
      modules.map((m) =>
        m.id === moduleId ? { ...m, isExpanded: !m.isExpanded } : m
      )
    );
  };

  const updateVideoTitle = (
    moduleId: string,
    videoId: string,
    title: string
  ) => {
    setModules(
      modules.map((m) =>
        m.id === moduleId
          ? {
              ...m,
              videos: m.videos.map((v) =>
                v.id === videoId ? { ...v, title } : v
              ),
            }
          : m
      )
    );
  };

  const addVideoToModule = (moduleId: string) => {
    setModules(
      modules.map((m) =>
        m.id === moduleId
          ? {
              ...m,
              videos: [
                ...m.videos,
                {
                  id: uuidv4(),
                  title: `Video ${m.videos.length + 1}`,
                  url: "",
                  module_id: moduleId,
                  session_id: sessionId as string,
                  order_index: m.videos.length,
                  is_interactive: false,
                  file: null,
                },
              ],
            }
          : m
      )
    );
  };

  const removeVideoFromModule = (moduleId: string, videoId: string) => {
    setModules(
      modules.map((m) =>
        m.id === moduleId
          ? {
              ...m,
              videos: m.videos.filter((v) => v.id !== videoId),
            }
          : m
      )
    );
  };

  const handleVideoFileChange = (
    moduleId: string,
    videoId: string,
    file: File | null
  ) => {
    setModules(
      modules.map((m) =>
        m.id === moduleId
          ? {
              ...m,
              videos: m.videos.map((v) =>
                v.id === videoId
                  ? { ...v, file, title: file?.name.split(".")[0] || v.title }
                  : v
              ),
            }
          : m
      )
    );
  };

  // Interactive session edit handlers
  const updateInteractiveVideoTitle = (videoId: string, title: string) => {
    setInteractiveVideos(
      interactiveVideos.map((v) => (v.id === videoId ? { ...v, title } : v))
    );
  };

  const addInteractiveVideo = () => {
    setInteractiveVideos([
      ...interactiveVideos,
      {
        id: uuidv4(),
        title: `Video ${interactiveVideos.length + 1}`,
        url: "",
        session_id: sessionId as string,
        order_index: interactiveVideos.length,
        is_interactive: true,
        file: null,
      },
    ]);
  };

  const removeInteractiveVideo = (videoId: string) => {
    if (interactiveVideos.length <= 1) return;
    setInteractiveVideos(interactiveVideos.filter((v) => v.id !== videoId));
    setQuestions(questions.filter((q) => q.video_id !== videoId));
  };

  const handleInteractiveVideoFileChange = (
    videoId: string,
    file: File | null
  ) => {
    setInteractiveVideos(
      interactiveVideos.map((v) =>
        v.id === videoId
          ? { ...v, file, title: file?.name.split(".")[0] || v.title }
          : v
      )
    );
  };

  const updateQuestionText = (
    videoId: string,
    questionId: string,
    text: string
  ) => {
    setQuestions(
      questions.map((q) =>
        q.id === questionId && q.video_id === videoId
          ? { ...q, question_text: text }
          : q
      )
    );
  };

  const addQuestionToVideo = (videoId: string) => {
    setQuestions([
      ...questions,
      {
        id: uuidv4(),
        question_text: "",
        video_id: videoId,
        answers: [
          {
            id: uuidv4(),
            answer_text: "Answer 1",
            question_id: "",
            destination_video_id: null,
          },
        ],
      },
    ]);
  };

  const removeQuestionFromVideo = (videoId: string, questionId: string) => {
    setQuestions(
      questions.filter((q) => !(q.id === questionId && q.video_id === videoId))
    );
  };

  const updateAnswerText = (
    questionId: string,
    answerId: string,
    text: string
  ) => {
    setQuestions(
      questions.map((q) =>
        q.id === questionId
          ? {
              ...q,
              answers: q.answers.map((a) =>
                a.id === answerId ? { ...a, answer_text: text } : a
              ),
            }
          : q
      )
    );
  };

  const updateAnswerDestination = (
    questionId: string,
    answerId: string,
    destinationVideoId: string | null
  ) => {
    setQuestions(
      questions.map((q) =>
        q.id === questionId
          ? {
              ...q,
              answers: q.answers.map((a) =>
                a.id === answerId
                  ? { ...a, destination_video_id: destinationVideoId }
                  : a
              ),
            }
          : q
      )
    );
  };

  const addAnswerToQuestion = (questionId: string) => {
    setQuestions(
      questions.map((q) =>
        q.id === questionId
          ? {
              ...q,
              answers: [
                ...q.answers,
                {
                  id: uuidv4(),
                  answer_text: `Answer ${q.answers.length + 1}`,
                  question_id: questionId,
                  destination_video_id: null,
                },
              ],
            }
          : q
      )
    );
  };

  const removeAnswerFromQuestion = (questionId: string, answerId: string) => {
    setQuestions(
      questions.map((q) =>
        q.id === questionId
          ? {
              ...q,
              answers: q.answers.filter((a) => a.id !== answerId),
            }
          : q
      )
    );
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
    <div className="container mx-auto py-8 max-w-4xl">
      <Card className="border-none shadow-none px-4">
        <CardHeader className="px-0">
          <CardTitle className="text-2xl font-semibold">Edit Session</CardTitle>
          <p className="text-sm text-gray-600">
            Edit the details of your session below.
          </p>
        </CardHeader>

        <CardContent className="px-0 space-y-6">
          {/* Session Info Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-lg">
            <div className="space-y-1">
              <Label htmlFor="sessionName">Session Name</Label>
              <Input
                id="sessionName"
                value={session.title}
                onChange={(e) =>
                  setSession({ ...session, title: e.target.value })
                }
                placeholder="Session name"
              />
            </div>
            <div>
              <Label>Session Type</Label>
              <div className="text-base font-medium p-2">
                {session.session_type === "linear"
                  ? "Linear Flow"
                  : "Interactive"}
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="userId">User ID</Label>
              <Input
                id="userId"
                value={session.created_by}
                onChange={(e) =>
                  setSession({ ...session, created_by: e.target.value })
                }
                placeholder="User ID"
              />
            </div>
          </div>

          {/* Content Section */}
          {session.session_type === "linear" ? (
            <div className="space-y-4">
              {modules.map((module) => (
                <div
                  key={module.id}
                  className="border rounded-lg overflow-hidden"
                >
                  <div className="flex items-center justify-between p-4 bg-white">
                    <div className="flex items-center gap-2">
                      <Input
                        value={module.title}
                        onChange={(e) =>
                          updateModuleTitle(module.id, e.target.value)
                        }
                        className="w-auto"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleModuleExpand(module.id)}
                      >
                        {module.isExpanded ? (
                          <DropdownUpArrow className="h-5 w-5" />
                        ) : (
                          <DropdownArrow className="h-5 w-5" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeModule(module.id)}
                        disabled={modules.length <= 1}
                      >
                        <DeleteIcon className="h-5 w-5 text-red-500" />
                      </Button>
                    </div>
                  </div>

                  {module.isExpanded && (
                    <div className="bg-gray-50 p-4 border-t space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {module.videos.map((video) => (
                          <div
                            key={video.id}
                            className="bg-white rounded-lg overflow-hidden shadow-sm border p-4"
                          >
                            <div className="space-y-3">
                              <Input
                                value={video.title}
                                onChange={(e) =>
                                  updateVideoTitle(
                                    module.id,
                                    video.id,
                                    e.target.value
                                  )
                                }
                                placeholder="Video title"
                              />

                              {video.url ? (
                                <video
                                  src={video.url}
                                  controls
                                  className="w-full aspect-video object-cover rounded"
                                />
                              ) : (
                                <div className="border border-dashed rounded p-4 text-center">
                                  <p className="text-sm text-gray-500">
                                    No video uploaded
                                  </p>
                                </div>
                              )}

                              <div className="flex justify-between items-center">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="relative"
                                >
                                  <UploadFile className="h-4 w-4 mr-2" />
                                  {video.file ? "Change" : "Upload"}
                                  <input
                                    type="file"
                                    accept="video/mp4,video/quicktime"
                                    onChange={(e) =>
                                      handleVideoFileChange(
                                        module.id,
                                        video.id,
                                        e.target.files?.[0] || null
                                      )
                                    }
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                  />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    removeVideoFromModule(module.id, video.id)
                                  }
                                >
                                  <DeleteIcon className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      <Button
                        variant="outline"
                        onClick={() => addVideoToModule(module.id)}
                        className="w-full"
                      >
                        <PlusCircle className="h-4 w-4 mr-2" />
                        Add Video
                      </Button>
                    </div>
                  )}
                </div>
              ))}

              <Button
                variant="outline"
                onClick={addModule}
                className="w-full border-dashed"
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Add Module
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {interactiveVideos.map((video) => {
                const videoQuestions = questions.filter(
                  (q) => q.video_id === video.id
                );

                return (
                  <div
                    key={video.id}
                    className="border rounded-lg overflow-hidden"
                  >
                    <div className="flex items-center justify-between p-4 bg-white">
                      <div className="flex items-center gap-2">
                        <Input
                          value={video.title}
                          onChange={(e) =>
                            updateInteractiveVideoTitle(
                              video.id,
                              e.target.value
                            )
                          }
                          className="w-auto"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeInteractiveVideo(video.id)}
                          disabled={interactiveVideos.length <= 1}
                        >
                          <DeleteIcon className="h-5 w-5 text-red-500" />
                        </Button>
                      </div>
                    </div>

                    <div className="bg-gray-50 p-4 border-t space-y-4">
                      <div className="space-y-3">
                        {video.url ? (
                          <video
                            src={video.url}
                            controls
                            className="w-full aspect-video object-cover rounded"
                          />
                        ) : (
                          <div className="border border-dashed rounded p-4 text-center">
                            <p className="text-sm text-gray-500">
                              No video uploaded
                            </p>
                          </div>
                        )}

                        <div className="flex justify-between items-center">
                          <Button
                            variant="outline"
                            size="sm"
                            className="relative"
                          >
                            <UploadFile className="h-4 w-4 mr-2" />
                            {video.file ? "Change" : "Upload"}
                            <input
                              type="file"
                              accept="video/mp4,video/quicktime"
                              onChange={(e) =>
                                handleInteractiveVideoFileChange(
                                  video.id,
                                  e.target.files?.[0] || null
                                )
                              }
                              className="absolute inset-0 opacity-0 cursor-pointer"
                            />
                          </Button>
                        </div>
                      </div>

                      {videoQuestions.length > 0 ? (
                        <div className="space-y-4">
                          {videoQuestions.map((question) => (
                            <div
                              key={question.id}
                              className="bg-white p-4 rounded-lg border space-y-3"
                            >
                              <div className="flex justify-between items-start">
                                <Textarea
                                  value={question.question_text}
                                  onChange={(e) =>
                                    updateQuestionText(
                                      video.id,
                                      question.id,
                                      e.target.value
                                    )
                                  }
                                  placeholder="Enter your question"
                                  className="min-h-[80px]"
                                />
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    removeQuestionFromVideo(
                                      video.id,
                                      question.id
                                    )
                                  }
                                  className="ml-2"
                                >
                                  <DeleteIcon className="h-4 w-4 text-red-500" />
                                </Button>
                              </div>

                              <div className="space-y-2">
                                <Label>Answers</Label>
                                {question.answers.map((answer) => (
                                  <div
                                    key={answer.id}
                                    className="grid grid-cols-12 gap-3 items-center"
                                  >
                                    <div className="col-span-5">
                                      <Input
                                        value={answer.answer_text}
                                        onChange={(e) =>
                                          updateAnswerText(
                                            question.id,
                                            answer.id,
                                            e.target.value
                                          )
                                        }
                                        placeholder="Answer text"
                                      />
                                    </div>
                                    <div className="col-span-5">
                                      {/* TODO:fix this */}
                                      <Select
                                        value={
                                          answer.destination_video_id || ""
                                        }
                                        onValueChange={(value) =>
                                          updateAnswerDestination(
                                            question.id,
                                            answer.id,
                                            value || null
                                          )
                                        }
                                      >
                                        <SelectTrigger>
                                          <SelectValue placeholder="Select destination video" />
                                        </SelectTrigger>
                                        <SelectContent>
                                        {/* TODO: value =null cannot be happening */}
                                          <SelectItem value="null">
                                            None
                                          </SelectItem>
                                          {interactiveVideos
                                            .filter((v) => v.id !== video.id)
                                            .map((v) => (
                                              <SelectItem
                                                key={v.id}
                                                value={v.id}
                                              >
                                                {v.title}
                                              </SelectItem>
                                            ))}
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    <div className="col-span-2 flex justify-end">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() =>
                                          removeAnswerFromQuestion(
                                            question.id,
                                            answer.id
                                          )
                                        }
                                        disabled={question.answers.length <= 1}
                                      >
                                        <DeleteIcon className="h-4 w-4 text-red-500" />
                                      </Button>
                                    </div>
                                  </div>
                                ))}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    addAnswerToQuestion(question.id)
                                  }
                                  className="w-full"
                                >
                                  <PlusCircle className="h-4 w-4 mr-2" />
                                  Add Answer
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <Button
                          variant="outline"
                          onClick={() => addQuestionToVideo(video.id)}
                          className="w-full"
                        >
                          <PlusCircle className="h-4 w-4 mr-2" />
                          Add Question
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}

              <Button
                variant="outline"
                onClick={addInteractiveVideo}
                className="w-full border-dashed"
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Add Video
              </Button>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => router.push(`/sessions/${sessionId}`)}
            >
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function uuidv4() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0,
      v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
