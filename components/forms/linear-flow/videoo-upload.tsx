import { Button } from "@/components/ui/button";
import { VideoType } from "@/lib/types";
import { Trash2, Upload, X } from "lucide-react";
import { useState } from "react";

export function VideoUpload({
  video,
  moduleId,
  onDelete,
  handleFileChange,
}: {
  video: VideoType;
  moduleId: string;
  onDelete: () => void;
  handleFileChange: (file: File | null) => void;
}) {
  const [file, setFile] = useState<File | null>(video.file);
  const [showControls, setShowControls] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      handleFileChange(selectedFile);
    }
  };

  const handleClearFile = () => {
    setFile(null);
    handleFileChange(null);
  };

  // If we have a URL but no file (existing video from DB)
  if (video.url && !file) {
    return (
      <div className="p-4 border border-gray-200 rounded-lg">
        <div className=" rounded-lg overflow-hidden relative group">
          <div className="absolute top-0 left-0 right-0 z-10 p-3 flex justify-between items-start pointer-events-none">
            <h4 className="text-sm font-medium text-white bg-opacity-50 px-2 py-1 rounded">
              {video.title || `Video ${video.id.split("-")[0]}`}
            </h4>
            <div className="flex gap-2 pointer-events-auto">
              <label className="cursor-pointer bg-black bg-opacity-50 rounded-full p-2 hover:bg-opacity-70">
                <Upload className="h-4 w-4 text-white" />
                <input
                  type="file"
                  accept="video/mp4,video/quicktime,image/jpeg,image/png"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </label>
              <Button
                variant="ghost"
                size="icon"
                onClick={onDelete}
                className="bg-black bg-opacity-50 rounded-full p-2 h-auto w-auto hover:bg-opacity-70"
              >
                <Trash2 className="h-4 w-4 text-white" />
              </Button>
            </div>
          </div>
          <video
            src={video.url}
            controls
            className="w-full h-[200px] aspect-video object-cover"
          />
        </div>
      </div>
    );
  }

  // If we have a file (new upload)
  if (file) {
    const videoUrl = URL.createObjectURL(file);
    const fileName = file.name.split(".").slice(0, -1).join(".");

    return (
      <div className="p-4 border border-gray-200 rounded-lg">
        <div className="bg-black rounded-lg overflow-hidden relative group">
          <div className="absolute top-0 left-0 right-0 z-10 p-3 flex justify-between items-start pointer-events-none">
            <div className="flex gap-2 pointer-events-auto">
              {/* <Button
                variant="ghost"
                size="icon"
                onClick={handleClearFile}
                className="bg-black bg-opacity-50 rounded-full p-2 h-auto w-auto hover:bg-opacity-70"
              >
                <X className="h-4 w-4 text-white" />
              </Button> */}
              <Button
                variant="ghost"
                size="icon"
                onClick={onDelete}
                className="bg-black bg-opacity-50 rounded-full p-2 h-auto w-auto hover:bg-opacity-70"
              >
                <Trash2 className="h-4 w-4 text-white" />
              </Button>
            </div>
          </div>
          <video
            src={videoUrl}
            controls
            className="w-full h-[200px] aspect-video object-cover"
          />
        </div>
      </div>
    );
  }

  // Default state (no file or URL)
  return (
    <div className="p-4  border-gray-200 rounded-lg col-start-1 col-end-[-1]">
      <div
        className="text-center py-6 border-dashed bg-white border-2 border-blue-100 rounded-lg relative"
        style={{
          borderWidth: "2px",
        }}
      >
        <div className="absolute top-0 right-2 justify-between items-center mb-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            className="text-gray-500 hover:text-gray-700 h-8 w-8 p-0"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
        <div className="space-y-2">
          <p className="text-sm font-medium">Browse your file to upload!</p>
          <p className="text-xs text-gray-500">
            Supported Format: Mp4, JPG, PNG (50mb each)
          </p>
          <div className="pt-2">
            <Button size="sm" className="relative py-5 px-6">
              Browse File <Upload className="ml-2" />
              <input
                type="file"
                accept="video/mp4,video/quicktime,image/jpeg,image/png"
                onChange={handleFileSelect}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
            </Button>
          </div>
        </div>
      </div>
      <hr className="mt-5" />
    </div>
  );
}
