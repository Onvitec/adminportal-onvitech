import { sessionTypes } from "@/lib/types";
import LinearSessionForm from "./LinearPageEdit";
import InteractiveEditPage from "../InteractivePageEdit";
import { supabase } from "@/lib/supabase";

async function HelloEdit({ params }: { params: any }) {
  const { sessionId } = params;

  if (!sessionId) return <div>No session ID provided</div>;
  if(supabase){

  const { data, error } = await supabase
    .from("sessions")
    .select("*")
    .eq("id", sessionId)
    .single();

  if (error || !data) {
    console.error("Supabase fetch error:", error);
    return <div>Session not found or error occurred.</div>;
  }

  if (data.session_type === sessionTypes.LINEAR_FLOW) {
    return <LinearSessionForm />;
  } else if (data.session_type === sessionTypes.INTERACTIVE) {
    return <InteractiveEditPage sessionId={data.id} />;
  }
  }

  return <div>Unknown session type</div>;
}

export default HelloEdit;
