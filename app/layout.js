import { Bricolage_Grotesque, Instrument_Serif, JetBrains_Mono, DM_Sans } from "next/font/google";
import Cursor from "@/components/Cursor";
import "./globals.css";

const display = Bricolage_Grotesque({ subsets: ["latin"], weight: ["600", "700", "800"], variable: "--font-display" });
const serif = Instrument_Serif({ subsets: ["latin"], weight: "400", style: ["italic", "normal"], variable: "--font-serif" });
const mono = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "600"], variable: "--font-mono" });
const body = DM_Sans({ subsets: ["latin"], variable: "--font-body" });

export const metadata = {
  title: "KHAO: desi food, real coach, actual results",
  description: "A personal diet and workout plan built around the Indian food you already eat. Made and checked by your coach, updated as your body changes.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#f4efe4",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${display.variable} ${serif.variable} ${mono.variable} ${body.variable}`} data-scroll-behavior="smooth">
      <body>
        {children}
        <div className="grain" aria-hidden />
        <Cursor />
      </body>
    </html>
  );
}
