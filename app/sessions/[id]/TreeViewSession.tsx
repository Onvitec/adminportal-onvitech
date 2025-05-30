"use client";

import ReactFlow, {
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  MarkerType,
  Panel,
  BezierEdge,
} from "reactflow";
import "reactflow/dist/style.css";
import { useEffect } from "react";
import { VideoType, Question, Answer } from "@/lib/types";

// Custom edge type for beautiful curved lines
const edgeTypes = {
  custom: BezierEdge,
};

const nodeTypes = {
  question: QuestionNode,
  answer: AnswerNode,
  video: VideoNode,
};

function QuestionNode({ data }: { data: { label: string; emoji?: string } }) {
  return (
    <div className="px-4 py-2 rounded-xl bg-white border-2 border-blue-300 shadow-lg w-[260px] min-h-[100px] flex flex-col justify-center">
      <div className="flex items-center gap-2">
        <span className="text-xl">{data.emoji || "❓"}</span>
        <div>
          <div className="font-semibold text-blue-800 text-sm">Question</div>
          <div className="text-blue-600 text-sm mt-1 line-clamp-2">{data.label}</div>
        </div>
      </div>
    </div>
  );
}

function AnswerNode({ data }: { data: { label: string; emoji?: string } }) {
  return (
    <div className="px-4 py-2 rounded-xl bg-white border-2 border-green-300 shadow-lg w-[260px] min-h-[100px] flex flex-col justify-center">
      <div className="flex items-center gap-2">
        <span className="text-xl">{data.emoji || "💡"}</span>
        <div>
          <div className="font-semibold text-green-800 text-sm">Answer</div>
          <div className="text-green-600 text-sm mt-1 line-clamp-2">{data.label}</div>
        </div>
      </div>
    </div>
  );
}

function VideoNode({ data }: { data: { label: string; emoji?: string } }) {
  return (
    <div className="px-4 py-2 rounded-xl bg-white border-2 border-purple-300 shadow-lg w-[260px] min-h-[100px] flex flex-col justify-center">
      <div className="flex items-center gap-2">
        <span className="text-xl">{data.emoji || "🎬"}</span>
        <div>
          <div className="font-semibold text-purple-800 text-sm">Video</div>
          <div className="text-purple-600 text-sm mt-1 line-clamp-2">{data.label}</div>
        </div>
      </div>
    </div>
  );
}

