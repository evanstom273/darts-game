import { DEFAULT_SETUP, type Setup } from './sim/setup';

const KEY = 'darts.setup.v1';

/** Settings are remembered on this device for convenience; nothing breaks if storage isn't available. */
export function loadSetup(): Setup {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const s = JSON.parse(raw) as Setup;
      if (s?.players?.length === 2 && s.format && s.stage) return { ...structuredClone(DEFAULT_SETUP), ...s };
    }
  } catch {
    /* ignore */
  }
  return structuredClone(DEFAULT_SETUP);
}

export function saveSetup(s: Setup): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* ignore */
  }
}
