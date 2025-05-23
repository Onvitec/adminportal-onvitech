"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Film,
  Video,
  FileEdit,
  Trash2,
  PlusCircle,
  AlertCircle,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";

type Session = {
  id: string;
  title: string;
  type: string;
  created_at: string;
  module_count?: number;
  video_count?: number;
};

export default function SessionsList() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      // const { data: { user } } = await supabase.auth.getUser();
      // if (!user) throw new Error('Not authenticated');

      // Fetch sessions
      const { data: sessionsData, error } = await supabase
        .from("sessions")
        .select("id, title, session_type, created_at")
        .eq("created_by", "826e31ef-0431-4762-af43-c501e3898cc3")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // For each session, get stats
      const sessionsWithStats = await Promise.all(
        (sessionsData || []).map(async (session) => {
          // For linear sessions, count modules
          if (session.session_type === "linear") {
            const { count: moduleCount } = await supabase
              .from("modules")
              .select("id", { count: "exact", head: true })
              .eq("session_id", session.id);

            const { count: videoCount } = await supabase
              .from("videos")
              .select("id", { count: "exact", head: true })
              .eq("session_id", session.id);

            return {
              ...session,
              module_count: moduleCount || 0,
              video_count: videoCount || 0,
            };
          } else {
            // For interactive sessions, count videos
            const { count: videoCount } = await supabase
              .from("videos")
              .select("id", { count: "exact", head: true })
              .eq("session_id", session.id);

            return {
              ...session,
              video_count: videoCount || 0,
            };
          }
        })
      );

      setSessions(sessionsWithStats);
    } catch (error) {
      console.error("Error fetching sessions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (sessionId: string) => {
    try {
      const { error } = await supabase
        .from("sessions")
        .delete()
        .eq("id", sessionId);

      if (error) throw error;

      // Refresh sessions list
      fetchSessions();
    } catch (error) {
      console.error("Error deleting session:", error);
      alert("Failed to delete session");
    } finally {
      setSessionToDelete(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <div className="animate-pulse text-muted-foreground">
          Loading sessions...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {sessions.length === 0 ? (
        <div className="text-center py-12 bg-muted/30 rounded-lg border border-dashed">
          <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No sessions found</h3>
          <p className="text-muted-foreground mb-6">
            You haven't created any learning sessions yet.
          </p>
          <Link href="/sessions/create">
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Your First Session
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sessions.map((session) => (
            <Card
              key={session.id}
              className="overflow-hidden transition-all hover:shadow-md"
            >
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <Badge
                      variant={
                        session.type === "linear" ? "secondary" : "outline"
                      }
                      className="mb-2"
                    >
                      {session.type === "linear" ? "Linear" : "Interactive"}
                    </Badge>
                    <CardTitle className="text-xl">{session.title}</CardTitle>
                    <CardDescription>
                      Created on{" "}
                      {new Date(session.created_at).toLocaleDateString()}
                    </CardDescription>
                  </div>
                  {session.type === "linear" ? (
                    <Film className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <Video className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-x-6 text-sm mt-2">
                  {session.type === "linear" && (
                    <div className="text-muted-foreground">
                      <span className="font-medium">
                        {session.module_count}
                      </span>{" "}
                      modules
                    </div>
                  )}
                  <div className="text-muted-foreground">
                    <span className="font-medium">{session.video_count}</span>{" "}
                    videos
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between border-t bg-muted/30 p-2">
                <Link href={`/sessions/${session.id}`}>
                  <Button variant="ghost" size="sm">
                    <FileEdit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                </Link>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete the session "{session.title}
                        " and all its associated data. This action cannot be
                        undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDelete(session.id)}
                        className="bg-destructive text-destructive-foreground"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
