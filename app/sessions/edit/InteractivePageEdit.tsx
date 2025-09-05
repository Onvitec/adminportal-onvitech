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
import { toast } from "sonner";
import { showToast } from "@/components/toast";
import Link from "next/link";
import Heading from "@/components/Heading";
import { Loader } from "@/components/Loader";
import { VideoUploadWithLinks } from "@/components/forms/videoo-upload";

type Answer = {
  id: string;
  answer_text: string;
  destination_video_id: string;
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
  duration: number;
  links: VideoLink[];
};

export default function EditInteractiveSession({
  sessionId,
}: {
  sessionId: string;
}) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [sessionName, setSessionName] = useState("");
  const [userId, setUserId] = useState("");
  const [solution, setSolution] = useState<Solution | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [isSolutionCollapsed, setIsSolutionCollapsed] = useState(false);
  const [videos, setVideos] = useState<Video[]>([]);

  // Generate available videos list for video link destinations
  const availableVideos = videos.map((video) => ({
    id: video.id,
    title: video.title,
  }));

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
        setUserId(sessionData.created_by);

        // Get videos for this session
        const { data: videosData, error: videosError } = await supabase
          .from("videos")
          .select("*")
          .eq("session_id", sessionId)
          .order("order_index", { ascending: true });

        if (videosError) throw videosError;

        // First pass: Create video objects without links
        const videosWithQuestions: Video[] = await Promise.all(
          videosData.map(async (video) => {
            const videoObj: Video = {
              id: uuidv4(),
              db_id: video.id,
              title: video.title,
              file: null,
              url: video.url,
              question: null,
              isExpanded: true,
              duration: video.duration || 0,
              links: [], // Will be populated in second pass
            };

            return videoObj;
          })
        );

        // Create ID mapping for video references
        const videoIdMap: Record<string, string> = {};
        videosWithQuestions.forEach((v) => {
          if (v.db_id) videoIdMap[v.db_id] = v.id;
        });

        // Second pass: Fetch links and questions with proper ID mapping
        for (const video of videosWithQuestions) {
          // Get links for this video
          const { data: linksData, error: linksError } = await supabase
            .from("video_links")
            .select("*")
            .eq("video_id", video.db_id)
            .order("timestamp_seconds", { ascending: true });
          if (!linksError && linksData && linksData.length > 0) {
            video.links = linksData.map((link) => ({
              id: link.id.toString(),
              timestamp_seconds: link.timestamp_seconds,
              label: link.label,
              url: link.url || undefined,
              video_id: link.video_id,
              destination_video_id: link.destination_video_id
                ? videoIdMap[link.destination_video_id] ||
                  link.destination_video_id
                : undefined,
              link_type:
                (link.link_type as "url" | "video") ||
                (link.url ? "url" : "video"),
              position_x: link.position_x || 20,
              position_y: link.position_y || 20,
              normal_state_image: link.normal_state_image || undefined,
              hover_state_image: link.hover_state_image || undefined,
              normal_image_width: link.normal_image_width || undefined,
              normal_image_height: link.normal_image_height || undefined,
              hover_image_width: link.hover_image_width || undefined,
              hover_image_height: link.hover_image_height || undefined,
              form_data: link.form_data || undefined,
            }));
          }

          // Get question for this video
          const { data: questionData, error: questionError } = await supabase
            .from("questions")
            .select("*")
            .eq("video_id", video.db_id)
            .maybeSingle();

          if (!questionError && questionData) {
            // Get answers for this question
            const { data: answersData, error: answersError } = await supabase
              .from("answers")
              .select("*")
              .eq("question_id", questionData.id)
              .order("created_at", { ascending: true });

            if (!answersError && answersData) {
              video.question = {
                id: uuidv4(),
                db_id: questionData.id,
                question_text: questionData.question_text,
                answers: answersData.map((answer) => ({
                  id: uuidv4(),
                  db_id: answer.id,
                  answer_text: answer.answer_text,
                  destination_video_id: answer.destination_video_id
                    ? videoIdMap[answer.destination_video_id] || ""
                    : "",
                })),
              };
            }
          }
        }

        setVideos(videosWithQuestions);

        // Get solution if exists
        const { data: solutionData, error: solutionError } = await supabase
          .from("solutions")
          .select("*")
          .eq("session_id", sessionId)
          .maybeSingle();

        if (solutionError) throw solutionError;

        if (solutionData) {
          setSolution({
            id: solutionData.id,
            category_id: solutionData.category_id,
            session_id: solutionData.session_id,
            form_data: solutionData.form_data,
            emailTarget: solutionData.email_content,
            link_url: solutionData.link_url,
            video_url: solutionData.video_url,
          });
          setSelectedCategory(solutionData.category_id);
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
        duration: 0,
        links: [],
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

  const handleFileChange = useCallback(
    (videoId: string, file: File | null, duration: number) => {
      setVideos(
        videos.map((v) =>
          v.id === videoId
            ? {
                ...v,
                file,
                duration,
                title: file?.name.split(".")[0] || v.title,
              }
            : v
        )
      );
    },
    [videos]
  );

  const handleLinksChange = useCallback(
    (videoId: string, links: VideoLink[]) => {
      setVideos(videos.map((v) => (v.id === videoId ? { ...v, links } : v)));
    },
    [videos]
  );

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
                    destination_video_id: "",
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
                    destination_video_id: "",
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

  const updateDestinationVideo = (
    videoId: string,
    answerId: string,
    destination_video_id: string
  ) => {
    setVideos(
      videos.map((v) =>
        v.id === videoId && v.question
          ? {
              ...v,
              question: {
                ...v.question,
                answers: v.question.answers.map((a) =>
                  a.id === answerId ? { ...a, destination_video_id } : a
                ),
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

        // Delete from database (cascades to links, questions, answers)
        await supabase.from("videos").delete().eq("id", videoId);
      }

      // First pass: Process all videos and create uploadedVideos mapping
      const uploadedVideos: Record<string, string> = {};

      for (const [index, video] of videos.entries()) {
        let videoDbId = video.db_id;
        let videoUrl = video.url;

        // Handle file upload if new file was added
        if (video.file) {
          const fileExt = video.file.name.split(".").pop();
          const filePath = `${user.id}/${sessionId}/${video.id}.${fileExt}`;

          // Delete old file if exists
          if (video.url && video.db_id) {
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
              duration: video.duration,
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
              is_interactive: true,
              order_index: index,
              duration: video.duration,
            })
            .select()
            .single();

          if (videoError || !videoData)
            throw videoError || new Error("Failed to create video");
          videoDbId = videoData.id;
        }

        // Store mapping of temporary ID to actual DB ID
        uploadedVideos[video.id] = videoDbId!;
      }

      // Second pass: Handle video links with proper destination mapping and image uploads
      for (const video of videos) {
        const videoDbId = uploadedVideos[video.id];

        // Delete all existing links for this video first
        await supabase.from("video_links").delete().eq("video_id", videoDbId);

        if (video.links && video.links.length > 0) {
          const linkInserts = [];

          for (const link of video.links) {
            let normalImageUrl = link.normal_state_image;
            let hoverImageUrl = link.hover_state_image;

            // Upload normal state image if it's a new File object
            if (link.normalImageFile) {
              const normalFileExt = link.normalImageFile.name.split(".").pop();
              const normalFilePath = `${user.id}/${sessionId}/images/${link.id}_normal.${normalFileExt}`;

              // Delete old normal image if exists
              if (link.normal_state_image) {
                const oldNormalFilePath = link.normal_state_image
                  .split("/")
                  .slice(3)
                  .join("/");
                await supabase.storage
                  .from("video-link-images")
                  .remove([oldNormalFilePath]);
              }

              const { error: normalUploadError } = await supabase.storage
                .from("video-link-images")
                .upload(normalFilePath, link.normalImageFile);

              if (normalUploadError) throw normalUploadError;

              const { data: normalUrlData } = supabase.storage
                .from("video-link-images")
                .getPublicUrl(normalFilePath);

              normalImageUrl = normalUrlData.publicUrl;
            }

            // Upload hover state image if it's a new File object
            if (link.hoverImageFile) {
              const hoverFileExt = link.hoverImageFile.name.split(".").pop();
              const hoverFilePath = `${user.id}/${sessionId}/images/${link.id}_hover.${hoverFileExt}`;

              // Delete old hover image if exists
              if (link.hover_state_image) {
                const oldHoverFilePath = link.hover_state_image
                  .split("/")
                  .slice(3)
                  .join("/");
                await supabase.storage
                  .from("video-link-images")
                  .remove([oldHoverFilePath]);
              }

              const { error: hoverUploadError } = await supabase.storage
                .from("video-link-images")
                .upload(hoverFilePath, link.hoverImageFile);

              if (hoverUploadError) throw hoverUploadError;

              const { data: hoverUrlData } = supabase.storage
                .from("video-link-images")
                .getPublicUrl(hoverFilePath);

              hoverImageUrl = hoverUrlData.publicUrl;
            }

            const linkData: any = {
              video_id: videoDbId,
              timestamp_seconds: link.timestamp_seconds,
              label: link.label,
              link_type: link.link_type,
              position_x: link.position_x || 20,
              position_y: link.position_y || 20,
              normal_state_image: normalImageUrl,
              hover_state_image: hoverImageUrl,
              normal_image_width: link.normal_image_width,
              normal_image_height: link.normal_image_height,
              hover_image_width: link.hover_image_width,
              hover_image_height: link.hover_image_height,
              form_data: link.form_data || null,
            };

            // Handle different link types
            if (link.link_type === "url") {
              linkData.url = link.url;
              linkData.destination_video_id = null;
            } else if (
              (link.link_type === "video" || link.link_type === "form") && // ADDED: form type
              link.destination_video_id
            ) {
              linkData.url = null;
              // Map the temporary video ID to the actual database ID
              linkData.destination_video_id =
                uploadedVideos[link.destination_video_id];
            } else {
              // For other link types or no destination
              linkData.url = null;
              linkData.destination_video_id = null;
            }

            linkInserts.push(linkData);
          }

          const { error: linksError } = await supabase
            .from("video_links")
            .insert(linkInserts);

          if (linksError) {
            console.error("Error inserting video links:", linksError);
            throw linksError;
          }
        }
      }
      // Third pass: Handle questions and answers
      for (const video of videos) {
        const videoDbId = uploadedVideos[video.id];

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
              const destinationVideoDbId = answer.destination_video_id
                ? uploadedVideos[answer.destination_video_id]
                : null;

              if (answer.db_id) {
                // Update existing answer
                const { error: answerError } = await supabase
                  .from("answers")
                  .update({
                    answer_text: answer.answer_text,
                    destination_video_id: destinationVideoDbId,
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
                    destination_video_id: destinationVideoDbId,
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
              const destinationVideoDbId = answer.destination_video_id
                ? uploadedVideos[answer.destination_video_id]
                : null;

              const { error: answerError } = await supabase
                .from("answers")
                .insert({
                  answer_text: answer.answer_text,
                  question_id: questionData.id,
                  destination_video_id: destinationVideoDbId,
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

      console.log("SOLution", solution);
      // Handle solution
      if (solution) {
        let solutionData: any = {
          session_id: sessionId,
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
            const filePath = `${
              user.id
            }/${sessionId}/solutions/${uuidv4()}.${fileExt}`;

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
            console.log("Upload error:", uploadError);
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
          console.log("COMING TO UPDATE", solutionData);
          // Update existing solution
          let updated = await supabase
            .from("solutions")
            .update(solutionData)
            .eq("session_id", solutionData.session_id);
          console.log("UPDATED", updated);
        } else {
          // Create new solution
          await supabase.from("solutions").insert(solutionData);
        }
      } else {
        // Delete solution if it existed but was removed
        const { data: existingSolution, error: solutionError } = await supabase
          .from("solutions")
          .select("id")
          .eq("session_id", sessionId)
          .maybeSingle();

        if (solutionError) throw solutionError;

        if (existingSolution) {
          await supabase
            .from("solutions")
            .delete()
            .eq("id", existingSolution.id);
        }
      }

      // router.push("/sessions");
      showToast("success", "Interactive Session updated successfully!");
    } catch (error) {
      console.error("Error updating session:", error);
      showToast("error", "Error updating Interactive Session");
    } finally {
      setIsLoading(false);
    }
  };

  const addSolution = () => {
    if (!selectedCategory) return;

    setSolution({
      id: uuidv4(),
      category_id: selectedCategory,
      session_id: sessionId,
    });
  };

  const removeSolution = () => {
    setSolution(null);
  };

  const updateSolution = (updates: Partial<Solution>) => {
    if (solution) {
      setSolution({ ...solution, ...updates });
    }
  };

  if (isFetching) {
    return (
      <div className="container mx-auto py-8 max-w-4xl">
        <div className="flex justify-center items-center h-64">
          <div>
            <Loader size="md" />
          </div>
        </div>
      </div>
    );
  }

  const hasAtLeastOneVideo = videos.some((video) => video.file || video.url);

  return (
    <div className="container mx-auto">
      <div>
        <Link href="/sessions">
          <p className="mt-2 text-[16px] font-normal text-[#5F6D7E] max-w-md cursor-pointer hover:underline">
            Back to Session Maker
          </p>
        </Link>

        <Heading>Edit Session</Heading>
      </div>
      <form onSubmit={handleSubmit} className="mt-4">
        <Card className="border-none shadow-none px-3">
          <CardHeader className="px-0">
            <CardTitle className="text-2xl font-semibold">
              Edit Interactive Session
            </CardTitle>
            <CardDescription className="text-sm text-gray-600">
              Update your interactive learning experience with branching videos
              based on user answers.
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
              <h3 className="text-lg font-medium mb-4">Interactive Videos</h3>

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
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
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
                          size="sm"
                          type="button"
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
                        <div className="grid grid-cols-1 gap-4">
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
                                  <div className="col-span-5">
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
                                  <div className="col-span-5">
                                    <Select
                                      value={answer.destination_video_id}
                                      onValueChange={(value) =>
                                        updateDestinationVideo(
                                          video.id,
                                          answer.id,
                                          value
                                        )
                                      }
                                    >
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select destination video" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {videos
                                          .filter((v) => v.id !== video.id)
                                          .map((v) => (
                                            <SelectItem key={v.id} value={v.id}>
                                              {v.title}
                                            </SelectItem>
                                          ))}
                                      </SelectContent>
                                    </Select>
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

            {/* Solution */}
            <div className="mt-8 border rounded-lg">
              <button
                type="button"
                className="w-full flex justify-between items-center p-4 cursor-pointer"
                onClick={() => setIsSolutionCollapsed(!isSolutionCollapsed)}
              >
                <h3 className="text-lg font-medium">Add a Solution</h3>
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
                        disabled={solution !== null}
                        value={
                          solutionCategories
                            .find((c) => c.id === selectedCategory)
                            ?.id?.toString() || ""
                        }
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
                        disabled={solution !== null}
                        className="h-10"
                      >
                        {solution ? "Solution Added" : "Add Solution"}
                      </Button>
                      {solution && (
                        <button
                          type="button"
                          onClick={removeSolution}
                          className="h-10 text-red-600 hover:text-red-800"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>

                  {solution && (
                    <SolutionCard
                      solution={solution}
                      onUpdate={updateSolution}
                      onDelete={removeSolution}
                    />
                  )}
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
                  disabled={isLoading || !hasAtLeastOneVideo}
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
