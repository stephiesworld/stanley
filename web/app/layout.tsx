import type { Metadata } from "next";
import Script from "next/script";
import { Archivo, Fraunces, Space_Mono } from "next/font/google";
import "./globals.css";
import "./keeper.css";

// Keeper of Days brand: Archivo 900 display + Space Mono for every label,
// ledger row, and chat line. Fraunces stays loaded for the /console voice
// tool, which keeps the old stylesheet.
const archivo = Archivo({
  subsets: ["latin"],
  variable: "--font-archivo",
  style: ["normal", "italic"],
});
const spaceMono = Space_Mono({
  subsets: ["latin"],
  variable: "--font-space-mono",
  weight: ["400", "700"],
  style: ["normal", "italic"],
});
const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  axes: ["opsz", "SOFT", "WONK"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_BASE_URL ?? "http://localhost:3000"),
  title: "Stanley — Keeper of Days",
  description:
    "A calendar is the only honest autobiography. Stanley reads yours, learns the person it describes, and politely keeps the week from getting the better of you.",
  openGraph: {
    title: "Stanley — Keeper of Days",
    description: "A calendar is the only honest autobiography.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Stanley — Keeper of Days",
    description: "A calendar is the only honest autobiography.",
  },
};

// Apply the saved theme before first paint so there's no flash. Default dark.
const THEME_BOOTSTRAP = `try{var t=localStorage.getItem('stanley-theme');document.documentElement.dataset.theme=t==='light'?'light':'dark';}catch(e){}`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${archivo.variable} ${spaceMono.variable} ${fraunces.variable}`}
      data-theme="dark"
      suppressHydrationWarning
    >
      <body>
        <Script id="theme-bootstrap" strategy="beforeInteractive">
          {THEME_BOOTSTRAP}
        </Script>
        {children}
      </body>
    </html>
  );
}
