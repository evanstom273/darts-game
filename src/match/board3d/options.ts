/** View options for the 3D board, kept apart from the scene so three.js can load on its own. */
export type CameraName = 'straight' | 'close' | 'angled' | 'side' | 'low' | 'high' | 'oche';
export type DartDesign = 'silver' | 'black';

export const CAMERAS: { id: CameraName; label: string }[] = [
  { id: 'straight', label: 'Straight on' },
  { id: 'close', label: 'Close-up' },
  { id: 'angled', label: 'Angled' },
  { id: 'side', label: 'Side' },
  { id: 'low', label: 'Low' },
  { id: 'high', label: 'High' },
  { id: 'oche', label: 'Oche' },
];
