import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";
import { GridBackground } from "@/components/grid-background";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "IronForge | Enterprise Job Queue Dashboard",
  description: "High-performance distributed job queue management for modern enterprises",
  keywords: ["job queue", "distributed systems", "enterprise", "ironforge"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-sans antialiased min-h-screen`}>
        <GridBackground />
        <Sidebar />
        <Header />
        <main className="ml-72 pt-20">
          <div className="p-8">{children}</div>
        </main>
      </body>
    </html>
  );
}
