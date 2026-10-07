import { Environment, Lightformer, RoundedBox, useTexture } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import type { Track } from "@/lib/vinyl-data";
import type { ScenePreset, SceneView, Settings } from "@/lib/scenes";
import { coverTexture, finishTexture, recordLabel, sceneColors, surfaceTexture } from "@/lib/room-textures";
import { ArtisanLamp } from "@/components/ArtisanLamp";
import wallpaperUrl from "@/assets/gallery-wallpaper.jpg";
import albumUrl from "@/assets/gallery-album.jpg";
import jazzUrl from "@/assets/jazz-wall.jpg";
import decoUrl from "@/assets/deco-wall.jpg";

type VinylSceneProps = { track: Track; playing: boolean; speed: number; roomLight: number; sceneScale: number; ambientMotion: boolean; reducedMotion: boolean; scene: ScenePreset; reactive: boolean; cameraHeight: number; fov: number; onReady: () => void; settings: Settings; onTogglePlayback: () => void; onToggleLamp: () => void; onToggleLid: () => void };
type Colors = ReturnType<typeof sceneColors>;

function PlatterStrobes({ colors }: { colors: Colors }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  useEffect(() => {
    if (!ref.current) return;
    const dummy = new THREE.Object3D();
    for (let i = 0; i < 160; i++) {
      const a = (i % 80) / 80 * Math.PI * 2;
      dummy.position.set(-0.55 + Math.cos(a) * 1.402, 0.245 + Math.floor(i / 80) * 0.075, Math.sin(a) * 1.402);
      dummy.rotation.set(0, -a, 0); dummy.updateMatrix();
      ref.current.setMatrixAt(i, dummy.matrix);
    }
    ref.current.instanceMatrix.needsUpdate = true;
  }, []);
  return <instancedMesh ref={ref} args={[undefined, undefined, 160]}><sphereGeometry args={[0.014, 6, 4]} /><meshStandardMaterial color={colors.ink} metalness={0.6} roughness={0.4} /></instancedMesh>;
}

function Sleeve({ texture, colors }: { texture: THREE.Texture; colors: Colors }) {
  const ref = useRef<THREE.Group>(null);
  const reveal = useRef(0);
  useEffect(() => { reveal.current = 0; }, [texture]);
  useFrame((_, delta) => {
    reveal.current = THREE.MathUtils.damp(reveal.current, 1, 5, Math.min(delta, 0.05));
    if (ref.current) {
      ref.current.position.y = 1.94 - (1 - reveal.current) * 0.16;
      ref.current.rotation.y = 0.16 + (1 - reveal.current) * 0.16;
    }
  });
  return <group ref={ref} position={[-3.05, 1.94, -0.9]} rotation={[-0.08, 0.16, 0]}>
    <RoundedBox args={[2.76, 2.76, 0.055]} radius={0.015} smoothness={3} castShadow><meshStandardMaterial color={colors.paper} roughness={0.85} /></RoundedBox>
    <mesh position-z={0.029}><planeGeometry args={[2.72, 2.72]} /><meshStandardMaterial map={texture} roughness={0.75} /></mesh>
  </group>;
}

