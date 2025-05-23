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
        <div className="flex justify-between items-center mb-3">
          <h4 className="text-sm font-medium text-gray-700">
            {video.title || `Video ${video.id.split("-")[0]}`}
          </h4>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            className="text-gray-500 hover:text-gray-700 h-8 w-8 p-0"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>

        <div className="bg-white rounded-lg overflow-hidden">
          <video
            src={video.url}
            controls
            className="w-full aspect-video object-cover"
          />
        </div>

        <div className="mt-3 text-xs text-gray-500">
          <p>To replace this video, upload a new file below:</p>
          <div className="pt-2">
            <Button size="sm" className="relative py-5 px-6 w-full">
              Replace Video <Upload className="ml-2" />
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
    );
  }

  // If we have a file (new upload)
  if (file) {
    return (
      <div className="p-4 border border-gray-200 rounded-lg">
        <div className="flex justify-between items-center mb-3">
          <h4 className="text-sm font-medium text-gray-700">
            {file.name || `Video ${video.id.split("-")[0]}`}
          </h4>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearFile}
              className="text-gray-500 hover:text-gray-700 h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onDelete}
              className="text-gray-500 hover:text-gray-700 h-8 w-8 p-0"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
          <div className="flex-1 truncate pr-2">
            <p className="text-sm truncate">{file.name}</p>
            <p className="text-xs text-gray-500">
              {(file.size / (1024 * 1024)).toFixed(2)} MB
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Default state (no file or URL)
  return (
    <div className="p-4 border border-gray-200 rounded-lg">
      <div className="flex justify-between items-center mb-3">
        <h4 className="text-sm font-medium text-gray-700">
          Video {video.id.split("-")[0]}
        </h4>
        <Button
          variant="ghost"
          size="sm"
          onClick={onDelete}
          className="text-gray-500 hover:text-gray-700 h-8 w-8 p-0"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="text-center py-6 border border-dashed border-gray-300 rounded-lg">
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
    </div>
  );
}