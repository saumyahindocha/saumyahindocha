"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Html, Lightformer, OrbitControls } from "@react-three/drei";
import { useRef, useState } from "react";
import * as THREE from "three";

/*
  Station Parking, one gate: two-wheelers ride in and out without stopping, each camera's
  capture line flashes as a bike crosses, a detection box appears and the plate read pops up.
  Plates are computer-generated, like the training data. Scene units: metres, illustrative.
  The full gate sim (time-of-day traffic, pipeline overlay, dashboard) is stage 3.
*/

const LANE_Z = { in: -0.85, out: 0.85 } as const;
const SPEED = 2.4;
const SPAN = 7;
const PER_LANE = 3;
const COLORS = ["#c94f3d", "#2f6db5", "#e6e1d3", "#3a3f3c", "#d8a23a", "#4f8a5b"];

let seed = 11;
const rnd = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
const L = "ABCDEFGHJKLMNPRSTUVWXYZ";
const plate = () =>
  `MH ${String(1 + Math.floor(rnd() * 48)).padStart(2, "0")} ${L[Math.floor(rnd() * L.length)]}${
    L[Math.floor(rnd() * L.length)]
  } ${String(Math.floor(rnd() * 9000) + 1000)}`;

const asphalt = new THREE.MeshStandardMaterial({ color: "#2c302e", roughness: 0.95 });
const paint = new THREE.MeshStandardMaterial({ color: "#e9e4d4", roughness: 0.8 });
export const pole = new THREE.MeshStandardMaterial({
  color: "#9aa39e",
  metalness: 0.6,
  roughness: 0.4,
});
export const camBody = new THREE.MeshStandardMaterial({ color: "#e8e6df", roughness: 0.4 });
const tyre = new THREE.MeshStandardMaterial({ color: "#141615", roughness: 0.8 });
const seat = new THREE.MeshStandardMaterial({ color: "#1b1d1c", roughness: 0.6 });

const BIKES = (["in", "out"] as const).flatMap((dir) =>
  Array.from({ length: PER_LANE }, (_, i) => ({
    dir,
    x: -SPAN + (i * 2 * SPAN) / PER_LANE + (dir === "out" ? 1.3 : 0),
    color: COLORS[Math.floor(rnd() * COLORS.length)],
  })),
);

type Read = { id: number; text: string; dir: "in" | "out" };

export function GateScene({ active, reducedMotion }: { active: boolean; reducedMotion: boolean }) {
  return (
    <Canvas
      dpr={[1, 1.5]}
      frameloop={active && !reducedMotion ? "always" : "demand"}
      camera={{ position: [5.5, 6.2, 7.5], fov: 30 }}
      gl={{ antialias: true, alpha: true }}
      style={{ touchAction: "pan-y" }}
    >
      <hemisphereLight args={["#f6f1df", "#0c241a", 0.9]} />
      <directionalLight position={[4, 8, 3]} intensity={1.3} />
      <Environment resolution={64}>
        <Lightformer form="rect" intensity={1.8} position={[0, 6, 3]} scale={[10, 3, 1]} />
      </Environment>
      <Gate />
      <OrbitControls
        target={[0, 0.4, 0]}
        enablePan={false}
        enableZoom={false}
        enableRotate={false}
      />
    </Canvas>
  );
}

