import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import Footer from "@/components/Footer";
import CapacitorSessionRestore from "@/components/CapacitorSessionRestore";
import OneSignalInit from "@/components/OneSignalInit";
import OneSignalWebInit from "@/components/OneSignalWebInit";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
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
    <html lang="nb" className={`${poppins.variable} h-full antialiased`} style={{ background: "#3A3A3A" }}>
      <body className="min-h-full flex flex-col font-[family-name:var(--font-poppins)] bg-[#3A3A3A]">
        <CapacitorSessionRestore />
        <OneSignalInit />
        <OneSignalWebInit />
        {children}
        <Footer />
      </body>
    </html>
  );
}
