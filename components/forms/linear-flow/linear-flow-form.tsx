"use client";

import { useState } from "react";
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
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { cn } from "@/lib/utils";
import { ModuleCard } from "./module";

type Module = {
  id: string;
  title: string;
  videos: Video[];
};

type Video = {
  id: string;
  title: string;
  file: File | null;
  url: string;
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
      videos: [{ id: uuidv4(), title: "Video 1", file: null, url: "" }],
    },
  ]);
  const [activeId, setActiveId] = useState<string | null>(null);

  const activeModule = modules.find((module) => module.id === activeId);

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
                { id: uuidv4(), title: "Video 1", file: null, url: "" },
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
      // Create session
      const { data: sessionData, error: sessionError } = await supabase
        .from("sessions")
        .insert({
          title: sessionName,
          session_type: "linear",
          created_by: "826e31ef-0431-4762-af43-c501e3898cc3",
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
          if (!video.file) continue;

          // Upload file to storage
          const fileExt = video.file.name.split(".").pop();
          const filePath = `${"826e31ef-0431-4762-af43-c501e3898cc3"}/${
            sessionData.id
          }/${moduleData.id}/${uuidv4()}.${fileExt}`;

          const { data: uploadData, error: uploadError } =
            await supabase.storage.from("videos").upload(filePath, video.file);

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
          });

          if (videoError) throw videoError;
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

  return (
    <div className="container py-8 max-w-7xl mx-auto">
      <form onSubmit={handleSubmit} className="">
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
                  Session Type
                </Label>
                <Input
                  id="userId"
                  value={"Linear Flow"}
                  disabled
                  // onChange={(e) => setUserId(e.target.value)}
                  placeholder="e.g., AI2045864"
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
                      module={activeModule}
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
                  onClick={() => router.push("/sessions/create")}
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
        module={module}
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
