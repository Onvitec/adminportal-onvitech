import { supabase } from "@/lib/supabase";
import { SessionType } from "@/lib/types";
export const fetchSessions = async () => {
  try {
    const { data, error } = await supabase
      .from("sessions")
      .select(
        `
        *,
        users:associated_with(first_name),
        watch_time:watch_time(session_id, watch_time)
      `
      )
      .order("created_at", { ascending: false });

    if (error) throw error;

    // Compute average watch time for each session
    const sessionsWithAverages = data.map((session: any) => {
      const watchEntries = session.watch_time || [];
      const avgWatchTime =
        watchEntries.length > 0
          ? watchEntries.reduce(
              (acc: number, w: any) => acc + w.watch_time,
              0
            ) / watchEntries.length
          : 0;

      console.log("SESSION", session);
      return {
        ...session,
        company_name: session.users?.first_name || "—",
        avg_watch_time: avgWatchTime,
      };
    });

    return sessionsWithAverages as SessionType[];
  } catch (error) {
    console.error("Error fetching sessions:", error);
    return [];
  }
};
