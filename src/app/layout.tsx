import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/layout/Sidebar";

export const metadata: Metadata = {
  title: "SessionOps Studio",
  description: "Voice assistant management platform — MiiHealth",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="h-full flex" style={{ background: "#ffffff" }}>
        <Sidebar />
        <main className="flex-1 overflow-y-auto min-h-screen">
          {children}
        </main>
      </body>
    </html>
  );
}
