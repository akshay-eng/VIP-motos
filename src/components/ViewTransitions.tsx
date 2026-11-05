import { useCallback, useEffect } from "react";
import { useNavigate, type NavigateFunction } from "react-router";
import { routeOf } from "@/lib/asset";

// Rendering is paused while a view transition captures its update, so
// requestAnimationFrame never fires here; poll with timers instead.
const tick = () => new Promise<void>((r) => setTimeout(r, 16));

async function until(test: () => boolean, ms = 800) {
  const end = performance.now() + ms;
  while (!test() && performance.now() < end) await tick();
}

/** The page wrapper carries the path it rendered, so this tells us React has committed the new page. */
const rendered = (path: string) => document.querySelector("[data-path]")?.getAttribute("data-path") === path;

const canAnimate = () => !!document.startViewTransition && !matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Navigates inside a view transition: the old page sinks back while the new
 * one wipes in, and `photo` (a car image) flies into the car page gallery.
 */
function transitionTo(navigate: NavigateFunction, to: string, photo: HTMLElement | null) {
  const url = new URL(to, window.location.href);
  document.querySelectorAll<HTMLElement>("[data-vt-hero]").forEach((el) => (el.style.viewTransitionName = "none"));
  const img = url.pathname.startsWith("/cars/") ? photo : null;
  if (img) img.style.viewTransitionName = "car-hero";
  const vt = document.startViewTransition(async () => {
    navigate(url.pathname + url.search + url.hash);
    await until(() => rendered(url.pathname) && window.location.search === url.search);
    await tick();
  });
  vt.finished.finally(() => {
    if (img) img.style.viewTransitionName = "";
  });
}

/** For programmatic navigation that should animate like a link click. */
export function useTransitionNavigate() {
  const navigate = useNavigate();
  return useCallback(
    (to: string, photo?: HTMLElement | null) => {
      if (!canAnimate()) navigate(to);
      else transitionTo(navigate, to, photo ?? null);
    },
    [navigate],
  );
}

/**
 * Routes same-origin link clicks through the View Transitions API. A car
 * photo marked data-vt-img inside the clicked link's card (data-vt-card)
 * flies into the car page's gallery (data-vt-hero). Changes that only touch
 * the query string, like filters, update in place without a transition.
 */
export function ViewTransitions() {
  const navigate = useNavigate();

  useEffect(() => {
    if (!document.startViewTransition) return;
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a");
      if (!a || (a.target && a.target !== "_self") || a.hasAttribute("download") || "noVt" in a.dataset) return;
      const url = new URL(a.href, window.location.href);
      if (url.origin !== window.location.origin || url.pathname === window.location.pathname) return;
      if (!canAnimate()) return;
      e.preventDefault();
      const card = a.closest("[data-vt-card]") ?? a;
      // Links carry the deploy base; the router wants the app route.
      transitionTo(navigate, routeOf(url.pathname) + url.search + url.hash, card.querySelector<HTMLElement>("[data-vt-img]"));
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [navigate]);

  return null;
}
