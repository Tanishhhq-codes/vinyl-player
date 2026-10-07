import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { sceneColors, stainedGlassTexture } from "@/lib/room-textures";

type Props = { colors: ReturnType<typeof sceneColors>; glow: THREE.Color; intensity: number; reactive: boolean; playing: boolean; reducedMotion: boolean; night: boolean; on: boolean; onToggle: () => void };

export function ArtisanLamp({ colors, glow, intensity, reactive, playing, reducedMotion, night, on, onToggle }: Props) {
  const glass = useMemo(() => stainedGlassTexture(colors), [colors]);
  const light = useRef<THREE.PointLight>(null);
  const shade = useRef<THREE.MeshPhysicalMaterial>(null);
  const profile = useMemo(() => [new THREE.Vector2(0.77, 0), new THREE.Vector2(0.79, 0.05), new THREE.Vector2(0.75, 0.22), new THREE.Vector2(0.64, 0.43), new THREE.Vector2(0.45, 0.64), new THREE.Vector2(0.20, 0.78), new THREE.Vector2(0.07, 0.81)], []);
  useEffect(() => () => glass.dispose(), [glass]);
  useFrame(({ clock }, delta) => {
    const beat = reactive && playing && !reducedMotion ? 1 + Math.pow(Math.max(0, Math.sin(clock.elapsedTime * Math.PI * 3.2)), 6) * 0.12 : 1;
    if (light.current) light.current.intensity = THREE.MathUtils.damp(light.current.intensity, intensity * beat, 5, Math.min(delta, 0.05));
    if (shade.current) shade.current.emissiveIntensity = THREE.MathUtils.damp(shade.current.emissiveIntensity, on ? (night ? 0.65 : 0.28) * beat : 0, 5, Math.min(delta, 0.05));
  });
  return <group position={[4.05, 0.44, -2.0]} onClick={e => { e.stopPropagation(); onToggle(); }}>
    <mesh position-y={0.08} castShadow><cylinderGeometry args={[0.44, 0.52, 0.16, 48]} /><meshStandardMaterial color={colors.ink} metalness={0.7} roughness={0.28} /></mesh>
    <mesh position-y={0.18} castShadow><cylinderGeometry args={[0.3, 0.42, 0.1, 48]} /><meshStandardMaterial color={colors.brass} metalness={0.8} roughness={0.32} /></mesh>
    <mesh position-y={0.35} castShadow><sphereGeometry args={[0.19, 32, 20]} /><meshStandardMaterial color={colors.ink} metalness={0.6} roughness={0.3} /></mesh>
    <mesh position-y={1.19} castShadow><cylinderGeometry args={[0.055, 0.1, 1.65, 32]} /><meshStandardMaterial color={colors.brass} metalness={0.85} roughness={0.28} /></mesh>
    <mesh position-y={2.0}><sphereGeometry args={[0.12, 24, 16]} /><meshStandardMaterial color={colors.paper} emissive={glow} emissiveIntensity={on ? 1.4 : 0} /></mesh>
    <mesh position-y={1.92} castShadow><latheGeometry args={[profile, 64]} /><meshPhysicalMaterial ref={shade} map={glass} emissiveMap={glass} emissive={colors.paper} emissiveIntensity={0.28} roughness={0.28} metalness={0.08} clearcoat={0.7} clearcoatRoughness={0.2} side={THREE.DoubleSide} /></mesh>
    <mesh position-y={1.95} rotation-x={Math.PI / 2}><torusGeometry args={[0.78, 0.025, 8, 64]} /><meshStandardMaterial color={colors.brass} metalness={0.85} roughness={0.3} /></mesh>
    <mesh position-y={2.79}><sphereGeometry args={[0.07, 24, 16]} /><meshStandardMaterial color={colors.brass} metalness={0.85} roughness={0.25} /></mesh>
    <pointLight ref={light} position={[0, 2.0, 0]} color={glow} intensity={intensity} distance={night ? 14 : 7} decay={2} />
  </group>;
}