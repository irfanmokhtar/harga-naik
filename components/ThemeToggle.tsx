"use client";

import { useEffect, useState } from "react";

type Theme = "dark" | "light";

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme | null>(null);

  useEffect(() => {
    setTheme(
      document.documentElement.dataset.theme === "dark" ? "dark" : "light"
    );
  }, []);

  const toggle = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    localStorage.theme = next;
    setTheme(next);
  };

  return (
    <button
      onClick={toggle}
      className="px-2 py-1.5 text-[13px] text-dim hover:text-ink cursor-pointer"
      aria-label="Tukar tema / switch theme"
    >
      {theme === "dark" ? "☀" : "☾"}
    </button>
  );
}
