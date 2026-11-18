/** View options for the 3D board, kept apart from the scene so three.js can load on its own. */
export type CameraName = 'dynamic' | 'straight' | 'angled' | 'side' | 'low' | 'high' | 'oche';
export type DartDesign = 'silver' | 'black';

export const CAMERAS: { id: CameraName; label: string }[] = [
  { id: 'dynamic', label: 'Dynamic' },
  { id: 'straight', label: 'Straight on' },
  { id: 'angled', label: 'Angled' },
  { id: 'side', label: 'Side' },
  { id: 'low', label: 'Low' },
  { id: 'high', label: 'High' },
  { id: 'oche', label: 'Oche' },
];
