import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ReportUpload } from "@/components/report/report-upload";

export default function ReportPage() {
  return (
    <main className="flex min-h-screen flex-col items-center gap-6 p-6 py-10">
      <div className="flex w-full max-w-xl items-center justify-start">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Dashboard
          </Link>
        </Button>
      </div>

      <ReportUpload />
    </main>
  );
}
