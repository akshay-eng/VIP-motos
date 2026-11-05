import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { flushSync } from "react-dom";

export type Theme = "light" | "dark";

interface ThemeState {
  theme: Theme;
  /** Switches theme; pass the click point for the circular reveal. */
  toggle: (origin?: { x: number; y: number }) => void;
}

const Ctx = createContext<ThemeState | null>(null);

function current(): Theme {
  return document.documentElement.dataset.theme === "light" ? "light" : "dark";
}

function apply(t: Theme) {
  document.documentElement.dataset.theme = t;
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", t === "light" ? "#f6f5f3" : "#09090a");
  try {
    localStorage.setItem("vip.theme", t);
  } catch {
    // Not persisted; the choice lasts for this visit.
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(current);

  // Follow the system setting until the visitor picks a theme themselves.
  useEffect(() => {
    let saved: string | null = null;
    try {
      saved = localStorage.getItem("vip.theme");
    } catch {
      /* ignore */
    }
    if (saved) return;
    const mq = matchMedia("(prefers-color-scheme: light)");
    const on = () => {
      const t: Theme = mq.matches ? "light" : "dark";
      document.documentElement.dataset.theme = t;
      setTheme(t);
    };
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);

  const toggle = useCallback((origin?: { x: number; y: number }) => {
    const next: Theme = current() === "dark" ? "light" : "dark";
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!document.startViewTransition || reduce) {
      apply(next);
      setTheme(next);
      return;
    }
    const x = origin?.x ?? innerWidth - 40;
    const y = origin?.y ?? 40;
    const r = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    document.documentElement.classList.add("vt-theme");
    const vt = document.startViewTransition(() => {
      flushSync(() => {
        apply(next);
        setTheme(next);
      });
    });
    vt.ready.then(() => {
      document.documentElement.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${r}px at ${x}px ${y}px)`] },
        { duration: 750, easing: "cubic-bezier(0.16, 1, 0.3, 1)", pseudoElement: "::view-transition-new(root)" },
      );
    });
    vt.finished.finally(() => document.documentElement.classList.remove("vt-theme"));
  }, []);

  return <Ctx.Provider value={{ theme, toggle }}>{children}</Ctx.Provider>;
}

export function useTheme() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useTheme must be used inside ThemeProvider");
  return ctx;
}
