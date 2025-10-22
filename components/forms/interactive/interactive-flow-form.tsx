"use client";

import { useCallback, useEffect, useState } from "react";
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
  Video,
  ArrowRight,
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
import { solutionCategories } from "@/lib/utils";
import { VideoUploadWithLinks } from "../videoo-upload";
import { Solution, SolutionCategory, UserType, VideoLink } from "@/lib/types";
import { SolutionCard } from "@/components/SolutionCard";
import { toast } from "sonner";
import { showToast } from "@/components/toast";
import Link from "next/link";
import Heading from "@/components/Heading";
import { Switch } from "@/components/ui/switch";
import { NavigationButtonSection } from "@/components/navigation-button-section";

type Answer = {
  id: string;
  answer_text: string;
  destination_video_id: string | null;
};

type Question = {
  id: string;
  question_text: string;
  answers: Answer[];
};

type Video = {
  id: string;
  title: string;
  file: File | null;
  url: string;
  question: Question | null;
  isExpanded: boolean;
  duration: number; // Add duration in seconds
  links: VideoLink[]; // Updated links array with new type
  freezeAtEnd?: boolean; // Optional: whether to freeze at the end of the video
  destination_video_id: string | null;
  is_navigation_video?: boolean; // Add this
};

export default function InteractiveSessionForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [sessionName, setSessionName] = useState("");
  const [navigationButtonImage, setNavigationButtonImage] =
    useState<File | null>(null);
  // Navigation Video State
  const [navigationButtonVideo, setNavigationButtonVideo] =
    useState<File | null>(null);
  const [navigationButtonVideoUrl, setNavigationButtonVideoUrl] = useState("");
  const [navigationButtonVideoTitle, setNavigationButtonVideoTitle] =
    useState("");
  const [navigationButtonVideoDuration, setNavigationButtonVideoDuration] =
    useState(0);
  const [navigationButtonVideoLinks, setNavigationButtonVideoLinks] = useState<
    VideoLink[]
  >([]);
  // Add these to your existing state
  const [isNavigationVideoModalOpen, setIsNavigationVideoModalOpen] =
    useState(false);

  const [userId, setUserId] = useState("");
  const [solution, setSolution] = useState<Solution | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [isSolutionCollapsed, setIsSolutionCollapsed] = useState(false);
  const [showPlayButton, setShowPlayButton] = useState(true);
  const [comapnies, setCompanies] = useState<UserType[] | []>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState("");

  const [videos, setVideos] = useState<Video[]>([
    {
      id: uuidv4(),
      title: "Video Name",
      file: null,
      url: "",
      question: null,
      isExpanded: true,
      links: [],
      duration: 0,
      freezeAtEnd: false,
      destination_video_id: null,
    },
  ]);

  useEffect(() => {
    const fetchCompanies = async () => {
      const { data, error } = await supabase
        .from("users")

        .select("*")
        .eq("is_company", true);

      if (error) {
        console.error("Error fetching companies:", error);
        return;
      }
      setCompanies(data || []);
    };

    fetchCompanies();
  }, []);

  // Generate available videos list for video link destinations
  const availableVideos = videos.map((video) => ({
    id: video.id,
    title: video.title,
  }));

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
        links: [],
        duration: 0,
        freezeAtEnd: false,
        destination_video_id: null,
      },
    ]);
  };

  // Add this function to handle image upload
  const handleNavigationImageChange = useCallback((file: File | null) => {
    setNavigationButtonImage(file);
  }, []);

  const handleNavigationVideoChange = useCallback(
    (file: File | null, duration: number) => {
      setNavigationButtonVideo(file);
      setNavigationButtonVideoDuration(duration);

      if (file === null) {
        setNavigationButtonVideoUrl("");
      }
    },
    []
  );

  const handleNavigationVideoTitleChange = useCallback((title: string) => {
    setNavigationButtonVideoTitle(title);
  }, []);

  const handleNavigationVideoLinksChange = useCallback((links: VideoLink[]) => {
    setNavigationButtonVideoLinks(links);
  }, []);
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

  // In your parent component
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
      setVideos((prevVideos) =>
        prevVideos.map((v) =>
          v.id === videoId ? { ...v, links: [...links] } : v
        )
      );
    },
    []
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
    destination_video_id: string | null
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

    if (sessionName.length === 0) {
      showToast("error", "session name is missing");
      return;
    }
    if (!selectedCompanyId) {
      showToast("error", "Select a company");
      return;
    }
    setIsLoading(true);

    try {
      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const userId = user.id;
      setUserId(userId);

      // Create session
      const { data: sessionData, error: sessionError } = await supabase
        .from("sessions")
        .insert({
          title: sessionName,
          session_type: "interactive",
          showPlayButton: showPlayButton,
          associated_with: selectedCompanyId,
          created_by: userId,
        })
        .select()
        .single();

      if (sessionError || !sessionData)
        throw sessionError || new Error("Failed to create session");

      // Upload videos FIRST (without links)
      const uploadedVideos: Record<string, string> = {};

      // PHASE 1: Upload all videos first
      for (const [index, video] of videos.entries()) {
        if (!video.file) continue;

        // Upload file to storage
        const fileExt = video.file.name.split(".").pop();
        const filePath = `${userId}/${sessionData.id}/${video.id}.${fileExt}`;

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
            title: video.title || video.file.name,
            url: urlData.publicUrl,
            session_id: sessionData.id,
            is_interactive: true,
            order_index: index,
            duration: video.duration,
            freezeAtEnd: video.freezeAtEnd || false,
            destination_video_id: null, // Will be updated later
          })
          .select()
          .single();

        if (videoError || !videoData)
          throw videoError || new Error("Failed to create video");

        // Store mapping of temporary ID to actual DB ID
        uploadedVideos[video.id] = videoData.id;
      }

      // Upload navigation video if provided
      let navigationVideoDbId: string | null = null;
      let finalNavigationImageUrl = "";

      if (navigationButtonVideo) {
        const videoFileExt = navigationButtonVideo.name.split(".").pop();
        const videoFilePath = `${userId}/${sessionData.id}/navigation-video.${videoFileExt}`;

        const { data: videoUploadData, error: videoUploadError } =
          await supabase.storage
            .from("navigation-videos")
            .upload(videoFilePath, navigationButtonVideo);

        if (videoUploadError) throw videoUploadError;

        const { data: videoUrlData } = supabase.storage
          .from("navigation-videos")
          .getPublicUrl(videoFilePath);

        // Create navigation video record
        const { data: navVideoData, error: navVideoError } = await supabase
          .from("videos")
          .insert({
            title: navigationButtonVideoTitle,
            url: videoUrlData.publicUrl,
            session_id: sessionData.id,
            is_interactive: true,
            order_index: -1,
            duration: navigationButtonVideoDuration,
            freezeAtEnd: true, // Navigation video should freeze at end
            destination_video_id: null,
            is_navigation_video: true,
          })
          .select()
          .single();

        if (navVideoError || !navVideoData) throw navVideoError;

        navigationVideoDbId = navVideoData.id;
      }

      // Upload navigation button image if provided
      if (navigationButtonImage) {
        const imageFileExt = navigationButtonImage.name.split(".").pop();
        const imageFilePath = `${userId}/${sessionData.id}/navigation-button.${imageFileExt}`;

        const { data: imageUploadData, error: imageUploadError } =
          await supabase.storage
            .from("navigation-images")
            .upload(imageFilePath, navigationButtonImage);

        if (imageUploadError) throw imageUploadError;

        const { data: imageUrlData } = supabase.storage
          .from("navigation-images")
          .getPublicUrl(imageFilePath);

        finalNavigationImageUrl = imageUrlData.publicUrl;
      }

      // Update session with navigation button data
      await supabase
        .from("sessions")
        .update({
          navigation_button_image_url: finalNavigationImageUrl,
          navigation_button_video_id: navigationVideoDbId,
          navigation_button_video_title: navigationButtonVideoTitle,
        })
        .eq("id", sessionData.id);

      // PHASE 2: Update video destination_video_id relationships
      for (const video of videos) {
        const videoDbId = uploadedVideos[video.id];
        if (!videoDbId) continue;

        // Handle destination video for the video itself
        if (video.destination_video_id) {
          const destinationDbId = uploadedVideos[video.destination_video_id];
          if (destinationDbId) {
            await supabase
              .from("videos")
              .update({ destination_video_id: destinationDbId })
              .eq("id", videoDbId);
          }
        }

        // Create questions and answers
        if (video.question) {
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

          // Create answers with destination videos
          for (const answer of video.question.answers) {
            let destinationVideoId = null;
            if (answer.destination_video_id) {
              destinationVideoId = uploadedVideos[answer.destination_video_id];
            }

            await supabase.from("answers").insert({
              answer_text: answer.answer_text,
              question_id: questionData.id,
              destination_video_id: destinationVideoId,
            });
          }
        }
      }

      // PHASE 3: Upload video links AFTER all videos exist
      for (const video of videos) {
        const videoDbId = uploadedVideos[video.id];
        if (!videoDbId || !video.links || video.links.length === 0) continue;

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

          // Resolve destination video ID
          let destinationVideoId = null;
          if (
            (link.link_type === "video" || link.link_type === "form") &&
            link.destination_video_id
          ) {
            destinationVideoId = uploadedVideos[link.destination_video_id];
          }

          linkInserts.push({
            video_id: videoDbId,
            timestamp_seconds: link.timestamp_seconds,
            label: link.label,
            url: link.link_type === "url" ? link.url : null,
            destination_video_id: destinationVideoId,
            link_type: link.link_type,
            position_x: link.position_x || 20,
            position_y: link.position_y || 20,
            normal_state_image: normalImageUrl,
            hover_state_image: hoverImageUrl,
            normal_image_width: link.normal_image_width,
            normal_image_height: link.normal_image_height,
            duration_ms: link.duration_ms,
            hover_image_width: link.hover_image_width,
            hover_image_height: link.hover_image_height,
            form_data: link.link_type === "form" ? link.form_data : null,
          });
        }

        const { error: linksError } = await supabase
          .from("video_links")
          .insert(linkInserts);

        if (linksError) throw linksError;
      }

      // PHASE 4: Upload navigation video links
      if (
        navigationVideoDbId &&
        navigationButtonVideoLinks &&
        navigationButtonVideoLinks.length > 0
      ) {
        const navLinkInserts = [];

        for (const link of navigationButtonVideoLinks) {
          let normalImageUrl = link.normal_state_image;
          let hoverImageUrl = link.hover_state_image;

          // Upload normal state image if it's a File object
          if (link.normalImageFile) {
            const normalFileExt = link.normalImageFile.name.split(".").pop();
            const normalFilePath = `${userId}/${sessionData.id}/navigation/images/${link.id}_normal.${normalFileExt}`;

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
            const hoverFilePath = `${userId}/${sessionData.id}/navigation/images/${link.id}_hover.${hoverFileExt}`;

            const { error: hoverUploadError } = await supabase.storage
              .from("video-link-images")
              .upload(hoverFilePath, link.hoverImageFile);

            if (hoverUploadError) throw hoverUploadError;

            const { data: hoverUrlData } = supabase.storage
              .from("video-link-images")
              .getPublicUrl(hoverFilePath);

            hoverImageUrl = hoverUrlData.publicUrl;
          }

          // Resolve destination video ID for navigation video links
          let destinationVideoId = null;
          if (
            (link.link_type === "video" || link.link_type === "form") &&
            link.destination_video_id
          ) {
            destinationVideoId = uploadedVideos[link.destination_video_id];
          }

          navLinkInserts.push({
            video_id: navigationVideoDbId,
            timestamp_seconds: link.timestamp_seconds,
            label: link.label,
            url: link.link_type === "url" ? link.url : null,
            destination_video_id: destinationVideoId,
            link_type: link.link_type,
            position_x: link.position_x || 20,
            position_y: link.position_y || 20,
            normal_state_image: normalImageUrl,
            hover_state_image: hoverImageUrl,
            normal_image_width: link.normal_image_width,
            normal_image_height: link.normal_image_height,
            duration_ms: link.duration_ms,
            hover_image_width: link.hover_image_width,
            hover_image_height: link.hover_image_height,
            form_data: link.link_type === "form" ? link.form_data : null,
          });
        }

        const { error: navLinksError } = await supabase
          .from("video_links")
          .insert(navLinkInserts);

        if (navLinksError) throw navLinksError;
      }

      // Solutions Logic
      if (solution) {
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
            const filePath = `${userId}/${
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

        await supabase.from("solutions").insert(solutionData);
      }

      // Redirect to sessions page
      router.push("/sessions");
      showToast("success", "Interactive Session created successfully!");
    } catch (error) {
      console.error("Error creating session:", error);
      showToast("error", "Error creating Interactive Session");
    } finally {
      setIsLoading(false);
    }
  };

  const addSolution = () => {
    if (!selectedCategory) return;

    setSolution({
      id: uuidv4(),
      category_id: selectedCategory,
      session_id: "",
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

  const toggleFreezeAtEnd = (videoId: string, freeze: boolean) => {
    setVideos(
      videos.map((v) => (v.id === videoId ? { ...v, freezeAtEnd: freeze } : v))
    );
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
      <form onSubmit={handleSubmit} className="mt-4">
        <Card className="border-none shadow-none px-3">
          <CardHeader className="px-0">
            <CardTitle className="text-2xl font-semibold">
              Interactive Session Details
            </CardTitle>
            <CardDescription className="text-sm text-gray-600">
              Create an interactive learning experience with branching videos
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

              <div className="space-y-1">
                <Label
                  htmlFor="company"
                  className="text-sm font-medium text-gray-700"
                >
                  Associated Company
                </Label>
                <Select
                  value={selectedCompanyId}
                  onValueChange={(id) => setSelectedCompanyId(id)}
                >
                  <SelectTrigger className="h-10 w-1/2">
                    <SelectValue placeholder="Select a company" />
                  </SelectTrigger>
                  <SelectContent>
                    {comapnies.map((company) => (
                      <SelectItem key={company.id} value={company.id}>
                        {company.first_name || company.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                        {/* Freeze at end option */}
                        <div className="mt-4 p-4 border rounded-md bg-gray-50">
                          <Label className="text-sm font-medium">
                            Video Playback Behavior
                          </Label>
                          <p className="text-xs text-gray-500 mb-2">
                            Choose what happens when this video finishes playing
                          </p>

                          <div className="flex items-center space-x-4 gap-3">
                            <label className="flex items-center space-x-2">
                              <input
                                type="radio"
                                name={`freeze-${video.id}`}
                                checked={video.freezeAtEnd === true}
                                onChange={() =>
                                  toggleFreezeAtEnd(video.id, true)
                                }
                                className="h-4 w-4 text-blue-600"
                              />
                              <span className="text-sm">Freeze at end</span>
                            </label>
                            <label className="flex items-center space-x-2">
                              <input
                                type="radio"
                                name={`freeze-${video.id}`}
                                checked={
                                  video.freezeAtEnd === false ||
                                  video.freezeAtEnd === undefined
                                }
                                onChange={() =>
                                  toggleFreezeAtEnd(video.id, false)
                                }
                                className="h-4 w-4 text-blue-600"
                              />
                              <span className="text-sm">
                                Autplay next video
                              </span>
                            </label>
                          </div>

                          {!video.freezeAtEnd && (
                            <p className="text-xs text-red-600 my-2">
                              NOTE: If the video has questions, the video will
                              automatically be paused at the last frame.
                            </p>
                          )}
                          {!video.freezeAtEnd && (
                            <div className="flex gap-3 mt-3 items-center">
                              <Label className="">Next Video:</Label>
                              <div className="">
                                <Select
                                  value={video.destination_video_id || "no"}
                                  onValueChange={(value) =>
                                    setVideos(
                                      videos.map((v) =>
                                        v.id === video.id
                                          ? {
                                              ...v,
                                              destination_video_id:
                                                value === "no" ? null : value,
                                            }
                                          : v
                                      )
                                    )
                                  }
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select next video" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="no">
                                      No video (end session)
                                    </SelectItem>
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
                            </div>
                          )}
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
                                      value={
                                        answer.destination_video_id ?? "no"
                                      }
                                      onValueChange={(value) =>
                                        updateDestinationVideo(
                                          video.id,
                                          answer.id,
                                          value === "no" ? null : value
                                        )
                                      }
                                    >
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select destination video" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="no">
                                          No video
                                        </SelectItem>
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

            {/* Enhanced Navigation Button Section */}
            <NavigationButtonSection
              navigationButtonImage={navigationButtonImage}
              navigationButtonVideo={navigationButtonVideo}
              navigationButtonVideoUrl={navigationButtonVideoUrl}
              navigationButtonVideoTitle={navigationButtonVideoTitle}
              navigationButtonVideoDuration={navigationButtonVideoDuration}
              navigationButtonVideoLinks={navigationButtonVideoLinks}
              availableVideos={availableVideos}
              onImageChange={handleNavigationImageChange}
              onVideoChange={handleNavigationVideoChange}
              onVideoTitleChange={handleNavigationVideoTitleChange}
              onVideoLinksChange={handleNavigationVideoLinksChange}
            />

            <div className="flex items-center space-x-2">
              <Switch
                checked={showPlayButton}
                onCheckedChange={setShowPlayButton}
                id="airplane-mode"
              />
              <Label htmlFor="airplane-mode">
                Show play/pause button (iFrame)
              </Label>
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
                        Add Solution
                      </Button>
                      <button
                        type="button"
                        onClick={removeSolution}
                        className="h-10 text-red-600 hover:text-red-800"
                      >
                        Reset
                      </button>
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
                  onClick={() => router.push("/sessions/create")}
                  className="h-10 px-6"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading || !hasAtLeastOneVideo}
                  className="h-10 px-6"
                >
                  {isLoading ? "Saving..." : "Save"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
