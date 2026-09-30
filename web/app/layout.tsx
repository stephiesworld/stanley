import type { Metadata } from "next";
import Script from "next/script";
import { Epilogue, Fraunces, Newsreader } from "next/font/google";
import "./globals.css";
import "./week.css";

// "The shape of the week" (landing + /demo console): Epilogue for the
// interface, Newsreader italic whenever Stanley speaks. Fraunces stays loaded
// for the /console voice tool, which keeps the old stylesheet.
const epilogue = Epilogue({
  subsets: ["latin"],
  variable: "--font-epilogue",
  weight: ["400", "500", "600", "800"],
});
const newsreader = Newsreader({
  subsets: ["latin"],
  variable: "--font-newsreader",
  style: ["italic"],
  weight: ["400", "500"],
});
const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  axes: ["opsz", "SOFT", "WONK"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_BASE_URL ?? "http://localhost:3000"),
  title: "Stanley",
  description:
    "Stanley protects the shape of your week. He reads your calendar, spots the day that's about to go wrong, and proposes a fix. Nothing moves until you say yes.",
  openGraph: {
    title: "Stanley",
    description: "Stanley protects the shape of your week.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Stanley",
    description: "Stanley protects the shape of your week.",
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
      className={`${epilogue.variable} ${newsreader.variable} ${fraunces.variable}`}
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
