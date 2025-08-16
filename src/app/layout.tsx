import "~/styles/globals.css";

import { type Metadata } from "next";
import { Geist } from "next/font/google";
import { Orbitron } from "next/font/google";
import { QueryProvider } from "~/components/providers/query-provider";

export const metadata: Metadata = {
  title: "Sc2ReplayAnalyzer",
  description: "statistical analysis of Starcraft 2 replays",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

const orbitron = Orbitron({
  subsets: ["latin"],
  variable: "--font-orbitron",
  weight: ["400", "500", "600", "700", "800", "900"],
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${geist.variable} ${orbitron.variable} dark crt-mode`}
    >
      <body className="crt-screen crt-lines crt-noise">
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
