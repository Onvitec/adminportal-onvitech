import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { session_id, watch_time } = body;

    const { error } = await supabase
      .from("watch_time")
      .insert([{ session_id, watch_time }]);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("❌ Failed to save lead:", err);
    return NextResponse.json({ success: false, error: err.message });
  }
}