function Turntable({ texture, colors, playing, speed, lidOpen, onTogglePlayback, onToggleLid }: { texture: THREE.Texture; colors: Colors; playing: boolean; speed: number; lidOpen: boolean; onTogglePlayback: () => void; onToggleLid: () => void }) {
  const record = useRef<THREE.Group>(null);
  const lid = useRef<THREE.Group>(null);
  const arm = useRef<THREE.Group>(null);
  const velocity = useRef(0);
  const grooves = useMemo(() => surfaceTexture("grooves", colors), [colors]);
  const metal = useMemo(() => surfaceTexture("metal", colors), [colors]);
  const curve = useMemo(() => new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0.15, 0), new THREE.Vector3(-0.34, 0.15, 0.1), new THREE.Vector3(-0.73, 0.15, 0.48), new THREE.Vector3(-1.16, 0.15, 0.75), new THREE.Vector3(-1.44, 0.15, 0.75)]), []);
  useEffect(() => () => { grooves.dispose(); metal.dispose(); }, [grooves, metal]);
  useFrame((_, rawDelta) => {
    const dt = Math.min(rawDelta, 0.05);
    if (lid.current) lid.current.rotation.x = THREE.MathUtils.damp(lid.current.rotation.x, lidOpen ? -0.22 : -Math.PI / 2, 4, dt);
    velocity.current = THREE.MathUtils.damp(velocity.current, playing ? 3.49 * speed : 0, playing ? 2.4 : 3, dt);
    if (record.current) record.current.rotation.y -= velocity.current * dt;
    if (arm.current) {
      arm.current.rotation.y = THREE.MathUtils.damp(arm.current.rotation.y, playing ? -0.36 : -1.03, 3, dt);
      arm.current.position.y = THREE.MathUtils.damp(arm.current.position.y, playing ? 0.48 : 0.6, 4, dt);
    }
  });
  return <group position={[1.65, 0.69, 0.35]} rotation-y={-0.075}>
    {([-1.9, 1.9] as number[]).flatMap(x => [-1.25, 1.25].map(z => <mesh key={`${x}-${z}`} position={[x, -0.09, z]} castShadow><cylinderGeometry args={[0.23, 0.2, 0.24, 32]} /><meshStandardMaterial color={colors.ink} metalness={0.5} roughness={0.35} /></mesh>))}
    <RoundedBox args={[4.9, 0.28, 3.45]} radius={0.06} smoothness={4} castShadow receiveShadow><meshPhysicalMaterial color={colors.enamel} roughness={0.21} metalness={0.35} clearcoat={1} clearcoatRoughness={0.12} /></RoundedBox>
    <RoundedBox args={[4.92, 0.025, 3.47]} position-y={0.09} radius={0.025} smoothness={3}><meshStandardMaterial color={colors.silver} metalness={0.95} roughness={0.18} /></RoundedBox>
    <RoundedBox args={[4.8, 0.04, 3.35]} position-y={0.16} radius={0.025} smoothness={3} receiveShadow><meshStandardMaterial color={colors.silver} map={metal} metalness={0.68} roughness={0.38} /></RoundedBox>
    <mesh position={[-0.55, 0.29, 0]} castShadow><cylinderGeometry args={[1.4, 1.4, 0.22, 128]} /><meshStandardMaterial color={colors.silver} metalness={0.92} roughness={0.22} /></mesh>
    <PlatterStrobes colors={colors} />
    <mesh position={[-0.55, 0.413, 0]}><cylinderGeometry args={[1.37, 1.37, 0.028, 96]} /><meshStandardMaterial color={colors.ink} roughness={0.92} /></mesh>
    <group ref={record} position={[-0.55, 0.44, 0]} onClick={e => { e.stopPropagation(); onTogglePlayback(); }}>
      <mesh castShadow><cylinderGeometry args={[1.36, 1.36, 0.028, 128]} /><meshPhysicalMaterial color={colors.vinyl} metalness={0.22} roughness={0.2} clearcoat={0.8} /></mesh>
      <mesh rotation-x={-Math.PI / 2} position-y={0.016}><circleGeometry args={[1.35, 128]} /><meshPhysicalMaterial map={grooves} metalness={0.45} roughness={0.22} clearcoat={1} clearcoatRoughness={0.16} /></mesh>
      <mesh rotation-x={-Math.PI / 2} position-y={0.019}><circleGeometry args={[0.38, 64]} /><meshStandardMaterial map={texture} roughness={0.75} /></mesh>
    </group>
    <mesh position={[-0.55, 0.49, 0]}><cylinderGeometry args={[0.026, 0.04, 0.12, 24]} /><meshStandardMaterial color={colors.silver} metalness={1} roughness={0.18} /></mesh>
    <mesh position={[1.48, 0.28, -1.14]} castShadow><cylinderGeometry args={[0.25, 0.29, 0.22, 48]} /><meshStandardMaterial color={colors.ink} metalness={0.7} roughness={0.24} /></mesh>
    <group ref={arm} position={[1.48, 0.48, -1.14]} rotation-y={-0.36}>
      <mesh castShadow><tubeGeometry args={[curve, 48, 0.039, 12, false]} /><meshStandardMaterial color={colors.silver} metalness={0.95} roughness={0.17} /></mesh>
      <mesh position={[0.22, 0.15, -0.09]} rotation-z={Math.PI / 2} castShadow><cylinderGeometry args={[0.135, 0.135, 0.32, 32]} /><meshStandardMaterial color={colors.ink} metalness={0.5} roughness={0.26} /></mesh>
      <mesh position={[-1.51, 0.1, 0.75]} castShadow><boxGeometry args={[0.28, 0.12, 0.16]} /><meshStandardMaterial color={colors.ink} roughness={0.38} /></mesh>
      <mesh position={[-1.58, 0.025, 0.75]}><boxGeometry args={[0.1, 0.035, 0.08]} /><meshStandardMaterial color={colors.teal} /></mesh>
      <mesh position={[-1.58, -0.005, 0.75]}><cylinderGeometry args={[0.008, 0.003, 0.05, 8]} /><meshStandardMaterial color={colors.brass} metalness={0.8} roughness={0.25} /></mesh>
    </group>
    <mesh position={[1.45, 0.19, 0.58]}><boxGeometry args={[0.065, 0.015, 1]} /><meshStandardMaterial color={colors.ink} /></mesh>
    <mesh position={[1.45, 0.22, 0.64]} castShadow><boxGeometry args={[0.24, 0.07, 0.13]} /><meshStandardMaterial color={colors.silver} metalness={0.8} roughness={0.25} /></mesh>
    <mesh position={[-1.97, 0.22, 1.3]} castShadow onClick={e => { e.stopPropagation(); onTogglePlayback(); }}><cylinderGeometry args={[0.12, 0.12, 0.07, 32]} /><meshStandardMaterial color={colors.ink} metalness={0.5} /></mesh>
    <mesh position={[-1.72, 0.191, 1.32]} rotation-x={-Math.PI / 2}><circleGeometry args={[0.022, 16]} /><meshBasicMaterial color={colors.teal} /></mesh>
    {([[-2.12, -1.38], [2.12, -1.38], [-2.12, 1.38], [2.12, 1.38]] as [number, number][]).map(([x, z], i) => <mesh key={i} position={[x, 0.188, z]}><cylinderGeometry args={[0.034, 0.034, 0.01, 12]} /><meshStandardMaterial color={colors.ink} metalness={0.8} roughness={0.3} /></mesh>)}
    <group ref={lid} position={[0, 0.2, -1.62]} rotation-x={-0.22} onClick={e => { e.stopPropagation(); onToggleLid(); }}>
      <RoundedBox args={[4.74, 2.85, 0.04]} position-y={1.43} radius={0.07} smoothness={3}><meshPhysicalMaterial color={colors.silver} transparent opacity={0.12} depthWrite={false} roughness={0.12} metalness={0.15} side={THREE.DoubleSide} /></RoundedBox>
      {[-2.25, 2.25].map(x => <mesh key={x} position={[x, 0.03, 0.06]}><boxGeometry args={[0.23, 0.1, 0.18]} /><meshStandardMaterial color={colors.ink} metalness={0.6} roughness={0.3} /></mesh>)}
    </group>
  </group>;
}

