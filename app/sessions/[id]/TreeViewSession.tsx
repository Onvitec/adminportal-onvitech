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
import { VideoType, VideoLink, Solution } from "@/lib/types";
import { Handle, Position } from "reactflow";
import { supabase } from "@/lib/supabase";
import { solutionCategories } from "@/lib/utils";
import { Loader } from "@/components/Loader";
import { DestinationVedio } from "@/components/icons";
import { ExternalLinkIcon, FormInputIcon, LinkIcon } from "lucide-react";
import dagre from "dagre";

/* ------------------------- DAGRE LAYOUT SETUP ------------------------- */
const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));
const nodeWidth = 250;
const nodeHeight = 120;

function getLayoutedElements(nodes: Node[], edges: Edge[], direction = "TB") {
  dagreGraph.setGraph({ rankdir: direction, nodesep: 60, ranksep: 100 });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
    const { x, y } = dagreGraph.node(node.id);
    return {
      ...node,
      position: { x, y },
    };
  });

  return { nodes: layoutedNodes, edges };
}


function CustomVideoNode({ data }: NodeProps<{ video: VideoType }>) {
  return (
    <div className="p-4 rounded-lg bg-blue-600 shadow-md  text-white border border-gray-300 w-64 h-full flex flex-col justify-center items-center text-center">
      <div className="font-semibold flex items-center gap-2 text-[16px]  mb-1">
        <DestinationVedio /> {data.video.title.substring(0, 20)}...
      </div>
      <div className="text-xs text-gray-500"></div>
      <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />
    </div>
  );
}

function CustomButtonNode({ data }: NodeProps<{ link: VideoLink }>) {
  return (
    <div className="p-4 rounded-lg shadow-sm bg-green-500 text-white border border-green-600 w-64 h-full flex flex-col justify-center items-center text-center">
      <div className="text-[16px] font-semibold">{data.link.label}</div>
      <div className="text-xs text-white opacity-80">
        @ {data.link.timestamp_seconds}s
      </div>
      <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />
    </div>
  );
}

function CustomLinkNode({ data }: NodeProps<{ link: VideoLink }>) {
  const getLinkIcon = () => {
    switch (data.link.link_type) {
      case "url":
        return <ExternalLinkIcon className="w-4 h-4" />;
      case "video":
        return <DestinationVedio className="w-4 h-4" />;
      case "form":
        return <FormInputIcon className="w-4 h-4" />;
      default:
        return <LinkIcon className="w-4 h-4" />;
    }
  };

  const getLinkTypeLabel = () => {
    switch (data.link.link_type) {
      case "url":
        return "External Link";
      case "video":
        return "Video Link";
      case "form":
        return "Form";
      default:
        return "Link";
    }
  };

  return (
    <div className="p-4 rounded-lg shadow-sm bg-white border border-gray-300 text-gray-800 w-72 h-full flex flex-col justify-center items-center text-center">
      <div className="text-[#242B42] font-medium text-[12px] flex items-center gap-1 mb-1">
        {getLinkIcon()} {getLinkTypeLabel()}
      </div>
      <div className="text-[16px] text-[#242B42] font-semibold">
        {data.link.label}
      </div>
      {data.link.link_type === "form" && data.link.form_data && (
        <div className="text-xs text-gray-500 mt-1">
          {/* {data.link.form_data.title} */} Form
        </div>
      )}
      <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />
    </div>
  );
}

function CustomFormNode({ data }: NodeProps<{ link: VideoLink }>) {
  return (
    <div className="p-4 rounded-lg shadow-sm bg-blue-50 border border-blue-200 text-gray-800 w-72 h-full flex flex-col justify-center items-center text-center">
      <div className="text-[#242B42] font-medium text-[12px] flex items-center gap-1 mb-1">
        <FormInputIcon /> Form Submission
      </div>
      <div className="text-[16px] text-[#242B42] font-semibold">
        {/* {data.link.form_data?.title || "Contact Form"} */} Form
      </div>
      <div className="text-xs text-gray-500 mt-1">
        {data.link.form_data?.elements?.length || 0} fields
      </div>
      <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />
    </div>
  );
}

function CustomSolutionNode({ data }: NodeProps<{ solution: Solution }>) {
  return (
    <div className="p-4 rounded-lg bg-[#EBEEF4] shadow-sm border text-gray-800 w-72 h-full flex flex-col justify-center items-center text-center">
      {solutionCategories.map((sol) => {
        if (sol.id === data.solution.category_id) {
          return (
            <div
              key={sol.id}
              className="text-[#242B42] font-semibold text-[16px]"
            >
              {sol.name}
            </div>
          );
        }
      })}
      <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />
    </div>
  );
}
function CustomAfterFormNode({ data }: NodeProps<{ link: VideoLink, destinationTitle?: string }>) {
  return (
    <div className="p-3 rounded-lg shadow-sm bg-orange-100 border border-orange-400 text-orange-800 w-64 flex flex-col justify-center items-center text-center">
      <div className="font-semibold text-[14px]">After Form Submission</div>
      <div className="text-xs opacity-70">Leads to {data.destinationTitle}</div>
      <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />
    </div>
  );
}

