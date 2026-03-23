import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Auth0Provider } from "@auth0/nextjs-auth0";
import { ToastProvider } from "@/lib/toast";
import { KeyboardShortcuts } from "@/lib/keyboard";
import CookieBanner from "@/components/CookieBanner";
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
  title: "Cloud Agentist — Your AI that acts",
  description: "Manage your schedule, wishlists, and finances through conversation.",
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/favicon.png", type: "image/png", sizes: "32x32" },
    ],
    apple: { url: "/brand/logomark-256.png", sizes: "256x256" },
  },
  openGraph: {
    title: "Cloud Agentist — Your AI that acts",
    description: "Manage your schedule, wishlists, and finances through conversation.",
    type: "website",
    images: [{ url: "/brand/og-image.png", width: 1200, height: 630 }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Auth0Provider>
          <ToastProvider>
            <KeyboardShortcuts />
            {children}
            <CookieBanner />
          </ToastProvider>
        </Auth0Provider>
      </body>
    </html>
  );
}
