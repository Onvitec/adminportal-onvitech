import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Module, VideoType } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  Check,
  ChevronDown,
  ChevronUp,
  Edit,
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
  const [isEditingModule, setIsEditingModule] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [moduleName, setModuleName] = useState(module.title);
  const [editingVideoId, setEditingVideoId] = useState<string | null>(null);
  const [videoTitles, setVideoTitles] = useState<Record<string, string>>(
    module.videos.reduce((acc, video) => {
      acc[video.id] = video.title;
      return acc;
    }, {} as Record<string, string>)
  );

  const handleRenameModule = () => {
    if (isEditingModule) {
      onUpdate({ ...module, title: moduleName });
    }
    setIsEditingModule(!isEditingModule);
  };

  const handleRenameVideo = (videoId: string) => {
    if (editingVideoId === videoId) {
      // Save the changes
      const updatedVideos = module.videos.map((video) =>
        video.id === videoId ? { ...video, title: videoTitles[videoId] } : video
      );
      onUpdate({ ...module, videos: updatedVideos });
    }
    setEditingVideoId(editingVideoId === videoId ? null : videoId);
  };

  const handleVideoTitleChange = (videoId: string, value: string) => {
    setVideoTitles((prev) => ({ ...prev, [videoId]: value }));
  };

  const handleAddVideo = () => {
    addVideo();
    // Auto-expand when adding a video
    if (!isExpanded) {
      setIsExpanded(true);
    }
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

          {isEditingModule ? (
            <div className="flex items-center gap-2">
              <Input
                value={moduleName}
                onChange={(e) => setModuleName(e.target.value)}
                className="h-8 w-48"
                autoFocus
                onBlur={handleRenameModule}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleRenameModule();
                }}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleRenameModule}
                className="h-8"
              >
                <Check className="h-4 w-4" />
              </Button>
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
            onClick={handleRenameModule}
            className="text-sm h-8 text-blue-600 hover:text-gray-900"
          >
            Rename
          </Button>
          <Button
            variant={"ghost"}
            size="sm"
            type="button"
            onClick={() => onDelete()}
            className="text-sm h-8 hover:text-red-900"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-gray-600 hover:text-gray-900 h-8"
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {isExpanded && (
        <div className="px-4 pb-4  bg-gray-50">
          <div className="bg-gray-50 p-4  rounded-lg">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 ">
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
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddVideo}
            className=" bg-gray-100 py-5"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Video
          </Button>
        </div>
      )}
    </div>
  );
}
