import type { Metadata } from "next";
import { Poppins, Instrument_Serif } from "next/font/google";
import "./globals.css";
import Footer from "@/components/Footer";
import AppGradient from "@/components/AppGradient";
import CapacitorSessionRestore from "@/components/CapacitorSessionRestore";
import OneSignalInit from "@/components/OneSignalInit";
import OneSignalWebInit from "@/components/OneSignalWebInit";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
});

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: "italic",
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: "Danceitude",
  description: "Book privattimer enkelt og raskt – for danseklubben din.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Danceitude",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/icons/apple-touch-icon.png",
  },
};

export const viewport = {
  viewportFit: "cover",
  themeColor: "#3A3A3A",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="nb" className={`${poppins.variable} ${instrumentSerif.variable} h-full antialiased`} style={{ background: "#3A3A3A" }}>
      <body className="min-h-full flex flex-col font-[family-name:var(--font-poppins)] bg-[#3A3A3A]">
        <CapacitorSessionRestore />
        <OneSignalInit />
        <OneSignalWebInit />
        <div className="app-shell relative isolate flex-1 flex flex-col bg-gray-50 dark:bg-gray-950">
          <AppGradient />
          {children}
        </div>
        <Footer />
      </body>
    </html>
  );
}
