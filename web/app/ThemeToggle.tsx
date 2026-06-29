"use client";

import { useState } from "react";

// Read the theme the bootstrap script already applied to <html> before paint.
// SSR has no document, so it falls back to dark there; the button suppresses the
// one-node hydration diff for returning light-mode users.
function readTheme(): "dark" | "light" {
  if (typeof document === "undefined") return "dark";
  return document.documentElement.dataset.theme === "light" ? "light" : "dark";
}

// Light/dark switch. Default is dark (the signature gentleman's-club look);
// the choice persists in localStorage.
export function ThemeToggle() {
  const [theme, setTheme] = useState<"dark" | "light">(readTheme);

  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem("stanley-theme", next);
    } catch {
      /* ignore */
    }
  }

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggle}
      suppressHydrationWarning
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      title={theme === "dark" ? "Light mode" : "Dark mode"}
    >
      {theme === "dark" ? "☾" : "☀"}
    </button>
  );
}
