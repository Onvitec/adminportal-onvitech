"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Session = {
  id: string;
  title: string;
  session_type: string;
  created_by: string;
  created_at: string;
};

type Module = {
  id: string;
  title: string;
  session_id: string;
  order_index: number;
  videos: Video[];
};

type Video = {
  id: string;
  title: string;
  url: string;
  module_id: string;
  session_id: string;
  order_index: number;
  is_interactive: boolean;
  progress?: string; // You might want to add this field to your database
};

export default function SessionViewPage() {
  const { id } = useParams();
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchSessionData();
    }
  }, [id]);

  const fetchSessionData = async () => {
    setLoading(true);
    try {
      // Fetch session details
      const { data: sessionData, error: sessionError } = await supabase
        .from("sessions")
        .select("*")
        .eq("id", id)
        .single();

      if (sessionError || !sessionData) {
        throw sessionError || new Error("Session not found");
      }

      setSession(sessionData);

      // Fetch modules with their videos
      const { data: modulesData, error: modulesError } = await supabase
        .from("modules")
        .select("*")
        .eq("session_id", id)
        .order("order_index", { ascending: true });

      if (modulesError) throw modulesError;

      // For each module, fetch its videos
      const modulesWithVideos = await Promise.all(
        (modulesData || []).map(async (module) => {
          const { data: videosData, error: videosError } = await supabase
            .from("videos")
            .select("*")
            .eq("module_id", module.id)
            .order("order_index", { ascending: true });

          if (videosError) throw videosError;

          return {
            ...module,
            videos: videosData || [],
          };
        })
      );

      setModules(modulesWithVideos);
    } catch (error) {
      console.error("Error fetching session data:", error);
      router.push("/sessions"); // Redirect if session not found
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8 max-w-4xl">
        <div className="flex justify-center items-center min-h-[300px]">
          <div className="animate-pulse text-muted-foreground">
            Loading session details...
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="container mx-auto py-8 max-w-4xl">
        <div className="text-center py-12 ">
          <h3 className="text-lg font-medium mb-2">Session not found</h3>
          <Button onClick={() => router.push("/sessions")} className="mt-4">
            Back to Sessions
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <Card className="border-none shadow-none px-4">
        <CardHeader className="px-0">
          <CardTitle className="text-2xl font-semibold">
            Session details
          </CardTitle>
          <p className="text-sm text-gray-600">
            Below are the details of the session you have added.
          </p>
        </CardHeader>

        <CardContent className="px-0 space-y-6">
          {/* Session Info Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4  rounded-lg">
            <div>
              <h3 className="text-sm font-medium text-gray-500">
                Session Name
              </h3>
              <p className="text-base font-medium">{session.title}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">
                Session Type
              </h3>
              <p className="text-base font-medium">
                {session.session_type === "linear" ? "Linear Flow" : "Interactive"}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">User ID</h3>
              <p className="text-base font-medium">{session.created_by}</p>
            </div>
          </div>

          {/* Modules Section */}
          <div className="space-y-4">
            {modules.map((module) => (
              <ModuleCard key={module.id} module={module} />
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => router.push("/sessions")}>
              Back
            </Button>
            <Button onClick={() => router.push(`/sessions/${id}/edit`)}>
              Edit Session
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ModuleCard({ module }: { module: Module }) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="flex items-center justify-between p-4 bg-white">
        <h3 className="text-lg font-medium">{module.title}</h3>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? (
            <ChevronUp className="h-5 w-5" />
          ) : (
            <ChevronDown className="h-5 w-5" />
          )}
        </Button>
      </div>

      {isExpanded && (
        <div className="bg-gray-50 p-4 border-t">
          {module.videos.length > 0 ? (
            <ul className="space-y-3">
              {module.videos.map((video) => (
                <li
                  key={video.id}
                  className="flex justify-between items-center p-3 bg-white rounded"
                >
                  <span className="font-medium">{video.title}</span>
                  {video.progress && (
                    <span className="text-sm text-gray-500">
                      {video.progress}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500 text-center py-4">
              No videos added
            </p>
          )}
        </div>
      )}
    </div>
  );
}