export function TreeViewSession({
  videos,
  questions,
}: {
  videos: VideoType[];
  questions: Question[];
}) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  useEffect(() => {
    if (videos.length > 0 && questions.length > 0) {
      const initialNodes: any = [];
      const initialEdges: any = [];
      const horizontalSpacing = 360;
      const verticalSpacing = 200;
      let currentY = 50;

      const mainVideo = videos.find((v) => v.is_main) || videos[0];
      const mainVideoNode = {
        id: `video-${mainVideo.id}`,
        type: "video",
        position: { x: 0, y: currentY },
        data: {
          label: mainVideo.title || "Main Video",
          emoji: "📺",
        },
      };
      initialNodes.push(mainVideoNode);
      currentY += verticalSpacing;

      const mainVideoQuestions = questions.filter((q) => q.video_id === mainVideo.id);

      mainVideoQuestions.forEach((question, qIndex) => {
        const questionX = (qIndex - (mainVideoQuestions.length - 1) / 2) * horizontalSpacing;

        const questionNode = {
          id: `question-${question.id}`,
          type: "question",
          position: { x: questionX, y: currentY },
          data: {
            label: question.question_text,
            emoji: "❓",
          },
        };
        initialNodes.push(questionNode);

        initialEdges.push({
          id: `edge-video-${mainVideo.id}-question-${question.id}`,
          source: `video-${mainVideo.id}`,
          target: `question-${question.id}`,
          type: "custom",
          markerEnd: { type: MarkerType.ArrowClosed },
          style: { strokeWidth: 2, stroke: "#3B82F6" },
        });

        const answerY = currentY + verticalSpacing;
        question.answers.forEach((answer, aIndex) => {
          const answerX =
            questionX + (aIndex - (question.answers.length - 1) / 2) * (horizontalSpacing * 0.8);

          const answerNode = {
            id: `answer-${answer.id}`,
            type: "answer",
            position: { x: answerX, y: answerY },
            data: {
              label: answer.answer_text,
              emoji: aIndex === 0 ? "✅" : "💡",
            },
          };
          initialNodes.push(answerNode);

          initialEdges.push({
            id: `edge-question-${question.id}-answer-${answer.id}`,
            source: `question-${question.id}`,
            target: `answer-${answer.id}`,
            type: "custom",
            markerEnd: { type: MarkerType.ArrowClosed },
            style: { strokeWidth: 2, stroke: "#10B981" },
          });

          if (answer.destination_video) {
            const destVideo = videos.find((v) => v.id === answer.destination_video?.id);
            if (destVideo) {
              const destVideoY = answerY + verticalSpacing;
              const destVideoX = answerX;

if (!initialNodes.some((n: { id: string }) => n.id === `video-${destVideo.id}`)) {
                const destVideoNode = {
                  id: `video-${destVideo.id}`,
                  type: "video",
                  position: { x: destVideoX, y: destVideoY },
                  data: {
                    label: destVideo.title || "Next Video",
                    emoji: "⏭️",
                  },
                };
                initialNodes.push(destVideoNode);
              }

              initialEdges.push({
                id: `edge-answer-${answer.id}-video-${destVideo.id}`,
                source: `answer-${answer.id}`,
                target: `video-${destVideo.id}`,
                type: "custom",
                markerEnd: { type: MarkerType.ArrowClosed },
                animated: true,
                style: { strokeWidth: 2, stroke: "#8B5CF6" },
              });

              const destVideoQuestions = questions.filter((q) => q.video_id === destVideo.id);
              if (destVideoQuestions.length > 0) {
                const nextLevelY = destVideoY + verticalSpacing;

                destVideoQuestions.forEach((destQuestion, destQIndex) => {
                  const destQuestionX =
                    destVideoX +
                    (destQIndex - (destVideoQuestions.length - 1) / 2) * (horizontalSpacing * 0.6);

                  if 
                  (!initialNodes.some((n: { id: string }) => n.id === `video-${destVideo.id}`)
) 
                  {
                    const destQuestionNode = {
                      id: `question-${destQuestion.id}`,
                      type: "question",
                      position: { x: destQuestionX, y: nextLevelY },
                      data: {
                        label: destQuestion.question_text,
                        emoji: "❔",
                      },
                    };
                    initialNodes.push(destQuestionNode);

                    initialEdges.push({
                      id: `edge-video-${destVideo.id}-question-${destQuestion.id}`,
                      source: `video-${destVideo.id}`,
                      target: `question-${destQuestion.id}`,
                      type: "custom",
                      markerEnd: { type: MarkerType.ArrowClosed },
                      style: { strokeWidth: 2, stroke: "#3B82F6" },
                    });
                  }
                });
              }
            }
          }
        });
      });

      setNodes(initialNodes);
      setEdges(initialEdges);
    }
  }, [videos, questions]);

  return (
    <div className="w-full h-[1000px] bg-gray-50 rounded-xl overflow-hidden border-2 border-gray-200">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        fitViewOptions={{ padding: 0.5 }}
      >
        <Controls className="bg-white p-1 rounded-md shadow-sm border" />
        <Background color="#ddd" gap={30} className="opacity-30" />
        <Panel position="top-right" className="bg-white p-2 rounded shadow-sm border text-sm">
          <div className="flex items-center gap-2 font-medium text-purple-700">
            <span className="text-lg">📊</span>
            Flowchart View
          </div>
        </Panel>
      </ReactFlow>
    </div>
  );
}
