import type { Metadata, Viewport } from "next";
import { Cinzel, Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
// Film-title capitals for her name on the landing (Trajan-style, open source).
const cinzel = Cinzel({ variable: "--font-cinzel", subsets: ["latin"], weight: ["400", "500"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const instrument = Instrument_Serif({
  variable: "--font-instrument",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "Akshita Mahajan — Sutra",
  description:
    "The living constellation of Akshita Mahajan — full-stack engineer, public speaker, connector. Ex-intern at IIT Indore, CSIT at Symbiosis University of Applied Sciences.",
  openGraph: {
    title: "Akshita Mahajan — Sutra",
    description: "Every connection begins with a signal.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#04040a",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} ${instrument.variable} ${cinzel.variable} antialiased`}>
      <body>{children}</body>
    </html>
  );
}
