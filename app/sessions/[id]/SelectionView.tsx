"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { SolutionCard } from "@/components/SolutionCard";
import { Solution } from "@/lib/types";

type Video = {
  id: string;
  title: string;
  url: string;
  order_index: number;
  question?: {
    id: string;
    question_text: string;
    answers: {
      id: string;
      answer_text: string;
    }[];
  };
};

export default function ViewSelectionSession({
  sessionId,
}: {
  sessionId: string;
}) {
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [session, setSession] = useState<any>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [solutions, setSolutions] = useState<Solution[]>([]);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<
    Record<string, string>
  >({});
  const [showSolution, setShowSolution] = useState(false);
  const [currentSolution, setCurrentSolution] = useState<Solution | null>(null);

  // Fetch session data
  useEffect(() => {
    const fetchSession = async () => {
      setIsLoading(true);
      try {
        // Get session
        const { data: sessionData, error: sessionError } = await supabase
          .from("sessions")
          .select("*")
          .eq("id", sessionId)
          .single();

        if (sessionError || !sessionData)
          throw sessionError || new Error("Session not found");

        setSession(sessionData);

        // Get videos with questions and answers
        const { data: videosData, error: videosError } = await supabase
          .from("videos")
          .select(
            `
            *,
            questions:questions(
              *,
              answers:answers(*)
            )
          `
          )
          .eq("session_id", sessionId)
          .order("order_index");

        if (videosError) throw videosError;

        const processedVideos = videosData.map((video) => ({
          ...video,
          question:
            video.questions.length > 0
              ? {
                  ...video.questions[0],
                  answers: video.questions[0].answers,
                }
              : undefined,
        }));

        setVideos(processedVideos);

        // Get solutions
        const { data: solutionsData, error: solutionsError } = await supabase
          .from("solutions")
          .select("*")
          .eq("session_id", sessionId);

        if (solutionsError) throw solutionsError;
        setSolutions(solutionsData || []);
      } catch (error) {
        console.error("Error fetching session:", error);
        router.push("/sessions");
      } finally {
        setIsLoading(false);
      }
    };

    if (sessionId) {
      fetchSession();
    }
  }, [sessionId, router]);

  // Handle answer selection
  const handleAnswerSelect = (questionId: string, answerId: string) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: answerId,
    }));
  };

  // Move to next video or show solution
  const handleNext = () => {
    const currentVideo = videos[currentVideoIndex];

    // Check if answer is selected for current video's question
    if (currentVideo.question && !selectedAnswers[currentVideo.question.id]) {
      alert("Please select an answer before proceeding");
      return;
    }

    // If last video, find matching solution
    if (currentVideoIndex === videos.length - 1) {
      findMatchingSolution();
    } else {
      setCurrentVideoIndex((prev) => prev + 1);
    }
  };

  // Move to previous video
  const handlePrevious = () => {
    if (showSolution) {
      setShowSolution(false);
    } else if (currentVideoIndex > 0) {
      setCurrentVideoIndex((prev) => prev - 1);
    }
  };

  // Find solution that matches the selected answers
  const findMatchingSolution = async () => {
    try {
      // Get all answer combinations for this session
      const { data: combinations, error: combosError } = await supabase
        .from("answer_combinations")
        .select(
          `
          *,
          combination_answers:combination_answers(
            answer_id
          )
        `
        )
        .eq("session_id", sessionId);

      if (combosError) throw combosError;

      // Create a hash of our selected answers
      const selectedAnswerIds = Object.values(selectedAnswers);
      const selectedHash = selectedAnswerIds.sort().join("-");

      // Find matching combination
      const matchingCombo = combinations.find((combo) => {
        const comboAnswerIds = combo.combination_answers.map(
          (ca: any) => ca.answer_id
        );
        const comboHash = comboAnswerIds.sort().join("-");
        return comboHash === selectedHash;
      });

      if (!matchingCombo) {
        alert("No solution found for this combination of answers");
        return;
      }

      // Find the solution
      const solution = solutions.find(
        (s) => s.id === matchingCombo.solution_id
      );
      if (solution) {
        setCurrentSolution({ ...solution, session_id: sessionId });
        setShowSolution(true);
      } else {
        alert("Solution not found");
      }
    } catch (error) {
      console.error("Error finding solution:", error);
      alert("Failed to find matching solution");
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 max-w-6xl">
        <Card>
          <CardContent className="p-8 text-center">
            <p>Loading session...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="container mx-auto py-8 max-w-6xl">
        <Card>
          <CardContent className="p-8 text-center">
            <p>Session not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentVideo = videos[currentVideoIndex];
  const progressPercentage =
    ((currentVideoIndex + (showSolution ? 1 : 0)) / videos.length) * 100;

  return (
    <div className="container mx-auto py-8 max-w-6xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-semibold">
            {session.title}
          </CardTitle>
        </CardHeader>

        <CardContent>
          {/* Progress bar */}
          <div className="w-full bg-gray-200 rounded-full h-2.5 mb-6">
            <div
              className="bg-blue-600 h-2.5 rounded-full"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>

          {showSolution && currentSolution ? (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold">Solution</h3>
              <SolutionCard
                solution={currentSolution}
                readOnly={true}
              />
              <div className="flex justify-between mt-6">
                <Button onClick={handlePrevious}>
                  <ChevronLeft className="h-4 w-4 mr-2" /> Back
                </Button>
              </div>
            </div>
          ) : currentVideo ? (
            <div className="space-y-6">
              <div className="aspect-video bg-black rounded-lg overflow-hidden">
                <video
                  src={currentVideo.url}
                  controls
                  className="w-full h-full object-contain"
                />
              </div>

              {currentVideo.question && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">
                    {currentVideo.question.question_text}
                  </h3>
                  <div className="space-y-2">
                    {currentVideo.question.answers.map((answer) => (
                      <Button
                        key={answer.id}
                        variant={
                          selectedAnswers[currentVideo.question!.id] ===
                          answer.id
                            ? "default"
                            : "outline"
                        }
                        className="w-full justify-start"
                        onClick={() =>
                          handleAnswerSelect(
                            currentVideo.question!.id,
                            answer.id
                          )
                        }
                      >
                        {answer.answer_text}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-between mt-6">
                <Button
                  onClick={handlePrevious}
                  disabled={currentVideoIndex === 0 && !showSolution}
                >
                  <ChevronLeft className="h-4 w-4 mr-2" /> Back
                </Button>
                <Button onClick={handleNext}>
                  {currentVideoIndex === videos.length - 1
                    ? "Show Solution"
                    : "Next"}
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          ) : (
            <p>No videos found in this session</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
