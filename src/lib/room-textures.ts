import * as THREE from "three";
import type { Track } from "@/lib/vinyl-data";
import type { FinishStyle } from "@/lib/scenes";

export function sceneColors() {
  const styles = getComputedStyle(document.documentElement);
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 1;
  const ctx = canvas.getContext("2d");
  const read = (name: string) => {
    if (!ctx) return "rgb(128,128,128)";
    ctx.fillStyle = styles.getPropertyValue(`--scene-${name}`).trim();
    ctx.fillRect(0, 0, 1, 1);
    const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
    return `rgb(${r},${g},${b})`;
  };
  return { paper: read("paper"), silver: read("silver"), ink: read("ink"), teal: read("teal"), vinyl: read("vinyl"), wood: read("wood"), grain: read("grain"), glow: read("glow"), night: read("night"), ember: read("ember"), sun: read("sun"), brass: read("brass"), enamel: read("enamel"), glass: read("glass"), petal: read("petal"), leaf: read("leaf"), walnut: read("walnut"), walnutLight: read("walnut-light"), neon: read("neon"), blue: read("blue") };
}

export function finishTexture(kind: FinishStyle | "plaster", colors: ReturnType<typeof sceneColors>, floor = false) {
  const canvas = document.createElement("canvas"); canvas.width = canvas.height = 1024;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.fillStyle = kind === "walnut" ? colors.walnut : colors.paper; ctx.fillRect(0, 0, 1024, 1024);
    if (kind === "checker") {
      ctx.fillStyle = colors.teal;
      for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) if ((x + y) % 2 === 0) ctx.fillRect(x * 256, y * 256, 256, 256);
    }
    if (kind === "walnut") {
      for (let i = 0; i < 1800; i++) {
        const y = (i * 37.17) % 1024; ctx.globalAlpha = 0.08 + (i % 5) * 0.035;
        ctx.strokeStyle = i % 3 ? colors.walnutLight : colors.grain; ctx.lineWidth = 0.5 + i % 3;
        ctx.beginPath(); ctx.moveTo(0, y); ctx.bezierCurveTo(330, y + Math.sin(i) * 22, 670, y - 12, 1024, y + 3); ctx.stroke();
      }
      ctx.globalAlpha = 0.35; ctx.strokeStyle = colors.grain; ctx.lineWidth = 2;
      for (let y = 0; y < 1024; y += 128) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(1024, y); ctx.stroke(); }
    }
    if (kind === "marble") {
      for (let i = 0; i < 24; i++) {
        ctx.strokeStyle = i % 3 ? colors.silver : colors.teal; ctx.globalAlpha = 0.1 + (i % 4) * 0.04; ctx.lineWidth = 1 + i % 3;
        const x = (i * 173) % 1024;
        ctx.beginPath(); ctx.moveTo(x - 400, 0); ctx.bezierCurveTo(x + 450, 230, x - 340, 590, x + 350, 1024); ctx.stroke();
      }
    }
    if (kind === "terrazzo") {
      const chips = [colors.teal, colors.petal, colors.brass, colors.ink, colors.silver];
      for (let i = 0; i < 2100; i++) {
        const x = (i * 173.31) % 1024, y = (i * 71.73) % 1024, r = 2 + i % 6;
        ctx.globalAlpha = 0.45; ctx.fillStyle = chips[i % chips.length] ?? colors.teal;
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + r, y - r / 2); ctx.lineTo(x + r * 1.4, y + r); ctx.lineTo(x - r / 2, y + r * 0.8); ctx.closePath(); ctx.fill();
      }
    }
    for (let i = 0; i < 13000; i++) { ctx.globalAlpha = 0.025; ctx.fillStyle = i % 2 ? colors.ink : colors.paper; ctx.fillRect((i * 197.73) % 1024, (i * 67.31) % 1024, 2, 2); }
  }
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace; texture.anisotropy = 8;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping; texture.repeat.set(floor ? 7 : 1.8, floor ? 7 : 1);
  return texture;
}

export function surfaceTexture(kind: "wood" | "grooves" | "metal", colors: ReturnType<typeof sceneColors>) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 1024;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.fillStyle = kind === "wood" ? colors.wood : kind === "metal" ? colors.silver : colors.vinyl;
    ctx.fillRect(0, 0, 1024, 1024);
    if (kind === "grooves") {
      for (let i = 148; i < 506; i += 1.1) {
        ctx.strokeStyle = colors.silver;
        ctx.globalAlpha = i % 71 < 3 ? 0.28 : 0.12;
        ctx.lineWidth = i % 71 < 3 ? 1.5 : 0.55;
        ctx.beginPath(); ctx.arc(512, 512, i, 0, Math.PI * 2); ctx.stroke();
      }
    } else {
      for (let i = 0; i < 1500; i++) {
        const y = (i * 37.17) % 1024;
        ctx.globalAlpha = kind === "metal" ? 0.12 : 0.08 + (i % 4) * 0.018;
        ctx.strokeStyle = i % 3 ? colors.grain : colors.paper;
        ctx.lineWidth = kind === "metal" ? 0.3 : 0.5 + i % 2;
        ctx.beginPath(); ctx.moveTo(0, y);
        ctx.bezierCurveTo(340, y + (kind === "metal" ? 0 : Math.sin(i) * 9), 670, y - 4, 1024, y + 2); ctx.stroke();
      }
    }
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

