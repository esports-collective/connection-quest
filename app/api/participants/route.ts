import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

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

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json(
      {
        error:
          "Account creation isn't configured yet. Ask an admin to add the SUPABASE_SERVICE_ROLE_KEY environment variable.",
      },
      { status: 503 },
    );
  }

  const body = await req.json().catch(() => ({}));
  const displayName = (body.displayName ?? "").trim();
  const email = (body.email ?? "").trim().toLowerCase();
  const password = body.password ?? "";
  const astaltyId = (body.astaltyId ?? "").trim() || null;
  const interests: string[] = Array.isArray(body.interests)
    ? body.interests
    : String(body.interests ?? "")
        .split(",")
        .map((s: string) => s.trim())
        .filter(Boolean);

  if (!displayName || !email || password.length < 6) {
    return NextResponse.json(
      { error: "Name, email and a password of 6+ characters are required." },
      { status: 400 },
    );
  }

  // Create the auth user. The handle_new_user trigger creates the profile as a
  // participant (role can't be set from here — enforced in the DB).
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { display_name: displayName },
  });
  if (createErr || !created.user) {
    return NextResponse.json(
      { error: createErr?.message ?? "Could not create the account." },
      { status: 400 },
    );
  }

  // Enrich the profile (minimal PII: display name + optional Astalty id + interests).
  await admin
    .from("profiles")
    .update({ astalty_id: astaltyId, interests })
    .eq("id", created.user.id);

  return NextResponse.json({ ok: true, id: created.user.id });
}
