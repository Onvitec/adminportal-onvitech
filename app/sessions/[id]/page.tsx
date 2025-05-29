"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { SessionType } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { LinearSessionView } from "./LinearViewSession";
import { InteractiveSessionView } from "./InteractiveViewSesion";
import  SelectionSessionView  from "./SelectionView";

export default function SessionViewPage() {
  const { id } = useParams();
  const router = useRouter();
  const [session, setSession] = useState<SessionType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchSession();
    }
  }, [id]);

  const fetchSession = async () => {
    setLoading(true);
    try {
      const { data: sessionData, error: sessionError } = await supabase
        .from("sessions")
        .select("*")
        .eq("id", id)
        .single();

      if (sessionError || !sessionData) {
        throw sessionError || new Error("Session not found");
      }

      setSession(sessionData);
    } catch (error) {
      console.error("Error fetching session:", error);
      router.push("/sessions");
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
        <div className="text-center py-12">
          <h3 className="text-lg font-medium mb-2">Session not found</h3>
          <Button onClick={() => router.push("/sessions")} className="mt-4">
            Back to Sessions
          </Button>
        </div>
      </div>
    );
  }

  const renderSessionContent = () => {
    switch (session.session_type) {
      case "linear":
        return <LinearSessionView sessionId={session.id} />;
      case "interactive":
        return <InteractiveSessionView sessionId={session.id} />;
      case "selection":
        return <SelectionSessionView sessionId={session.id} />;
      default:
        return <div>Unknown session type</div>;
    }
  };

  return (
    <div className="container py-8">
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-lg">
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
              <p className="text-base font-medium capitalize">
                {session.session_type}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">User ID</h3>
              <p className="text-base font-medium">{session.created_by}</p>
            </div>
          </div>

          {/* Content Section */}
          {renderSessionContent()}

          {/* Action Buttons */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => router.push("/sessions")}>
              Back
            </Button>
            <Button onClick={() => router.push(`/sessions/edit/${id}`)}>
              Edit Session
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
