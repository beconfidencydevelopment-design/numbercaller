import type { Metadata } from "next";
import { Geist, Inter, Josefin_Sans } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const josefin = Josefin_Sans({
  variable: "--font-josefin",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

/**
 * The console's one typeface. Geist for everything — chrome, copy, and every
 * numeral; columns of figures get tabular numerals through a feature
 * setting, not a second font. The marketing site above keeps Inter and
 * Josefin; the two products do not share type.
 */
const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "NumberCaller — Call Numbers Smarter",
  description:
    "Turn any TV, monitor, or projector into a live queue display with voice announcements. Ideal for restaurants, events, banks, clinics, and counters.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${josefin.variable} ${geist.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        {/* Applies the saved theme before first paint. Without this the
            console renders light and then snaps to dark on hydration. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('snk-theme');if(t==='dark'||(!t&&matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.classList.add('dark')}}catch(e){}`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        {children}
      </body>
    </html>
  );
}
