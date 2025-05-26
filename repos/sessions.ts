import { supabase } from "@/lib/supabase";
import { SessionType } from "@/lib/types";

export const fetchSessions = async () => {
  try {
    // const { data: { user } } = await supabase.auth.getUser();
    // if (!user) throw new Error('Not authenticated');

    // Fetch sessions
    const { data: sessionsData, error } = await supabase
      .from("sessions")
      .select("*")
      // .eq("created_by", "826e31ef-0431-4762-af43-c501e3898cc3")
      .order("created_at", { ascending: false });

    if (error) throw error;

    // For each session, get stats
    // Uncomment this when you need video count or stuff
    // const sessionsWithStats = await Promise.all(
    //   (sessionsData || []).map(async (session) => {
    //     // For linear sessions, count modules
    //     if (session.session_type === "linear") {
    //       const { count: moduleCount } = await supabase
    //         .from("modules")
    //         .select("id", { count: "exact", head: true })
    //         .eq("session_id", session.id);

    //       const { count: videoCount } = await supabase
    //         .from("videos")
    //         .select("id", { count: "exact", head: true })
    //         .eq("session_id", session.id);

    //       return {
    //         ...session,
    //         module_count: moduleCount || 0,
    //         video_count: videoCount || 0,
    //       };
    //     } else {
    //       // For interactive sessions, count videos
    //       const { count: videoCount } = await supabase
    //         .from("videos")
    //         .select("id", { count: "exact", head: true })
    //         .eq("session_id", session.id);

    //       return {
    //         ...session,
    //         video_count: videoCount || 0,
    //       };
    //     }
    //   })
    // );

    return sessionsData as SessionType[];
  } catch (error) {
    console.error("Error fetching sessions:", error);
  }
};
