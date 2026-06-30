import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://playhoodwinked.com"),
  title: "Hoodwinked",
  description: "Fool the room. Win the night.",
  applicationName: "Hoodwinked",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/pwa-icon-512.png", sizes: "512x512", type: "image/png" },
      { url: "/favicon.ico", sizes: "any" }
    ],
    shortcut: ["/favicon-32x32.png"],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }]
  },
  openGraph: {
    title: "Hoodwinked",
    description: "Fool the room. Win the night.",
    siteName: "Hoodwinked",
    images: [{ url: "/hwlogo.png", width: 752, height: 752, alt: "Hoodwinked game logo" }]
  },
  twitter: {
    card: "summary",
    title: "Hoodwinked",
    description: "Fool the room. Win the night.",
    images: ["/hwlogo.png"]
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Hoodwinked"
  },
  formatDetection: {
    telephone: false
  }
};

export const viewport: Viewport = {
  themeColor: "#1f3320",
  viewportFit: "cover",
  width: "device-width",
  initialScale: 1
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
