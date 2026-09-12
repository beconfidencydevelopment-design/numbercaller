import type { Metadata } from "next";
import { Inter, Josefin_Sans } from "next/font/google";
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
    <html lang="en" className={`${inter.variable} ${josefin.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        {/* Applies the saved theme before first paint. Without this the
            console renders light and then snaps to dark on hydration. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var d=document.documentElement;var t=localStorage.getItem('snk-theme');if(t==='dark'||(!t&&matchMedia('(prefers-color-scheme: dark)').matches)){d.classList.add('dark')}d.setAttribute('data-brand',localStorage.getItem('snk-brand')==='orange'?'orange':'violet')}catch(e){}`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        {children}
      </body>
    </html>
  );
}
