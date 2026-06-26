import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "JH Studio — Photography & Studio Management Platform",
  description:
    "Streamline your photography studio operations. Manage bookings, clients, shoots, equipment, and your team — all in one powerful platform.",
  keywords: [
    "photography studio management",
    "studio booking system",
    "photographer CRM",
    "shoot scheduling",
    "studio operations",
  ],
  authors: [{ name: "Janith Harshana" }],
  openGraph: {
    title: "JH Studio — Photography & Studio Management Platform",
    description:
      "Streamline your photography studio operations with our all-in-one platform.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${playfair.variable} font-sans bg-zinc-950 text-zinc-50 antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
