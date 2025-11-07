"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
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
  Trash2,
  GripVertical,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { v4 as uuidv4 } from "uuid";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { cn, solutionCategories } from "@/lib/utils";
import { ModuleCard } from "@/components/forms/linear-flow/module";
import { Solution, SolutionCategory, VideoLink } from "@/lib/types";
import { SolutionCard } from "@/components/SolutionCard";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { showToast } from "@/components/toast";
import Link from "next/link";
import Heading from "@/components/Heading";
import { VideoUploadWithLinks } from "@/components/forms/videoo-upload";

type Video = {
  id: string;
  title: string;
  file: File | null;
  url: string;
  db_id?: string;
  path?: string;
  duration: number;
  links: VideoLink[];
};

type Module = {
  id: string;
  title: string;
  videos: Video[];
  db_id?: string;
};

export default function LinearSessionEditForm() {
  const { sessionId } = useParams();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [sessionName, setSessionName] = useState("");
  const [userId, setUserId] = useState("");
  const [solution, setSolution] = useState<Solution | null>(null);
  const [solutionCategory, setSolutionCategory] = useState<number | null>(null);
  const [solutionsExpanded, setSolutionsExpanded] = useState(true);
  const [modules, setModules] = useState<Module[]>([
    {
      id: uuidv4(),
      title: "Module 1",
      videos: [
        {
          id: uuidv4(),
          title: "Video Name",
          file: null,
          url: "",
          duration: 0,
          links: [],
        },
      ],
    },
  ]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const activeModule = modules.find((module) => module.id === activeId);

  // Generate available videos list for video link destinations
  const availableVideos = modules.flatMap((module) =>
    module.videos.map((video) => ({
      id: video.id,
      title: video.title,
      module: module.title,
    }))
  );

  useEffect(() => {
    if (sessionId) {
      loadSessionData(sessionId as string);
    }
  }, [sessionId]);

  const loadSessionData = async (sessionId: string) => {
    setIsLoading(true);
    try {
      // Fetch session data
      const { data: sessionData, error: sessionError } = await supabase
        .from("sessions")
        .select("*")
        .eq("id", sessionId)
        .single();

      if (sessionError || !sessionData)
        throw sessionError || new Error("Session not found");

      setSessionName(sessionData.title);
      setUserId(sessionData.created_by);

      // Fetch modules and videos
      const { data: modulesData, error: modulesError } = await supabase
        .from("modules")
        .select("*, videos(*)")
        .eq("session_id", sessionId)
        .order("order_index", { ascending: true });

      if (modulesError) throw modulesError;

      // Fetch video links for all videos
      const videoIds = modulesData.flatMap((module) =>
        module.videos.map((video: any) => video.id)
      );

      let videoLinks: VideoLink[] = [];
      if (videoIds.length > 0) {
        const { data: linksData, error: linksError } = await supabase
          .from("video_links")
          .select("*")
          .in("video_id", videoIds);

        if (!linksError && linksData) {
          videoLinks = linksData;
        }
      }

      const formattedModules = await Promise.all(
        modulesData.map(async (module, index) => ({
          id: uuidv4(),
          db_id: module.id,
          title: module.title,
          videos: await Promise.all(
            module.videos.map(async (video: any) => {
              const videoLinksForThisVideo = videoLinks.filter(
                (link) => link.video_id === video.id
              );

              return {
                id: uuidv4(),
                db_id: video.id,
                title: video.title,
                file: null,
                url: video.url,
                path: video.path,
                duration: video.duration || 0,
                links: videoLinksForThisVideo.map((link) => ({
                  id: link.id,
                  timestamp_seconds: link.timestamp_seconds,
                  label: link.label,
                  url: link.url || "",
                  destination_video_id: link.destination_video_id || "",
                  link_type: link.link_type as "url" | "video",
                  position_x: link.position_x ?? 20,
                  position_y: link.position_y ?? 20,
                })),
              };
            })
          ),
        }))
      );

      // Fetch solution if exists
      const { data: solutionData, error: solutionError } = await supabase
        .from("solutions")
        .select("*")
        .eq("session_id", sessionId)
        .single();

      if (!solutionError && solutionData) {
        setSolution({
          ...solutionData,
          id: solutionData.id,
          category_id: solutionData.category_id,
          session_id: solutionData.session_id,
        });
        setSolutionCategory(solutionData.category_id);
      }

      setModules(formattedModules);
    } catch (error) {
      console.error("Error loading session data:", error);
      showToast("error", "Failed to load session data");
    } finally {
      setIsLoading(false);
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor)
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      setModules((prev) => {
        const oldIndex = prev.findIndex((module) => module.id === active.id);
        const newIndex = prev.findIndex((module) => module.id === over.id);

        const newModules = [...prev];
        const [removed] = newModules.splice(oldIndex, 1);
        newModules.splice(newIndex, 0, removed);

        return newModules;
      });
    }

    setActiveId(null);
  };

  const addModule = () => {
    setModules([
      ...modules,
      {
        id: uuidv4(),
        title: `Module ${modules.length + 1}`,
        videos: [
          {
            id: uuidv4(),
            title: "Video Name",
            file: null,
            url: "",
            duration: 0,
            links: [],
          },
        ],
      },
    ]);
  };

  const removeModule = async (moduleId: string) => {
    const moduleToDelete = modules.find((m) => m.id === moduleId);

    if (moduleToDelete?.db_id) {
      // Delete videos from storage first
      const videosToDelete = moduleToDelete.videos.filter((v) => v.path);
      for (const video of videosToDelete) {
        if (video.path) {
          await supabase.storage.from("videos").remove([video.path]);
        }
      }

      // Delete module and its videos from database
      await supabase
        .from("videos")
        .delete()
        .eq("module_id", moduleToDelete.db_id);
      await supabase.from("modules").delete().eq("id", moduleToDelete.db_id);
    }

    setModules(modules.filter((m) => m.id !== moduleId));
  };

  const updateModuleName = (moduleId: string, title: string) => {
    setModules(modules.map((m) => (m.id === moduleId ? { ...m, title } : m)));
  };

  const addVideo = (moduleId: string) => {
    setModules(
      modules.map((m) =>
        m.id === moduleId
          ? {
              ...m,
              videos: [
                ...m.videos,
                {
                  id: uuidv4(),
                  title: "Video Name",
                  file: null,
                  url: "",
                  duration: 0,
                  links: [],
                },
              ],
            }
          : m
      )
    );
  };

  const removeVideo = async (moduleId: string, videoId: string) => {
    const module = modules.find((m) => m.id === moduleId);
    const videoToDelete = module?.videos.find((v) => v.id === videoId);

    if (videoToDelete?.db_id && videoToDelete?.path) {
      // Delete video from storage
      await supabase.storage.from("videos").remove([videoToDelete.path]);
      // Delete video record from database
      await supabase.from("videos").delete().eq("id", videoToDelete.db_id);
    }

    setModules(
      modules.map((m) =>
        m.id === moduleId
          ? { ...m, videos: m.videos.filter((v) => v.id !== videoId) }
          : m
      )
    );
  };

  const handleFileChange = useCallback(
    (
      moduleId: string,
      videoId: string,
      file: File | null,
      duration: number = 0
    ) => {
      setModules(
        modules.map((m) =>
          m.id === moduleId
            ? {
                ...m,
                videos: m.videos.map((v) =>
                  v.id === videoId
                    ? {
                        ...v,
                        file,
                        duration,
                        title: file?.name.split(".")[0] || v.title,
                      }
                    : v
                ),
              }
            : m
        )
      );
    },
    [modules]
  );

  const handleLinksChange = useCallback(
    (moduleId: string, videoId: string, links: VideoLink[]) => {
      setModules(
        modules.map((m) =>
          m.id === moduleId
            ? {
                ...m,
                videos: m.videos.map((v) =>
                  v.id === videoId ? { ...v, links } : v
                ),
              }
            : m
        )
      );
    },
    [modules]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await updateSession(sessionId as string);

      // Handle solution updates
      if (solution) {
        let solutionData: any = {
          category_id: solutionCategory,
          title: `Solution for ${sessionName}`,
        };

        // Set appropriate fields based on solution type
        if (solutionCategory === 1) {
          solutionData.form_data = solution.form_data;
        } else if (solutionCategory === 2) {
          solutionData.email_content = solution.email_content;
        } else if (solutionCategory === 3) {
          solutionData.link_url = solution.link_url;
        } else if (solutionCategory === 4) {
          if (solution.videoFile) {
            const fileExt = solution.videoFile.name.split(".").pop();
            const filePath = `${userId}/${sessionId}/solutions/${uuidv4()}.${fileExt}`;

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
          await supabase
            .from("solutions")
            .update(solutionData)
            .eq("id", solution.id);
        } else {
          // Create new solution
          solutionData.session_id = sessionId;
          await supabase.from("solutions").insert(solutionData);
        }
      } else {
        // Delete solution if it was removed
        await supabase.from("solutions").delete().eq("session_id", sessionId);
      }

      router.push("/sessions");
      showToast("success", "Session updated successfully!");
    } catch (error) {
      console.error("Error updating session:", error);
      showToast("error", "Error updating session");
    } finally {
      setIsLoading(false);
    }
  };

  const updateSession = async (sessionId: string) => {
    // Update session
    const { error: sessionError } = await supabase
      .from("sessions")
      .update({
        title: sessionName,
      })
      .eq("id", sessionId);

    if (sessionError) throw sessionError;

    // Get existing modules to compare
    const { data: existingModules, error: modulesError } = await supabase
      .from("modules")
      .select("id")
      .eq("session_id", sessionId);

    if (modulesError) throw modulesError;

    const existingModuleIds = existingModules?.map((m) => m.id) || [];

    // Process modules
    for (const [moduleIndex, module] of modules.entries()) {
      if (module.db_id) {
        // Update existing module
        const { error: moduleError } = await supabase
          .from("modules")
          .update({
            title: module.title,
            order_index: moduleIndex,
          })
          .eq("id", module.db_id);

        if (moduleError) throw moduleError;

        // Remove from existingModuleIds array
        const index = existingModuleIds.indexOf(module.db_id);
        if (index > -1) {
          existingModuleIds.splice(index, 1);
        }
      } else {
        // Create new module
        const { data: moduleData, error: moduleError } = await supabase
          .from("modules")
          .insert({
            title: module.title,
            session_id: sessionId,
            order_index: moduleIndex,
          })
          .select()
          .single();

        if (moduleError || !moduleData)
          throw moduleError || new Error("Failed to create module");

        // Update the module in state with db_id for future reference
        module.db_id = moduleData.id;
      }

      // Get existing videos for this module
      const { data: existingVideos, error: videosError } = await supabase
        .from("videos")
        .select("id, path")
        .eq("module_id", module.db_id || "");

      if (videosError) throw videosError;

      const existingVideoIds = existingVideos?.map((v) => v.id) || [];

      // Process videos
      for (const [videoIndex, video] of module.videos.entries()) {
        if (video.db_id) {
          // Update existing video
          if (video.file) {
            // Delete old video from storage if it exists
            const oldVideo = existingVideos?.find((v) => v.id === video.db_id);
            if (oldVideo?.path) {
              await supabase.storage.from("videos").remove([oldVideo.path]);
            }

            // Upload new file
            const fileExt = video.file.name.split(".").pop();
            const filePath = `${userId}/${sessionId}/${
              module.db_id
            }/${uuidv4()}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
              .from("videos")
              .upload(filePath, video.file);

            if (uploadError) throw uploadError;

            // Get public URL
            const { data: urlData } = supabase.storage
              .from("videos")
              .getPublicUrl(filePath);

            // Update video record with new file
            const { error: videoError } = await supabase
              .from("videos")
              .update({
                title: video.title || video.file.name,
                url: urlData.publicUrl,
                order_index: videoIndex,
                path: filePath,
                duration: video.duration,
              })
              .eq("id", video.db_id);

            if (videoError) throw videoError;
          } else {
            // Just update order if no file change
            const { error: videoError } = await supabase
              .from("videos")
              .update({
                title: video.title,
                order_index: videoIndex,
                duration: video.duration,
              })
              .eq("id", video.db_id);

            if (videoError) throw videoError;
          }

          // Handle video links
          await updateVideoLinks(video.db_id, video.links);

          // Remove from existingVideoIds array
          const index = existingVideoIds.indexOf(video.db_id);
          if (index > -1) {
            existingVideoIds.splice(index, 1);
          }
        } else {
          // Create new video
          if (!video.file) continue;

          // Upload file to storage
          const fileExt = video.file.name.split(".").pop();
          const filePath = `${userId}/${sessionId}/${
            module.db_id
          }/${uuidv4()}.${fileExt}`;

          const { error: uploadError } = await supabase.storage
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
              module_id: module.db_id,
              session_id: sessionId,
              order_index: videoIndex,
              is_interactive: false,
              path: filePath,
              duration: video.duration,
            })
            .select()
            .single();

          if (videoError || !videoData)
            throw videoError || new Error("Failed to create video");

          // Handle video links
          await updateVideoLinks(videoData.id, video.links);

          // Update the video in state with db_id for future reference
          video.db_id = videoData.id;
          video.path = filePath;
        }
      }

      // Delete any remaining videos that were removed
      for (const videoId of existingVideoIds) {
        const videoToDelete = existingVideos?.find((v) => v.id === videoId);
        if (videoToDelete?.path) {
          await supabase.storage.from("videos").remove([videoToDelete.path]);
        }
        await supabase.from("videos").delete().eq("id", videoId);
      }
    }

    // Delete any remaining modules that were removed
    for (const moduleId of existingModuleIds) {
      // First delete all videos in this module
      const { data: videosToDelete, error: videosError } = await supabase
        .from("videos")
        .select("path")
        .eq("module_id", moduleId);

      if (videosError) throw videosError;

      const pathsToDelete = videosToDelete
        ?.map((v) => v.path)
        .filter(Boolean) as string[];
      if (pathsToDelete.length > 0) {
        await supabase.storage.from("videos").remove(pathsToDelete);
      }

      await supabase.from("videos").delete().eq("module_id", moduleId);
      await supabase.from("modules").delete().eq("id", moduleId);
    }
  };

  const updateVideoLinks = async (videoDbId: string, links: VideoLink[]) => {
    // First delete all existing links for this video
    await supabase.from("video_links").delete().eq("video_id", videoDbId);

    if (links.length === 0) return;

    // Create mapping of temporary video IDs to database IDs
    const videoIdMap: Record<string, string> = {};
    for (const module of modules) {
      for (const video of module.videos) {
        if (video.db_id && video.id) {
          videoIdMap[video.id] = video.db_id;
        }
      }
    }

    // Prepare links for insertion
    const linkInserts = links.map((link) => {
      const destinationVideoId =
        link.link_type === "video" && link.destination_video_id
          ? videoIdMap[link.destination_video_id] || null
          : null;

      return {
        video_id: videoDbId,
        timestamp_seconds: link.timestamp_seconds,
        label: link.label,
        url: link.link_type === "url" ? link.url : null,
        destination_video_id: destinationVideoId,
        link_type: link.link_type,
        position_x: link.position_x ?? 20,
        position_y: link.position_y ?? 20,
      };
    });

    // Insert new links
    const { error: linksError } = await supabase
      .from("video_links")
      .insert(linkInserts);

    if (linksError) throw linksError;
  };

  const addSolution = () => {
    if (!solutionCategory) return;

    setSolution({
      id: uuidv4(),
      category_id: solutionCategory,
      session_id: sessionId as string,
    });
  };

  const removeSolution = () => {
    setSolution(null);
    setSolutionCategory(null);
  };

  const updateSolution = (updates: Partial<Solution>) => {
    if (solution) {
      setSolution({ ...solution, ...updates });
    }
  };

  const hasAtLeastOneVideo = modules.some((module) =>
    module.videos.some((video) => video.file || video.url)
  );

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
              Edit Session
            </CardTitle>
            <CardDescription className="text-sm text-gray-600">
              Update the session details below.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 px-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <Label
                  htmlFor="sessionName"
                  className="text-sm font-medium text-[#242B42]"
                >
                  Session Name
                </Label>
                <Input
                  id="sessionName"
                  value={sessionName}
                  onChange={(e) => setSessionName(e.target.value)}
                  placeholder="e.g., UX Design Sprint"
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
                  value={"Linear Flow"}
                  disabled
                  className="h-10 bg-[#EEEEEE] text-[#242B42] font-medium"
                  required
                />
              </div>
            </div>

            <div className="mt-8">
              <h3 className="text-lg font-medium mb-4">Modules</h3>

              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                modifiers={[restrictToVerticalAxis]}
              >
                <SortableContext
                  items={modules.map((module) => module.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {modules.map((module) => (
                    <SortableModule
                      key={module.id}
                      module={module}
                      availableVideos={availableVideos}
                      onUpdate={updateModuleName}
                      onDelete={removeModule}
                      addVideo={addVideo}
                      removeVideo={removeVideo}
                      handleFileChange={handleFileChange}
                      handleLinksChange={handleLinksChange}
                    />
                  ))}
                </SortableContext>

                <DragOverlay>
                  {activeId && activeModule ? (
                    <ModuleCard
                      module={activeModule as any}
                      availableVideos={availableVideos}
                      onUpdate={() => {}}
                      onDelete={() => {}}
                      addVideo={() => {}}
                      removeVideo={() => {}}
                      handleFileChange={() => {}}
                      handleLinksChange={() => {}}
                      isDragging={true}
                      editPage={true}
                    />
                  ) : null}
                </DragOverlay>
              </DndContext>
            </div>

            <div className="border rounded-lg">
              <button
                type="button"
                className="w-full flex justify-between items-center p-4 cursor-pointer"
                onClick={() => setSolutionsExpanded(!solutionsExpanded)}
              >
                <h3 className="text-lg font-medium">Solution</h3>
                {solutionsExpanded ? (
                  <ChevronDown className="h-5 w-5" />
                ) : (
                  <ChevronUp className="h-5 w-5" />
                )}
              </button>

              {solutionsExpanded && (
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
                            .find((c) => c.id === solutionCategory)
                            ?.id?.toString() || ""
                        }
                        onValueChange={(value) =>
                          setSolutionCategory(Number(value))
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
                        {solution ? "Update Solution" : "Add Solution"}
                      </Button>
                      <button
                        type="button"
                        onClick={removeSolution}
                        className="h-10 text-red-600 hover:text-red-800"
                      >
                        Remove
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
              <Button
                type="button"
                onClick={addModule}
                className="mt-4 border-dashed"
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Add Module
              </Button>
              <div className="flex space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/sessions")}
                  className="h-10 px-6"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmit}
                  type="submit"
                  disabled={
                    isLoading || modules.length === 0 || !hasAtLeastOneVideo
                  }
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

function SortableModule({
  module,
  availableVideos,
  onUpdate,
  onDelete,
  addVideo,
  removeVideo,
  handleFileChange,
  handleLinksChange,
}: {
  module: Module;
  availableVideos: Array<{ id: string; title: string; module: string }>;
  onUpdate: (moduleId: string, title: string) => void;
  onDelete: (moduleId: string) => void;
  addVideo: (moduleId: string) => void;
  removeVideo: (moduleId: string, videoId: string) => void;
  handleFileChange: (
    moduleId: string,
    videoId: string,
    file: File | null,
    duration?: number
  ) => void;
  handleLinksChange: (
    moduleId: string,
    videoId: string,
    links: VideoLink[]
  ) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: module.id });

  const style = {
    transform: transform ? `translate3d(0, ${transform.y}px, 0)` : undefined,
    transition,
    zIndex: isDragging ? 1 : 0,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <ModuleCard
        module={module as any}
        availableVideos={availableVideos}
        onUpdate={(updatedModule) =>
          onUpdate(updatedModule.id, updatedModule.title)
        }
        onDelete={() => onDelete(module.id)}
        addVideo={() => addVideo(module.id)}
        removeVideo={removeVideo}
        handleFileChange={handleFileChange}
        handleLinksChange={handleLinksChange}
        isDragging={isDragging}
        editPage={true}
        dragHandleProps={listeners}
      />
    </div>
  );
}
