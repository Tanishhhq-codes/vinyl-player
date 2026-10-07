import type { Track } from "@/lib/vinyl-data";

function loadImage(url: string) {
  return new Promise<HTMLImageElement | undefined>((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(undefined);
    img.src = url;
  });
}

/** Picks dark / vivid / light colors from the artwork so the room matches the album. */
function paletteFrom(img: HTMLImageElement): [string, string, string] {
  const c = document.createElement("canvas");
  c.width = c.height = 24;
  const ctx = c.getContext("2d");
  if (!ctx) return ["#222222", "#888888", "#eeeeee"];
  ctx.drawImage(img, 0, 0, 24, 24);
  const d = ctx.getImageData(0, 0, 24, 24).data;
  const px: { r: number; g: number; b: number; l: number; s: number }[] = [];
  for (let i = 0; i < d.length; i += 4) {
    const r = d[i] ?? 0, g = d[i + 1] ?? 0, b = d[i + 2] ?? 0;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    px.push({ r, g, b, l: (max + min) / 2, s: max - min });
  }
  const hex = (p: { r: number; g: number; b: number }) => "#" + [p.r, p.g, p.b].map((v) => v.toString(16).padStart(2, "0")).join("");
  const byL = [...px].sort((a, b) => a.l - b.l);
  const z = { r: 0, g: 0, b: 0 };
  const vivid = [...px].sort((a, b) => b.s - a.s)[0] ?? z;
  return [hex(byL[Math.floor(byL.length * 0.1)] ?? z), hex(vivid), hex(byL[Math.floor(byL.length * 0.9)] ?? z)];
}

export async function trackFromFile(file: File): Promise<Track> {
  const { parseBlob } = await import("music-metadata");
  const src = URL.createObjectURL(file);
  const fallbackTitle = file.name.replace(/\.[^.]+$/, "");
  let title = fallbackTitle, artist = "Local file", album = "My music", duration = 0;
  let art: HTMLImageElement | undefined;
  try {
    const meta = await parseBlob(file, { duration: true });
    title = meta.common.title || fallbackTitle;
    artist = meta.common.artist || artist;
    album = meta.common.album || album;
    duration = Math.round(meta.format.duration ?? 0);
    const pic = meta.common.picture?.[0];
    if (pic) art = await loadImage(URL.createObjectURL(new Blob([new Uint8Array(pic.data)], { type: pic.format })));
  } catch { /* untagged file: use file name */ }
  if (!duration) {
    duration = await new Promise<number>((resolve) => {
      const a = new Audio(); a.preload = "metadata";
      a.onloadedmetadata = () => resolve(Math.round(a.duration) || 180);
      a.onerror = () => resolve(180);
      a.src = src;
    });
  }
  return { title, artist, album, duration, palette: art ? paletteFrom(art) : ["#1d2326", "#628a91", "#e9e4da"], mark: "L", src, ...(art ? { art } : {}) };
}
