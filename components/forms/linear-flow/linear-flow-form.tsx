"use client";

import { useEffect, useState, useCallback } from "react";
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
  Trash2,
  GripVertical,
  Upload,
  X,
  ChevronDown,
  ChevronUp,
  Edit,
  Check,
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
import { ModuleCard } from "./module";
import { SolutionCard } from "@/components/SolutionCard";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Solution, SolutionCategory } from "@/lib/types";
import { toast } from "sonner";
import { showToast } from "@/components/toast";
import Link from "next/link";
import Heading from "@/components/Heading";

// Updated VideoLink type to support both URL and destination video
type VideoLink = {
  id: string;
  timestamp_seconds: number;
  label: string;
  url?: string; // Optional URL
  destination_video_id?: string; // Optional destination video ID
  link_type: 'url' | 'video'; // Type discriminator
};

type Video = {
  id: string;
  title: string;
  file: File | null;
  url: string;
  duration: number; // Add duration in seconds
  links: VideoLink[]; // Updated links array with new type
};

type Module = {
  id: string;
  title: string;
  videos: Video[];
};

export default function LinearSessionForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [sessionName, setSessionName] = useState("");
  const [userId, setUserId] = useState("");
  const [modules, setModules] = useState<Module[]>([
    {
      id: uuidv4(),
      title: "Module 1",
      videos: [{ 
        id: uuidv4(), 
        title: "Video Name", 
        file: null, 
        url: "",
        duration: 0,
        links: []
      }],
    },
  ]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [solution, setSolution] = useState<Solution | null>(null);
  const [isSolutionCollapsed, setIsSolutionCollapsed] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const activeModule = modules.find((module) => module.id === activeId);

  // Generate available videos list for video link destinations
  const availableVideos = modules.flatMap(module => 
    module.videos.map(video => ({
      id: video.id,
      title: video.title,
      module: module.title
    }))
  );

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor)
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as any);
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
        videos: [{ 
          id: uuidv4(), 
          title: "Video Name", 
          file: null, 
          url: "",
          duration: 0,
          links: []
        }],
      },
    ]);
  };

  const removeModule = (moduleId: string) => {
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
                  links: []
                },
              ],
            }
          : m
      )
    );
  };

  const removeVideo = (moduleId: string, videoId: string) => {
    setModules(
      modules.map((m) =>
        m.id === moduleId
          ? { ...m, videos: m.videos.filter((v) => v.id !== videoId) }
          : m
      )
    );
  };

  const handleFileChange = useCallback(
    (moduleId: string, videoId: string, file: File | null, duration: number = 0) => {
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
                        title: file?.name.split(".")[0] || v.title 
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
      setModules(modules.map((m) => 
        m.id === moduleId 
          ? {
              ...m,
              videos: m.videos.map((v) => 
                v.id === videoId ? { ...v, links } : v
              )
            } 
          : m
      ));
    },
    [modules]
  );

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
          session_type: "linear",
          created_by: user.id,
        })
        .select()
        .single();

      if (sessionError || !sessionData)
        throw sessionError || new Error("Failed to create session");

      // Store mapping of temporary IDs to actual DB IDs
      const uploadedVideos: Record<string, string> = {};

      // Create modules and upload videos
      for (const [moduleIndex, module] of modules.entries()) {
        // Create module
        const { data: moduleData, error: moduleError } = await supabase
          .from("modules")
          .insert({
            title: module.title,
            session_id: sessionData.id,
            order_index: moduleIndex,
          })
          .select()
          .single();

        if (moduleError || !moduleData)
          throw moduleError || new Error("Failed to create module");

        // Upload videos
        for (const [videoIndex, video] of module.videos.entries()) {
          if (!video.file) continue;

          // Upload file to storage
          const fileExt = video.file.name.split(".").pop();
          const filePath = `${user.id}/${sessionData.id}/${moduleData.id}/${uuidv4()}.${fileExt}`;

          const { data: uploadData, error: uploadError } =
            await supabase.storage.from("videos").upload(filePath, video.file);

          if (uploadError) throw uploadError;

          // Get public URL
          const { data: urlData } = supabase.storage
            .from("videos")
            .getPublicUrl(filePath);

          // Create video record
          const { data: videoData, error: videoError } = await supabase.from("videos").insert({
            title: video.title || video.file.name,
            url: urlData.publicUrl,
            module_id: moduleData.id,
            session_id: sessionData.id,
            order_index: videoIndex,
            is_interactive: false,
          }).select().single();

          if (videoError || !videoData) throw videoError || new Error("Failed to create video");

          // Store mapping of temporary ID to actual DB ID
          uploadedVideos[video.id] = videoData.id;

          // Insert links if available
          if (video.links && video.links.length > 0) {
            const linkInserts = video.links.map((l) => ({
              video_id: videoData.id,
              timestamp_seconds: l.timestamp_seconds,
              label: l.label,
              url: l.link_type === 'url' ? l.url : null,
              destination_video_id: l.link_type === 'video' ? null : null, // Will be updated later for video links
              link_type: l.link_type,
            }));

            const { data: insertedLinks, error: linksError } = await supabase
              .from("video_links")
              .insert(linkInserts)
              .select();

            if (linksError) throw linksError;
          }
        }
      }

      // Update video link destination_video_id for video-type links after all videos are uploaded
      for (const module of modules) {
        for (const video of module.videos) {
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
            
            if (originalLink.link_type === 'video' && originalLink.destination_video_id && dbLink) {
              const destinationDbId = uploadedVideos[originalLink.destination_video_id];
              if (destinationDbId) {
                await supabase
                  .from("video_links")
                  .update({ destination_video_id: destinationDbId })
                  .eq("id", dbLink.id);
              }
            }
          }
        }
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

        await supabase.from("solutions").insert(solutionData);
      }

      router.push("/sessions");
      showToast("success", "Linear Session created successfully!");
    } catch (error) {
      console.error("Error creating session:", error);
      showToast("error", "Error creating Linear Session!");
    } finally {
      setIsLoading(false);
    }
  };

  // Add solution handler
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

  const hasAtLeastOneVideo = modules.some((module) => module.videos.length > 0) && modules.some((module) => module.videos.some((video) => video.file || video.url));
  
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
              Session details
            </CardTitle>
            <CardDescription className="text-sm text-gray-600">
              Please fill out the new session form with the details of the
              session you wish to add.
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
                    />
                  ) : null}
                </DragOverlay>
              </DndContext>
            </div>

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
                  onClick={() => router.push("/sessions/create")}
                  className="h-10 px-6"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmit}
                  type="submit"
                  disabled={
                    isLoading ||
                    modules.length === 0 ||
                    !solution ||
                    !hasAtLeastOneVideo
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
  availableVideos: Array<{id: string; title: string; module: string}>;
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
        editPage={false}
        dragHandleProps={listeners}
      />
    </div>
  );
}


