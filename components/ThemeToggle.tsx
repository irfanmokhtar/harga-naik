"use client";

import { useEffect, useState } from "react";

type Theme = "dark" | "light";

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme | null>(null);

  useEffect(() => {
    setTheme(document.documentElement.dataset.theme === "light" ? "light" : "dark");

    // follow live OS changes only while no explicit choice is stored
    const mq = matchMedia("(prefers-color-scheme: light)");
    const onChange = (e: MediaQueryListEvent) => {
      if (localStorage.theme) return;
      const t: Theme = e.matches ? "light" : "dark";
      document.documentElement.dataset.theme = t;
      setTheme(t);
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const toggle = () => {
    const next: Theme = theme === "light" ? "dark" : "light";
    document.documentElement.dataset.theme = next;
    localStorage.theme = next;
    setTheme(next);
  };

  return (
    <button
      onClick={toggle}
      className="border border-hairline px-2 py-0.5 text-[11px] text-dim hover:text-ink hover:border-dim cursor-pointer"
      aria-label="Tukar tema / switch theme"
    >
      <span className={theme === "dark" ? "text-acid" : ""}>DRK</span>
      <span className="text-faint">/</span>
      <span className={theme === "light" ? "text-acid" : ""}>LGT</span>
    </button>
  );
}
