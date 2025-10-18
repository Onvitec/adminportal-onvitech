"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Edit, Trash2, Upload, Video } from "lucide-react";
import { VideoLink } from "@/lib/types";
import { VideoUploadWithLinks } from "./forms/videoo-upload";

interface NavigationButtonSectionProps {
  navigationButtonImage: File | null;
  navigationButtonVideo: File | null;
  navigationButtonVideoUrl: string;
  navigationButtonVideoTitle: string;
  navigationButtonVideoDuration?: number;
  navigationButtonVideoLinks: VideoLink[];
  availableVideos: Array<{ id: string; title: string }>;
  onImageChange: (file: File | null) => void;
  onVideoChange: (file: File | null, duration: number) => void;
  onVideoTitleChange: (title: string) => void;
  onVideoLinksChange: (links: VideoLink[]) => void;
  existingImageUrl?: string | null;
  existingVideoUrl?: string | null;
}

export function NavigationButtonSection({
  navigationButtonImage,
  navigationButtonVideo,
  navigationButtonVideoUrl,
  navigationButtonVideoTitle,
  navigationButtonVideoDuration,
  navigationButtonVideoLinks,
  availableVideos,
  onImageChange,
  onVideoChange,
  onVideoTitleChange,
  onVideoLinksChange,
  existingImageUrl,
  existingVideoUrl,
}: NavigationButtonSectionProps) {
  const [isNavigationVideoModalOpen, setIsNavigationVideoModalOpen] =
    useState(false);

  const handleVideoUpload = (file: File | null, duration: number) => {
    onVideoChange(file, duration);
    if (file) {
      onVideoTitleChange(file.name.split(".")[0] || "Navigation Video");
    }
  };

  const getImagePreview = () => {
    if (navigationButtonImage)
      return URL.createObjectURL(navigationButtonImage);
    if (existingImageUrl) return existingImageUrl;
    return null;
  };

  const getVideoPreview = () => {
    if (navigationButtonVideo)
      return URL.createObjectURL(navigationButtonVideo);
    if (existingVideoUrl) return existingVideoUrl;
    return navigationButtonVideoUrl;
  };

  return (
    <div className="mt-10 rounded-2xl border border-neutral-200 bg-white p-8">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-neutral-900">
          Navigation Button
        </h3>
        <p className="text-sm text-neutral-500 mt-1">
          Upload a button image and an interactive video. The button will stay
          visible and when clicked, play the interactive video which can have
          its own buttons/links.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {/* Button Image Section */}
        <div className="space-y-6 max-w-1/5">
          <div className="space-y-3">
            <Label className="text-sm font-medium text-neutral-700">
              Button Image *
            </Label>
            <div className="border border-dashed border-neutral-300 rounded-xl p-6 text-center bg-neutral-50 hover:bg-neutral-100/60 transition">
              {getImagePreview() ? (
                <div className="space-y-4 flex flex-col items-center">
                  <img
                    src={getImagePreview()!}
                    alt="Navigation button"
                    className="max-h-32 object-contain rounded-md"
                  />
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const input = document.createElement("input");
                        input.type = "file";
                        input.accept = "image/*";
                        input.onchange = (e) => {
                          const file = (e.target as HTMLInputElement)
                            .files?.[0];
                          if (file) onImageChange(file);
                        };
                        input.click();
                      }}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Change
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => onImageChange(null)}
                      className="text-red-500 hover:text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Remove
                    </Button>
                  </div>
                </div>
              ) : (
                <Label
                  htmlFor="navigation-image"
                  className="cursor-pointer block"
                >
                  <Upload className="mx-auto h-8 w-8 text-neutral-400" />
                  <p className="mt-2 text-sm font-medium text-blue-600">
                    Upload Button Image
                  </p>
                  <input
                    id="navigation-image"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) onImageChange(file);
                    }}
                  />
                  <p className="text-xs text-neutral-400 mt-1">
                    PNG, JPG up to 10MB
                  </p>
                </Label>
              )}
            </div>
          </div>
        </div>

        {/* Interactive Video Section */}
        <div className="space-y-4">
          <Label className="text-sm font-medium text-neutral-700">
            Interactive Video *
          </Label>

          {navigationButtonVideo || existingVideoUrl ? (
            <div className="space-y-4">
              <div className="border rounded-lg p-4 bg-neutral-50">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Video className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="flex gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsNavigationVideoModalOpen(true)}
                      className="h-8 w-8 p-0 text-blue-600 hover:text-blue-800"
                      title="Edit video buttons"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        onVideoChange(null, 0);
                        onVideoTitleChange("");
                        onVideoLinksChange([]);
                      }}
                      className="h-8 w-8 p-0 text-red-500 hover:text-red-600"
                      title="Remove video"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <VideoUploadWithLinks
                  video={{
                    id: "navigation-video",
                    title: navigationButtonVideoTitle,
                    file: navigationButtonVideo,
                    url: getVideoPreview(),
                    duration: navigationButtonVideoDuration || 0,
                    links: navigationButtonVideoLinks,
                    freezeAtEnd: false,
                    destination_video_id: null,
                  }}
                  availableVideos={availableVideos}
                  onFileChange={handleVideoUpload}
                  onLinksChange={onVideoLinksChange}
                  onDelete={() => {}}
                />

                <div className="flex justify-between items-center mt-2 text-xs text-neutral-600">
                  <span>
                    {/* Duration: {Math.round(navigationButtonVideoDuration || 0)}s */}
                  </span>
                  <span>{navigationButtonVideoLinks.length} buttons</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-neutral-700">
                  Video Title
                </Label>
                <Input
                  placeholder="Enter video title"
                  value={navigationButtonVideoTitle}
                  onChange={(e) => onVideoTitleChange(e.target.value)}
                  className="h-9"
                />
              </div>
            </div>
          ) : (
            <div className="border-2 border-dashed border-neutral-300 rounded-xl p-8 text-center bg-neutral-50 hover:bg-neutral-100/60 transition">
              <Label
                htmlFor="navigation-video"
                className="cursor-pointer block"
              >
                <Video className="mx-auto h-8 w-8 text-neutral-400" />
                <p className="mt-2 text-sm font-medium text-blue-600">
                  Upload Interactive Video
                </p>
                <input
                  id="navigation-video"
                  type="file"
                  accept="video/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleVideoUpload(file, 0);

                      const videoElement = document.createElement("video");
                      videoElement.preload = "metadata";
                      videoElement.onloadedmetadata = function () {
                        window.URL.revokeObjectURL(videoElement.src);
                        onVideoChange(file, Math.round(videoElement.duration));
                      };
                      videoElement.src = URL.createObjectURL(file);
                    }
                  }}
                />
                <p className="text-xs text-neutral-400 mt-1">
                  MP4, MOV up to 100MB
                </p>
              </Label>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
