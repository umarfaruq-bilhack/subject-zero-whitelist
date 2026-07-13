import type { Metadata } from "next";
import "./globals.css";
import { getSiteConfig } from "@/lib/config";

export async function generateMetadata(): Promise<Metadata> {
  const config = await getSiteConfig();
  return {
    title: `${config.projectName} — Whitelist Application`,
    description: `Complete the infection protocol to apply for ${config.projectName} whitelist, live on Robinhood Chain.`,
  };
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-void bg-scanlines min-h-screen">{children}</body>
    </html>
  );
}
