/** A file in /public, resolved against the deploy base (e.g. /VIP-motos/ on GitHub Pages). */
export const asset = (path: string) => import.meta.env.BASE_URL + path.replace(/^\//, "");

/** The router's basename: the deploy base without its trailing slash. */
export const basename = import.meta.env.BASE_URL.replace(/\/$/, "") || "/";

/** Turns a full pathname from an <a href> back into an app route. */
export function routeOf(pathname: string) {
  return basename !== "/" && pathname.startsWith(basename) ? pathname.slice(basename.length) || "/" : pathname;
}
