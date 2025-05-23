'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  PlusCircle, X, Upload, Trash2, Edit, Check, 
  ChevronDown, ChevronUp, Pencil 
} from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';
import { cn } from '@/lib/utils';

type Answer = {
  id: string;
  answer_text: string;
  destination_video_id: string;
};

type Question = {
  id: string;
  question_text: string;
  answers: Answer[];
};

type Video = {
  id: string;
  name: string;
  file: File | null;
  url: string;
  question: Question | null;
  isExpanded: boolean;
};

export default function InteractiveSessionForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [sessionName, setSessionName] = useState('');
  const [userId, setUserId] = useState('');
  const [videos, setVideos] = useState<Video[]>([
    {
      id: uuidv4(),
      name: 'Video 1',
      file: null,
      url: '',
      question: null,
      isExpanded: true,
    },
  ]);

  const addVideo = () => {
    setVideos([
      ...videos,
      {
        id: uuidv4(),
        name: `Video ${videos.length + 1}`,
        file: null,
        url: '',
        question: null,
        isExpanded: true,
      },
    ]);
  };

  const removeVideo = (videoId: string) => {
    setVideos(videos.filter((v) => v.id !== videoId));
  };

  const updateVideoName = (videoId: string, name: string) => {
    setVideos(
      videos.map((v) => (v.id === videoId ? { ...v, name } : v))
    );
  };

  const toggleExpandVideo = (videoId: string) => {
    setVideos(
      videos.map((v) => 
        v.id === videoId ? { ...v, isExpanded: !v.isExpanded } : v
      )
    );
  };

  const handleFileChange = (videoId: string, file: File | null) => {
    setVideos(
      videos.map((v) =>
        v.id === videoId
          ? { ...v, file, name: file?.name.split('.')[0] || v.name }
          : v
      )
    );
  };

  const addQuestion = (videoId: string) => {
    setVideos(
      videos.map((v) =>
        v.id === videoId
          ? {
              ...v,
              question: {
                id: uuidv4(),
                question_text: '',
                answers: [
                  {
                    id: uuidv4(),
                    answer_text: 'Answer 1',
                    destination_video_id: '',
                  },
                ],
              },
            }
          : v
      )
    );
  };

  const removeQuestion = (videoId: string) => {
    setVideos(
      videos.map((v) =>
        v.id === videoId ? { ...v, question: null } : v
      )
    );
  };

  const updateQuestion = (videoId: string, question_text: string) => {
    setVideos(
      videos.map((v) =>
        v.id === videoId && v.question
          ? { ...v, question: { ...v.question, question_text } }
          : v
      )
    );
  };

  const addAnswer = (videoId: string) => {
    setVideos(
      videos.map((v) =>
        v.id === videoId && v.question
          ? {
              ...v,
              question: {
                ...v.question,
                answers: [
                  ...v.question.answers,
                  {
                    id: uuidv4(),
                    answer_text: `Answer ${v.question.answers.length + 1}`,
                    destination_video_id: '',
                  },
                ],
              },
            }
          : v
      )
    );
  };

  const updateAnswer = (videoId: string, answerId: string, answer_text: string) => {
    setVideos(
      videos.map((v) =>
        v.id === videoId && v.question
          ? {
              ...v,
              question: {
                ...v.question,
                answers: v.question.answers.map((a) =>
                  a.id === answerId ? { ...a, answer_text } : a
                ),
              },
            }
          : v
      )
    );
  };

  const removeAnswer = (videoId: string, answerId: string) => {
    setVideos(
      videos.map((v) =>
        v.id === videoId && v.question
          ? {
              ...v,
              question: {
                ...v.question,
                answers: v.question.answers.filter((a) => a.id !== answerId),
              },
            }
          : v
      )
    );
  };

  const updateDestinationVideo = (
    videoId: string,
    answerId: string,
    destination_video_id: string
  ) => {
    setVideos(
      videos.map((v) =>
        v.id === videoId && v.question
          ? {
              ...v,
              question: {
                ...v.question,
                answers: v.question.answers.map((a) =>
                  a.id === answerId ? { ...a, destination_video_id } : a
                ),
              },
            }
          : v
      )
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Create session
      const { data: sessionData, error: sessionError } = await supabase
        .from('sessions')
        .insert({
          title: sessionName,
          session_type: 'interactive',
          created_by: user.id,
        })
        .select()
        .single();

      if (sessionError || !sessionData) throw sessionError || new Error('Failed to create session');

      // Upload videos and create questions/answers
      const uploadedVideos: Record<string, string> = {};

      for (const [index, video] of videos.entries()) {
        if (!video.file) continue;

        // Upload file to storage
        const fileExt = video.file.name.split('.').pop();
        const filePath = `${user.id}/${sessionData.id}/${video.id}.${fileExt}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('videos')
          .upload(filePath, video.file);

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('videos')
          .getPublicUrl(filePath);

        // Create video record
        const { data: videoData, error: videoError } = await supabase
          .from('videos')
          .insert({
            title: video.name || video.file.name,
            url: urlData.publicUrl,
            session_id: sessionData.id,
            is_interactive: true,
            order_index: index,
          })
          .select()
          .single();

        if (videoError || !videoData) throw videoError || new Error('Failed to create video');

        // Store mapping of temporary ID to actual DB ID
        uploadedVideos[video.id] = videoData.id;

        // Create question if exists
        if (video.question) {
          const { data: questionData, error: questionError } = await supabase
            .from('questions')
            .insert({
              question_text: video.question.question_text,
              video_id: videoData.id,
            })
            .select()
            .single();

          if (questionError || !questionData) throw questionError || new Error('Failed to create question');

          // Create answers
          for (const answer of video.question.answers) {
            await supabase
              .from('answers')
              .insert({
                answer_text: answer.answer_text,
                question_id: questionData.id,
              });
          }
        }
      }

      // Update answer destination_video_id after all videos are uploaded
      for (const video of videos) {
        if (!video.question) continue;

        const videoDbId = uploadedVideos[video.id];
        if (!videoDbId) continue;

        const { data: questions } = await supabase
          .from('questions')
          .select('id')
          .eq('video_id', videoDbId);

        if (!questions || questions.length === 0) continue;
        const questionId = questions[0].id;

        for (const [index, answer] of video.question.answers.entries()) {
          if (!answer.destination_video_id) continue;
          
          const destinationDbId = uploadedVideos[answer.destination_video_id];
          if (!destinationDbId) continue;

          const { data: answers } = await supabase
            .from('answers')
            .select('id')
            .eq('question_id', questionId)
            .order('created_at', { ascending: true });

          if (!answers || !answers[index]) continue;
          
          await supabase
            .from('answers')
            .update({ destination_video_id: destinationDbId })
            .eq('id', answers[index].id);
        }
      }

      // Redirect to sessions page
      router.push('/sessions');
    } catch (error) {
      console.error('Error creating session:', error);
      alert('Failed to create session. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <form onSubmit={handleSubmit}>
        <Card className="border-none shadow-none px-3">
          <CardHeader className="px-0">
            <CardTitle className="text-2xl font-semibold">
              Interactive Session Details
            </CardTitle>
            <CardDescription className="text-sm text-gray-600">
              Create an interactive learning experience with branching videos based on user answers.
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
                  placeholder="e.g., Customer Service Training"
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
              <h3 className="text-lg font-medium mb-4">Interactive Videos</h3>

              <div className="space-y-4">
                {videos.map((video) => (
                  <Card key={video.id} className="border rounded-lg overflow-hidden">
                    <div className="p-4 flex items-center justify-between bg-gray-50">
                      <div className="flex items-center gap-3">
                        <h3 className="text-base font-medium">{video.name}</h3>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const newName = prompt('Enter new video name', video.name);
                            if (newName) updateVideoName(video.id, newName);
                          }}
                          className="h-8 w-8 p-0 text-gray-500 hover:text-gray-900"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleExpandVideo(video.id)}
                          className="h-8 w-8 p-0 text-gray-500 hover:text-gray-900"
                        >
                          {video.isExpanded ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeVideo(video.id)}
                          className="h-8 w-8 p-0 text-gray-500 hover:text-gray-900"
                          disabled={videos.length === 1}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {video.isExpanded && (
                      <CardContent className="p-4 space-y-4">
                        <div className="border border-dashed rounded-lg p-4">
                          {video.file ? (
                            <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                              <div className="flex-1 truncate pr-2">
                                <p className="text-sm truncate">{video.file.name}</p>
                                <p className="text-xs text-gray-500">
                                  {(video.file.size / (1024 * 1024)).toFixed(2)} MB
                                </p>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleFileChange(video.id, null)}
                                className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <div className="text-center py-4">
                              <div className="space-y-2">
                                <p className="text-sm font-medium">Browse your file to upload!</p>
                                <p className="text-xs text-gray-500">
                                  Supported Format: MP4, JPG, PNG (50mb each)
                                </p>
                                <div className="pt-2">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="relative py-5 px-6"
                                  >
                                    <Upload className="h-4 w-4 mr-2" />
                                    Browse File
                                    <input
                                      type="file"
                                      accept="video/mp4,video/quicktime,image/jpeg,image/png"
                                      onChange={(e) => 
                                        handleFileChange(video.id, e.target.files?.[0] || null)
                                      }
                                      className="absolute inset-0 opacity-0 cursor-pointer"
                                    />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        {video.question ? (
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label>Question</Label>
                              <Textarea
                                value={video.question.question_text}
                                onChange={(e) => updateQuestion(video.id, e.target.value)}
                                placeholder="Enter your question here"
                                className="min-h-[80px]"
                              />
                            </div>

                            <div className="space-y-3">
                              <Label>Answers</Label>
                              {video.question.answers.map((answer) => (
                                <div key={answer.id} className="grid grid-cols-12 gap-3 items-center">
                                  <div className="col-span-5">
                                    <Input
                                      value={answer.answer_text}
                                      onChange={(e) => 
                                        updateAnswer(video.id, answer.id, e.target.value)
                                      }
                                      placeholder="Answer text"
                                    />
                                  </div>
                                  <div className="col-span-5">
                                    <Select
                                      value={answer.destination_video_id}
                                      onValueChange={(value) => 
                                        updateDestinationVideo(video.id, answer.id, value)
                                      }
                                    >
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select destination video" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {videos
                                          .filter((v) => v.id !== video.id)
                                          .map((v) => (
                                            <SelectItem key={v.id} value={v.id}>
                                              {v.name}
                                            </SelectItem>
                                          ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div className="col-span-2 flex justify-end">
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => removeAnswer(video.id, answer.id)}
                                      disabled={video.question?.answers.length === 1}
                                      className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              ))}
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => addAnswer(video.id)}
                                className="w-full mt-2"
                              >
                                <PlusCircle className="h-4 w-4 mr-2" />
                                Add Answer
                              </Button>
                            </div>

                            <div className="flex justify-end">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeQuestion(video.id)}
                                className="text-red-600 hover:text-red-800"
                              >
                                Remove Question
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => addQuestion(video.id)}
                            className="w-full"
                          >
                            <PlusCircle className="h-4 w-4 mr-2" />
                            Add Question
                          </Button>
                        )}
                      </CardContent>
                    )}
                  </Card>
                ))}

                <Button
                  type="button"
                  variant="outline"
                  onClick={addVideo}
                  className="w-full mt-4 border-dashed"
                >
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Add Video
                </Button>
              </div>
            </div>

            <div className="flex justify-between items-center gap-2 mt-8">
              <div className="flex-1"></div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/sessions/create')}
                  className="h-10 px-6"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="h-10 px-6"
                >
                  {isLoading ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}