function CameraMotion({ enabled, scale, reducedMotion, view, height, fov }: { enabled: boolean; scale: number; reducedMotion: boolean; view: SceneView; height: number; fov: number }) {
  const { camera, size } = useThree();
  const target = useRef(new THREE.Vector3(0.1, 1.35, -0.3));
  useFrame(({ clock, pointer }, rawDelta) => {
    const dt = Math.min(rawDelta, 0.05);
    const aspect = size.width / size.height;
    const fit = 1 / Math.min(1, aspect);
    const motion = enabled && !reducedMotion;
    const drift = motion ? Math.sin(clock.elapsedTime * 0.12) * 0.1 : 0;
    const px = motion ? pointer.x : 0, py = motion ? pointer.y : 0;
    const desk = view === "desk";
    const cam = camera as THREE.PerspectiveCamera;
    if (Math.abs(cam.fov - fov) > 0.01) { cam.fov = THREE.MathUtils.damp(cam.fov, fov, 3, dt); cam.updateProjectionMatrix(); }
    const goal = desk
      ? new THREE.Vector3(0.2 + px * 0.15 + drift, (13.5 * fit) / scale, 1.3 + height * 2 + py * 0.1)
      : new THREE.Vector3(0.35 + px * 0.22 + drift, 6.5 + height * 3 + py * 0.12, (12 * fit) / scale);
    const look = desk ? new THREE.Vector3(0.2, 0.7, 0.2) : new THREE.Vector3(0.1, 1.35, -0.3);
    camera.position.x = THREE.MathUtils.damp(camera.position.x, goal.x, 2.2, dt);
    camera.position.y = THREE.MathUtils.damp(camera.position.y, goal.y, 2.2, dt);
    camera.position.z = THREE.MathUtils.damp(camera.position.z, goal.z, 2.2, dt);
    target.current.lerp(look, 1 - Math.exp(-2.2 * dt));
    camera.lookAt(target.current);
  });
  return null;
}

