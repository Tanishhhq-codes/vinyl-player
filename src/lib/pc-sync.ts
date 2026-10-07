import { useEffect, useRef, useState } from "react";
import type { Track } from "@/lib/vinyl-data";

export const HELPER_URL = "http://localhost:5179";

type NowPlaying = { title: string; artist: string; album: string; duration: number; position: number; playing: boolean; app: string; artId: string };
export type LiveState = { status: "off" | "searching" | "connected"; track?: Track | undefined; playing: boolean; position: number; app?: string };

function loadImage(url: string) {
  return new Promise<HTMLImageElement | undefined>((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(undefined);
    img.src = url;
  });
}

function paletteFrom(img: HTMLImageElement): [string, string, string] {
  const c = document.createElement("canvas"); c.width = c.height = 16;
  const ctx = c.getContext("2d");
  if (!ctx) return ["#1d2326", "#628a91", "#e9e4da"];
  ctx.drawImage(img, 0, 0, 16, 16);
  const d = ctx.getImageData(0, 0, 16, 16).data;
  const px: number[][] = [];
  for (let i = 0; i < d.length; i += 4) px.push([d[i] ?? 0, d[i + 1] ?? 0, d[i + 2] ?? 0]);
  const lum = (p: number[]) => (p[0] ?? 0) + (p[1] ?? 0) + (p[2] ?? 0);
  const sat = (p: number[]) => Math.max(...p) - Math.min(...p);
  const hex = (p: number[] | undefined) => "#" + (p ?? [0, 0, 0]).map((v) => v.toString(16).padStart(2, "0")).join("");
  const byL = [...px].sort((a, b) => lum(a) - lum(b));
  return [hex(byL[Math.floor(byL.length * 0.1)]), hex([...px].sort((a, b) => sat(b) - sat(a))[0]), hex(byL[Math.floor(byL.length * 0.9)])];
}

/** Polls the Vinyl PC helper, which reads what Windows is playing (Spotify, Apple Music, etc.). */
export function usePcSync(enabled: boolean): LiveState {
  const [state, setState] = useState<LiveState>({ status: "off", playing: false, position: 0 });
  const artKey = useRef("");
  const trackRef = useRef<Track | undefined>(undefined);

  useEffect(() => {
    if (!enabled) { setState({ status: "off", playing: false, position: 0 }); artKey.current = ""; return; }
    let alive = true;
    setState((s) => ({ ...s, status: "searching" }));
    const tick = async () => {
      try {
        const res = await fetch(`${HELPER_URL}/now-playing`, { cache: "no-store" });
        const np = (await res.json()) as NowPlaying | null;
        if (!alive) return;
        if (!np || !np.title) { setState({ status: "connected", playing: false, position: 0 }); return; }
        const key = `${np.title}|${np.artist}|${np.artId}`;
        if (key !== artKey.current) {
          artKey.current = key;
          const art = np.artId ? await loadImage(`${HELPER_URL}/artwork?v=${encodeURIComponent(np.artId)}`) : undefined;
          trackRef.current = { title: np.title, artist: np.artist || np.app, album: np.album || np.app, duration: Math.max(1, Math.round(np.duration)), palette: art ? paletteFrom(art) : ["#1d2326", "#628a91", "#e9e4da"], mark: "PC", ...(art ? { art } : {}) };
        }
        if (alive) setState({ status: "connected", track: trackRef.current, playing: np.playing, position: Math.round(np.position), app: np.app });
      } catch {
        if (alive) setState((s) => ({ ...s, status: "searching" }));
      }
    };
    void tick();
    const id = window.setInterval(tick, 1000);
    return () => { alive = false; window.clearInterval(id); };
  }, [enabled]);

  return state;
}

export function sendPcCommand(action: "toggle" | "next" | "previous") {
  void fetch(`${HELPER_URL}/control?action=${action}`, { method: "POST" }).catch(() => undefined);
}
