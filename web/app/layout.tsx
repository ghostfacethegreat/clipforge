import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Clipforge — Auto clip maker",
  description: "Turn long videos into ranked, captioned vertical clips with local AI.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
