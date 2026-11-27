import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "ClipForge — Find the moments worth keeping",
    template: "%s · ClipForge",
  },
  description: "A local-first AI clipping studio for finding moments, styling captions, reframing footage, and exporting vertical videos.",
  applicationName: "ClipForge",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  openGraph: {
    title: "ClipForge — Find the moments worth keeping",
    description: "Turn long-form footage into reviewed short-form edits with a local-first AI workflow.",
    type: "website",
    images: [{ url: "/clipforge-identity.jpg", width: 256, height: 455, alt: "ClipForge glowing one-eyed starburst artwork" }],
  },
  icons: { icon: "/clipforge-identity.jpg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
