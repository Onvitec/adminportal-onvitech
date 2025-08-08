"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { VideoType, Question, Answer, Solution } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Loader2, ChevronLeft } from "lucide-react";
import { Questions, Answers } from "@/components/icons";

type AnswerCombination = {
  id: string;
  answers: string[];
  solution_id: string | null;
};

export function SelectionSessionEmbed({ sessionId }: { sessionId: string }) {
  const [videos, setVideos] = useState<VideoType[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [solutions, setSolutions] = useState<Solution[]>([]);
  const [combinations, setCombinations] = useState<AnswerCombination[]>([]);
  const [currentVideo, setCurrentVideo] = useState<VideoType | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showQuestions, setShowQuestions] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [currentSolution, setCurrentSolution] = useState<Solution | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch videos
        const { data: videosData, error: videosError } = await supabase
          .from("videos")
          .select("*")
          .eq("session_id", sessionId)
          .order("order_index", { ascending: true });

        if (videosError) throw videosError;

        if (!videosData || videosData.length === 0) {
          throw new Error("No videos found for this session");
        }

        setVideos(videosData);
        setCurrentVideo(videosData[0]);

        // Fetch questions and answers
        const { data: questionsData, error: questionsError } = await supabase
          .from("questions")
          .select("*, answers(*)")
          .in("video_id", videosData.map(v => v.id));

        if (questionsError) throw questionsError;

        setQuestions(questionsData || []);

        // Fetch solutions
        const { data: solutionsData, error: solutionsError } = await supabase
          .from("solutions")
          .select("*")
          .eq("session_id", sessionId);

        if (solutionsError) throw solutionsError;
        setSolutions(solutionsData || []);

        // Fetch answer combinations
        const { data: combinationsData, error: combinationsError } = await supabase
          .from("answer_combinations")
          .select("*, combination_answers(answer_id)")
          .eq("session_id", sessionId);

        if (combinationsError) throw combinationsError;

        const processedCombinations = combinationsData?.map(combo => ({
          id: combo.id,
          answers: combo.combination_answers.map((ca: any) => ca.answer_id),
          solution_id: combo.solution_id
        })) || [];

        setCombinations(processedCombinations);

      } catch (error) {
        console.error("Error fetching selection session data:", error);
        setError(error instanceof Error ? error.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [sessionId]);

  useEffect(() => {
    if (currentVideo && questions.length > 0) {
      const videoQuestion = questions.find(q => q.video_id === currentVideo.id);
      setCurrentQuestion(videoQuestion || null);
      setShowQuestions(false);
      
      if (videoRef.current) {
        videoRef.current.pause();
        setIsPlaying(false);
        setShowControls(true);
      }
    }
  }, [currentVideo, questions]);

  const handleVideoEnd = () => {
    setIsPlaying(false);
    setShowControls(true);
    if (currentQuestion) {
      setShowQuestions(true);
    } else {
      const currentIndex = videos.findIndex(v => v.id === currentVideo?.id);
      if (currentIndex < videos.length - 1) {
        setCurrentVideo(videos[currentIndex + 1]);
      }
    }
  };

  const handleAnswerSelect = (answerId: string) => {
    if (!currentQuestion) return;

    // Update selected answers
    const newSelectedAnswers = {
      ...selectedAnswers,
      [currentQuestion.id]: answerId
    };
    setSelectedAnswers(newSelectedAnswers);

    // Check if we have answers for all questions
    const allQuestionsAnswered = questions.every(q => 
      newSelectedAnswers[q.id] !== undefined
    );

    if (allQuestionsAnswered) {
      // Find the matching combination
      const selectedAnswerIds = questions.map(q => newSelectedAnswers[q.id]);
      const matchingCombination = combinations.find(combo => 
        combo.answers.every(answerId => selectedAnswerIds.includes(answerId))
      );

      if (matchingCombination?.solution_id) {
        const solution = solutions.find(s => s.id === matchingCombination.solution_id);
        setCurrentSolution(solution || null);
        return;
      }
    }

    // Move to next video with a question
    const currentIndex = videos.findIndex(v => v.id === currentVideo?.id);
    const nextVideo = videos.slice(currentIndex + 1).find(v => 
      questions.some(q => q.video_id === v.id)
    );
    
    if (nextVideo) {
      setCurrentVideo(nextVideo);
    } else {
      // No more videos with questions - show solution if we have one
      const selectedAnswerIds = questions.map(q => newSelectedAnswers[q.id]);
      const finalCombination = combinations.find(combo => 
        combo.answers.every(answerId => selectedAnswerIds.includes(answerId))
      );

      if (finalCombination?.solution_id) {
        const solution = solutions.find(s => s.id === finalCombination.solution_id);
        setCurrentSolution(solution || null);
      }
    }

    setShowQuestions(false);
  };

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
        setShowControls(true);
      } else {
        videoRef.current.play();
        setIsPlaying(true);
        setShowControls(false);
        setTimeout(() => setShowControls(false), 300);
      }
    }
  };

  const goToFirstVideo = () => {
    if (videos.length > 0) {
      setCurrentVideo(videos[0]);
      setCurrentSolution(null);
      setSelectedAnswers({});
      setShowQuestions(false);
      if (videoRef.current) {
        videoRef.current.pause();
        setIsPlaying(false);
        setShowControls(true);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-4 text-red-500">
        {error}
      </div>
    );
  }

  if (!currentVideo) {
    return (
      <div className="text-center p-4">
        No video content available
      </div>
    );
  }

  if (currentSolution) {
    return (
      <div className="relative flex-1 bg-black rounded-xl flex items-center justify-center">
        <div className="bg-white/30 backdrop-blur-sm rounded-lg p-8 max-w-2xl w-full mx-4 shadow-lg border border-white/60">
          <h2 className="text-2xl font-bold text-white mb-4">Solution</h2>
          
          {currentSolution.category_id === 1 && currentSolution.form_data && (
            <div className="text-white">
              <h3 className="text-xl font-semibold mb-2">Form Solution</h3>
              <p>{JSON.stringify(currentSolution.form_data)}</p>
            </div>
          )}
          
          {currentSolution.category_id === 2 && currentSolution.emailContent && (
            <div className="text-white">
              <h3 className="text-xl font-semibold mb-2">Email Solution</h3>
              <p>{currentSolution.emailContent}</p>
            </div>
          )}
          
          {currentSolution.category_id === 3 && currentSolution.link_url && (
            <div className="text-white">
              <h3 className="text-xl font-semibold mb-2">Link Solution</h3>
              <a 
                href={currentSolution.link_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-300 hover:text-blue-200 underline"
              >
                {currentSolution.link_url}
              </a>
            </div>
          )}
          
          {currentSolution.category_id === 4 && currentSolution.video_url && (
            <div className="mt-4">
              <video
                src={currentSolution.video_url}
                controls
                className="w-full rounded-lg"
              />
            </div>
          )}

          <div className="mt-6 flex justify-center">
            <Button
              onClick={goToFirstVideo}
              className="bg-white/90 hover:bg-white text-gray-900"
            >
              Start Over
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full rounded-xl overflow-hidden">
      <div className="relative flex-1 bg-black rounded-xl">
        <video

          ref={videoRef}
          src={currentVideo.url}
          className="w-full h-full object-contain rounded-xl"
          controls
          onEnded={handleVideoEnd}
          onPlay={() => {
            setIsPlaying(true);
            setShowControls(false);
          }}
          onPause={() => {
            setIsPlaying(false);
            setShowControls(true);
          }}
        />

        {videos.findIndex(v => v.id === currentVideo?.id) > 0 && (
          <div 
            className="absolute left-4 top-4 bg-white/30 backdrop-blur-sm rounded-lg p-2 shadow-lg border border-white/60 cursor-pointer hover:bg-white/40 transition-colors duration-200"
            onClick={goToFirstVideo}
          >
            <ChevronLeft className="w-6 h-6 text-white font-bold" />
          </div>
        )}

        {showControls && !showQuestions && (
          <div 
            className={`absolute inset-0 flex items-center justify-center cursor-pointer transition-opacity duration-300 ${isPlaying ? 'opacity-0' : 'opacity-100'}`}
            onClick={togglePlayPause}
          >
            <div className={`bg-white/30 backdrop-blur-sm rounded-full p-4 shadow-lg border border-white/60 flex items-center justify-center transform transition-transform duration-300 ${isPlaying ? 'scale-90' : 'scale-100'}`}>
              {isPlaying ? (
                <div className="w-10 h-10 flex items-center justify-center">
                  <div className="w-2 h-8 bg-white mx-1"></div>
                  <div className="w-2 h-8 bg-white mx-1"></div>
                </div>
              ) : (
                <svg
                  className="w-10 h-10 text-white transform transition-transform duration-300 hover:scale-110"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </div>
          </div>
        )}

        {showQuestions && currentQuestion && (
          <div className="absolute right-4 top-1/2 transform -translate-y-1/2 w-96 space-y-4">
            <div className="bg-white/30 backdrop-blur-sm rounded-lg p-4 shadow-lg border border-white/60">
              <div className="flex items-center gap-2 mb-2">
                <Questions className="text-white"/>
                <span className="text-white font-semibold text-sm uppercase tracking-wider">Question</span>
              </div>
              <h3 className="text-lg text-white text-[16px] font-bold pl-2">
                {currentQuestion.question_text}
              </h3>
            </div>

            <hr className="border-white/60 w-full" />

            <div className="space-y-4">
              {currentQuestion.answers.map((answer) => (
                <div
                  key={answer.id}
                  className="bg-white/30 backdrop-blur-sm rounded-lg p-4 shadow-lg border border-white/60 cursor-pointer 
                            hover:bg-white/40 transition-colors duration-200"
                  onClick={() => handleAnswerSelect(answer.id)}
                >
                  <div className="flex items-center gap-3">
                    <Answers className="text-white" />
                    <p className="text-white font-semibold text-[16px]">{answer.answer_text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}