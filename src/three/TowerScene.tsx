"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Lightformer, OrbitControls } from "@react-three/drei";
import { useMemo, useRef, type RefObject } from "react";
import * as THREE from "three";

/*
  A mechanical-draft cooling tower for the SS Filters tile: hot water sprays down through
  the fill, the fan pulls air up, cold water collects in the basin. Illustrative geometry
  (the repo has no tower dimensions). On the project page `drive` links it to the
  live model in src/sims/tower: the fill and basin water dirty with fouling, the
  fan follows the load and the water falls with the flow.
*/

export type TowerDrive = { fouling: number; load: number; flowFrac: number };

const FILL_CLEAN = new THREE.Color("#a9bda4");
const FILL_FOULED = new THREE.Color("#7a5a32");
const WATER_CLEAN = new THREE.Color("#5fb3d9");
const WATER_FOULED = new THREE.Color("#6f7a52");

const DROPS = 260;
const TOP = 2.1; // spray header height
const BASIN = 0.25;

const casing = new THREE.MeshStandardMaterial({
  color: "#c9d3cc",
  roughness: 0.55,
  metalness: 0.2,
});
const louver = new THREE.MeshStandardMaterial({ color: "#8fa39a", roughness: 0.6 });
const frp = new THREE.MeshStandardMaterial({ color: "#dfe4df", roughness: 0.4 });
const dark = new THREE.MeshStandardMaterial({ color: "#1c2722", roughness: 0.5, metalness: 0.4 });
const hot = new THREE.MeshStandardMaterial({ color: "#d9773a", roughness: 0.4, metalness: 0.3 });
const cold = new THREE.MeshStandardMaterial({ color: "#3a86c8", roughness: 0.4, metalness: 0.3 });
const water = new THREE.MeshPhysicalMaterial({
  color: "#5fb3d9",
  roughness: 0.1,
  transparent: true,
  opacity: 0.6,
});
const fill = new THREE.MeshStandardMaterial({
  color: "#a9bda4",
  roughness: 0.8,
  transparent: true,
  opacity: 0.35,
});

export function TowerScene({
  active,
  reducedMotion,
  drive,
  interactive = false,
}: {
  active: boolean;
  reducedMotion: boolean;
  drive?: RefObject<TowerDrive>;
  interactive?: boolean;
}) {
  return (
    <Canvas
      dpr={[1, 1.5]}
      frameloop={active && !reducedMotion ? "always" : "demand"}
      camera={{ position: drive ? [6.4, 3.9, 7.4] : [5.2, 3.4, 6.0], fov: 30 }}
      gl={{ antialias: true, alpha: true }}
      style={{ touchAction: interactive ? "none" : "pan-y" }}
    >
      <hemisphereLight args={["#f6f1df", "#0c241a", 0.8]} />
      <directionalLight position={[3, 5, 3]} intensity={1.4} />
      <Environment resolution={64}>
        <Lightformer form="rect" intensity={2} position={[0, 4, 2]} scale={[6, 2, 1]} />
      </Environment>
      <Tower drive={drive} />
      <OrbitControls
        target={[0, 1.4, 0]}
        enablePan={false}
        enableZoom={false}
        enableRotate={interactive}
        enableDamping
        autoRotate={!reducedMotion && !drive}
        autoRotateSpeed={0.8}
      />
    </Canvas>
  );
}

// Deterministic scatter of water drops; positions are advanced in useFrame.
function makeDrops() {
  let n = 7;
  const rnd = () => ((n = (n * 16807) % 2147483647) - 1) / 2147483646;
  return Array.from({ length: DROPS }, () => ({
    x: (rnd() - 0.5) * 1.5,
    z: (rnd() - 0.5) * 1.5,
    y: BASIN + rnd() * (TOP - BASIN),
    v: 0.9 + rnd() * 0.6,
  }));
}

