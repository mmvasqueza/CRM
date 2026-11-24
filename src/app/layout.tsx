import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CRM — Digital System Pros",
  description: "Lead inbox for the Digital System Pros team.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
