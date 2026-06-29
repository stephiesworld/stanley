import type { Metadata } from "next";
import Script from "next/script";
import { Fraunces } from "next/font/google";
import "./globals.css";

// Fraunces — an old-style display serif with real character; Stanley's wordmark
// and headings. Body stays Georgia (set in globals) for warm, readable prose.
const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "Stanley",
  description: "He protects the shape of your week.",
};

// Apply the saved theme before first paint so there's no flash. Default dark.
const THEME_BOOTSTRAP = `try{var t=localStorage.getItem('stanley-theme');document.documentElement.dataset.theme=t==='light'?'light':'dark';}catch(e){}`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={fraunces.variable} data-theme="dark" suppressHydrationWarning>
      <body>
        <Script id="theme-bootstrap" strategy="beforeInteractive">
          {THEME_BOOTSTRAP}
        </Script>
        {children}
      </body>
    </html>
  );
}
