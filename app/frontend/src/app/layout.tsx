import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import { ClerkProvider } from '@clerk/nextjs';
import { ConvexClientProvider } from './providers/convex-provider';
import ImpersonationBanner from '../components/impersonation-banner';
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
  title: "CryptIoMT - Cybersecurity Risk Assessment",
  description: "Comprehensive cybersecurity risk assessment and equipment management platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`} suppressHydrationWarning={true}>
      <head>
        <Script id="theme-init" strategy="beforeInteractive">
          {`
            try {
              const storageTheme = localStorage.getItem('theme');
              const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
              const shouldDark = storageTheme ? storageTheme === 'dark' : systemPrefersDark;
              const el = document.documentElement;
              if (shouldDark) {
                el.classList.add('dark');
              } else {
                el.classList.remove('dark');
              }
            } catch (_) {}
          `}
        </Script>
      </head>
      <body className="bg-background text-foreground antialiased">
        <ClerkProvider>
          <ConvexClientProvider>
            {children}
          </ConvexClientProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
