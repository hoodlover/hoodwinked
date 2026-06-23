import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Hoodwinked",
  description: "Fool the room. Win the night.",
  applicationName: "Hoodwinked"
};

export const viewport: Viewport = {
  themeColor: "#1f3320"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
