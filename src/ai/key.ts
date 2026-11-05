// API-key storage for the optional Claude mode. Kept apart from claude.ts so
// the SDK only downloads when a key is actually set.
const KEY_STORAGE = "vip.anthropicKey";

export function getApiKey(): string | null {
  const fromEnv = import.meta.env.VITE_ANTHROPIC_API_KEY as string | undefined;
  if (fromEnv) return fromEnv;
  try {
    return window.localStorage.getItem(KEY_STORAGE);
  } catch {
    return null;
  }
}

export function setApiKey(key: string | null) {
  try {
    if (key) window.localStorage.setItem(KEY_STORAGE, key);
    else window.localStorage.removeItem(KEY_STORAGE);
  } catch {
    // Storage blocked: the key lasts for this page view only.
  }
}

export class ConciergeUnavailable extends Error {}
