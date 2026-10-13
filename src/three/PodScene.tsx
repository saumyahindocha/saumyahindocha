"use client";

import { Canvas, useFrame, type ThreeEvent } from "@react-three/fiber";
import {
  ContactShadows,
  Environment,
  Html,
  Lightformer,
  OrbitControls,
  RoundedBox,
  useTexture,
} from "@react-three/drei";
import { useRef, useState } from "react";
import * as THREE from "three";

/*
  Pod, from the iPOD repo (docs/pcb-plan.md): device about 57 × 115 × 24 mm, 52 × 109 mm board
  with the Pico 2 W in a 23 mm strip at the top, the 2.8" 240×320 screen module below it facing
  down onto the board, the PCM5102 DAC near the jack at the bottom right, and a 503450
  (5 × 34 × 50 mm) 1000 mAh LiPo on the underside, planned. Scene units: 1 = 10 mm.
  Tap or click to explode it into layers. The screen shows the "Poster" Now Playing design.
*/

const shell = new THREE.MeshStandardMaterial({
  color: "#2a2f2c",
  roughness: 0.55,
  metalness: 0.15,
});
const bezel = new THREE.MeshStandardMaterial({ color: "#121614", roughness: 0.35, metalness: 0.2 });
const frame = new THREE.MeshStandardMaterial({ color: "#2a2f2c", roughness: 0.5, metalness: 0.15 });
const perf = new THREE.MeshStandardMaterial({ color: "#a8693a", roughness: 0.7 });
const pico = new THREE.MeshStandardMaterial({ color: "#1f7a3a", roughness: 0.5 });
const redPcb = new THREE.MeshStandardMaterial({ color: "#c0261c", roughness: 0.5 });
const purple = new THREE.MeshStandardMaterial({ color: "#3b2a6b", roughness: 0.5 });
const silver = new THREE.MeshStandardMaterial({ color: "#c9ccc8", metalness: 0.9, roughness: 0.3 });
const lipoMat = new THREE.MeshStandardMaterial({
  color: "#c9c3b2",
  roughness: 0.4,
  metalness: 0.3,
});

// [assembled z, exploded z] for each layer, front to back.
const LAYERS = {
  bezel: [0.9, 4.4],
  screen: [0.95, 3.1],
  board: [0.25, 1.4],
  battery: [-0.35, -0.6],
  shell: [-0.2, -2.2],
} as const;

export function PodScene({ active, reducedMotion }: { active: boolean; reducedMotion: boolean }) {
  return (
    <Canvas
      dpr={[1, 1.5]}
      frameloop={active ? "always" : "never"}
      camera={{ position: [17, 6, 23], fov: 32 }}
      gl={{ antialias: true, alpha: true }}
      style={{ touchAction: "pan-y" }}
    >
      <hemisphereLight args={["#f6f1df", "#0c241a", 0.8]} />
      <directionalLight position={[5, 8, 6]} intensity={1.5} />
      <Environment resolution={64}>
        <Lightformer form="rect" intensity={2} position={[0, 6, 4]} scale={[10, 3, 1]} />
        <Lightformer
          form="rect"
          intensity={0.7}
          position={[-6, 2, -2]}
          scale={[4, 4, 1]}
          color="#9fd3b8"
        />
      </Environment>
      <Pod reducedMotion={reducedMotion} />
      <ContactShadows
        position={[0, -6.2, 0]}
        opacity={0.5}
        scale={20}
        blur={2.4}
        far={8}
        color="#04140d"
      />
      <OrbitControls
        target={[0, 0, 0.5]}
        enablePan={false}
        enableZoom={false}
        autoRotate={!reducedMotion}
        autoRotateSpeed={0.7}
        enableDamping
      />
    </Canvas>
  );
}

