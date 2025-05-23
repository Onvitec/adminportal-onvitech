import { Button } from "@/components/ui/button";
import { Video } from "@/lib/types";
import { Trash2, Upload, X } from "lucide-react";
import { useState } from "react";

export function VideoUpload({
  video,
  moduleId,
  onDelete,
  handleFileChange,
}: {
  video: Video;
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

      <div className="space-y-2">
        {file ? (
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
            <div className="flex-1 truncate pr-2">
              <p className="text-sm truncate">{file.name}</p>
              <p className="text-xs text-gray-500">
                {(file.size / (1024 * 1024)).toFixed(2)} MB
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearFile}
              className="text-gray-500 hover:text-gray-700 h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="text-center py-6 border border-dashed border-gray-300 rounded-lg">
            <div className="space-y-2">
              <p className="text-sm font-medium">Browse your file to upload!</p>
              <p className="text-xs text-gray-500">
                Supported Format: Mp4, JPG, PNG (50mb each)
              </p>
              <div className="pt-2">
                <Button size="sm" className="relative py-5 px-6">
                  Browse File <Upload />
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
        )}
      </div>
    </div>
  );
}
