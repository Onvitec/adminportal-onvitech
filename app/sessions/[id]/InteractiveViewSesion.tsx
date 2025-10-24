"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  VideoType,
  Question,
  Answer,
  Solution,
  VideoLink,
  SolutionCategory,
} from "@/lib/types";
import { Answers, DestinationVedio, Questions } from "@/components/icons";
import { Button } from "@/components/ui/button";
import {
  ChevronDown,
  ChevronUp,
  Clock,
  Video,
  ImageIcon,
  Eye,
  LinkIcon,
} from "lucide-react";
import { SolutionCard } from "@/components/SolutionCard";
import { Loader } from "@/components/Loader";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import Link from "next/link";
import Heading from "@/components/Heading";

type ViewVideo = {
  id: string;
  title: string;
  url: string;
  question: Question | null;
  isExpanded: boolean;
  duration: number;
  links: VideoLink[];
  freezeAtEnd?: boolean;
  destination_video_id: string | null;
  destination_video_title?: string;
};

type NavigationButtonData = {
  image_url: string | null;
  video_url: string | null;
  video_title: string;
  video_links: VideoLink[];
  video_duration: number;
};

export function InteractiveSessionView({ sessionId }: { sessionId: string }) {
  const [videos, setVideos] = useState<ViewVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [solutions, setSolutions] = useState<Solution[]>([]);
  const [solutionsExpanded, setSolutionsExpanded] = useState(true);
  const [sessionData, setSessionData] = useState<any>(null);
  const [navigationButton, setNavigationButton] =
    useState<NavigationButtonData>({
      image_url: null,
      video_url: null,
      video_title: "",
      video_links: [],
      video_duration: 0,
    });
  const [showPlayButton, setShowPlayButton] = useState(true);
  const [sessionName, setSessionName] = useState("");
  const [selectedCompany, setSelectedCompany] = useState("");

  useEffect(() => {
    const fetchSessionData = async () => {
      try {
        // Fetch session data
        const { data: sessionData, error: sessionError } = await supabase
          .from("sessions")
          .select("*")
          .eq("id", sessionId)
          .single();

        if (sessionError || !sessionData)
          throw sessionError || new Error("Session not found");

        setSessionData(sessionData);
        setSessionName(sessionData.title);
        setShowPlayButton(sessionData.showPlayButton);
        setSelectedCompany(sessionData.associated_with);

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

        // Create video ID mapping for destination references
        const videoIdMap: Record<string, string> = {};
        videosData?.forEach((video) => {
          videoIdMap[video.id] = video.title;
        });

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
              freezeAtEnd: video.freezeAtEnd || false,
              destination_video_id: video.destination_video_id,
              destination_video_title: video.destination_video_id
                ? videoIdMap[video.destination_video_id]
                : undefined,
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
                destination_video_title: link.destination_video_id
                  ? videoIdMap[link.destination_video_id]
                  : undefined,
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
                    destination_video_title: answer.destination_video_id
                      ? videoIdMap[answer.destination_video_id]
                      : undefined,
                  })),
                };
              }
            }

            return videoObj;
          })
        );

        setVideos(videosWithDetails);

        // Fetch solutions
        const { data: solutionsData, error: solutionsError } = await supabase
          .from("solutions")
          .select("*")
          .eq("session_id", sessionId);

        if (solutionsError) throw solutionsError;
        setSolutions(solutionsData || []);
      } catch (error) {
        console.error("Error fetching session data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSessionData();
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
      <div className=" mx-auto py-8 max-w-4xl">
        <div className="flex justify-center items-center h-64">
          <Loader size="md" />
        </div>
      </div>
    );
  }

  return (
    <div className=" mx-auto">
      <Card className="border-none shadow-none px-3 mt-4">
        <CardContent className="space-y-6 px-0">
          {/* Interactive Videos */}
          <div className="mt-8">
            <div className="space-y-4">
              {videos.map((video) => (
                <div
                  key={video.id}
                  className="border border-neutral-200 rounded-xl overflow-hidden bg-white"
                >
                  <div className="p-4 flex items-center justify-between bg-neutral-50">
                    <div className="flex items-center gap-3">
                      <Video className="h-5 w-5 text-neutral-600" />
                      <h3 className="text-base font-medium text-neutral-900">
                        {video.title}
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
                      <div className="space-y-4">
                        <div className="relative h-[1200px] object-cover rounded-xl overflow-hidden bg-black">
                          <video
                            src={video.url}
                            controls
                            className="w-full aspect-video object-fill"
                          />
                          <div className="absolute top-3 right-3 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-sm">
                            {formatTime(video.duration)}
                          </div>
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
                            Interactive links that appear at specific timestamps during video playback
                          </p>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {video.links.map((link) => (
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
                                      Appears at: {formatTime(link.timestamp_seconds)}
                                    </div>
                                    
                                    <div className="flex items-center gap-1">
                                      📍 Position: ({link.position_x}%, {link.position_y}%)
                                    </div>

                                    {link.duration_ms && (
                                      <div className="flex items-center gap-1">
                                        ⏱️ Duration: {link.duration_ms}ms
                                      </div>
                                    )}

                                    {link.link_type === "url" && link.url && (
                                      <div className="truncate">
                                        🔗 URL: {link.url}
                                      </div>
                                    )}

                                    {link.link_type === "video" && link.destination_video_title && (
                                      <div className="flex items-center gap-1">
                                        <Video className="h-3 w-3" />
                                        Destination: {link.destination_video_title}
                                      </div>
                                    )}

                                    {link.link_type === "form" && link.form_data && (
                                      <div className="flex items-center gap-1">
                                        📋 Form: {link.form_data.title || "Custom Form"}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Playback Behavior */}
                      <div className="p-4 border border-neutral-200 rounded-xl bg-neutral-50">
                        <Label className="text-sm font-medium text-neutral-900">
                          Video Playback Behavior
                        </Label>
                        <div className="flex items-center space-x-6 gap-3 mt-3">
                          <div className="flex items-center space-x-2">
                            <div
                              className={`h-4 w-4 rounded-full border-2 ${
                                video.freezeAtEnd
                                  ? "bg-blue-500 border-blue-500"
                                  : "border-neutral-400"
                              }`}
                            />
                            <span className="text-sm text-neutral-700">
                              Freeze at end
                            </span>
                          </div>

                          <div className="flex items-center space-x-2">
                            <div
                              className={`h-4 w-4 rounded-full border-2 ${
                                !video.freezeAtEnd
                                  ? "bg-green-500 border-green-500"
                                  : "border-neutral-400"
                              }`}
                            />
                            <span className="text-sm text-neutral-700">
                              Autoplay next video
                            </span>
                          </div>
                        </div>

                        {!video.freezeAtEnd && video.destination_video_title && (
                          <div className="mt-3 p-2 bg-blue-50 rounded-md border border-blue-200">
                            <div className="text-sm text-blue-800">
                              Next Video:{" "}
                              <span className="font-medium">
                                {video.destination_video_title}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Question Section */}
                      {video.question ? (
                        <div className="space-y-4 p-4 border border-neutral-200 rounded-xl bg-white">
                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-neutral-900">
                              Question
                            </Label>
                            <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200">
                              <p className="text-neutral-900">
                                {video.question.question_text}
                              </p>
                            </div>
                          </div>

                          <div className="space-y-3">
                            <Label className="text-sm font-medium text-neutral-900">
                              Answers ({video.question.answers.length})
                            </Label>
                            <div className="space-y-3">
                              {video.question.answers.map((answer, index) => (
                                <div
                                  key={answer.id}
                                  className="grid grid-cols-1 md:grid-cols-12 gap-3 items-start"
                                >
                                  <div className="md:col-span-7">
                                    <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200">
                                      <div className="text-xs text-neutral-600 mb-1">
                                        Answer {index + 1}
                                      </div>
                                      <p className="text-neutral-900 font-medium">
                                        {answer.answer_text}
                                      </p>
                                    </div>
                                  </div>
                                  {/* <div className="md:col-span-5">
                                    {answer.destination_video_title ? (
                                      <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                                        <div className="text-xs text-blue-700 mb-1">
                                          Destination Video
                                        </div>
                                        <div className="text-blue-900 font-medium flex items-center gap-1">
                                          <Video className="h-3 w-3" />
                                          {answer.destination_video_title}
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="p-3 bg-neutral-100 rounded-lg border border-neutral-200 text-center">
                                        <div className="text-xs text-neutral-500">
                                          No destination video
                                        </div>
                                      </div>
                                    )}
                                  </div> */}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="p-4 border border-neutral-200 rounded-xl bg-neutral-50 text-center text-neutral-500">
                          No questions added to this video
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Navigation Button Section - Read Only */}
          {(navigationButton.image_url || navigationButton.video_url) && (
            <div className="mt-8 rounded-2xl border border-neutral-200 bg-white p-8">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-neutral-900 flex items-center gap-2">
                  <ImageIcon className="h-5 w-5" />
                  Navigation Button
                </h3>
                <p className="text-sm text-neutral-500 mt-1">
                  Button image and interactive video configuration for
                  navigation.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-8">
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
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                              {navigationButton.video_links.map((link) => (
                                <div
                                  key={link.id}
                                  className="flex items-start gap-3 p-4 border border-neutral-200 rounded-lg bg-white"
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
                                      <span className="font-medium text-sm text-neutral-900">
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
                                        At {formatTime(link.timestamp_seconds)}
                                      </div>
                                      <div className="flex items-center gap-1">
                                        📍 Position: ({link.position_x}%, {link.position_y}%)
                                      </div>
                                      {link.duration_ms && (
                                        <div className="flex items-center gap-1">
                                          ⏱️ Duration: {link.duration_ms}ms
                                        </div>
                                      )}
                                      {link.link_type === "url" && link.url && (
                                        <div className="truncate">
                                          🔗 {link.url}
                                        </div>
                                      )}
                                      {/* {link.link_type === "video" && link.destination_video_title && (
                                        <div className="flex items-center gap-1">
                                          <Video className="h-3 w-3" />
                                          To: {link.destination_video_title}
                                        </div>
                                      )} */}
                                    </div>
                                  </div>
                                </div>
                              ))}
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
          <div className="border border-neutral-200 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between p-6 bg-white">
              <h2 className="text-xl font-semibold text-neutral-900">
                Solution Type
              </h2>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setSolutionsExpanded(!solutionsExpanded)}
                className="cursor-pointer"
              >
                {solutionsExpanded ? (
                  <ChevronUp className="h-5 w-5" />
                ) : (
                  <ChevronDown className="h-5 w-5" />
                )}
              </Button>
            </div>

            {solutionsExpanded && (
              <div className="bg-neutral-50 p-6 border-t border-neutral-200">
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
                  <div className="text-center py-8">
                    <p className="text-neutral-500">No solutions added</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}