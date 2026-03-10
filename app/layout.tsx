
import "./globals.css";
import type { ReactNode } from "react";

export const metadata = {
  title: "Hair Diary",
  description: "Simple appointment planner for Stewart and Sue"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-100 min-h-screen">{children}</body>
    </html>
  );
}
