import { type EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Receiving end for magic links minted by the staff app via
 * `auth.admin.generateLink()`. The link points here with
 * `?token_hash=…&type=…&next=…`; we verify it server-side (which sets the
 * session cookies) and then land the user in the app.
 *
 * This uses the token-hash / verifyOtp flow deliberately: unlike the PKCE
 * `?code=` flow (see ./callback), it is NOT bound to the browser that started
 * the login, so a link generated in the staff app authenticates a participant
 * session wherever it is opened — staff impersonating a participant, or the
 * participant clicking it themselves.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = safeNext(searchParams.get("next"));

  if (token_hash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash });
    if (!error) return NextResponse.redirect(new URL(next, request.url));
  }

  return NextResponse.redirect(new URL("/login?error=link", request.url));
}

// Only allow internal, single-slash paths — never an open redirect to another
// origin (a protocol-relative "//host" or absolute URL is rejected).
function safeNext(raw: string | null): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return "/";
  return raw;
}
