import type { Metadata } from "next";
import Script from "next/script";
import { Fraunces } from "next/font/google";
import "./globals.css";

// Fraunces — an old-style display serif with real character; Stanley's wordmark
// and headings. Loaded as a variable font so we get the full optical-size axis
// (true display cuts at headline sizes) plus SOFT/WONK for bespoke detailing.
// Body stays Georgia (set in globals) for warm, readable prose.
const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  axes: ["opsz", "SOFT", "WONK"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_BASE_URL ?? "http://localhost:3000"),
  title: "Stanley — your personal calendar butler",
  description: "He protects the shape of your week. Dry, brief, entirely on your side.",
  openGraph: {
    title: "Stanley — your personal calendar butler",
    description: "He protects the shape of your week.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Stanley — your personal calendar butler",
    description: "He protects the shape of your week.",
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