function Pod({ reducedMotion }: { reducedMotion: boolean }) {
  const [exploded, setExploded] = useState(false);
  const k = useRef(0);
  const bezelRef = useRef<THREE.Group>(null);
  const screenRef = useRef<THREE.Group>(null);
  const boardRef = useRef<THREE.Group>(null);
  const batteryRef = useRef<THREE.Group>(null);
  const shellRef = useRef<THREE.Group>(null);
  const art = useTexture("/media/pod-screen-poster.webp", (t) => {
    t.colorSpace = THREE.SRGBColorSpace;
  });

  useFrame((_, dt) => {
    const target = exploded ? 1 : 0;
    k.current = reducedMotion ? target : THREE.MathUtils.damp(k.current, target, 6, dt);
    const layers = [
      [bezelRef, "bezel"],
      [screenRef, "screen"],
      [boardRef, "board"],
      [batteryRef, "battery"],
      [shellRef, "shell"],
    ] as const;
    layers.forEach(([ref, name]) => {
      const g = ref.current;
      if (g) g.position.z = THREE.MathUtils.lerp(LAYERS[name][0], LAYERS[name][1], k.current);
    });
  });

  const toggle = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    setExploded((v) => !v);
  };

  return (
    <group onClick={toggle} rotation={[0, -0.35, 0]}>
      {/* Front bezel: a frame around the screen */}
      <group ref={bezelRef}>
        {/* Frame pieces around the 43.2 × 57.6 mm active area (centre y = -1.0) */}
        {[
          [0, 3.82, 5.7, 3.86],
          [0, -4.82, 5.7, 1.86],
          [-2.53, -1.0, 0.64, 5.78],
          [2.53, -1.0, 0.64, 5.78],
        ].map(([x, y, w, h]) => (
          <mesh key={`${x}${y}`} material={frame} position={[x, y, 0]}>
            <boxGeometry args={[w, h, 0.15]} />
          </mesh>
        ))}
        {exploded && <Label at={[-4.0, 3.6, 0]} text="front bezel" left />}
      </group>

      {/* Screen module: red PCB, 2.8" panel showing the Poster Now Playing screen */}
      <group ref={screenRef}>
        <mesh material={redPcb} position={[0, -1.2, -0.1]}>
          <boxGeometry args={[5.0, 8.6, 0.12]} />
        </mesh>
        <mesh position={[0, -1.0, 0.02]}>
          <planeGeometry args={[4.32, 5.76]} />
          <meshBasicMaterial map={art} toneMapped={false} />
        </mesh>
        {exploded && <Label at={[3.2, 0.6, 0]} text={'2.8" 240×320 touch screen'} />}
      </group>

      {/* Perfboard with the Pico 2 W in the top strip and the DAC near the bottom */}
      <group ref={boardRef}>
        <mesh material={perf}>
          <boxGeometry args={[5.2, 10.9, 0.16]} />
        </mesh>
        <group position={[0, 4.3, 0.15]}>
          <mesh material={pico}>
            <boxGeometry args={[5.1, 2.1, 0.1]} />
          </mesh>
          <mesh material={silver} position={[1.6, 0, 0.1]}>
            <boxGeometry args={[1.1, 1.0, 0.12]} />
          </mesh>
          <mesh material={bezel} position={[-0.3, 0, 0.09]}>
            <boxGeometry args={[0.7, 0.7, 0.08]} />
          </mesh>
          <mesh material={silver} position={[-2.45, 0, 0.1]}>
            <boxGeometry args={[0.5, 0.75, 0.25]} />
          </mesh>
        </group>
        <group position={[1.3, -4.1, 0.15]}>
          <mesh material={purple}>
            <boxGeometry args={[1.8, 1.4, 0.1]} />
          </mesh>
          <mesh material={bezel} position={[0.4, -0.75, 0.25]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.3, 0.3, 0.6, 16]} />
          </mesh>
        </group>
        {exploded && (
          <>
            <Label at={[3.4, 4.3, 0]} text="Pico 2 W" />
            <Label at={[3.4, -4.1, 0]} text="PCM5102 DAC" />
          </>
        )}
      </group>

      {/* 503450 LiPo on the underside */}
      <group ref={batteryRef}>
        <RoundedBox
          args={[3.4, 5.0, 0.5]}
          radius={0.12}
          material={lipoMat}
          position={[0, -1.6, 0]}
        />
        {exploded && <Label at={[-3.8, -1.2, 0]} text="1000 mAh LiPo (planned)" left />}
      </group>

      {/* Back shell */}
      <group ref={shellRef}>
        <RoundedBox
          args={[5.7, 11.5, 1.9]}
          radius={0.5}
          smoothness={4}
          material={shell}
          position={[0, 0, -0.1]}
        />
        {exploded && <Label at={[-4.0, -5.8, 0]} text="57 × 115 × 24 mm" left />}
      </group>
    </group>
  );
}

function Label({
  at,
  text,
  left = false,
}: {
  at: [number, number, number];
  text: string;
  left?: boolean;
}) {
  return (
    <Html position={at} className="pointer-events-none select-none" zIndexRange={[20, 0]}>
      <span
        className={`${left ? "absolute right-0 mr-1" : "ml-1"} -translate-y-1/2 rounded-[3px] bg-mat-shade/80 px-1.5 py-0.5 font-mono text-[10px] whitespace-nowrap text-ink`}
      >
        {text}
      </span>
    </Html>
  );
}
