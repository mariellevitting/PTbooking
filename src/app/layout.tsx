import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import Footer from "@/components/Footer";
import CapacitorSessionRestore from "@/components/CapacitorSessionRestore";
import OneSignalInit from "@/components/OneSignalInit";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
});

export const metadata: Metadata = {
  title: "Danceitude",
  description: "Book privattimer enkelt og raskt – for danseklubben din.",
};

export const viewport = {
  viewportFit: "cover",
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
        {children}
        <Footer />
      </body>
    </html>
  );
}
