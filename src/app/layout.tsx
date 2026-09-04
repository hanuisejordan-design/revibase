import type { Metadata } from "next";
import { Geist, Geist_Mono, Fraunces, Gloria_Hallelujah } from "next/font/google";
import { APP_NAME, APP_TAGLINE } from "@/constants/app";
import { ThemeWatcher } from "@/components/settings/theme-watcher";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Serif éditorial pour les titres (essai identité visuelle).
const fraunces = Fraunces({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["400", "500"],
  style: ["normal"],
});

// Manuscrite « craie sur tableau » : réservée au « Bonjour X. » du dashboard.
const gloria = Gloria_Hallelujah({
  variable: "--font-hand",
  subsets: ["latin"],
  weight: ["400"],
});

export const metadata: Metadata = {
  title: APP_NAME,
  description: APP_TAGLINE,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="fr"
      className={`${geistSans.variable} ${geistMono.variable} ${fraunces.variable} ${gloria.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <ThemeWatcher />
        {children}
      </body>
    </html>
  );
}
