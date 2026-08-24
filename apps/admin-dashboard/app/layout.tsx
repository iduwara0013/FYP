import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals-new.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AgriLanka Admin",
  description: "Operations console for the AgriLanka smart-agriculture platform.",
  icons: {
    icon: "/agrilanka-logo.png",
    shortcut: "/agrilanka-logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
