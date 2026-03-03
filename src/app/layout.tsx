import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    template: "%s — Docilog",
    default: "Docilog — AI Blog Platformu",
  },
  description:
    "Docilog: AI destekli çok-alanlı blog yönetim platformu.",
  icons: {
    icon: "/docilog.ico",
    apple: "/docilog.png",
  },
  openGraph: {
    title: "Docilog — AI Blog Platformu",
    description: "AI destekli çok-alanlı içerik yönetim platformu. Her alan için uzman AI persona'ları ile profesyonel içerik üretimi.",
    images: ["/docilog.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <Toaster richColors position="bottom-right" />
      </body>
    </html>
  );
}
