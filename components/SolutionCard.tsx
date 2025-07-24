import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Solution, SolutionCategory } from "@/lib/types";
import { Trash2, Upload, X } from "lucide-react";
import { Suspense, useState } from "react";
import { FormBuilder } from "./form-builder";

export function SolutionCard({
  solution,
  onUpdate,
  onDelete,
  readOnly = false,
}: {
  solution: Solution;
  onUpdate?: (updates: Partial<Solution>) => void;
  onDelete?: () => void;
  readOnly?: boolean;
}) {
  const [localSolution, setLocalSolution] = useState(solution);

  const handleChange = (updates: Partial<Solution>) => {
    if (readOnly || !onUpdate) return;
    const updatedSolution = { ...localSolution, ...updates };
    setLocalSolution(updatedSolution);
    onUpdate(updates);
  };

  const renderSolutionInput = () => {
    switch (solution?.category_id) {
      case 1: // Form
        return (
          <div className="rounded-lg py-4">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-medium">Form Solution</h4>
              {!readOnly && onDelete && (
                <button
                  onClick={onDelete}
                  className="text-red-600 hover:text-red-800 cursor-pointer"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>

            <FormBuilder
              form_data={
                solution.form_data || {
                  title: "",
                  elements: [
                    {
                      id: `elem-${Date.now()}`,
                      type: "text",
                      label: "Name",
                      value: "",
                    },
                  ],
                }
              }
              editable={!readOnly}
              onChange={(newFormData) =>
                !readOnly && onUpdate && onUpdate({ form_data: newFormData })
              }
            />
          </div>
        );
      case 2: // Email
        return (
          <div className="space-y-2 py-4">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-medium">Email Solution</h4>
              {!readOnly && onDelete && (
                <button
                  onClick={onDelete}
                  className="text-red-600 hover:text-red-800 cursor-pointer"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
            <div className="space-y-4">
              <div>
                <Label>Recipient Email</Label>
                <Input
                  value={solution.email_content || ""}
                  onChange={(e) => handleChange({ email_content: e.target.value })}
                  className="w-full mt-1"
                  placeholder="Email address to send to"
                />
              </div>
              <div>
                <Label>Email Subject</Label>
                <Input
                  value={solution.emailContent || ""}
                  onChange={(e) => handleChange({ emailContent: e.target.value })}
                  className="w-full mt-1"
                  placeholder="Email subject"
                />
              </div>
             
            </div>
          </div>
        );
      case 3: // Link
        return (
          <div className="space-y-2  py-4">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-medium">Link Solution</h4>
              {!readOnly && onDelete && (
                <button
                  onClick={onDelete}
                  className="text-red-600 hover:text-red-800 cursor-pointer"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
            <div>
              <Label>Link URL</Label>
              <Input
                placeholder="https://example.com"
                value={solution.link_url || ""}
                onChange={(e) => handleChange({ link_url: e.target.value })}
                readOnly={readOnly}
              />
            </div>
          </div>
        );
      case 4: // Video
        if (readOnly) {
          return (
            <div className="py-2 border border-gray-200 rounded-lg">
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-medium">Video Solution</h4>
                {!readOnly && onDelete && (
                  <button
                    onClick={onDelete}
                    className="text-red-600 hover:text-red-800 cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
              {solution.video_url && (
                <div className="bg-black rounded-lg overflow-hidden">
                  <video
                    src={solution.video_url}
                    controls
                    className="w-full h-[200px] aspect-video object-cover"
                  />
                </div>
              )}
            </div>
          );
        }

        return (
          <div className="p-4 border border-gray-200 rounded-lg">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-medium">Video Solution</h4>
              {!readOnly && onDelete && (
                <button
                  onClick={onDelete}
                  className="text-red-600 hover:text-red-800 cursor-pointer"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
            
            {/* If we have a URL but no file (existing video from DB) */}
            {solution.video_url && !solution.videoFile && (
              <div className="bg-black rounded-lg overflow-hidden relative group">
                <div className="absolute top-0 left-0 right-0 z-10 p-3 flex justify-between items-start pointer-events-none">
                  <div className="flex gap-2 pointer-events-auto">
                    <label className="cursor-pointer bg-black bg-opacity-50 rounded-full p-2 hover:bg-opacity-70">
                      <Upload className="h-4 w-4 text-white" />
                      <input
                        type="file"
                        accept="video/mp4,video/quicktime"
                        onChange={(e) => {
                          if (e.target.files?.[0]) {
                            handleChange({ videoFile: e.target.files[0] });
                          }
                        }}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
                <video
                  src={solution.video_url}
                  controls
                  className="w-full h-[200px] aspect-video object-cover"
                />
              </div>
            )}

            {/* If we have a file (new upload) */}
            {solution.videoFile && (
              <div className="bg-black rounded-lg overflow-hidden relative group">
                <div className="absolute top-0 left-0 right-0 z-10 p-3 flex justify-between items-start pointer-events-none">
                  <h4 className="text-sm font-medium text-white bg-black bg-opacity-50 px-2 py-1 rounded">
                    {solution.videoFile.name.split(".").slice(0, -1).join(".")}
                  </h4>
                  <div className="flex gap-2 pointer-events-auto">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleChange({ videoFile: null })}
                      className="bg-black bg-opacity-50 rounded-full p-2 h-auto w-auto hover:bg-opacity-70"
                    >
                      <X className="h-4 w-4 text-white" />
                    </Button>
                  </div>
                </div>
                <video
                  src={URL.createObjectURL(solution.videoFile)}
                  controls
                  className="w-full h-[200px] aspect-video object-cover"
                />
              </div>
            )}

            {/* Default state (no file or URL) */}
            {!solution.video_url && !solution.videoFile && (
              <div className="text-center py-6 border border-dashed border-gray-300 rounded-lg">
                <div className="space-y-2">
                  <p className="text-sm font-medium">
                    Browse your file to upload!
                  </p>
                  <p className="text-xs text-gray-500">
                    Supported Format: Mp4 (50mb max)
                  </p>
                  <div className="pt-2">
                    <Button size="sm" className="relative py-5 px-6">
                      Browse File <Upload className="ml-2" />
                      <input
                        type="file"
                        accept="video/mp4,video/quicktime"
                        onChange={(e) => {
                          if (e.target.files?.[0]) {
                            handleChange({ videoFile: e.target.files[0] });
                          }
                        }}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  return <div className="rounded-lg ">{renderSolutionInput()}</div>;
}