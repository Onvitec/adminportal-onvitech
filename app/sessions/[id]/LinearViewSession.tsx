"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Module, Solution, SolutionCategory } from "@/lib/types";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SolutionCard } from "@/components/SolutionCard";

export function LinearSessionView({ sessionId }: { sessionId: string }) {
  const [modules, setModules] = useState<Module[]>([]);
  const [solutions, setSolutions] = useState<Solution[]>([]);
  const [solutionCategories, setSolutionCategories] = useState<SolutionCategory[]>([]);
  const [solutionsExpanded, setSolutionsExpanded] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch modules and videos
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

        // Fetch solutions and categories
        const { data: solutionsData, error: solutionsError } = await supabase
          .from("solutions")
          .select("*")
          .eq("session_id", sessionId);

        if (solutionsError) throw solutionsError;

        const { data: categoriesData, error: categoriesError } = await supabase
          .from("solution_categories")
          .select("*");

        if (categoriesError) throw categoriesError;

        setModules(modulesWithVideos);
        setSolutions(solutionsData || []);
        setSolutionCategories(categoriesData || []);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [sessionId]);

  if (loading) {
    return <div>Loading session data...</div>;
  }

  return (
    <div className="space-y-4 w-full">
      {/* Modules Section */}
      <div className="space-y-4">
        {modules.map((module) => (
          <ModuleCard key={module.id} module={module} />
        ))}
      </div>
      
      {/* Solutions Section */}
      <div className="border rounded-lg overflow-hidden">
        <div className="flex items-center justify-between py-4 px-4 bg-white">
          <h2 className="text-xl font-bold">Solution Type</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSolutionsExpanded(!solutionsExpanded)}
          >
            {solutionsExpanded ? (
              <ChevronUp className="h-5 w-5" />
            ) : (
              <ChevronDown className="h-5 w-5" />
            )}
          </Button>
        </div>

        {solutionsExpanded && (
          <div className="bg-gray-50 py-4 border-t">
            {solutions.length > 0 ? (
              <div className="grid grid-cols-1 gap-4">
                {solutions.map((solution) => (
                  <SolutionCard
                    key={solution.id}
                    solution={solution}
                    readOnly={true}
                  />
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">
                No solutions added
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ModuleCard({ module }: { module: Module }) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="flex items-center justify-between py-4 px-4 bg-white">
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