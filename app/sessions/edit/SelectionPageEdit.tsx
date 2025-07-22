"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  PlusCircle,
  X,
  Upload,
  Trash2,
  Edit,
  Check,
  ChevronDown,
  ChevronUp,
  Pencil,
  Plus,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/lib/supabase";
import { v4 as uuidv4 } from "uuid";
import { cn, solutionCategories } from "@/lib/utils";
import { Solution, SolutionCategory } from "@/lib/types";
import { SolutionCard } from "@/components/SolutionCard";
import { VideoUpload } from "@/components/forms/linear-flow/videoo-upload";
import { Loader } from "@/components/Loader";

type Answer = {
  id: string;
  answer_text: string;
  db_id?: string;
};

type Question = {
  id: string;
  question_text: string;
  answers: Answer[];
  db_id?: string;
};

type Video = {
  id: string;
  title: string;
  file: File | null;
  url: string;
  question: Question | null;
  isExpanded: boolean;
  db_id?: string;
};

export default function EditSelectionSession({
  sessionId,
}: {
  sessionId: string;
}) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [sessionName, setSessionName] = useState("");
  const [solutions, setSolutions] = useState<Solution[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [isSolutionCollapsed, setIsSolutionCollapsed] = useState(false);
  const [videos, setVideos] = useState<Video[]>([]);
  const [editingSolutionId, setEditingSolutionId] = useState<string | null>(null);
  const [editingSolutionDraft, setEditingSolutionDraft] = useState<Solution | null>(null);

  useEffect(() => {
    const fetchSessionData = async () => {
      setIsFetching(true);
      try {
        // Get session data
        const { data: sessionData, error: sessionError } = await supabase
          .from("sessions")
          .select("*")
          .eq("id", sessionId)
          .single();

        if (sessionError || !sessionData)
          throw sessionError || new Error("Session not found");

        setSessionName(sessionData.title);

        // Get videos for this session
        const { data: videosData, error: videosError } = await supabase
          .from("videos")
          .select(
            `
            *,
            questions:questions(
              *,
              answers:answers(*)
            )
          `
          )
          .eq("session_id", sessionId)
          .order("order_index", { ascending: true });

        if (videosError) throw videosError;

        // Process videos to match our structure
        const videosWithQuestions: Video[] = videosData.map((video) => {
          const videoObj: Video = {
            id: uuidv4(),
            db_id: video.id,
            title: video.title,
            file: null,
            url: video.url,
            question: null,
            isExpanded: true,
          };

          if (video.questions && video.questions.length > 0) {
            const question = video.questions[0];
            videoObj.question = {
              id: uuidv4(),
              db_id: question.id,
              question_text: question.question_text,
              answers: question.answers.map((answer: any) => ({
                id: uuidv4(),
                db_id: answer.id,
                answer_text: answer.answer_text,
              })),
            };
          }

          return videoObj;
        });

        setVideos(videosWithQuestions);

        // Get all solutions for this session
        const { data: solutionsData, error: solutionsError } = await supabase
          .from("solutions")
          .select("*")
          .eq("session_id", sessionId);

        if (solutionsError) throw solutionsError;

        if (solutionsData && solutionsData.length > 0) {
          setSolutions(solutionsData.map(sol => ({
            id: sol.id,
            category_id: sol.category_id,
            session_id: sol.session_id,
            form_data: sol.form_data,
            emailTarget: sol.email_content,
            emailContent: sol.email_content,
            link_url: sol.link_url,
            video_url: sol.video_url,
          })));
        }
      } catch (error) {
        console.error("Error fetching session data:", error);
        alert("Failed to load session data");
      } finally {
        setIsFetching(false);
      }
    };

    fetchSessionData();
  }, [sessionId, router]);

  const addVideo = () => {
    setVideos([
      ...videos,
      {
        id: uuidv4(),
        title: `Video ${videos.length + 1}`,
        file: null,
        url: "",
        question: null,
        isExpanded: true,
      },
    ]);
  };

  const removeVideo = (videoId: string) => {
    setVideos(videos.filter((v) => v.id !== videoId));
  };

  const updateVideoName = (videoId: string, title: string) => {
    setVideos(videos.map((v) => (v.id === videoId ? { ...v, title } : v)));
  };

  const toggleExpandVideo = (videoId: string) => {
    setVideos(
      videos.map((v) =>
        v.id === videoId ? { ...v, isExpanded: !v.isExpanded } : v
      )
    );
  };

  const handleFileChange = (videoId: string, file: File | null) => {
    setVideos(
      videos.map((v) =>
        v.id === videoId
          ? { ...v, file, title: file?.name.split(".")[0] || v.title }
          : v
      )
    );
  };

  const addQuestion = (videoId: string) => {
    setVideos(
      videos.map((v) =>
        v.id === videoId
          ? {
              ...v,
              question: {
                id: uuidv4(),
                question_text: "",
                answers: [
                  {
                    id: uuidv4(),
                    answer_text: "Answer 1",
                  },
                ],
              },
            }
          : v
      )
    );
  };

  const removeQuestion = (videoId: string) => {
    setVideos(
      videos.map((v) => (v.id === videoId ? { ...v, question: null } : v))
    );
  };

  const updateQuestion = (videoId: string, question_text: string) => {
    setVideos(
      videos.map((v) =>
        v.id === videoId && v.question
          ? { ...v, question: { ...v.question, question_text } }
          : v
      )
    );
  };

  const addAnswer = (videoId: string) => {
    setVideos(
      videos.map((v) =>
        v.id === videoId && v.question
          ? {
              ...v,
              question: {
                ...v.question,
                answers: [
                  ...v.question.answers,
                  {
                    id: uuidv4(),
                    answer_text: `Answer ${v.question.answers.length + 1}`,
                  },
                ],
              },
            }
          : v
      )
    );
  };

  const updateAnswer = (
    videoId: string,
    answerId: string,
    answer_text: string
  ) => {
    setVideos(
      videos.map((v) =>
        v.id === videoId && v.question
          ? {
              ...v,
              question: {
                ...v.question,
                answers: v.question.answers.map((a) =>
                  a.id === answerId ? { ...a, answer_text } : a
                ),
              },
            }
          : v
      )
    );
  };

  const removeAnswer = (videoId: string, answerId: string) => {
    setVideos(
      videos.map((v) =>
        v.id === videoId && v.question
          ? {
              ...v,
              question: {
                ...v.question,
                answers: v.question.answers.filter((a) => a.id !== answerId),
              },
            }
          : v
      )
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Update session
      const { error: sessionError } = await supabase
        .from("sessions")
        .update({
          title: sessionName,
        })
        .eq("id", sessionId);

      if (sessionError) throw sessionError;

      // Track which videos to keep
      const existingVideoIds = videos
        .filter((v) => v.db_id)
        .map((v) => v.db_id) as string[];

      // Delete videos that were removed
      const { data: existingVideos, error: existingVideosError } =
        await supabase.from("videos").select("id").eq("session_id", sessionId);

      if (existingVideosError) throw existingVideosError;

      const videosToDelete = existingVideos
        .filter((v) => !existingVideoIds.includes(v.id))
        .map((v) => v.id);

      for (const videoId of videosToDelete) {
        // Delete from storage first
        const { data: videoData } = await supabase
          .from("videos")
          .select("url")
          .eq("id", videoId)
          .single();

        if (videoData?.url) {
          const filePath = videoData.url.split("/").slice(3).join("/");
          await supabase.storage.from("videos").remove([filePath]);
        }

        // Delete from database
        await supabase.from("videos").delete().eq("id", videoId);
      }

      // Process videos (update existing or create new)
      const uploadedVideos: Record<string, string> = {};

      for (const [index, video] of videos.entries()) {
        let videoDbId = video.db_id;
        let videoUrl = video.url;

        // Handle file upload if new file was added
        if (video.file) {
          const fileExt = video.file.name.split(".").pop();
          const filePath = `${user.id}/${sessionId}/${video.id}.${fileExt}`;

          // Delete old file if exists
          if (video.url) {
            const oldFilePath = video.url.split("/").slice(3).join("/");
            await supabase.storage.from("videos").remove([oldFilePath]);
          }

          // Upload new file
          const { error: uploadError } = await supabase.storage
            .from("videos")
            .upload(filePath, video.file);

          if (uploadError) throw uploadError;

          // Get new URL
          const { data: urlData } = supabase.storage
            .from("videos")
            .getPublicUrl(filePath);
          videoUrl = urlData.publicUrl;
        }

        // Update or create video record
        if (videoDbId) {
          // Update existing video
          const { error: videoError } = await supabase
            .from("videos")
            .update({
              title: video.title || video.file?.name || video.title,
              url: videoUrl,
              order_index: index,
            })
            .eq("id", videoDbId);

          if (videoError) throw videoError;
        } else {
          // Create new video
          const { data: videoData, error: videoError } = await supabase
            .from("videos")
            .insert({
              title: video.title || video.file?.name || `Video ${index + 1}`,
              url: videoUrl,
              session_id: sessionId,
              is_interactive: false,
              order_index: index,
            })
            .select()
            .single();

          if (videoError || !videoData)
            throw videoError || new Error("Failed to create video");
          videoDbId = videoData.id;
        }

        // Store mapping of temporary ID to actual DB ID
        uploadedVideos[video.id] = videoDbId!;

        // Handle questions and answers
        if (video.question) {
          if (video.question.db_id) {
            // Update existing question
            const { error: questionError } = await supabase
              .from("questions")
              .update({
                question_text: video.question.question_text,
                video_id: videoDbId,
              })
              .eq("id", video.question.db_id);

            if (questionError) throw questionError;

            // Process answers
            const existingAnswerIds = video.question.answers
              .filter((a) => a.db_id)
              .map((a) => a.db_id) as string[];

            // Delete answers that were removed
            const { data: existingAnswers } = await supabase
              .from("answers")
              .select("id")
              .eq("question_id", video.question.db_id);

            if (existingAnswers) {
              const answersToDelete = existingAnswers
                .filter((a) => !existingAnswerIds.includes(a.id))
                .map((a) => a.id);

              for (const answerId of answersToDelete) {
                await supabase.from("answers").delete().eq("id", answerId);
              }
            }

            // Update or create answers
            for (const answer of video.question.answers) {
              if (answer.db_id) {
                // Update existing answer
                const { error: answerError } = await supabase
                  .from("answers")
                  .update({
                    answer_text: answer.answer_text,
                  })
                  .eq("id", answer.db_id);
                if (answerError) throw answerError;
              } else {
                // Create new answer
                const { error: answerError } = await supabase
                  .from("answers")
                  .insert({
                    answer_text: answer.answer_text,
                    question_id: video.question.db_id,
                  });
                if (answerError) throw answerError;
              }
            }
          } else {
            // Create new question
            const { data: questionData, error: questionError } = await supabase
              .from("questions")
              .insert({
                question_text: video.question.question_text,
                video_id: videoDbId,
              })
              .select()
              .single();

            if (questionError || !questionData)
              throw questionError || new Error("Failed to create question");

            // Create answers
            for (const answer of video.question.answers) {
              const { error: answerError } = await supabase
                .from("answers")
                .insert({
                  answer_text: answer.answer_text,
                  question_id: questionData.id,
                });
              if (answerError) throw answerError;
            }
          }
        } else if (video.db_id) {
          // Check if video had a question before and delete it
          const { data: existingQuestion, error: questionError } =
            await supabase
              .from("questions")
              .select("id")
              .eq("video_id", video.db_id)
              .maybeSingle();

          if (questionError) throw questionError;

          if (existingQuestion) {
            await supabase
              .from("questions")
              .delete()
              .eq("id", existingQuestion.id);
          }
        }
      }

      // Handle solutions
      const existingSolutionIds = solutions.map(s => s.id);
      
      // Delete solutions that were removed
      const { data: existingSolutions, error: existingSolutionsError } = 
        await supabase.from("solutions").select("id").eq("session_id", sessionId);
      
      if (existingSolutionsError) throw existingSolutionsError;

      const solutionsToDelete = existingSolutions
        .filter(s => !existingSolutionIds.includes(s.id))
        .map(s => s.id);

      for (const solutionId of solutionsToDelete) {
        await supabase.from("solutions").delete().eq("id", solutionId);
      }

      // Update or create solutions
      for (const solution of solutions) {
        let solutionData: any = {
          session_id: sessionId,
          category_id: solution.category_id,
          title: `Solution for ${sessionName}`,
        };

        // Set appropriate fields based on solution type
        if (solution.category_id === 1) {
          solutionData.form_data = solution.form_data;
        } else if (solution.category_id === 2) {
          solutionData.email_content = solution.emailContent || solution.emailTarget;
        } else if (solution.category_id === 3) {
          solutionData.link_url = solution.link_url;
        } else if (solution.category_id === 4) {
          if (solution.videoFile) {
            const fileExt = solution.videoFile.name.split(".").pop();
            const filePath = `${user.id}/${sessionId}/solutions/${uuidv4()}.${fileExt}`;

            // Delete old solution video if exists
            if (solution.video_url) {
              const oldFilePath = solution.video_url
                .split("/")
                .slice(3)
                .join("/");
              await supabase.storage.from("solutions").remove([oldFilePath]);
            }

            const { error: uploadError } = await supabase.storage
              .from("solutions")
              .upload(filePath, solution.videoFile);

            if (uploadError) throw uploadError;

            const { data: urlData } = supabase.storage
              .from("solutions")
              .getPublicUrl(filePath);

            solutionData.video_url = urlData.publicUrl;
          } else if (solution.video_url) {
            solutionData.video_url = solution.video_url;
          }
        }

        if (solution.id) {
          // Update existing solution
          const { error: solutionError } = await supabase
            .from("solutions")
            .update(solutionData)
            .eq("id", solution.id);
          
          if (solutionError) throw solutionError;
        } else {
          // Create new solution
          const { error: solutionError } = await supabase
            .from("solutions")
            .insert(solutionData);
          
          if (solutionError) throw solutionError;
        }
      }

      router.push("/sessions");
    } catch (error) {
      console.error("Error updating session:", error);
      alert("Failed to update session. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const addSolution = () => {
    if (!selectedCategory) return;

    const newSolution: Solution = {
      id: uuidv4(),
      category_id: selectedCategory,
      session_id: sessionId,
      form_data: selectedCategory === 1 ? {
        title: "",
        elements: [{
          id: `elem-${Date.now()}`,
          type: "text",
          label: "Name",
          value: "",
        }]
      } : null,
      emailTarget: selectedCategory === 2 ? "" : undefined,
      emailContent: selectedCategory === 2 ? "" : undefined,
      link_url: selectedCategory === 3 ? "" : undefined,
      video_url: selectedCategory === 4 ? "" : undefined,
      videoFile: null,
    };

    setSolutions([...solutions, newSolution]);
    setEditingSolutionId(newSolution.id);
    setEditingSolutionDraft({ ...newSolution });
  };

  const removeSolution = (solutionId: string) => {
    setSolutions(solutions.filter(s => s.id !== solutionId));
    if (editingSolutionId === solutionId) {
      setEditingSolutionId(null);
      setEditingSolutionDraft(null);
    }
  };

  const startEditingSolution = (solutionId: string) => {
    const solutionToEdit = solutions.find(s => s.id === solutionId);
    if (solutionToEdit) {
      setEditingSolutionId(solutionId);
      setEditingSolutionDraft({ ...solutionToEdit });
    }
  };

  const updateSolutionDraft = (updatedFields: Partial<Solution>) => {
    if (editingSolutionDraft) {
      setEditingSolutionDraft({ ...editingSolutionDraft, ...updatedFields });
    }
  };

  const saveSolution = () => {
    if (editingSolutionDraft && editingSolutionId) {
      setSolutions(solutions.map(s => 
        s.id === editingSolutionId ? { ...editingSolutionDraft } : s
      ));
      setEditingSolutionId(null);
      setEditingSolutionDraft(null);
    }
  };

  const cancelEditing = () => {
    setEditingSolutionId(null);
    setEditingSolutionDraft(null);
  };

  if (isFetching) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex justify-center items-center h-64">
               <div><Loader size="md"/></div>;
          
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <form onSubmit={handleSubmit}>
        <Card className="border-none shadow-none px-3">
          <CardHeader className="px-0">
            <CardTitle className="text-2xl font-semibold">
              Edit Selection Session
            </CardTitle>
            <CardDescription className="text-sm text-gray-600">
              Update your selection-based learning experience where users answer
              questions to determine the final solution.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 px-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <Label
                  htmlFor="sessionName"
                  className="text-sm font-medium text-gray-700"
                >
                  Session Name
                </Label>
                <Input
                  id="sessionName"
                  value={sessionName}
                  onChange={(e) => setSessionName(e.target.value)}
                  placeholder="e.g., Customer Service Training"
                  className="h-10"
                  required
                />
              </div>
            </div>

            <div className="mt-8">
              <h3 className="text-lg font-medium mb-4">Videos</h3>

              <div className="space-y-4">
                {videos.map((video) => (
                  <div
                    key={video.id}
                    className="border rounded-lg overflow-hidden"
                  >
                    <div className="p-4 flex items-center justify-between bg-gray-50">
                      <div className="flex items-center gap-3">
                        <h3 className="text-base font-medium">{video.title}</h3>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const newTitle = prompt(
                              "Enter new video title",
                              video.title
                            );
                            if (newTitle) updateVideoName(video.id, newTitle);
                          }}
                          className="h-8 w-8 p-0 text-gray-500 hover:text-gray-900"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleExpandVideo(video.id)}
                          className="h-8 w-8 p-0 text-gray-500 hover:text-gray-900"
                        >
                          {video.isExpanded ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeVideo(video.id)}
                          className="h-8 w-8 p-0 text-gray-500 hover:text-gray-900"
                          disabled={videos.length === 1}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {video.isExpanded && (
                      <div className="p-4 space-y-4 bg-white">
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                          <VideoUpload
                            video={video}
                            moduleId={video.id}
                            onDelete={() => removeVideo(video.id)}
                            handleFileChange={(file) =>
                              handleFileChange(video.id, file)
                            }
                          />
                        </div>

                        {video.question ? (
                          <div className="space-y-4 mt-4">
                            <div className="space-y-2">
                              <Label>Question</Label>
                              <Textarea
                                value={video.question.question_text}
                                onChange={(e) =>
                                  updateQuestion(video.id, e.target.value)
                                }
                                placeholder="Enter your question here"
                                className="min-h-[80px]"
                              />
                            </div>

                            <div className="space-y-3">
                              <Label>Answers</Label>
                              {video.question.answers.map((answer) => (
                                <div
                                  key={answer.id}
                                  className="grid grid-cols-12 gap-3 items-center"
                                >
                                  <div className="col-span-10">
                                    <Input
                                      value={answer.answer_text}
                                      onChange={(e) =>
                                        updateAnswer(
                                          video.id,
                                          answer.id,
                                          e.target.value
                                        )
                                      }
                                      placeholder="Answer text"
                                    />
                                  </div>
                                  <div className="col-span-2 flex justify-end">
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() =>
                                        removeAnswer(video.id, answer.id)
                                      }
                                      disabled={
                                        video.question?.answers.length === 1
                                      }
                                      className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              ))}
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => addAnswer(video.id)}
                                className="w-full mt-2"
                              >
                                <PlusCircle className="h-4 w-4 mr-2" />
                                Add Answer
                              </Button>
                            </div>

                            <div className="flex justify-end">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeQuestion(video.id)}
                                className="text-red-600 hover:text-red-800"
                              >
                                Remove Question
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => addQuestion(video.id)}
                            className="w-full mt-4"
                          >
                            <PlusCircle className="h-4 w-4 mr-2" />
                            Add Question
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                ))}

                <Button
                  type="button"
                  variant="outline"
                  onClick={addVideo}
                  className="w-full mt-4 border-dashed"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Video
                </Button>
              </div>
            </div>

            {/* Solutions Section */}
            <div className="mt-8 border rounded-lg">
              <button
                type="button"
                className="w-full flex justify-between items-center p-4"
                onClick={() => setIsSolutionCollapsed(!isSolutionCollapsed)}
              >
                <h3 className="text-lg font-medium">Solutions</h3>
                {isSolutionCollapsed ? (
                  <ChevronDown className="h-5 w-5" />
                ) : (
                  <ChevronUp className="h-5 w-5" />
                )}
              </button>

              {!isSolutionCollapsed && (
                <div className="p-4 pt-0 space-y-4">
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                      <Label className="block text-sm font-medium mb-1">
                        Solution Category
                      </Label>
                      <Select
                        value={selectedCategory?.toString() || ""}
                        onValueChange={(value) =>
                          setSelectedCategory(Number(value))
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select solution type" />
                        </SelectTrigger>
                        <SelectContent className="flex-1">
                          {solutionCategories.map((category) => (
                            <SelectItem
                              key={category.id}
                              value={String(category.id)}
                            >
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-end gap-2">
                      <Button
                        type="button"
                        onClick={addSolution}
                        disabled={!selectedCategory}
                        className="h-10"
                      >
                        Add Solution
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {solutions.map((solution) => (
                      <div key={solution.id} className="border rounded-lg p-4">
                        {editingSolutionId === solution.id ? (
                          <div className="space-y-4">
                            <SolutionCard
                              solution={editingSolutionDraft || solution}
                              onUpdate={updateSolutionDraft}
                              onDelete={() => removeSolution(solution.id)}
                            />
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                onClick={cancelEditing}
                                className="h-10"
                              >
                                Cancel
                              </Button>
                              <Button
                                onClick={saveSolution}
                                className="h-10"
                              >
                                Save
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex justify-between items-center">
                            <div>
                              <h4 className="font-medium">
                                {solutionCategories.find(
                                  (c) => c.id === solution.category_id
                                )?.name || "Solution"}
                              </h4>
                              {solution.category_id === 1 && (
                                <p className="text-sm text-gray-600 truncate">
                                  Form solution
                                </p>
                              )}
                              {solution.category_id === 2 && solution.emailTarget && (
                                <p className="text-sm text-gray-600 truncate">
                                  Email: {solution.emailTarget}
                                </p>
                              )}
                              {solution.category_id === 3 && solution.link_url && (
                                <p className="text-sm text-gray-600 truncate">
                                  Link: {solution.link_url}
                                </p>
                              )}
                              {solution.category_id === 4 && solution.video_url && (
                                <p className="text-sm text-gray-600 truncate">
                                  Video solution
                                </p>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => startEditingSolution(solution.id)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeSolution(solution.id)}
                                className="text-red-600 hover:text-red-800"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-between items-center gap-2 mt-8">
              <div className="flex-1"></div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/sessions")}
                  className="h-10 px-6"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="h-10 px-6"
                >
                  {isLoading ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}