export function coverTexture(image: unknown, track: Track, colors: ReturnType<typeof sceneColors>) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 1024;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.fillStyle = colors.paper; ctx.fillRect(0, 0, 1024, 1024);
    if (track.art) {
      const a = track.art, s = Math.min(a.width, a.height);
      ctx.drawImage(a, (a.width - s) / 2, (a.height - s) / 2, s, s, 0, 0, 1024, 1024);
    } else if (image instanceof HTMLImageElement || image instanceof HTMLCanvasElement || image instanceof ImageBitmap) ctx.drawImage(image, 35, 35, 954, 790);
    if (track.art) { /* real artwork fills the sleeve */ } else if (track.mark !== "R") {
      ctx.globalCompositeOperation = "multiply";
      ctx.fillStyle = track.palette[1]; ctx.globalAlpha = 0.4;
      ctx.fillRect(35, 35, 954, 790);
      ctx.globalCompositeOperation = "source-over"; ctx.globalAlpha = 1;
    }
    if (!track.art) {
    ctx.fillStyle = colors.ink;
    ctx.font = "400 48px 'Instrument Serif', Georgia";
    ctx.fillText(track.album, 52, 895, 910);
    ctx.font = "400 23px 'Work Sans', sans-serif";
    ctx.fillText(track.artist.toUpperCase(), 54, 951, 800);
    ctx.textAlign = "right"; ctx.fillText("33⅓", 970, 951);
    }
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

export function recordLabel(track: Track, colors: ReturnType<typeof sceneColors>) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 512;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.fillStyle = colors.paper; ctx.fillRect(0, 0, 512, 512);
    ctx.textAlign = "center";
    ctx.fillStyle = track.art ? track.palette[0] : colors.teal; ctx.beginPath(); ctx.arc(256, 256, 244, 0, Math.PI * 2); ctx.fill();
    if (track.art) {
      ctx.save(); ctx.beginPath(); ctx.arc(256, 256, 244, 0, Math.PI * 2); ctx.clip();
      const a = track.art, s = Math.min(a.width, a.height);
      ctx.drawImage(a, (a.width - s) / 2, (a.height - s) / 2, s, s, 12, 12, 488, 488);
      ctx.fillStyle = "rgba(0,0,0,0.35)"; ctx.fillRect(0, 0, 512, 512);
      ctx.restore();
    }
    ctx.strokeStyle = colors.paper; ctx.lineWidth = 2;
    for (const r of [230, 220, 72]) { ctx.beginPath(); ctx.arc(256, 256, r, 0, Math.PI * 2); ctx.stroke(); }
    ctx.fillStyle = colors.paper; ctx.font = "38px 'Instrument Serif', serif"; ctx.fillText("Vinyl", 256, 127);
    ctx.font = "18px 'Work Sans', sans-serif"; ctx.fillText(track.title.toUpperCase(), 256, 173, 330);
    ctx.font = "14px 'Work Sans', sans-serif"; ctx.fillText(track.artist, 256, 198, 300);
    ctx.fillText("SIDE A", 256, 365); ctx.fillText("STEREO   •   33⅓ RPM", 256, 392);
    ctx.fillStyle = colors.vinyl; ctx.beginPath(); ctx.arc(256, 256, 15, 0, Math.PI * 2); ctx.fill();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

export function stainedGlassTexture(colors: ReturnType<typeof sceneColors>) {
  const canvas = document.createElement("canvas");
  canvas.width = 1024; canvas.height = 512;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.fillStyle = colors.glass; ctx.fillRect(0, 0, 1024, 512);
    ctx.strokeStyle = colors.ink; ctx.lineWidth = 4;
    for (let row = 0; row < 5; row++) {
      for (let col = -1; col < 17; col++) {
        const x = col * 64 + (row % 2) * 32, y = row * 102;
        ctx.fillStyle = row === 1 || row === 2 ? (col % 3 ? colors.glow : colors.petal) : (col % 3 ? colors.glass : colors.leaf);
        ctx.beginPath(); ctx.moveTo(x, y);
        ctx.bezierCurveTo(x + 61, y + 14, x + 60, y + 68, x + 32, y + 102);
        ctx.bezierCurveTo(x - 5, y + 74, x - 10, y + 23, x, y);
        ctx.fill(); ctx.stroke();
      }
    }
    for (let i = 0; i < 6000; i++) {
      ctx.globalAlpha = 0.06; ctx.fillStyle = i % 2 ? colors.paper : colors.ink;
      ctx.fillRect((i * 173.31) % 1024, (i * 71.73) % 512, 2, 2);
    }
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}