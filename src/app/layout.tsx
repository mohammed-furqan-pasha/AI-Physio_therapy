import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { BackgroundLayer } from "@/components/layout/background-layer";


export const metadata: Metadata = {
  title: "AI Physio",
  description: "AI-powered physiotherapy exercise tracking",
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#2563eb",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background text-foreground antialiased">
        <BackgroundLayer />
        {children}
        <Toaster />
      </body>
    </html>
  );
}
