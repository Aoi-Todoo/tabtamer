import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TabTamer | Keep research within reach",
  description:
    "A calmer way to save and find the links behind your classes, projects, and ideas.",
  applicationName: "TabTamer",
  openGraph: {
    title: "TabTamer | Find the link you saved",
    description:
      "A thoughtful home for the pages behind your classes, projects, and ideas.",
    type: "website",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
