import type { CameraName, DartDesign } from './match/board3d/options';

export interface ViewSettings {
  camera: CameraName;
  design: DartDesign;
}

// v2: the dynamic camera became the default.
const KEY = 'darts.view.v2';
const DEFAULT: ViewSettings = { camera: 'dynamic', design: 'silver' };

/** Camera and dart design are remembered on this device; nothing breaks if storage isn't available. */
export function loadView(): ViewSettings {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...DEFAULT, ...(JSON.parse(raw) as Partial<ViewSettings>) };
  } catch {
    /* ignore */
  }
  return { ...DEFAULT };
}

export function saveView(v: ViewSettings): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(v));
  } catch {
    /* ignore */
  }
}
