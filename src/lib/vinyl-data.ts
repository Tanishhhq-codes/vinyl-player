export type Track = {
  title: string;
  artist: string;
  album: string;
  duration: number;
  palette: [string, string, string];
  mark: string;
  /** Playable audio URL for local files. */
  src?: string;
  /** Real album artwork, when available. */
  art?: HTMLImageElement;
};

export const tracks: Track[] = [
  {
    title: "Soft Spot",
    artist: "keshi",
    album: "Requiem",
    duration: 204,
    palette: ["#263133", "#b7644c", "#e0b58e"],
    mark: "R",
  },
  {
    title: "Sweet",
    artist: "Cigarettes After Sex",
    album: "Cigarettes After Sex",
    duration: 292,
    palette: ["#16191c", "#646a6f", "#e8e3dc"],
    mark: "S",
  },
  {
    title: "Passionfruit",
    artist: "Drake",
    album: "More Life",
    duration: 299,
    palette: ["#101b22", "#c83e32", "#dfbf65"],
    mark: "ML",
  },
];

export function formatTime(seconds: number) {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  return `${Math.floor(safeSeconds / 60)}:${String(safeSeconds % 60).padStart(2, "0")}`;
}