const nodeTypes = {
  video: CustomVideoNode,
  button: CustomButtonNode,
  link: CustomLinkNode,
  form: CustomFormNode,
  solution: CustomSolutionNode,
  afterForm: CustomAfterFormNode,
};

interface TreeViewSessionProps {
  sessionId: string;
  videos: VideoType[];
}

export function TreeViewSession({ sessionId, videos }: TreeViewSessionProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [videoLinks, setVideoLinks] = useState<VideoLink[]>([]);
  const [finalSolution, setFinalSolution] = useState<Solution>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch video links for all videos in this session
        const videoIds = videos.map((v) => v.id);

        if (videoIds.length > 0) {
          const { data: linksData, error: linksError } = await supabase
            .from("video_links")
            .select("*")
            .in("video_id", videoIds)
            .order("timestamp_seconds", { ascending: true });

          if (linksError) throw linksError;
          setVideoLinks(linksData || []);
        }

        // Fetch solutions
        const { data: solutionsData, error: solutionsError } = await supabase
          .from("solutions")
          .select("*")
          .eq("session_id", sessionId);

        if (solutionsError) throw solutionsError;
        setFinalSolution(solutionsData[0]);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [sessionId, videos]);

  useEffect(() => {
    if (loading || !videos.length) return;

    const orderedVideos = [...videos].sort(
      (a: any, b: any) => a.order_index - b.order_index
    );
    const createdNodes = new Map<string, Node>();
    const createdEdges: Edge[] = [];

    const xSpacing = 300;
    const ySpacing = 200;
    const mainColumnX = 0;

    // Track terminal nodes
    const terminalNodes: Node[] = [];

    // First pass: Create all video nodes in order
    orderedVideos.forEach((video, index) => {
      const videoNodeId = `video-${video.id}`;
      const videoY = index * ySpacing * 3; // More spacing for videos

      const videoNode: Node = {
        id: videoNodeId,
        type: "video",
        position: { x: mainColumnX, y: videoY },
        data: { video },
      };
      createdNodes.set(videoNodeId, videoNode);

      // Get links for this video
      const videoLinksForThisVideo = videoLinks.filter(
        (link) => link.video_id === video.id
      );

      // Check if this video has a destination video (direct video-to-video connection)
      if (video.destination_video_id) {
        const destVideoNodeId = `video-${video.destination_video_id}`;

        // Create edge from current video to destination video
        createdEdges.push({
          id: `edge-direct-${videoNodeId}-to-${destVideoNodeId}`,
          source: videoNodeId,
          target: destVideoNodeId,
          markerEnd: { type: MarkerType.ArrowClosed },
          style: { strokeWidth: 3, stroke: "#F59E0B", strokeDasharray: "5,5" }, // orange
          label: "Auto-play",
          labelStyle: { fill: "#3B82F6", fontWeight: "bold" },
        });
      }

      if (videoLinksForThisVideo.length === 0) {
        // Video with no links is terminal
        terminalNodes.push(videoNode);
        return;
      }

      const buttonStartX = mainColumnX + xSpacing;
      const buttonY = videoY;

      videoLinksForThisVideo.forEach((link, linkIndex) => {
        // Create button node (intermediate layer)
        const buttonNodeId = `button-${link.id}`;
        const buttonX = buttonStartX + linkIndex * xSpacing;

        const buttonNode: Node = {
          id: buttonNodeId,
          type: "button",
          position: { x: buttonX, y: buttonY },
          data: { link },
        };
        createdNodes.set(buttonNodeId, buttonNode);

        // Create edge from video to button
        createdEdges.push({
          id: `edge-${videoNodeId}-to-${buttonNodeId}`,
          source: videoNodeId,
          target: buttonNodeId,
          markerEnd: { type: MarkerType.ArrowClosed },
          style: { strokeWidth: 2, stroke: "#F59E0B", strokeDasharray: "5,5" }, // orange
        });

        // Create destination node based on link type
        const destinationX = buttonX;
        const destinationY = buttonY + ySpacing;

        if (link.link_type === "url") {
          // Create URL link node
          const linkNodeId = `link-${link.id}`;
          const linkNode: Node = {
            id: linkNodeId,
            type: "link",
            position: { x: destinationX, y: destinationY },
            data: { link },
          };
          createdNodes.set(linkNodeId, linkNode);

          // Create edge from button to link
          createdEdges.push({
            id: `edge-${buttonNodeId}-to-${linkNodeId}`,
            source: buttonNodeId,
            target: linkNodeId,
            markerEnd: { type: MarkerType.ArrowClosed },
            style: { strokeWidth: 2, stroke: "#10B981" },
          });

          // URL links are terminal
          terminalNodes.push(linkNode);
        } else if (link.link_type === "form") {
          // Create form node
          const formNodeId = `form-${link.id}`;
          const formNode: Node = {
            id: formNodeId,
            type: "form",
            position: { x: destinationX, y: destinationY },
            data: { link },
          };
          createdNodes.set(formNodeId, formNode);

          // Create edge from button to form
          createdEdges.push({
            id: `edge-${buttonNodeId}-to-${formNodeId}`,
            source: buttonNodeId,
            target: formNodeId,
            markerEnd: { type: MarkerType.ArrowClosed },
            style: { strokeWidth: 2, stroke: "#4F46E5" },
          });

          if (link.destination_video_id) {
            const destVideo = videos?.find(
              (v) => v.id === link.destination_video_id
            );

            const afterFormNodeId = `afterForm-${link.id}`;
            const afterFormNode: Node = {
              id: afterFormNodeId,
              type: "afterForm",
              position: { x: destinationX, y: destinationY + ySpacing },
              data: { link, destinationTitle: destVideo?.title },
            };
            createdNodes.set(afterFormNodeId, afterFormNode);

            // Edge from form → afterForm
            createdEdges.push({
              id: `edge-${formNodeId}-to-${afterFormNodeId}`,
              source: formNodeId,
              target: afterFormNodeId,
              markerEnd: { type: MarkerType.ArrowClosed },
              style: { strokeWidth: 2, stroke: "#F59E0B" }, // orange
              label: "After Submit",
              labelStyle: { fill: "#F59E0B", fontWeight: "bold" },
            }); 

            // Edge from afterForm → destination video
            const destVideoNodeId = `video-${link.destination_video_id}`;
            createdEdges.push({
              id: `edge-${afterFormNodeId}-to-${destVideoNodeId}`,
              source: afterFormNodeId,
              target: destVideoNodeId,
              markerEnd: { type: MarkerType.ArrowClosed },
              style: { strokeWidth: 2, stroke: "#F59E0B" }, // orange
            });
          } else {
            // Form is terminal
            terminalNodes.push(formNode);
          }
        } else if (link.link_type === "video" && link.destination_video_id) {
          // Video links connect to destination videos
          const destVideoNodeId = `video-${link.destination_video_id}`;
          const destVideoNode = createdNodes.get(destVideoNodeId);

          if (destVideoNode) {
            // Create curved edge from button to destination video
            createdEdges.push({
              id: `edge-${buttonNodeId}-to-${destVideoNodeId}`,
              source: buttonNodeId,
              target: destVideoNodeId,
              markerEnd: { type: MarkerType.ArrowClosed },
              style: {
                strokeWidth: 2,
                stroke: "#10B981",
                strokeDasharray: "5,5",
              },
              label: "Video Link",
              labelStyle: { fill: "#10B981", fontWeight: "bold" },
            });
          } else {
            terminalNodes.push(buttonNode);
          }
        } else {
          // Unknown link type or no destination
          terminalNodes.push(buttonNode);
        }
      });
    });

    // Add solution node and connect terminal nodes to it
    if (finalSolution && finalSolution.id && terminalNodes.length > 0) {
      const solutionNodeId = `solution-${finalSolution.id}`;

      // Find the maximum Y position to place solution node below everything
      const maxY = Math.max(
        ...Array.from(createdNodes.values()).map((n) => n.position.y),
        ySpacing * 3
      );

      // Create the solution node
      const solutionNode: Node = {
        id: solutionNodeId,
        type: "solution",
        position: { x: mainColumnX, y: maxY + ySpacing * 2 },
        data: { solution: finalSolution },
      };
      createdNodes.set(solutionNodeId, solutionNode);

      // Connect each terminal node to the solution node
      terminalNodes.forEach((terminalNode, index) => {
        createdEdges.push({
          id: `edge-${terminalNode.id}-to-${solutionNodeId}-${index}`,
          source: terminalNode.id,
          target: solutionNodeId,
          markerEnd: { type: MarkerType.ArrowClosed },
          style: {
            strokeWidth: 2,
            stroke: "#8B5CF6",
            strokeDasharray: "5,5",
          },
          label: "Solution",
          labelStyle: { fill: "#8B5CF6", fontWeight: "bold" },
        });
      });
    }
     const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
      Array.from(createdNodes.values()),
      createdEdges,
      "TB" // top-to-bottom layout
    );

    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
  }, [loading, videos, videoLinks, finalSolution]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  if (loading) {
    return (
      <div className="text-center py-8">
        <Loader size="md" />
      </div>
    );
  }

  return (
    <div style={{ height: "100vh", width: "100%" }}>
      <div className="p-4 border-b mb-2 text-white flex items-center gap-6 justify-center">
        <div className="bg-blue-600 px-8 py-2"> Clips </div>
        <div className="bg-green-600 px-8 py-2"> Buttons </div>
        {/* <div className="bg-gray-700 px-8 py-2"> Functions / Links </div> */}
        <div className="bg-orange-500 px-8 py-2"> Destination Videos </div>
      </div>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.5 }}
        defaultEdgeOptions={{
          style: {
            strokeWidth: 3,
            stroke: "#CDD5DD",
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
