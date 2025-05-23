import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";;
import { Toaster } from "@/components/ui/sonner"

import "./globals.css";

const inter = Inter({ subsets: ['latin'] })

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Travel Sphere App",
  description: "Generated by khatri.kelashk@gmail.com",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${inter.className} antialiased`}
      >
          {children}
          <Toaster />
      </body>
    </html>
  );
}
