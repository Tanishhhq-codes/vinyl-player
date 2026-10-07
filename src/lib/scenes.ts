export type SceneView = "room" | "desk";
export type WallStyle = "botanical" | "jazz" | "deco" | "plaster";
export type FinishStyle = "walnut" | "marble" | "terrazzo" | "checker";
export const wallStyles: { id: WallStyle; name: string }[] = [{ id: "jazz", name: "Jazz gallery" }, { id: "botanical", name: "Botanical" }, { id: "deco", name: "Emerald Deco" }, { id: "plaster", name: "Soft plaster" }];
export const finishStyles: { id: FinishStyle; name: string }[] = [{ id: "walnut", name: "Walnut" }, { id: "marble", name: "Cloud marble" }, { id: "terrazzo", name: "Terrazzo" }, { id: "checker", name: "Checkerboard" }];

export type ScenePreset = {
  id: string;
  name: string;
  blurb: string;
  view: SceneView;
  /** CSS token names (without --scene-) resolved in the browser. */
  background: string;
  keyLight: string;
  lampGlow: string;
  ambient: number;
  key: number;
  lamp: number;
  wallpaper: boolean;
  blinds: boolean;
};

export const scenes: ScenePreset[] = [
  { id: "listening", name: "Listening Room", blurb: "Bright gallery daylight", view: "room", background: "paper", keyLight: "paper", lampGlow: "glow", ambient: 0.65, key: 2.3, lamp: 5, wallpaper: true, blinds: false },
  { id: "desk", name: "Turntable", blurb: "Top-down, sun through blinds", view: "desk", background: "paper", keyLight: "sun", lampGlow: "glow", ambient: 0.5, key: 3.2, lamp: 2, wallpaper: true, blinds: true },
  { id: "after-hours", name: "After Hours", blurb: "Late night, warm lamp glow", view: "room", background: "night", keyLight: "ember", lampGlow: "ember", ambient: 0.22, key: 0.55, lamp: 14, wallpaper: true, blinds: false },
  { id: "minimal", name: "Minimal", blurb: "Plain wall, soft light", view: "room", background: "paper", keyLight: "paper", lampGlow: "glow", ambient: 0.9, key: 1.6, lamp: 2, wallpaper: false, blinds: false },
];

export type Settings = {
  sceneId: string;
  roomLight: number;
  speed: number;
  sceneScale: number;
  ambientMotion: boolean;
  reactive: boolean;
  cameraHeight: number;
  fov: number;
  performance: "quality" | "balanced" | "battery";
  wallStyle: WallStyle;
  floorStyle: FinishStyle;
  deskStyle: FinishStyle;
  lampOn: boolean;
  lidOpen: boolean;
  moodLights: boolean;
  pcSync: boolean;
};

export const defaultSettings: Settings = {
  sceneId: "listening", roomLight: 1, speed: 1, sceneScale: 1, ambientMotion: true, reactive: true, cameraHeight: 0, fov: 44, performance: "balanced",
  wallStyle: "jazz", floorStyle: "checker", deskStyle: "walnut", lampOn: true, lidOpen: true, moodLights: false, pcSync: false,
};

const KEY = "vinyl-settings-v1";

export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(KEY);
    const saved = raw ? { ...defaultSettings, ...JSON.parse(raw) } : { ...defaultSettings };
    if (!wallStyles.some(x => x.id === saved.wallStyle)) saved.wallStyle = defaultSettings.wallStyle;
    for (const key of ["floorStyle", "deskStyle"] as const) if (!finishStyles.some(x => x.id === saved[key])) saved[key] = defaultSettings[key];
    return saved;
  } catch { return defaultSettings; }
}

export function saveSettings(s: Settings) {
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* ignore */ }
}
