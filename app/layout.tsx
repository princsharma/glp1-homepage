import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const teachers = localFont({
  src: [
    {
      path: "./fonts/Teachers-Latin-Roman.woff2",
      weight: "400 800",
      style: "normal",
    },
    {
      path: "./fonts/Teachers-Latin-Italic.woff2",
      weight: "400 800",
      style: "italic",
    },
  ],
  display: "swap",
  variable: "--font-teachers",
  fallback: ["Helvetica Neue", "Arial", "sans-serif"],
});

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
    <html lang="en" className={teachers.variable}>
      <body>{children}</body>
    </html>
  );
}
