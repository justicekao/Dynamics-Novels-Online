import type { Metadata } from "next";
import "./globals.css";
import { Nav } from "@/components/nav";

export const metadata: Metadata = {
  title: "Dynamics Novels Online",
  description: "Build and play interconnected text-RPG worlds, together.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-slate-950 text-slate-100">
        <Nav />
        <main className="flex-1">{children}</main>
        <footer className="border-t border-slate-800 py-6 text-center text-xs text-slate-500">
          Dynamics Novels Online
        </footer>
      </body>
    </html>
  );
}
