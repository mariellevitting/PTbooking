import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import "./globals.css";
import Footer from "@/components/Footer";
import CapacitorSessionRestore from "@/components/CapacitorSessionRestore";
import OneSignalInit from "@/components/OneSignalInit";
import OneSignalWebInit from "@/components/OneSignalWebInit";
import LocaleSync from "@/components/LocaleSync";
import { htmlLang, isLocale } from "@/i18n/locale";

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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={isLocale(locale) ? htmlLang(locale) : "nb"} className={`${poppins.variable} h-full antialiased`} style={{ background: "#3A3A3A" }}>
      <body className="min-h-full flex flex-col font-[family-name:var(--font-poppins)] bg-[#3A3A3A]">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <CapacitorSessionRestore />
          <OneSignalInit />
          <OneSignalWebInit />
          <LocaleSync />
          {children}
          <Footer />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