export function Tower({ drive }: { drive?: RefObject<TowerDrive> }) {
  const fan = useRef<THREE.Group>(null);
  const drops = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const seeds = useRef(makeDrops()).current;

  useFrame((_, dt) => {
    const d = Math.min(dt, 1 / 30);
    const live = drive?.current;
    if (fan.current) fan.current.rotation.y += d * 6 * (live ? live.load / 0.7 : 1);
    if (live) {
      fill.color.lerpColors(FILL_CLEAN, FILL_FOULED, live.fouling);
      water.color.lerpColors(WATER_CLEAN, WATER_FOULED, live.fouling * 0.85);
    } else {
      // The materials are shared with the tile, so put them back to clean.
      fill.color.copy(FILL_CLEAN);
      water.color.copy(WATER_CLEAN);
    }
    const flow = live ? live.flowFrac : 1;
    const m = drops.current;
    if (!m) return;
    seeds.forEach((s, i) => {
      s.y -= s.v * d * flow;
      if (s.y < BASIN) s.y = TOP;
      dummy.position.set(s.x, s.y, s.z);
      dummy.scale.set(1, 2.4, 1);
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
    });
    m.instanceMatrix.needsUpdate = true;
  });

  return (
    <group>
      {/* Basin */}
      <mesh material={dark} position={[0, 0.12, 0]}>
        <boxGeometry args={[2.1, 0.24, 2.1]} />
      </mesh>
      <mesh material={water} position={[0, 0.245, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[1.9, 1.9]} />
      </mesh>

      {/* Corner posts and the casing panels above the air inlet */}
      {[
        [-0.9, -0.9],
        [0.9, -0.9],
        [-0.9, 0.9],
        [0.9, 0.9],
      ].map(([x, z]) => (
        <mesh key={`${x}${z}`} material={casing} position={[x, 1.25, z]}>
          <boxGeometry args={[0.08, 2.0, 0.08]} />
        </mesh>
      ))}
      {/* Back two walls solid, front two open so the inside shows */}
      <mesh material={casing} position={[0, 1.55, -0.9]}>
        <boxGeometry args={[1.8, 1.4, 0.03]} />
      </mesh>
      <mesh material={casing} position={[-0.9, 1.55, 0]}>
        <boxGeometry args={[0.03, 1.4, 1.8]} />
      </mesh>
      {/* Air-inlet louvers along the bottom of every side */}
      {[0, 1, 2, 3].map((side) => (
        <group key={side} rotation={[0, (side * Math.PI) / 2, 0]}>
          {[0.45, 0.6, 0.75].map((y) => (
            <mesh key={y} material={louver} position={[0, y, 0.9]} rotation={[0.6, 0, 0]}>
              <boxGeometry args={[1.8, 0.02, 0.14]} />
            </mesh>
          ))}
        </group>
      ))}

      {/* Fill pack */}
      <mesh material={fill} position={[0, 1.15, 0]}>
        <boxGeometry args={[1.7, 0.5, 1.7]} />
      </mesh>

      {/* Spray header */}
      <mesh material={hot} position={[0, TOP + 0.05, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.05, 0.05, 1.8, 12]} />
      </mesh>
      {/* Hot water in, cold water out */}
      <mesh material={hot} position={[1.4, TOP + 0.05, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.07, 0.07, 1.0, 14]} />
      </mesh>
      <mesh material={cold} position={[1.4, 0.12, 0.5]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.07, 0.07, 1.0, 14]} />
      </mesh>

      {/* Deck and fan stack */}
      <mesh material={casing} position={[0, 2.27, 0]}>
        <boxGeometry args={[1.9, 0.06, 1.9]} />
      </mesh>
      <mesh material={frp} position={[0, 2.62, 0]}>
        <cylinderGeometry args={[0.62, 0.7, 0.66, 40, 1, true]} />
      </mesh>
      <group ref={fan} position={[0, 2.5, 0]}>
        <mesh material={dark}>
          <cylinderGeometry args={[0.08, 0.08, 0.1, 16]} />
        </mesh>
        {[0, 1, 2].map((i) => (
          <mesh
            key={i}
            material={dark}
            rotation={[0.25, (i * Math.PI) / 3, 0]}
            position={[0, 0, 0]}
          >
            <boxGeometry args={[1.12, 0.015, 0.12]} />
          </mesh>
        ))}
      </group>

      {/* Falling water */}
      <instancedMesh ref={drops} args={[undefined, undefined, DROPS]} material={water}>
        <sphereGeometry args={[0.016, 6, 4]} />
      </instancedMesh>
    </group>
  );
}
