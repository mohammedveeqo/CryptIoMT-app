import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Script from "next/script";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CryptIoMT - Healthcare Cybersecurity Solutions",
  description: "Comprehensive cybersecurity solutions designed specifically for healthcare organizations. Protect patient data, ensure HIPAA compliance, and defend against evolving cyber threats.",
  keywords: "healthcare cybersecurity, HIPAA compliance, medical data protection, healthcare IT security, IoMT security, medical device cybersecurity",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Script src="https://cdn.credly.com/assets/utilities/embed.js" strategy="afterInteractive" />
        {children}
      </body>
    </html>
  );
}
