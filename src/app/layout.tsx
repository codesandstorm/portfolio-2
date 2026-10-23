import type { Metadata, Viewport } from "next";
import { Bodoni_Moda, Cinzel, Geist_Mono, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

// Film-title capitals for her name on the landing (Trajan-style, open source).
const cinzel = Cinzel({ variable: "--font-cinzel", subsets: ["latin"], weight: ["400", "500", "600", "700"] });
// The landing's body face, used for all running text and labels.
const jakarta = Plus_Jakarta_Sans({ variable: "--font-jakarta", subsets: ["latin"], weight: ["300", "400", "500", "600"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
// The landing's editorial serif, used for headlines across the site (with true italics).
const bodoni = Bodoni_Moda({ variable: "--font-bodoni", subsets: ["latin"], style: ["normal", "italic"], axes: ["opsz"] });

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
  themeColor: "#050608",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistMono.variable} ${bodoni.variable} ${cinzel.variable} ${jakarta.variable} antialiased`}>
      <body>{children}</body>
    </html>
  );
}
