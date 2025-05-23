import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Module } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  Check,
  ChevronDown,
  ChevronUp,
  GripVertical,
  PlusCircle,
  Trash2,
  X,
} from "lucide-react";
import { useState } from "react";
import { VideoUpload } from "./videoo-upload";

export function ModuleCard({
  module,
  onUpdate,
  onDelete,
  addVideo,
  removeVideo,
  handleFileChange,
  isDragging = false,
  dragHandleProps,
}: {
  module: Module;
  onUpdate: (updatedModule: Module) => void;
  onDelete: () => void;
  addVideo: () => void;
  removeVideo: (moduleId: string, videoId: string) => void;
  handleFileChange: (
    moduleId: string,
    videoId: string,
    file: File | null
  ) => void;
  isDragging?: boolean;
  dragHandleProps?: any;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [moduleName, setModuleName] = useState(module.title);

  const handleRename = () => {
    if (isEditing) {
      onUpdate({ ...module, title: moduleName });
    }
    setIsEditing(!isEditing);
  };

  return (
    <div
      className={cn(
        "border rounded-lg mb-4 transition-all",
        isDragging ? "border-blue-300 bg-blue-50" : "border-gray-200"
      )}
    >
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button {...dragHandleProps}>
            <GripVertical className="h-5 w-5 text-gray-400 cursor-grab" />
          </button>

          {isEditing ? (
            <div className="flex items-center gap-2">
              <Input
                value={moduleName}
                onChange={(e) => setModuleName(e.target.value)}
                className="h-8 w-48"
                autoFocus
                onBlur={handleRename}
                // onKeyDown={(e) => e.key === "Enter" && handleRename()}
              />
            </div>
          ) : (
            <h3 className="text-base font-medium">{module.title}</h3>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={"ghost"}
            size="sm"
            type="button"
            onClick={handleRename}
            className="text-sm h-8 text-gray-600 hover:text-gray-900"
          >
            {isEditing ? "Save" : "Rename"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="text-gray-600 hover:text-gray-900"
          >
            {isCollapsed ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronUp className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {!isCollapsed && (
        <div className="px-4 pb-4 space-y-3">
          {module.videos.map((video) => (
            <VideoUpload
              key={video.id}
              video={video}
              moduleId={module.id}
              onDelete={() => removeVideo(module.id, video.id)}
              handleFileChange={(file) =>
                handleFileChange(module.id, video.id, file)
              }
            />
          ))}

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addVideo}
            className="mt-2 bg-gray-100 py-5 border-dashed"
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            Add Video
          </Button>
        </div>
      )}
    </div>
  );
}
