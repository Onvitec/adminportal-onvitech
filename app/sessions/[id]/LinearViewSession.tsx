'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Module } from '@/lib/types';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function LinearSessionView({ sessionId }: { sessionId: string }) {
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchModules = async () => {
      try {
        const { data: modulesData, error: modulesError } = await supabase
          .from("modules")
          .select("*")
          .eq("session_id", sessionId)
          .order("order_index", { ascending: true });

        if (modulesError) throw modulesError;

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
        console.error("Error fetching modules:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchModules();
  }, [sessionId]);

  if (loading) {
    return <div>Loading linear session...</div>;
  }

  return (
    <div className="space-y-4">
      {modules.map((module) => (
        <ModuleCard key={module.id} module={module} />
      ))}
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
            <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {module.videos.map((video) => (
                <li
                  key={video.id}
                  className="bg-white rounded-lg overflow-hidden shadow-sm border"
                >
                  <video
                    src={video.url}
                    controls
                    className="w-full aspect-video object-cover"
                  />
                  <div className="p-3">
                    <h4 className="text-sm font-medium">{video.title}</h4>
                  </div>
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