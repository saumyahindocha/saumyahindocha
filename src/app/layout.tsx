import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { BenchFX } from "@/components/bench/BenchFX";
import { Nav } from "@/components/bench/Nav";
import { Footer } from "@/components/bench/Footer";
import { SmoothScroll } from "@/components/bench/SmoothScroll";
import { SITE_URL } from "@/lib/site";
import "./globals.css";

const geist = Geist({ variable: "--font-geist", subsets: ["latin"], display: "optional" });
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "optional",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Saumya Hindocha · Mechanical Design & Robotics",
    template: "%s · Saumya Hindocha",
  },
  description:
    "Second-year mechanical engineering student at IIT Bombay. A self-balancing robot, a Pico music player, a number-plate parking system and a cooling-tower energy audit, with what broke along the way.",
};

export const viewport: Viewport = {
  themeColor: "#0f1a15",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geist.variable} ${geistMono.variable}`}>
      <body className="antialiased">
        <a
          href="#main"
          className="sr-only z-50 rounded-sm bg-surface px-3 py-2 focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
        >
          Skip to content
        </a>
        <div className="relative min-h-dvh overflow-x-clip">
          <BenchFX />
          <SmoothScroll />
          <Nav />
          <main id="main" className="relative z-10">
            {children}
          </main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
