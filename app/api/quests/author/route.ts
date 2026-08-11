import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { authorQuest } from "@/lib/ai/jobs";

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorised" }, { status: 401 });

  const { data: me } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (me?.role !== "staff" && me?.role !== "admin") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const { idea } = await req.json().catch(() => ({}));
  if (!idea || typeof idea !== "string") {
    return NextResponse.json({ error: "idea required" }, { status: 400 });
  }

  const { draft, source } = await authorQuest(idea);
  return NextResponse.json({ draft, source });
}
