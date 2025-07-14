"use client";

import React, { useEffect, useState, useCallback } from "react";
import ReactFlow, {
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  MarkerType,
  NodeProps,
} from "reactflow";
import "reactflow/dist/style.css";
import { VideoType, Question, Answer } from "@/lib/types";
import { Handle, Position } from "reactflow";

function CustomVideoNode({ data }: NodeProps<{ video: VideoType }>) {
  return (
    <div className="p-4 rounded-lg shadow-md bg-white border border-gray-300 text-gray-800 relative w-64">
      <div className="font-semibold flex items-center gap-2 text-sm text-gray-600 mb-1">
        🎥 {data.video.title}
      </div>

      <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />
    </div>
  );
}

function CustomQuestionNode({ data }: NodeProps<{ question: Question }>) {
  return (
    <div className="p-4 rounded-lg shadow-sm bg-white border border-gray-300 text-gray-800 relative w-72">
      <div className="text-blue-600 font-semibold text-sm flex items-center gap-1 mb-1">
        ❓ Question
      </div>
      <div className="text-sm text-gray-700">{data.question.question_text}</div>
      <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />
    </div>
  );
}

function CustomAnswerNode({ data }: NodeProps<{ answer: Answer }>) {
  return (
    <div className="p-4 rounded-lg shadow-sm bg-blue-50 border border-blue-200 text-gray-800 relative w-72">
      <div className="text-blue-700 font-medium text-sm flex items-center gap-1 mb-1">
        🌟 Answer
      </div>
      <div className="text-sm text-gray-700">{data.answer.answer_text}</div>
      {data.answer.destination_video_id && (
        <div className="text-xs text-gray-400 mt-2">Leads to another video</div>
      )}
      <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />
    </div>
  );
}

const nodeTypes = {
  video: CustomVideoNode,
  question: CustomQuestionNode,
  answer: CustomAnswerNode,
};

interface TreeViewSessionProps {
  videos: VideoType[];
  questions: Question[];
}

export function TreeViewSession({ videos, questions }: TreeViewSessionProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  useEffect(() => {
    if (!videos.length) return;

    const orderedVideos = [...videos].sort(
      (a:any, b:any) => a.order_index - b.order_index
    );
    const visitedVideos = new Set<string>();
    const createdNodes = new Map<string, Node>();
    const createdEdges: Edge[] = [];

    const xSpacing = 250;
    const ySpacing = 180;

    const processVideo = (
      video: VideoType,
      parentId: string | null,
      parentX: number,
      depth: number
    ) => {
      if (visitedVideos.has(video.id)) return;
      visitedVideos.add(video.id);

      const videoNodeId = `video-${video.id}`;
      const videoX = parentX;

      const videoNode: Node = {
        id: videoNodeId,
        type: "video",
        position: { x: videoX, y: ySpacing * depth },
        data: { video },
      };
      createdNodes.set(videoNodeId, videoNode);

      if (parentId) {
        createdEdges.push({
          id: `edge-${parentId}-to-${videoNodeId}`,
          source: parentId,
          target: videoNodeId,
          markerEnd: { type: MarkerType.ArrowClosed },
          style: { strokeWidth: 2, stroke: "#9CA3AF" },
        });
      }

      const videoQuestions = questions.filter((q) => q.video_id === video.id);
      const questionStartX =
        videoX - ((videoQuestions.length - 1) * xSpacing) / 2;

      videoQuestions.forEach((question, qIndex) => {
        const questionNodeId = `question-${question.id}`;
        const questionX = questionStartX + qIndex * xSpacing;

        const questionNode: Node = {
          id: questionNodeId,
          type: "question",
          position: { x: questionX, y: ySpacing * (depth + 1) },
          data: { question },
        };
        createdNodes.set(questionNodeId, questionNode);

        createdEdges.push({
          id: `edge-${videoNodeId}-to-${questionNodeId}`,
          source: videoNodeId,
          target: questionNodeId,
          markerEnd: { type: MarkerType.ArrowClosed },
          style: { strokeWidth: 2, stroke: "#9CA3AF" },
        });

        const answers = question.answers || [];
        const answerStartX =
          questionX - ((answers.length - 1) * xSpacing * 0.7) / 2;

        answers.forEach((answer, aIndex) => {
          const answerNodeId = `answer-${answer.id}`;
          const answerX = answerStartX + aIndex * xSpacing * 0.7;

          const answerNode: Node = {
            id: answerNodeId,
            type: "answer",
            position: { x: answerX, y: ySpacing * (depth + 2) },
            data: { answer },
          };
          createdNodes.set(answerNodeId, answerNode);

          createdEdges.push({
            id: `edge-${questionNodeId}-to-${answerNodeId}`,
            source: questionNodeId,
            target: answerNodeId,
            markerEnd: { type: MarkerType.ArrowClosed },
            style: { strokeWidth: 2, stroke: "#9CA3AF" },
          });

          if (answer.destination_video_id) {
            const destVideo = videos.find(
              (v) => v.id === answer.destination_video_id
            );
            if (destVideo) {
              processVideo(destVideo, answerNodeId, answerX, depth + 3);
            }
          }
        });
      });
    };

    processVideo(orderedVideos[0], null, 0, 0);

    setNodes(Array.from(createdNodes.values()));
    setEdges(createdEdges);
  }, [videos, questions]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  return (
    <div style={{ height: "100vh", width: "100%" }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        defaultEdgeOptions={{
          style: {
            strokeWidth: 2,
            stroke: "#9CA3AF", // Gray color
          },
          markerEnd: { type: MarkerType.ArrowClosed },
        }}
        nodesDraggable
        nodesConnectable={false}
        proOptions={{ hideAttribution: true }}
      >
        <Controls />
        <Background />
      </ReactFlow>
    </div>
  );
}