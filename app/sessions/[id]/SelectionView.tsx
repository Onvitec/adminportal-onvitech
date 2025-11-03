"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { VideoType, Question, Answer, Solution, VideoLink } from "@/lib/types";
import { Answers, DestinationVedio, Questions } from "@/components/icons";
import { Button } from "@/components/ui/button";
import {
  ChevronDown,
  ChevronUp,
  Clock,
  Video,
  ImageIcon,
  LinkIcon,
} from "lucide-react";
import { SolutionCard } from "@/components/SolutionCard";
import { Loader } from "@/components/Loader";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { formatTimestamp } from "@/lib/helper";

type ViewVideo = {
  id: string;
  title: string;
  url: string;
  question: Question | null;
  isExpanded: boolean;
  duration: number;
  links: VideoLink[];
};

type NavigationButtonData = {
  image_url: string | null;
  video_url: string | null;
  video_title: string;
  video_links: VideoLink[];
  video_duration: number;
};

export default function SelectionViewSession({
  sessionId,
}: {
  sessionId: string;
}) {
  const [videos, setVideos] = useState<ViewVideo[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [solutions, setSolutions] = useState<Solution[]>([]);
  const [solutionsExpanded, setSolutionsExpanded] = useState(true);
  const [navigationButton, setNavigationButton] =
    useState<NavigationButtonData>({
      image_url: null,
      video_url: null,
      video_title: "",
      video_links: [],
      video_duration: 0,
    });
  const [showPlayButton, setShowPlayButton] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch session data
        const { data: sessionData, error: sessionError } = await supabase
          .from("sessions")
          .select("*")
          .eq("id", sessionId)
          .single();

        if (sessionError) throw sessionError;

        setShowPlayButton(sessionData.showPlayButton);

        // Fetch navigation button data
        const navigationData: NavigationButtonData = {
          image_url: sessionData.navigation_button_image_url,
          video_url: null,
          video_title: sessionData.navigation_button_video_title || "",
          video_links: [],
          video_duration: 0,
        };

        // Fetch navigation video from videos table
        const { data: navigationVideoData, error: navVideoError } =
          await supabase
            .from("videos")
            .select("*")
            .eq("session_id", sessionId)
            .eq("is_navigation_video", true)
            .maybeSingle();

        if (!navVideoError && navigationVideoData) {
          navigationData.video_url = navigationVideoData.url;
          navigationData.video_title = navigationVideoData.title;
          navigationData.video_duration = navigationVideoData.duration || 0;

          // Fetch navigation video links
          const { data: navLinksData, error: navLinksError } = await supabase
            .from("video_links")
            .select("*")
            .eq("video_id", navigationVideoData.id)
            .order("timestamp_seconds", { ascending: true });

          if (!navLinksError && navLinksData) {
            navigationData.video_links = navLinksData.map((link) => ({
              id: link.id.toString(),
              timestamp_seconds: link.timestamp_seconds,
              label: link.label,
              url: link.url || undefined,
              video_id: link.video_id,
              destination_video_id: link.destination_video_id || undefined,
              link_type:
                (link.link_type as "url" | "video" | "form") ||
                (link.url ? "url" : "video"),
              position_x: link.position_x || 20,
              position_y: link.position_y || 20,
              duration_ms: link.duration_ms,
              normal_state_image: link.normal_state_image || undefined,
              hover_state_image: link.hover_state_image || undefined,
              normal_image_width: link.normal_image_width || undefined,
              normal_image_height: link.normal_image_height || undefined,
              hover_image_width: link.hover_image_width || undefined,
              hover_image_height: link.hover_image_height || undefined,
              form_data: link.form_data || undefined,
            }));
          }
        }

        setNavigationButton(navigationData);

        // Fetch regular videos
        const { data: videosData, error: videosError } = await supabase
          .from("videos")
          .select("*")
          .eq("session_id", sessionId)
          .eq("is_navigation_video", false)
          .order("order_index", { ascending: true });

        if (videosError) throw videosError;

        const videosWithDetails: ViewVideo[] = await Promise.all(
          (videosData || []).map(async (video) => {
            const videoObj: ViewVideo = {
              id: video.id,
              title: video.title,
              url: video.url,
              question: null,
              isExpanded: true,
              duration: video.duration || 0,
              links: [],
            };

            // Fetch video links
            const { data: linksData, error: linksError } = await supabase
              .from("video_links")
              .select("*")
              .eq("video_id", video.id)
              .order("timestamp_seconds", { ascending: true });

            if (!linksError && linksData) {
              videoObj.links = linksData.map((link) => ({
                id: link.id.toString(),
                timestamp_seconds: link.timestamp_seconds,
                label: link.label,
                url: link.url || undefined,
                video_id: link.video_id,
                destination_video_id: link.destination_video_id || undefined,
                link_type:
                  (link.link_type as "url" | "video" | "form") ||
                  (link.url ? "url" : "video"),
                position_x: link.position_x || 20,
                position_y: link.position_y || 20,
                duration_ms: link.duration_ms,
                normal_state_image: link.normal_state_image || undefined,
                hover_state_image: link.hover_state_image || undefined,
                normal_image_width: link.normal_image_width || undefined,
                normal_image_height: link.normal_image_height || undefined,
                hover_image_width: link.hover_image_width || undefined,
                hover_image_height: link.hover_image_height || undefined,
                form_data: link.form_data || undefined,
              }));
            }

            // Fetch question for this video
            const { data: questionData, error: questionError } = await supabase
              .from("questions")
              .select("*")
              .eq("video_id", video.id)
              .maybeSingle();

            if (!questionError && questionData) {
              // Fetch answers for this question
              const { data: answersData, error: answersError } = await supabase
                .from("answers")
                .select("*")
                .eq("question_id", questionData.id)
                .order("created_at", { ascending: true });

              if (!answersError && answersData) {
                videoObj.question = {
                  id: questionData.id,
                  question_text: questionData.question_text,
                  video_id: questionData.video_id,
                  answers: answersData.map((answer) => ({
                    id: answer.id,
                    answer_text: answer.answer_text,
                    question_id: answer.question_id,
                    destination_video_id: answer.destination_video_id || null,
                  })),
                };
              }
            }

            return videoObj;
          })
        );

        setVideos(videosWithDetails);

        // Process questions with answers for the existing logic
        const allQuestions = videosWithDetails.flatMap((video) =>
          video.question
            ? [
                {
                  ...video.question,
                  video_id: video.id,
                  answers: video.question.answers.map((answer) => ({
                    ...answer,
                    destination_video: answer.destination_video_id
                      ? videosWithDetails.find(
                          (v) => v.id === answer.destination_video_id
                        )
                      : null,
                  })),
                },
              ]
            : []
        );

        setQuestions(allQuestions as any);

        // Fetch solutions
        const { data: solutionsData, error: solutionsError } = await supabase
          .from("solutions")
          .select("*")
          .eq("session_id", sessionId);

        if (solutionsError) throw solutionsError;
        setSolutions(solutionsData || []);
      } catch (error) {
        console.error("Error fetching selection session data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [sessionId]);

  const toggleExpandVideo = (videoId: string) => {
    setVideos(
      videos.map((v) =>
        v.id === videoId ? { ...v, isExpanded: !v.isExpanded } : v
      )
    );
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getLinkTypeIcon = (linkType: string) => {
    switch (linkType) {
      case "url":
        return <LinkIcon className="h-3 w-3" />;
      case "video":
        return <Video className="h-3 w-3" />;
      case "form":
        return "📋";
      default:
        return <LinkIcon className="h-3 w-3" />;
    }
  };

  const getLinkTypeColor = (linkType: string) => {
    switch (linkType) {
      case "url":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "video":
        return "bg-green-100 text-green-800 border-green-200";
      case "form":
        return "bg-purple-100 text-purple-800 border-purple-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  if (loading) {
    return (
      <div className="p-6 text-center">
        <Loader size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-8 py-6">
      {/* Videos Section */}
      {videos.map((video) => {
        const videoQuestions = questions.filter((q) => q.video_id === video.id);

        return (
          <div
            key={video.id}
            className="border border-neutral-200 rounded-xl overflow-hidden bg-white"
          >
            <div className="p-4 flex items-center justify-between bg-neutral-50">
              <div className="flex items-center gap-3">
                <Video className="h-5 w-5 text-neutral-600" />
                <h3 className="text-base font-medium text-neutral-900">
                  {video.title || "Video Name"}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  type="button"
                  onClick={() => toggleExpandVideo(video.id)}
                  className="h-8 w-8 p-0 text-neutral-500 hover:text-neutral-900"
                >
                  {video.isExpanded ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {video.isExpanded && (
              <div className="p-6 space-y-6 bg-white">
                {/* Video Player */}
                <div className="flex flex-col md:flex-row gap-6">
                  {/* Video on the left */}
                  <div className="w-full md:w-2/5">
                    <div className="relative rounded-xl overflow-hidden bg-black">
                      <video
                        src={video.url}
                        controls
                        className="w-full aspect-video object-cover h-[351px]"
                      />
                      <div className="absolute top-3 right-3 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-sm">
                        {formatTime(video.duration)}
                      </div>
                    </div>
                  </div>

                  {/* Questions on the right */}
                  <div className="w-full md:w-3/5">
                    {videoQuestions.length > 0 ? (
                      <div className="space-y-6">
                        {videoQuestions.map((question) => (
                          <div key={question.id} className="space-y-4">
                            {/* Question section with border bottom */}
                            <div className="flex items-start gap-3 pb-3 border-b border-gray-200">
                              <div className="pt-1">
                                <Questions className="w-[15px] h-[14.35px]" />
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

                {/* Video Links Section */}
                {video.links.length > 0 && (
                  <div className="space-y-4 p-4 border border-neutral-200 rounded-xl bg-white">
                    <Label className="text-sm font-medium text-neutral-900 flex items-center gap-2">
                      <LinkIcon className="h-4 w-4" />
                      Video Links ({video.links.length})
                    </Label>
                    <p className="text-sm text-neutral-500">
                      Interactive links that appear at specific timestamps
                      during video playback
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {video.links.map((link) => {
                        const appearsAt = formatTimestamp(
                          link.timestamp_seconds
                        );
                        const durationSeconds = link.duration_ms
                          ? `${(link.duration_ms / 1000).toFixed(1)}s`
                          : null;

                        return (
                          <div
                            key={link.id}
                            className="flex items-start gap-3 p-4 border border-neutral-200 rounded-lg bg-white hover:bg-neutral-50 transition-colors"
                          >
                            {link.normal_state_image && (
                              <img
                                src={link.normal_state_image}
                                alt={link.label}
                                className="w-16 h-16 object-cover rounded-md flex-shrink-0"
                              />
                            )}

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="font-medium text-sm text-neutral-900 truncate">
                                  {link.label}
                                </span>
                                <span
                                  className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getLinkTypeColor(
                                    link.link_type
                                  )}`}
                                >
                                  {getLinkTypeIcon(link.link_type)}
                                  {link.link_type}
                                </span>
                              </div>

                              <div className="space-y-1 text-xs text-neutral-600">
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  Appears at: {appearsAt}
                                </div>

                                <div className="flex items-center gap-1">
                                  📍 Position: ({link.position_x}%,{" "}
                                  {link.position_y}%)
                                </div>

                                {durationSeconds && (
                                  <div className="flex items-center gap-1">
                                    ⏱️ Duration: {durationSeconds}
                                  </div>
                                )}

                                {link.link_type === "url" && link.url && (
                                  <div className="truncate">
                                    🔗 URL: {link.url}
                                  </div>
                                )}

                                {link.link_type === "form" &&
                                  link.form_data && (
                                    <div className="flex items-center gap-1">
                                      📋 Form:{" "}
                                      {link.form_data.title || "Custom Form"}
                                    </div>
                                  )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* Navigation Button Section - Read Only */}
      {(navigationButton.image_url || navigationButton.video_url) && (
        <div className="border border-neutral-200 rounded-xl overflow-hidden bg-white">
          <div className="p-6 border-b bg-gray-50">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              Navigation Button
            </h3>
            <p className="text-sm text-neutral-500 mt-1">
              Button image and interactive video configuration for navigation.
            </p>
          </div>

          <div className="p-6 space-y-6">
            {/* Navigation Image */}
            {navigationButton.image_url && (
              <div className="space-y-3">
                <Label className="text-sm font-medium text-neutral-700">
                  Button Image
                </Label>
                <div className="border border-neutral-200 rounded-xl p-6 bg-neutral-50 md:w-1/3">
                  <div className="space-y-4 flex flex-col items-center">
                    <img
                      src={navigationButton.image_url}
                      alt="Navigation button"
                      className="max-h-32 object-contain rounded-md"
                    />
                    <div className="text-sm text-neutral-600">
                      Navigation button image
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Video */}
            {navigationButton.video_url && (
              <div className="space-y-4">
                <Label className="text-sm font-medium text-neutral-700">
                  Navigation Video
                </Label>

                <div className="border border-neutral-200 rounded-xl p-6 bg-neutral-50">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Video className="h-5 w-5 text-green-600" />
                        <span className="font-medium text-neutral-900">
                          {navigationButton.video_title}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-neutral-600">
                        <Clock className="h-4 w-4" />
                        {formatTime(navigationButton.video_duration)}
                      </div>
                    </div>

                    <div className="relative rounded-lg overflow-hidden bg-black">
                      <video
                        src={navigationButton.video_url}
                        controls
                        className="w-full aspect-video object-contain"
                      />
                    </div>

                    {/* Navigation Video Links */}
                   {navigationButton.video_links.length > 0 && (
                          <div className="space-y-3">
                            <Label className="text-sm font-medium text-neutral-700">
                              Navigation Video Links (
                              {navigationButton.video_links.length})
                            </Label>
                            <div className="flex gap-4 w-max pb-2">
                              {navigationButton.video_links.map((link) => {
                                const appearsAt = formatTimestamp(
                                  link.timestamp_seconds
                                );
                                const durationSeconds = link.duration_ms
                                  ? `${(link.duration_ms / 1000).toFixed(1)}s`
                                  : null;

                                return (
                                  <div
                                    key={link.id}
                                    className="w-[420px] flex-shrink-0 flex items-start gap-3 p-4 border border-neutral-200 rounded-lg bg-white hover:bg-neutral-50 transition-colors"
                                  >
                                    {link.normal_state_image && (
                                      <img
                                        src={link.normal_state_image}
                                        alt={link.label}
                                        className="w-16 h-16 object-cover rounded-md flex-shrink-0"
                                      />
                                    )}

                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 mb-2">
                                        <span className="font-medium text-sm text-neutral-900 truncate">
                                          {link.label}
                                        </span>
                                        <span
                                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getLinkTypeColor(
                                            link.link_type
                                          )}`}
                                        >
                                          {getLinkTypeIcon(link.link_type)}
                                          {link.link_type}
                                        </span>
                                      </div>

                                      <div className="space-y-1 text-xs text-neutral-600">
                                        <div className="flex items-center gap-1">
                                          <Clock className="h-3 w-3" />
                                          Appears at: {appearsAt}
                                        </div>

                                        <div className="flex items-center gap-1">
                                          📍 Position: ({link.position_x}%,{" "}
                                          {link.position_y}%)
                                        </div>

                                        {durationSeconds && (
                                          <div className="flex items-center gap-1">
                                            ⏱️ Duration: {durationSeconds}
                                          </div>
                                        )}

                                        {link.link_type === "url" &&
                                          link.url && (
                                            <div className="truncate">
                                              🔗 URL: {link.url}
                                            </div>
                                          )}

                                        {link.link_type === "video" &&
                                          link.destination_video_title && (
                                            <div className="flex items-center gap-1">
                                              <Video className="h-3 w-3" />
                                              Destination:{" "}
                                              {link.destination_video_title}
                                            </div>
                                          )}

                                        {link.link_type === "form" &&
                                          link.form_data && (
                                            <div className="flex items-center gap-1">
                                              📋 Form:{" "}
                                              {link.form_data.title ||
                                                "Custom Form"}
                                            </div>
                                          )}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Play Button Setting */}
      <div className="flex items-center space-x-2 p-4 border border-neutral-200 rounded-xl bg-neutral-50">
        <Switch checked={showPlayButton} disabled className="opacity-50" />
        <Label className="text-sm font-medium text-neutral-700">
          Show play/pause button (iFrame)
        </Label>
      </div>

      {/* Solutions Section */}
      <div className="border border-neutral-200 rounded-xl overflow-hidden px-4 bg-white">
        <div className="flex items-center justify-between py-4">
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
