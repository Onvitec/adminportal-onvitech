import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Module } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  Check,
  ChevronDown,
  ChevronUp,
  GripVertical,
  Plus,
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
  const [isExpanded, setIsExpanded] = useState(false);
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
      <div className="p-4 flex border-b items-center justify-between bg-white">
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
            className="text-sm h-8 text-blue-600 hover:text-gray-900"
          >
            {isEditing ? "Save" : "Rename"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-gray-600 hover:text-gray-900"
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronUp className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {isExpanded && (
        <div className="px-4 pb-4 space-y-3 bg-gray-50">
          {/* Grid of existing videos with URLs */}
          {module.videos.some((v) => v.url) && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium mb-3">Existing Videos</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {module.videos
                  .filter((v) => v.url)
                  .map((video) => (
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
              </div>
            </div>
          )}

          {/* Videos being uploaded (no URL yet) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {module.videos
              .filter((v) => !v.url)
              .map((video) => (
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
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addVideo}
            className="mt-2 bg-gray-100 py-5"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Video
          </Button>
        </div>
      )}
    </div>
  );
}
