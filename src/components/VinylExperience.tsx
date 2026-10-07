import { Canvas } from "@react-three/fiber";
import { Music, LampDesk, Shuffle, Pause, Play, RotateCcw, Settings2, SkipBack, SkipForward, X } from "lucide-react";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { trackFromFile } from "@/lib/local-music";
import { sendPcCommand, usePcSync } from "@/lib/pc-sync";
import { MonitorSmartphone } from "lucide-react";
import type { Track } from "@/lib/vinyl-data";
import { formatTime, tracks } from "@/lib/vinyl-data";
import { IconButton } from "@/components/ui/IconButton";
import { VinylScene } from "@/components/VinylScene";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { defaultSettings, loadSettings, saveSettings, scenes, wallStyles, finishStyles, type Settings } from "@/lib/scenes";
import { SceneRecovery, SceneStatus } from "@/components/SceneRecovery";

export function VinylExperience() {
  const [trackIndex, setTrackIndex] = useState(0);
  const [playingState, setPlaying] = useState(true);
  const [positionState, setPosition] = useState(124);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => { setSettings(loadSettings()); setLoaded(true); }, []);
  useEffect(() => { if (loaded) saveSettings(settings); }, [settings, loaded]);
  const set = <K extends keyof Settings>(k: K, v: Settings[K]) => setSettings((cur) => ({ ...cur, [k]: v }));
  const { roomLight, speed, sceneScale, ambientMotion } = settings;
  const scene = scenes.find((x) => x.id === settings.sceneId) ?? scenes[0];
  const perf = settings.performance;
  const [reducedMotion, setReducedMotion] = useState(false);
  const [sceneReady, setSceneReady] = useState(false);
  const [sceneFailed, setSceneFailed] = useState(false);
  const [sceneAttempt, setSceneAttempt] = useState(0);
  const markSceneReady = useCallback(() => setSceneReady(true), []);
  const retryScene = () => { setSceneReady(false); setSceneFailed(false); setSceneAttempt(current => current + 1); };
  const [library, setLibrary] = useState<Track[]>(tracks);
  const audioRef = useRef<HTMLAudioElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const live = usePcSync(settings.pcSync);
  const liveOn = live.status === "connected" && !!live.track;
  const track = liveOn ? live.track : (library[trackIndex] ?? library[0]);
  const isLocal = !liveOn && !!track?.src;
  const playing = liveOn ? live.playing : playingState;
  const position = liveOn ? Math.min(live.position, track?.duration ?? 0) : positionState;
  const togglePlay = () => liveOn ? sendPcCommand("toggle") : setPlaying(v => !v);
  const addFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    const loaded = await Promise.all([...files].filter(f => f.type.startsWith("audio") || /\.(mp3|m4a|flac|wav|ogg|aac)$/i.test(f.name)).map(trackFromFile));
    if (!loaded.length) return;
    setLibrary(cur => { const local = cur.filter(t => t.src); setTrackIndex(local.length); return [...local, ...loaded]; });
    setPosition(0); setPlaying(true);
  };
  useEffect(() => {
    const a = audioRef.current; if (!a) return;
    if (!isLocal) { a.pause(); return; }
    if (playing) a.play().catch(() => setPlaying(false)); else a.pause();
  }, [playing, isLocal, track]);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!playing || !track || isLocal || liveOn) return;
    const timer = window.setInterval(() => {
      setPosition((current) => (current >= track.duration ? 0 : current + 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [playing, track, isLocal, liveOn]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSettingsOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (!track || !scene) return null;

  const shuffleRoom = () => {
    const pick = <T,>(items: T[], current: T) => {
      const options = items.filter(x => x !== current);
      return options[Math.floor(Math.random() * options.length)] ?? current;
    };
    setSettings(cur => ({ ...cur, wallStyle: pick(wallStyles.map(x => x.id), cur.wallStyle), floorStyle: pick(finishStyles.map(x => x.id), cur.floorStyle), deskStyle: pick(finishStyles.map(x => x.id), cur.deskStyle) }));
  };

  function switchTrack(direction: number) {
    if (liveOn) { sendPcCommand(direction > 0 ? "next" : "previous"); return; }
    setTrackIndex((current) => (current + direction + library.length) % library.length);
    setPosition(0);
    setPlaying(true);
  }

  return (
    <main className={`vinyl-app scene-${scene.id} floor-${settings.floorStyle}`}>
      <div className="scene-layer">
        <SceneRecovery key={sceneAttempt} onRetry={retryScene}>
        {sceneFailed ? <SceneStatus failed onRetry={retryScene} /> : <>
        {!sceneReady && <SceneStatus />}
        <Canvas key={perf} shadows={perf !== "battery"} dpr={perf === "quality" ? [1, 2] : 1} camera={{ position: [0.35, 6.5, 12], fov: 44 }} gl={{ antialias: true, powerPreference: "default" }} fallback={<SceneStatus failed onRetry={retryScene} />} onCreated={({ gl }) => {
          gl.domElement.addEventListener("webglcontextlost", (event) => { event.preventDefault(); setSceneFailed(true); }, { once: true });
        }}>
          <Suspense fallback={null}>
          <VinylScene
            track={track}
            playing={playing}
            speed={speed}
            roomLight={roomLight}
            sceneScale={sceneScale}
            ambientMotion={ambientMotion}
            reducedMotion={reducedMotion}
            scene={scene}
            reactive={settings.reactive}
            cameraHeight={settings.cameraHeight}
            fov={settings.fov}
            settings={settings}
            onTogglePlayback={togglePlay}
            onToggleLamp={() => set("lampOn", !settings.lampOn)}
            onToggleLid={() => set("lidOpen", !settings.lidOpen)}
             onReady={markSceneReady}
          />
          </Suspense>
        </Canvas>
        </>}
        </SceneRecovery>
      </div>

      <header className="topbar">
        <div className="brand-lockup">
          <span className="brand-mark" aria-hidden="true"><i /><i /><i /></span>
          <span>Vinyl</span>
        </div>
        <div className="scene-options" role="group" aria-label="Scene">
          {scenes.map((x) => (
            <Button key={x.id} size="sm" variant={scene.id === x.id ? "default" : "ghost"} aria-pressed={scene.id === x.id} onClick={() => set("sceneId", x.id)}>
              {x.name}
            </Button>
          ))}
        </div>
        <div className="room-actions">
        <IconButton label={settings.pcSync ? "Disconnect from my PC" : "Connect to my PC"} active={settings.pcSync} onClick={() => set("pcSync", !settings.pcSync)}><MonitorSmartphone size={18} /></IconButton>
        <IconButton label="Play my music" onClick={() => fileRef.current?.click()}><Music size={18} /></IconButton>
        <input ref={fileRef} type="file" accept="audio/*" multiple hidden onChange={e => { void addFiles(e.target.files); e.target.value = ""; }} />
        <IconButton label="Shuffle room" onClick={shuffleRoom}><Shuffle size={18} /></IconButton>
        <IconButton label="Toggle lamp" active={settings.lampOn} onClick={() => set("lampOn", !settings.lampOn)}><LampDesk size={18} /></IconButton>
        <IconButton label={settingsOpen ? "Close settings" : "Open settings"} active={settingsOpen} onClick={() => setSettingsOpen((open) => !open)}>
          {settingsOpen ? <X size={18} /> : <Settings2 size={18} />}
        </IconButton>
        </div>
      </header>

      {settings.pcSync && live.status === "searching" && <div className="pc-status" role="status">Looking for the Vinyl helper on this PC… start it, then keep this page open.</div>}
      <section className={`now-playing ${sceneReady && !sceneFailed ? "" : "scene-unavailable"}`} aria-label="Now playing">
        <div className="eyebrow"><span className={playing ? "live-dot" : "live-dot paused"} /> {playing ? "Now playing" : "Paused"}{liveOn && live.app ? ` · from ${live.app}` : ""}</div>
        <div key={track.title} className="track-copy"><h1>{track.title}</h1>
        <p>{track.artist} <span>·</span> {track.album}</p></div>
      </section>
      <div className={`equalizer ${playing ? "" : "equalizer-paused"}`} aria-hidden="true"><i /><i /><i /><i /></div>

      <audio ref={audioRef} src={track.src} onTimeUpdate={e => setPosition(Math.floor(e.currentTarget.currentTime))} onEnded={() => switchTrack(1)} />
      <section className="transport" aria-label="Playback controls">
        <div className="timeline-row">
          <span>{formatTime(position)}</span>
          <input
            aria-label="Track position"
            type="range"
            min="0"
            max={track.duration}
            value={position}
            onChange={(event) => { const v = Number(event.target.value); setPosition(v); if (isLocal && audioRef.current) audioRef.current.currentTime = v; }}
            style={{ "--progress": `${(position / track.duration) * 100}%` } as React.CSSProperties}
          />
          <span>{formatTime(track.duration)}</span>
        </div>
        <div className="transport-buttons">
          <IconButton label="Previous track" onClick={() => switchTrack(-1)}><SkipBack size={20} fill="currentColor" /></IconButton>
          <IconButton label={playing ? "Pause" : "Play"} className="play-button" onClick={togglePlay}>
            {playing ? <Pause size={23} fill="currentColor" /> : <Play size={23} fill="currentColor" />}
          </IconButton>
          <IconButton label="Next track" onClick={() => switchTrack(1)}><SkipForward size={20} fill="currentColor" /></IconButton>
        </div>
      </section>

      <aside className={`settings-panel ${settingsOpen ? "settings-open" : ""}`} aria-hidden={!settingsOpen} inert={!settingsOpen}>
        <div className="panel-header">
          <div><span>Scene controls</span><h2>Listening room</h2></div>
          <IconButton label="Close settings" onClick={() => setSettingsOpen(false)}><X size={18} /></IconButton>
        </div>
        <label>Background
          <select aria-label="Background" value={settings.wallStyle} onChange={e => set("wallStyle", e.target.value as Settings["wallStyle"])}>{wallStyles.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}</select>
        </label>
        <label>Floor
          <select aria-label="Floor" value={settings.floorStyle} onChange={e => set("floorStyle", e.target.value as Settings["floorStyle"])}>{finishStyles.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}</select>
        </label>
        <label>Desktop finish
          <select aria-label="Desktop finish" value={settings.deskStyle} onChange={e => set("deskStyle", e.target.value as Settings["deskStyle"])}>{finishStyles.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}</select>
        </label>
        <div className="toggle-row"><strong>Open dust cover</strong><Switch aria-label="Open dust cover" checked={settings.lidOpen} onCheckedChange={v => set("lidOpen", v)} /></div>
        <div className="toggle-row"><strong>Neon mood lights</strong><Switch aria-label="Neon mood lights" checked={settings.moodLights} onCheckedChange={v => set("moodLights", v)} /></div>
        <label>Room light <output>{Math.round(roomLight * 100)}%</output>
          <input type="range" min="0.55" max="1.45" step="0.05" value={roomLight} onChange={(event) => set("roomLight", Number(event.target.value))} />
        </label>
        <label>Record speed <output>{speed.toFixed(1)}×</output>
          <input type="range" min="0.6" max="1.5" step="0.1" value={speed} onChange={(event) => set("speed", Number(event.target.value))} />
        </label>
        <label>Scene scale <output>{Math.round(sceneScale * 100)}%</output>
          <input type="range" min="0.82" max="1.12" step="0.02" value={sceneScale} onChange={(event) => set("sceneScale", Number(event.target.value))} />
        </label>
        <label>Camera height <output>{settings.cameraHeight > 0 ? "+" : ""}{Math.round(settings.cameraHeight * 100)}</output>
          <input type="range" min="-0.5" max="0.5" step="0.05" value={settings.cameraHeight} onChange={(event) => set("cameraHeight", Number(event.target.value))} />
        </label>
        <label>Field of view <output>{settings.fov}°</output>
          <input type="range" min="30" max="60" step="1" value={settings.fov} onChange={(event) => set("fov", Number(event.target.value))} />
        </label>
        <label>Performance <output>{perf}</output>
          <select value={perf} onChange={(event) => set("performance", event.target.value as Settings["performance"])}>
            <option value="quality">Quality</option><option value="balanced">Balanced</option><option value="battery">Battery saver</option>
          </select>
        </label>
        <div className="toggle-row">
          <div><strong>React to music</strong></div>
          <Switch aria-label="Toggle music-reactive lighting" checked={settings.reactive} onCheckedChange={(v) => set("reactive", v)} />
        </div>
        <div className="toggle-row">
          <div><strong>Ambient motion</strong></div>
          <Switch aria-label="Toggle ambient motion" checked={ambientMotion} onCheckedChange={(v) => set("ambientMotion", v)} />
        </div>
        <Button variant="outline" className="reset-button" onClick={() => setSettings({ ...defaultSettings, sceneId: scene.id })}>
          <RotateCcw size={15} /> Reset scene
        </Button>
      </aside>

    </main>
  );
}