import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GLP-1 Weight Loss Program",
  description: "Doctor-led GLP-1 weight loss plans built around you.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
