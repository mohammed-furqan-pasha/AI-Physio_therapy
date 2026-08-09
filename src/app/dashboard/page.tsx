import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { HeroSection } from "@/components/dashboard/hero-section";
import { HowItWorks } from "@/components/dashboard/how-it-works";
import { NavCards } from "@/components/dashboard/nav-cards";
import { QuickStatsTeaser } from "@/components/dashboard/quick-stats-teaser";
import { Button } from "@/components/ui/button";
import { FileText, UserCircle } from "lucide-react";
import { SignOutButton } from "@/components/dashboard/sign-out-button";

export default async function DashboardPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <main className="flex min-h-screen flex-col items-center gap-10 p-6 py-16">
      <header className="flex w-full max-w-3xl items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">AI Physiotherapy</h1>
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </div>
        <SignOutButton />
      </header>

      <HeroSection />

      <NavCards />

      <HowItWorks />

      <QuickStatsTeaser />

      <div className="flex gap-3">
        <Button variant="outline" asChild>
          <Link href="/report">
            <FileText className="mr-2 h-4 w-4" />
            Upload Medical Report
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/profile">
            <UserCircle className="mr-2 h-4 w-4" />
            My Profile
          </Link>
        </Button>
      </div>
    </main>
  );
}
