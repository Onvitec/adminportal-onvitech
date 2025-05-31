"use client";

import { useState, useEffect } from "react";
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
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { cn } from "@/lib/utils";
import { ModuleCard } from "@/components/forms/linear-flow/module";
import { VideoType } from "@/lib/types";

type Module = {
  id: string;
  title: string;
  videos: Video[];
  db_id?: string; // Added for existing modules
};

type Video = {
  id: string;
  title: string;
  file: File | null;
  url: string;
  db_id?: string; // Added for existing videos
  path?: string; // Added for existing videos in storage
};

export default function LinearSessionForm() {
  const { sessionId } = useParams();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(!!sessionId);
  const [sessionName, setSessionName] = useState("");
  const [userId, setUserId] = useState("");
  const [modules, setModules] = useState<Module[]>([
    {
      id: uuidv4(),
      title: "Module 1",
      videos: [{ id: uuidv4(), title: "Video 1", file: null, url: "" }],
    },
  ]);
  const [activeId, setActiveId] = useState<string | null>(null);

  const activeModule = modules.find((module) => module.id === activeId);

  useEffect(() => {
    loadSessionData(sessionId as string);
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

      const formattedModules = modulesData.map((module) => ({
        id: uuidv4(), // New ID for UI
        db_id: module.id, // Original ID from DB
        title: module.title,
        videos: module.videos.map((video: any) => ({
          id: uuidv4(), // New ID for UI
          db_id: video.id, // Original ID from DB
          title: video.title,
          file: null, // We won't load the file, just the URL
          url: video.url,
          path: video.path, // Store the storage path for deletion
        })),
      }));

      setModules(formattedModules);
    } catch (error) {
      console.error("Error loading session data:", error);
      alert("Failed to load session data");
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

  const handleDragStart = (event: any) => {
    setActiveId(event.active.id);
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
        videos: [{ id: uuidv4(), title: "Video 1", file: null, url: "" }],
      },
    ]);
  };

  const removeModule = async (moduleId: string) => {
    const moduleToDelete = modules.find((m) => m.id === moduleId);

    if (isEditing && moduleToDelete?.db_id) {
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
                { id: uuidv4(), title: "Video 1", file: null, url: "" },
              ],
            }
          : m
      )
    );
  };

  const removeVideo = async (moduleId: string, videoId: string) => {
    const module = modules.find((m) => m.id === moduleId);
    const videoToDelete = module?.videos.find((v) => v.id === videoId);

    if (isEditing && videoToDelete?.db_id && videoToDelete?.path) {
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

  const handleFileChange = (
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
                  ? { ...v, file, title: file?.name || v.title }
                  : v
              ),
            }
          : m
      )
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isEditing && sessionId) {
        await updateSession(sessionId as string);
      } else {
        await createSession();
      }

      // Redirect to sessions page
      router.push("/sessions");
    } catch (error) {
      console.error("Error saving session:", error);
      alert("Failed to save session. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const createSession = async () => {
    // Create session
    const { data: sessionData, error: sessionError } = await supabase
      .from("sessions")
      .insert({
        title: sessionName,
        session_type: "linear",
        created_by: userId || "826e31ef-0431-4762-af43-c501e3898cc3",
      })
      .select()
      .single();

    if (sessionError || !sessionData)
      throw sessionError || new Error("Failed to create session");

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
        if (!video.file && video.url) {
          // Existing video, just update order if needed
          await supabase
            .from("videos")
            .update({ order_index: videoIndex })
            .eq("id", video.db_id);
          continue;
        }

        if (!video.file) continue;

        // Upload new file to storage
        const fileExt = video.file.name.split(".").pop();
        const filePath = `${userId || "826e31ef-0431-4762-af43-c501e3898cc3"}/${
          sessionData.id
        }/${moduleData.id}/${uuidv4()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("videos")
          .upload(filePath, video.file);

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: urlData } = supabase.storage
          .from("videos")
          .getPublicUrl(filePath);

        // Create video record
        const { error: videoError } = await supabase.from("videos").insert({
          title: video.title || video.file.name,
          url: urlData.publicUrl,
          module_id: moduleData.id,
          session_id: sessionData.id,
          order_index: videoIndex,
          is_interactive: false,
          path: filePath,
        });

        if (videoError) throw videoError;
      }
    }
  };

  const updateSession = async (sessionId: string) => {
    // Update session
    const { error: sessionError } = await supabase
      .from("sessions")
      .update({
        title: sessionName,
        created_by: userId || "826e31ef-0431-4762-af43-c501e3898cc3",
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
            const filePath = `${
              userId || "826e31ef-0431-4762-af43-c501e3898cc3" // TODO: fix this
            }/${sessionId}/${module.db_id}/${uuidv4()}.${fileExt}`;

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
              })
              .eq("id", video.db_id);

            if (videoError) throw videoError;
          }

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
          const filePath = `${
            userId || "826e31ef-0431-4762-af43-c501e3898cc3" // TODO: fix this
          }/${sessionId}/${module.db_id}/${uuidv4()}.${fileExt}`;

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
            })
            .select()
            .single();

          if (videoError || !videoData)
            throw videoError || new Error("Failed to create video");

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

  return (
    <div className="container mx-auto py-8 max-w-4xl ">
      <form onSubmit={handleSubmit} className="">
        <Card className="border-none shadow-none px-3">
          <CardHeader className="px-0">
            <CardTitle className="text-2xl font-semibold">
              {isEditing ? "Edit Session" : "Session details"}
            </CardTitle>
            <CardDescription className="text-sm text-gray-600">
              {isEditing
                ? "Update the session details below."
                : "Please fill out the new session form with the details of the session you wish to add."}
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
                  placeholder="e.g., UX Design Sprint"
                  className="h-10"
                  required
                />
              </div>
              <div className="space-y-1">
                <Label
                  htmlFor="userId"
                  className="text-sm font-medium text-gray-700"
                >
                  User ID
                </Label>
                <Input
                  disabled
                  id="userId"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  placeholder="e.g., AI2045864"
                  className="h-10"
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
                      onUpdate={updateModuleName}
                      onDelete={removeModule}
                      addVideo={addVideo}
                      removeVideo={removeVideo}
                      handleFileChange={handleFileChange}
                    />
                  ))}
                </SortableContext>

                <DragOverlay>
                  {activeId && activeModule ? (
                    <ModuleCard
                      module={activeModule as any} // TODO:fix if needed
                      onUpdate={() => {}}
                      onDelete={() => {}}
                      addVideo={() => {}}
                      removeVideo={() => {}}
                      handleFileChange={() => {}}
                      isDragging={true}
                    />
                  ) : null}
                </DragOverlay>
              </DndContext>
            </div>

            <div className="flex justify-between items-center gap-2 mt-8">
              <Button
                type="button"
                onClick={addModule}
                className="mt-4  border-dashed"
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Add Module
              </Button>
              <div>
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
                  disabled={isLoading}
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
  onUpdate,
  onDelete,
  addVideo,
  removeVideo,
  handleFileChange,
}: {
  module: Module;
  onUpdate: (moduleId: string, title: string) => void;
  onDelete: (moduleId: string) => void;
  addVideo: (moduleId: string) => void;
  removeVideo: (moduleId: string, videoId: string) => void;
  handleFileChange: (
    moduleId: string,
    videoId: string,
    file: File | null
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
        module={module as any} // TODO:fix if needed
        onUpdate={(updatedModule) =>
          onUpdate(updatedModule.id, updatedModule.title)
        }
        onDelete={() => onDelete(module.id)}
        addVideo={() => addVideo(module.id)}
        removeVideo={removeVideo}
        handleFileChange={handleFileChange}
        isDragging={isDragging}
        dragHandleProps={listeners}
      />
    </div>
  );
}
