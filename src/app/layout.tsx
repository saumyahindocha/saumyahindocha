import type { Metadata, Viewport } from "next";
import { JetBrains_Mono, Manrope } from "next/font/google";
import { LampLight } from "@/components/bench/LampLight";
import { Nav } from "@/components/bench/Nav";
import { Footer } from "@/components/bench/Footer";
import "./globals.css";

const manrope = Manrope({ variable: "--font-manrope", subsets: ["latin"], display: "swap" });
const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://saumyahindocha.vercel.app"),
  title: {
    default: "Saumya Hindocha · Mechanical Design & Robotics",
    template: "%s · Saumya Hindocha",
  },
  description:
    "Mechanical engineering student at IIT Bombay. I build machines where mechanical design meets electronics and code, and document every build from the breadboard up.",
};

export const viewport: Viewport = {
  themeColor: "#1d4b39",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${manrope.variable} ${jetbrains.variable}`}>
      <head>
        {/* Lets reveal animations hide content only when JS will un-hide it. */}
        <script
          dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }}
        />
      </head>
      <body className="antialiased">
        <a
          href="#main"
          className="sr-only z-50 rounded-sm bg-surface px-3 py-2 focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
        >
          Skip to content
        </a>
        <div className="mat-edges relative min-h-dvh overflow-x-clip">
          <LampLight />
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
