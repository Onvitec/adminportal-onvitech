"use client";

import { useState, useEffect, useCallback } from "react";
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
import { Solution, SolutionCategory, VideoLink } from "@/lib/types";
import { SolutionCard } from "@/components/SolutionCard";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import Link from "next/link";
import Heading from "@/components/Heading";
import { VideoUploadWithLinks } from "../videoo-upload";

type Answer = {
  id: string;
  answer_text: string;
};

type Question = {
  id: string;
  question_text: string;
  answers: Answer[];
};

type Video = {
  id: string;
  name: string;
  file: File | null;
  title: string;
  url: string;
  question: Question | null;
  isExpanded: boolean;
  duration: number; // Add duration in seconds
  links: VideoLink[]; // Add links array
  destination_video_id: string | null;
};

type AnswerCombination = {
  id: string;
  answers: string[]; // Array of answer IDs
  solution_id: string | null;
};

export default function SelectionSessionForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [sessionName, setSessionName] = useState("");
  const [userId, setUserId] = useState("");
  const [videos, setVideos] = useState<Video[]>([
    {
      id: uuidv4(),
      name: "Video Name",
      file: null,
      url: "",
      question: null,
      isExpanded: true,
      title: "Video Name",
      duration: 0,
      links: [],
      destination_video_id: null,
    },
  ]);
  const [combinations, setCombinations] = useState<AnswerCombination[]>([]);
  const [isGeneratingCombinations, setIsGeneratingCombinations] =
    useState(false);
  const [solutions, setSolutions] = useState<Solution[]>([]);
  const [isSolutionCollapsed, setIsSolutionCollapsed] = useState(false);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentCombinationId, setCurrentCombinationId] = useState<
    string | null
  >(null);
  const [modalSolution, setModalSolution] = useState<Partial<Solution>>({
    id: uuidv4(),
    category_id: null,
  });

  // Generate available videos list for video link destinations
  const availableVideos = videos.map((video) => ({
    id: video.id,
    title: video.title || video.name,
  }));

  // Open modal for a specific combination
  const openSolutionModal = (combinationId: string) => {
    setCurrentCombinationId(combinationId);

    // Check if this combination already has a solution
    const combination = combinations.find((c) => c.id === combinationId);
    if (combination?.solution_id) {
      const existingSolution = solutions.find(
        (s) => s.id === combination.solution_id
      );
      if (existingSolution) {
        setModalSolution(existingSolution);
      }
    } else {
      // Create new solution
      setModalSolution({
        id: uuidv4(),
        category_id: null,
      });
    }

    setIsModalOpen(true);
  };

  // Save solution from modal
  const saveModalSolution = () => {
    if (!modalSolution.category_id) {
      alert("Please select a solution category");
      return;
    }

    // Update or add the solution
    const existingIndex = solutions.findIndex((s) => s.id === modalSolution.id);
    let updatedSolutions: Solution[];

    if (existingIndex >= 0) {
      updatedSolutions = [...solutions];
      updatedSolutions[existingIndex] = modalSolution as Solution;
    } else {
      updatedSolutions = [...solutions, modalSolution as Solution];
    }

    setSolutions(updatedSolutions);

    // Update the combination with this solution
    if (currentCombinationId) {
      setCombinations(
        combinations.map((c) =>
          c.id === currentCombinationId
            ? { ...c, solution_id: modalSolution.id! }
            : c
        )
      );
    }

    setIsModalOpen(false);
  };

  // Update solution in modal
  const updateModalSolution = (updates: Partial<Solution>) => {
    setModalSolution((prev) => ({
      ...prev,
      ...updates,
    }));
  };

  // Generate all possible answer combinations
  const generateCombinations = () => {
    setIsGeneratingCombinations(true);

    try {
      // Get all questions with answers
      const questionsWithAnswers = videos
        .filter((video) => video.question)
        .map((video) => ({
          videoId: video.id,
          questionId: video.question!.id,
          answers: video.question!.answers.map((answer) => answer.id),
        }));

      if (questionsWithAnswers.length < 1) {
        alert(
          "You need at least one question with answers to generate combinations"
        );
        return;
      }

      // Generate all possible combinations
      const newCombinations: AnswerCombination[] = [];
      const generate = (current: string[], index: number) => {
        if (index === questionsWithAnswers.length) {
          newCombinations.push({
            id: uuidv4(),
            answers: [...current],
            solution_id: null,
          });
          return;
        }

        for (const answerId of questionsWithAnswers[index].answers) {
          current[index] = answerId;
          generate(current, index + 1);
        }
      };

      generate([], 0);
      setCombinations(newCombinations);
    } finally {
      setIsGeneratingCombinations(false);
    }
  };

  // Add a new video
  const addVideo = () => {
    setVideos([
      ...videos,
      {
        id: uuidv4(),
        name: `Video ${videos.length + 1}`,
        file: null,
        url: "",
        question: null,
        isExpanded: true,
        title: `Video ${videos.length + 1}`,
        duration: 0,
        links: [],
        destination_video_id: null,
      },
    ]);
  };

  // Remove a video
  const removeVideo = (videoId: string) => {
    setVideos(videos.filter((v) => v.id !== videoId));
  };

  // Update video name
  const updateVideoName = (videoId: string, name: string) => {
    setVideos(
      videos.map((v) => (v.id === videoId ? { ...v, name, title: name } : v))
    );
  };

  // Toggle video expansion
  const toggleExpandVideo = (videoId: string) => {
    setVideos(
      videos.map((v) =>
        v.id === videoId ? { ...v, isExpanded: !v.isExpanded } : v
      )
    );
  };

  // Handle file change for a video - Updated to include duration
  const handleFileChange = useCallback(
    (videoId: string, file: File | null, duration: number) => {
      setVideos(
        videos.map((v) =>
          v.id === videoId
            ? {
                ...v,
                file,
                duration,
                name: file?.name.split(".")[0] || v.name,
                title: file?.name.split(".")[0] || v.title,
              }
            : v
        )
      );
    },
    [videos]
  );

  // Handle links change for a video - New function
  const handleLinksChange = useCallback(
    (videoId: string, links: VideoLink[]) => {
      setVideos(videos.map((v) => (v.id === videoId ? { ...v, links } : v)));
    },
    [videos]
  );

  // Add a question to a video
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

  // Remove a question from a video
  const removeQuestion = (videoId: string) => {
    setVideos(
      videos.map((v) => (v.id === videoId ? { ...v, question: null } : v))
    );

    // Regenerate combinations when a question is removed
    generateCombinations();
  };

  // Update question text
  const updateQuestion = (videoId: string, question_text: string) => {
    setVideos(
      videos.map((v) =>
        v.id === videoId && v.question
          ? { ...v, question: { ...v.question, question_text } }
          : v
      )
    );
  };

  // Add an answer to a question
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

  // Update an answer
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

  // Remove an answer
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

    // Remove combinations that include this answer
    setCombinations(
      combinations.filter((combo) => !combo.answers.includes(answerId))
    );
  };

  // Remove a solution
  const removeSolution = (id: string) => {
    setSolutions(solutions.filter((s) => s.id !== id));
    // Remove references from combinations
    setCombinations(
      combinations.map((c) =>
        c.solution_id === id ? { ...c, solution_id: null } : c
      )
    );
  };

  // Submit the form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Create session
      const { data: sessionData, error: sessionError } = await supabase
        .from("sessions")
        .insert({
          title: sessionName,
          session_type: "selection",
          created_by: user.id,
        })
        .select()
        .single();

      if (sessionError || !sessionData)
        throw sessionError || new Error("Failed to create session");

      // Upload videos and create questions/answers
      const uploadedVideos: Record<string, string> = {};
      const uploadedAnswers: Record<string, string> = {};

      for (const [index, video] of videos.entries()) {
        if (!video.file) continue;

        // Upload file to storage
        const fileExt = video.file.name.split(".").pop();
        const filePath = `${user.id}/${sessionData.id}/${video.id}.${fileExt}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("videos")
          .upload(filePath, video.file);

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: urlData } = supabase.storage
          .from("videos")
          .getPublicUrl(filePath);

        // Create video record
        const { data: videoData, error: videoError } = await supabase
          .from("videos")
          .insert({
            title: video.name || video.file.name,
            url: urlData.publicUrl,
            session_id: sessionData.id,
            session_type: "selection",
            order_index: index,
          })
          .select()
          .single();

        if (videoError || !videoData)
          throw videoError || new Error("Failed to create video");

        // Store mapping of temporary ID to actual DB ID
        uploadedVideos[video.id] = videoData.id;

        // Insert links if available - Updated to handle both URL and video links
        if (video.links && video.links.length > 0) {
          const linkInserts = [];

          for (const link of video.links) {
            let normalImageUrl = link.normal_state_image;
            let hoverImageUrl = link.hover_state_image;

            // Upload normal state image if it's a File object
            if (link.normalImageFile) {
              const normalFileExt = link.normalImageFile.name.split(".").pop();
              const normalFilePath = `${userId}/${sessionData.id}/images/${link.id}_normal.${normalFileExt}`;

              const { error: normalUploadError } = await supabase.storage
                .from("video-link-images")
                .upload(normalFilePath, link.normalImageFile);

              if (normalUploadError) throw normalUploadError;

              const { data: normalUrlData } = supabase.storage
                .from("video-link-images")
                .getPublicUrl(normalFilePath);

              normalImageUrl = normalUrlData.publicUrl;
            }

            // Upload hover state image if it's a File object
            if (link.hoverImageFile) {
              const hoverFileExt = link.hoverImageFile.name.split(".").pop();
              const hoverFilePath = `${userId}/${sessionData.id}/images/${link.id}_hover.${hoverFileExt}`;

              const { error: hoverUploadError } = await supabase.storage
                .from("video-link-images")
                .upload(hoverFilePath, link.hoverImageFile);

              if (hoverUploadError) throw hoverUploadError;

              const { data: hoverUrlData } = supabase.storage
                .from("video-link-images")
                .getPublicUrl(hoverFilePath);

              hoverImageUrl = hoverUrlData.publicUrl;
            }

            linkInserts.push({
              video_id: videoData.id,
              timestamp_seconds: link.timestamp_seconds,
              label: link.label,
              url: link.link_type === "url" ? link.url : null,
              destination_video_id: link.link_type === "video" ? null : null,
              link_type: link.link_type,
              position_x: link.position_x || 20,
              position_y: link.position_y || 20,
              normal_state_image: normalImageUrl,
              hover_state_image: hoverImageUrl,
              normal_image_width: link.normal_image_width,
              normal_image_height: link.normal_image_height,
              hover_image_width: link.hover_image_width,
              hover_image_height: link.hover_image_height,
            });
          }

          const { data: insertedLinks, error: linksError } = await supabase
            .from("video_links")
            .insert(linkInserts)
            .select();

          if (linksError) throw linksError;

          // Store link mapping for later destination video ID updates
          if (insertedLinks) {
            video.links.forEach((originalLink, linkIndex) => {
              if (
                originalLink.link_type === "video" &&
                originalLink.destination_video_id
              ) {
                const insertedLink = insertedLinks[linkIndex];
                if (insertedLink) {
                  insertedLink._temp_destination_video_id =
                    originalLink.destination_video_id;
                  insertedLink._temp_link_id = originalLink.id;
                }
              }
            });
          }
        }

        // Create question if exists
        if (video.question) {
          const { data: questionData, error: questionError } = await supabase
            .from("questions")
            .insert({
              question_text: video.question.question_text,
              video_id: videoData.id,
            })
            .select()
            .single();

          if (questionError || !questionData)
            throw questionError || new Error("Failed to create question");

          // Create answers
          for (const answer of video.question.answers) {
            const { data: answerData, error: answerError } = await supabase
              .from("answers")
              .insert({
                answer_text: answer.answer_text,
                question_id: questionData.id,
              })
              .select()
              .single();

            if (answerError || !answerData)
              throw answerError || new Error("Failed to create answer");

            // Store mapping of temporary answer ID to DB ID
            uploadedAnswers[answer.id] = answerData.id;
          }
        }
      }

      // Update video link destination_video_id for video-type links after all videos are uploaded
      for (const video of videos) {
        if (!video.links || video.links.length === 0) continue;

        const videoDbId = uploadedVideos[video.id];
        if (!videoDbId) continue;

        // Get all video links for this video
        const { data: videoLinks } = await supabase
          .from("video_links")
          .select("id, link_type")
          .eq("video_id", videoDbId);

        if (!videoLinks) continue;

        // Update destination_video_id for video-type links
        for (let i = 0; i < video.links.length; i++) {
          const originalLink = video.links[i];
          const dbLink = videoLinks[i];

          if (
            originalLink.link_type === "video" &&
            originalLink.destination_video_id &&
            dbLink
          ) {
            const destinationDbId =
              uploadedVideos[originalLink.destination_video_id];
            if (destinationDbId) {
              await supabase
                .from("video_links")
                .update({ destination_video_id: destinationDbId })
                .eq("id", dbLink.id);
            }
          }
        }
      }

      // Upload solutions first
      const uploadedSolutions: Record<string, string> = {};
      for (const solution of solutions) {
        let solutionData: any = {
          session_id: sessionData.id,
          category_id: solution.category_id,
          title: `Solution for ${sessionName}`,
        };

        // Set appropriate fields based on solution type
        if (solution.category_id === 1) {
          solutionData.form_data = solution.form_data;
        } else if (solution.category_id === 2) {
          solutionData.email_content = solution.emailTarget;
        } else if (solution.category_id === 3) {
          solutionData.link_url = solution.link_url;
        } else if (solution.category_id === 4) {
          if (solution.videoFile) {
            const fileExt = solution.videoFile.name.split(".").pop();
            const filePath = `${user.id}/${
              sessionData.id
            }/solutions/${uuidv4()}.${fileExt}`;

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

        const { data: dbSolution, error: solutionError } = await supabase
          .from("solutions")
          .insert(solutionData)
          .select()
          .single();

        if (solutionError || !dbSolution)
          throw solutionError || new Error("Failed to create solution");
        uploadedSolutions[solution.id] = dbSolution.id;
      }

      // Create answer combinations after all answers and solutions are uploaded
      for (const combination of combinations) {
        if (!combination.solution_id) continue;

        const solutionDbId = uploadedSolutions[combination.solution_id];
        if (!solutionDbId) continue;

        // Create combination record
        const { data: comboData, error: comboError } = await supabase
          .from("answer_combinations")
          .insert({
            session_id: sessionData.id,
            solution_id: solutionDbId,
            combination_hash: combination.answers.join("-"),
          })
          .select()
          .single();

        if (comboError || !comboData)
          throw comboError || new Error("Failed to create answer combination");

        // Create junction records for each answer in the combination
        for (const answerId of combination.answers) {
          const answerDbId = uploadedAnswers[answerId];
          if (!answerDbId) continue;

          await supabase.from("combination_answers").insert({
            combination_id: comboData.id,
            answer_id: answerDbId,
          });
        }
      }

      // Redirect to sessions page
      router.push("/sessions");
    } catch (error) {
      console.error("Error creating session:", error);
      alert("Failed to create session. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Get answer text by ID
  const getAnswerText = (answerId: string): string => {
    for (const video of videos) {
      if (video.question) {
        for (const answer of video.question.answers) {
          if (answer.id === answerId) {
            return answer.answer_text;
          }
        }
      }
    }
    return "Unknown Answer";
  };

  // Get solution title by ID
  const getSolutionTitle = (solutionId: string): string => {
    const solution = solutions.find((s) => s.id === solutionId);
    if (!solution) return "No Solution";

    const category = solutionCategories.find(
      (c) => c.id === solution.category_id
    );
    return `${category?.name || "Solution"}`;
  };

  const hasAtLeastOneVideo = videos.some((video) => video.file || video.url);

  return (
    <div className="container mx-auto">
      <div>
        <Link href="/sessions">
          <p className="mt-2 text-[16px] font-normal text-[#5F6D7E] max-w-md cursor-pointer hover:underline">
            Back to Session Maker
          </p>
        </Link>

        <Heading>Add New Session</Heading>
      </div>
      <form onSubmit={handleSubmit}>
        <Card className="border-none shadow-none px-3">
          <CardHeader className="px-0">
            <CardTitle className="text-2xl font-semibold">
              Selection-Based Session Details
            </CardTitle>
            <CardDescription className="text-sm text-gray-600">
              Create a learning experience where combinations of answers lead to
              different solutions.
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
                  placeholder="e.g., Sales Training Assessment"
                  className="h-10"
                  required
                />
              </div>
              <div className="space-y-1">
                <Label
                  htmlFor="userId"
                  className="text-sm font-medium text-[#242B42]"
                >
                  Session Type
                </Label>
                <Input
                  id="userId"
                  value={"Selection Based"}
                  disabled
                  className="h-10 bg-[#EEEEEE] text-[#242B42] font-medium"
                  required
                />
              </div>
            </div>

            <div className="mt-8">
              <h3 className="text-lg font-medium mb-4">
                Videos with Questions
              </h3>

              <div className="space-y-4">
                {videos.map((video) => (
                  <div
                    key={video.id}
                    className="border rounded-lg overflow-hidden"
                  >
                    <div className="p-4 flex items-center justify-between bg-gray-50">
                      <div className="flex items-center gap-3">
                        <h3 className="text-base font-medium">{video.name}</h3>
                        <Button
                          variant="ghost"
                          size="sm"
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            const newName = prompt(
                              "Enter new video name",
                              video.name
                            );
                            if (newName) updateVideoName(video.id, newName);
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
                          type="button"
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
                          type="button"
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
                          <VideoUploadWithLinks
                            key={video.id}
                            video={video}
                            availableVideos={availableVideos}
                            onFileChange={(file, duration) =>
                              handleFileChange(video.id, file, duration)
                            }
                            onLinksChange={(links) =>
                              handleLinksChange(video.id, links)
                            }
                            onDelete={() => removeVideo(video.id)}
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

            {/* Answer Combinations Section */}
            {videos.some((v) => v.question) && (
              <div className="mt-8">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium">Answer Combinations</h3>
                  <Button
                    type="button"
                    onClick={generateCombinations}
                    disabled={isGeneratingCombinations}
                  >
                    {isGeneratingCombinations
                      ? "Generating..."
                      : "Generate Combinations"}
                  </Button>
                </div>

                {combinations.length > 0 ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-12 gap-4 items-center font-medium text-sm text-gray-600">
                      <div className="col-span-8">Combination</div>
                      <div className="col-span-4">Solution</div>
                    </div>

                    {combinations.map((combination) => (
                      <div
                        key={combination.id}
                        className="grid grid-cols-12 gap-4 items-center bg-gray-50 p-3 rounded-lg"
                      >
                        <div className="col-span-8">
                          <div className="flex flex-wrap items-center gap-2">
                            {combination.answers.map((answerId) => (
                              <span
                                key={answerId}
                                className="px-4 py-2 bg-white border border-gray-200 rounded-md text-sm font-medium shadow-sm hover:bg-gray-50"
                              >
                                {getAnswerText(answerId)}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="col-span-3">
                          {combination.solution_id ? (
                            <div className="flex items-center gap-2">
                              <span className="px-4 py-2 bg-blue-100 text-blue-800 rounded-md text-sm font-medium border border-blue-200 shadow-sm">
                                {getSolutionTitle(combination.solution_id)}
                              </span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  openSolutionModal(combination.id)
                                }
                                className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => openSolutionModal(combination.id)}
                              className="h-9 px-4 shadow-sm"
                            >
                              Add Solution
                            </Button>
                          )}
                        </div>
                        <div className="col-span-1 flex justify-end">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              setCombinations(
                                combinations.filter(
                                  (c) => c.id !== combination.id
                                )
                              )
                            }
                            className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 border border-dashed rounded-lg">
                    <p className="text-gray-500">
                      {videos.filter((v) => v.question).length > 0
                        ? 'Click "Generate Combinations" to create all possible answer paths'
                        : "Add questions with answers to generate combinations"}
                    </p>
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-between items-center gap-2 mt-8">
              <div className="flex-1"></div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/sessions/create")}
                  className="h-10 px-6"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={
                    isLoading ||
                    !hasAtLeastOneVideo ||
                    solutions.length === 0 ||
                    (combinations.length > 0 &&
                      combinations.some((c) => !c.solution_id))
                  }
                  className="h-10 px-6"
                >
                  {isLoading ? "Saving..." : "Save"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </form>

      {/* Solution Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Solution for Combination</DialogTitle>
            <DialogDescription>
              Configure the solution that will be shown when this answer
              combination is selected.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Solution Category</Label>
              <Select
                value={modalSolution.category_id?.toString() || ""}
                onValueChange={(value) =>
                  updateModalSolution({ category_id: Number(value) })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {solutionCategories.map((category) => (
                    <SelectItem
                      key={category.id}
                      value={category.id.toString()}
                    >
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {modalSolution.category_id && (
              <SolutionCard
                solution={modalSolution as any}
                onUpdate={updateModalSolution}
              />
            )}

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={saveModalSolution}
                disabled={!modalSolution.category_id}
              >
                Save Solution
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
