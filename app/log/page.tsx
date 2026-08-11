import { redirect } from "next/navigation";
import { getSessionProfile } from "@/lib/session";
import { STAFF_APP_URL } from "@/lib/constants";
import TopBar from "@/components/TopBar";
import Footer from "@/components/Footer";
import LogForm from "@/components/LogForm";
import { SectionTitle } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function LogPage() {
  const profile = await getSessionProfile();
  if (!profile) redirect("/login");
  if (profile.role !== "participant") redirect(STAFF_APP_URL);

  return (
    <>
      <TopBar displayName={profile.display_name} role={profile.role} />
      <main className="mx-auto max-w-2xl px-4 py-6">
        <SectionTitle>Log an activity</SectionTitle>
        <p className="mb-4 -mt-2 text-sm text-[var(--on-dark-soft)]">
          Did something that isn&apos;t a quest yet? Log it here so it still
          counts.
        </p>
        <LogForm />
      </main>
      <Footer />
    </>
  );
}