function WindowBlinds({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return <group position={[-3, 9, 3]} rotation={[0, 0.5, 0]}>
    {[-3, -1.2, 0.6, 2.4].map(x => <mesh key={x} position={[x, 0, 0]} castShadow><boxGeometry args={[0.55, 0.05, 14]} /><meshBasicMaterial colorWrite={false} depthWrite={false} /></mesh>)}
  </group>;
}

export function VinylScene(props: VinylSceneProps) {
  const colors = useMemo(sceneColors, []);
  const { wallpaper, photo, jazz, deco } = useTexture({ wallpaper: wallpaperUrl, photo: albumUrl, jazz: jazzUrl, deco: decoUrl });
  const wall = useMemo(() => { const t = (props.settings.wallStyle === "deco" ? deco : wallpaper).clone(); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(3.3, 1.6); t.colorSpace = THREE.SRGBColorSpace; t.needsUpdate = true; return t; }, [wallpaper, deco, props.settings.wallStyle]);
  const gallery = useMemo(() => { const t = jazz.clone(); t.colorSpace = THREE.SRGBColorSpace; t.needsUpdate = true; return t; }, [jazz]);
  const plaster = useMemo(() => finishTexture("plaster", colors), [colors]);
  const floor = useMemo(() => finishTexture(props.settings.floorStyle, colors, true), [props.settings.floorStyle, colors]);
  const cover = useMemo(() => coverTexture(photo.image, props.track, colors), [photo, props.track, colors]);
  const label = useMemo(() => recordLabel(props.track, colors), [props.track, colors]);
  const wood = useMemo(() => finishTexture(props.settings.deskStyle, colors), [props.settings.deskStyle, colors]);
  useEffect(() => { props.onReady(); }, [props.onReady]);
  useEffect(() => () => { wall.dispose(); wood.dispose(); }, [wall, wood]);
  useEffect(() => () => { plaster.dispose(); gallery.dispose(); }, [plaster, gallery]);
  useEffect(() => () => floor.dispose(), [floor]);
  useEffect(() => () => cover.dispose(), [cover]);
  useEffect(() => () => label.dispose(), [label]);
  const s = props.scene;
  const accent = props.reactive ? props.track.palette[1] : colors.teal;
  const lampColor = props.reactive ? new THREE.Color(colors[s.lampGlow as keyof Colors] ?? colors.glow).lerp(new THREE.Color(props.track.palette[2]), 0.35) : new THREE.Color(colors[s.lampGlow as keyof Colors] ?? colors.glow);
  const c = (name: string) => colors[name as keyof Colors] ?? colors.paper;
  return <>
    <color attach="background" args={[c(s.background)]} />
    <ambientLight intensity={s.ambient * props.roomLight} />
    <directionalLight position={s.blinds ? [-4, 10, 5] : [-5, 8, 6]} intensity={s.key * props.roomLight} color={c(s.keyLight)} castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024} shadow-camera-left={-9} shadow-camera-right={9} shadow-camera-top={8} shadow-camera-bottom={-5} shadow-normalBias={0.025} shadow-bias={-0.0001} shadow-radius={4} />
    <Environment key={`${s.id}-${accent}`} resolution={128}>
      <Lightformer intensity={s.id === "after-hours" ? 0.6 : 3} position={[-5, 6, 3]} scale={[5, 7, 1]} color={c(s.keyLight)} />
      <Lightformer intensity={s.id === "after-hours" ? 0.4 : 1.8} position={[4, 4, 2]} rotation-y={-Math.PI / 2} scale={[3, 6, 1]} color={c(s.keyLight)} />
      <Lightformer intensity={0.9} position={[0, 5, -3]} rotation-x={Math.PI / 2} scale={[8, 2, 1]} color={accent} />
      <Lightformer intensity={2} position={[-1, 7, 3]} rotation-x={Math.PI / 2} scale={[6, 0.65, 1]} color={colors.paper} />
    </Environment>
    <mesh position={[0, 4, -3.3]} receiveShadow><planeGeometry args={[40, 20]} /><meshStandardMaterial map={s.wallpaper && (props.settings.wallStyle === "botanical" || props.settings.wallStyle === "deco") ? wall : plaster} roughness={0.96} /></mesh>
    {s.wallpaper && props.settings.wallStyle === "jazz" && <mesh position={[0, 4.9, -3.28]}><planeGeometry args={[11.5, 7.67]} /><meshStandardMaterial map={gallery} roughness={0.9} /></mesh>}
    <mesh position={[0, -2.36, -3.23]}><boxGeometry args={[40, 0.16, 0.09]} /><meshStandardMaterial color={colors.paper} /></mesh>
    <mesh position={[0, -2.5, 5]} rotation-x={-Math.PI / 2} receiveShadow><planeGeometry args={[50, 50]} /><meshStandardMaterial map={floor} roughness={props.settings.floorStyle === "marble" ? 0.3 : 0.68} /></mesh>
    <RoundedBox position={[0, 0.26, 0]} args={[11.8, 0.35, 6]} radius={0.07} smoothness={3} receiveShadow castShadow><meshPhysicalMaterial map={wood} roughness={props.settings.deskStyle === "marble" ? 0.25 : 0.5} clearcoat={0.22} /></RoundedBox>
    {[-5.3, 5.3].flatMap(x => [-2.35, 2.35].map(z => <mesh key={`${x}-${z}`} position={[x, -1.14, z]} castShadow><boxGeometry args={[0.14, 2.45, 0.14]} /><meshStandardMaterial color={colors.ink} metalness={0.65} roughness={0.3} /></mesh>))}
    {props.settings.moodLights && <>
      <mesh position={[0, 0.04, 2.97]}><boxGeometry args={[11.2, 0.025, 0.025]} /><meshBasicMaterial color={colors.neon} /></mesh>
      <pointLight position={[-4, -0.3, 1]} color={colors.neon} intensity={18} distance={8} /><pointLight position={[4, 2, -2.8]} color={colors.blue} intensity={20} distance={9} />
    </>}
    <Sleeve texture={cover} colors={colors} />
    <mesh position={[-3.05, 0.5, -0.74]} castShadow><boxGeometry args={[2.95, 0.1, 0.5]} /><meshStandardMaterial color={colors.ink} metalness={0.6} roughness={0.35} /></mesh>
    <Turntable texture={label} colors={colors} playing={props.playing} speed={props.speed} lidOpen={props.settings.lidOpen} onTogglePlayback={props.onTogglePlayback} onToggleLid={props.onToggleLid} />
    <ArtisanLamp colors={colors} glow={lampColor} intensity={props.settings.lampOn ? s.lamp * props.roomLight : 0} reactive={props.reactive} playing={props.playing} reducedMotion={props.reducedMotion} night={s.id === "after-hours"} on={props.settings.lampOn} onToggle={props.onToggleLamp} />
    <WindowBlinds visible={s.blinds} />
    <CameraMotion enabled={props.ambientMotion} scale={props.sceneScale} reducedMotion={props.reducedMotion} view={s.view} height={props.cameraHeight} fov={props.fov} />
  </>;
}
