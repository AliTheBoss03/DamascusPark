import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mawqif | موقف – Damascus Smart Parking",
  description:
    "Digital parking management platform for Damascus, Syria — inflation-pegged zones, warden enforcement, and real-time revenue for the municipality.",
  keywords: ["Damascus", "parking", "Syria", "smart city", "municipal"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" dir="ltr" className="dark">
      <body className="min-h-screen bg-slate-950 text-slate-100 antialiased">
        {children}
      </body>
    </html>
  );
}