function Gate() {
  const [reads, setReads] = useState<Read[]>([]);
  const nextId = useRef(0);
  const flash = useRef({ in: 0, out: 0 });
  const lineIn = useRef<THREE.MeshStandardMaterial>(null);
  const lineOut = useRef<THREE.MeshStandardMaterial>(null);
  const bikes = useRef<(THREE.Group | null)[]>([]);
  const boxes = useRef<(THREE.Mesh | null)[]>([]);
  const state = useRef(BIKES.map((b) => ({ ...b, crossed: false })));

  useFrame((_, dt) => {
    const d = Math.min(dt, 1 / 30);
    state.current.forEach((b, i) => {
      b.x += SPEED * d;
      if (b.x > SPAN) {
        b.x = -SPAN;
        b.crossed = false;
      }
      const worldX = b.dir === "in" ? b.x : -b.x;
      const g = bikes.current[i];
      if (g) g.position.x = worldX;
      const box = boxes.current[i];
      if (box) box.visible = Math.abs(worldX) < 1.6;
      if (!b.crossed && b.x > 0) {
        b.crossed = true;
        flash.current[b.dir] = 1;
        const id = nextId.current++;
        setReads((r) => [...r.slice(-1), { id, text: plate(), dir: b.dir }]);
        window.setTimeout(() => setReads((r) => r.filter((x) => x.id !== id)), 1600);
      }
    });
    flash.current.in = Math.max(0, flash.current.in - d * 1.8);
    flash.current.out = Math.max(0, flash.current.out - d * 1.8);
    if (lineIn.current) lineIn.current.emissiveIntensity = 0.3 + flash.current.in * 2.5;
    if (lineOut.current) lineOut.current.emissiveIntensity = 0.3 + flash.current.out * 2.5;
  });

  return (
    <group>
      {/* Road and lane markings */}
      <mesh material={asphalt} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[2 * SPAN + 1, 3.6]} />
      </mesh>
      {Array.from({ length: 12 }, (_, i) => (
        <mesh
          key={i}
          material={paint}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[-SPAN + 0.6 + i * 1.2, 0.005, 0]}
        >
          <planeGeometry args={[0.6, 0.06]} />
        </mesh>
      ))}
      {[-1.75, 1.75].map((z) => (
        <mesh key={z} material={paint} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, z]}>
          <planeGeometry args={[2 * SPAN + 1, 0.06]} />
        </mesh>
      ))}

      {/* Capture lines */}
      {(["in", "out"] as const).map((dir) => (
        <mesh key={dir} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, LANE_Z[dir]]}>
          <planeGeometry args={[0.08, 1.5]} />
          <meshStandardMaterial
            ref={dir === "in" ? lineIn : lineOut}
            color="#eaa682"
            emissive="#eaa682"
            emissiveIntensity={0.3}
          />
        </mesh>
      ))}

      {/* Camera poles, one per lane */}
      {([-2.1, 2.1] as const).map((z) => (
        <group key={z} position={[z < 0 ? 1.4 : -1.4, 0, z]}>
          <mesh material={pole} position={[0, 1.2, 0]}>
            <cylinderGeometry args={[0.05, 0.06, 2.4, 12]} />
          </mesh>
          <mesh
            material={pole}
            position={[0, 2.38, z < 0 ? 0.3 : -0.3]}
            rotation={[Math.PI / 2, 0, 0]}
          >
            <cylinderGeometry args={[0.03, 0.03, 0.6, 8]} />
          </mesh>
          <group
            position={[0, 2.3, z < 0 ? 0.6 : -0.6]}
            rotation={[0, z < 0 ? -Math.PI / 2 : Math.PI / 2, -0.5]}
          >
            <mesh material={camBody}>
              <boxGeometry args={[0.38, 0.16, 0.18]} />
            </mesh>
            <mesh material={seat} position={[0.2, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.06, 0.06, 0.04, 16]} />
            </mesh>
          </group>
        </group>
      ))}

      {/* Two-wheelers */}
      {BIKES.map((b, i) => (
        <group
          key={i}
          ref={(g) => {
            bikes.current[i] = g;
          }}
          position={[b.dir === "in" ? b.x : -b.x, 0, LANE_Z[b.dir]]}
          rotation={[0, b.dir === "in" ? 0 : Math.PI, 0]}
        >
          <Scooter color={b.color} />
          <mesh
            ref={(m) => {
              boxes.current[i] = m;
            }}
            position={[0, 0.55, 0]}
            visible={false}
          >
            <boxGeometry args={[1.85, 1.15, 0.8]} />
            <meshBasicMaterial color="#eaa682" wireframe transparent opacity={0.85} />
          </mesh>
        </group>
      ))}

      {/* Plate reads */}
      {reads.map((r) => (
        <Html
          key={r.id}
          position={[r.dir === "in" ? 0.6 : -0.6, 1.6, LANE_Z[r.dir]]}
          center
          className="pointer-events-none select-none"
        >
          <div className="rounded-[3px] border border-brass/70 bg-mat-shade/90 px-2 py-1 font-mono text-[10px] leading-tight whitespace-nowrap text-ink">
            <div>{r.text}</div>
            <div className="text-brass">
              {r.dir === "in" ? "IN · session opened" : "OUT · session closed"}
            </div>
          </div>
        </Html>
      ))}
    </group>
  );
}

export function Scooter({ color }: { color: string }) {
  return (
    <group>
      {[-0.55, 0.55].map((x) => (
        <mesh key={x} material={tyre} position={[x, 0.26, 0]}>
          <torusGeometry args={[0.2, 0.07, 10, 24]} />
        </mesh>
      ))}
      <mesh position={[0, 0.42, 0]}>
        <boxGeometry args={[1.0, 0.22, 0.34]} />
        <meshStandardMaterial color={color} roughness={0.4} metalness={0.2} />
      </mesh>
      <mesh material={seat} position={[-0.15, 0.62, 0]}>
        <boxGeometry args={[0.6, 0.1, 0.3]} />
      </mesh>
      <mesh position={[0.5, 0.65, 0]} rotation={[0, 0, -0.35]}>
        <boxGeometry args={[0.12, 0.6, 0.3]} />
        <meshStandardMaterial color={color} roughness={0.4} metalness={0.2} />
      </mesh>
      <mesh material={tyre} position={[0.6, 0.98, 0]}>
        <boxGeometry args={[0.06, 0.06, 0.6]} />
      </mesh>
      {/* Rear number plate */}
      <mesh material={camBody} position={[-0.72, 0.5, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[0.26, 0.14]} />
      </mesh>
    </group>
  );
}
