import type { Metadata } from "next";
import { Bricolage_Grotesque, Hanken_Grotesk } from "next/font/google";
import "./globals.css";


const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-display",
});

const hanken = Hanken_Grotesk({
  subsets: ["latin"],
  variable: "--font-body",
});


export const metadata: Metadata = {
  title: "Pedrun — Daily Raffle",
  description: "Win dinner today. We'll deliver.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${bricolage.variable} ${hanken.variable}`}>
        {children}
      </body>
    </html>
  );
}

