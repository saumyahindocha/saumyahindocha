"use client";

import { Canvas, useFrame, type ThreeEvent } from "@react-three/fiber";
import {
  ContactShadows,
  Environment,
  Grid,
  Html,
  Lightformer,
  OrbitControls,
  RoundedBox,
} from "@react-three/drei";
import { forwardRef, useImperativeHandle, useMemo, useRef, useState, type RefObject } from "react";
import * as THREE from "three";

/*
  NIDS, built procedurally from the dimensions in the self-balancing-bot repo.
  Scene units: 1 = 100 mm.
    wheels 100 mm × 44 mm, plates 230 × 100 × 6 mm acrylic on M6 rods,
    CoG 108 mm above the axle (matlab/balance_model.m).
  Plate spacing isn't documented; it follows the Fusion 360 screenshot by eye.

  On a tile, the push response uses the dominant closed-loop poles from
  balance_model.m (-2.04 ± 1.83j); the fast pole at -172.3 settles in
  milliseconds and is left out. On the project page, `drive` hands the pose to
  the live sim in src/sims/nids instead, and the floor slides as the wheels roll.
*/

const AXLE_Y = 0.5;
const PLATE_Y = [0.66, 1.3, 2.0];
const SIGMA = 2.04;
const OMEGA_D = 1.83;
const PEAK_DEG = 7;
// Impulse response peak of e^{-σt} sin(ωt) is at t* = atan(ω/σ)/ω.
const T_PEAK = Math.atan(OMEGA_D / SIGMA) / OMEGA_D;
const PEAK_GAIN = Math.exp(-SIGMA * T_PEAK) * Math.sin(OMEGA_D * T_PEAK);

const acrylic = new THREE.MeshPhysicalMaterial({
  color: "#cfe9df",
  roughness: 0.08,
  metalness: 0,
  transparent: true,
  opacity: 0.32,
  clearcoat: 1,
  depthWrite: false,
});
const steel = new THREE.MeshStandardMaterial({ color: "#c9ccc8", metalness: 0.9, roughness: 0.28 });
const rubber = new THREE.MeshStandardMaterial({ color: "#151816", roughness: 0.85 });
const hubWhite = new THREE.MeshStandardMaterial({ color: "#ecebe4", roughness: 0.45 });
const pcbTeal = new THREE.MeshStandardMaterial({ color: "#1b6a6e", roughness: 0.5 });
const pcbRed = new THREE.MeshStandardMaterial({ color: "#b3261e", roughness: 0.5 });
const pcbBlue = new THREE.MeshStandardMaterial({ color: "#1f4fa3", roughness: 0.5 });
const black = new THREE.MeshStandardMaterial({ color: "#1a1a1a", roughness: 0.4, metalness: 0.3 });
const lipo = new THREE.MeshStandardMaterial({ color: "#e0782f", roughness: 0.6 });
const brass = new THREE.MeshStandardMaterial({ color: "#ddb06f", metalness: 0.7, roughness: 0.3 });

export type NidsHandle = { push: (dir?: number) => void };
/** Pose from the live sim: pitch θ (rad, positive leans back toward −z) and wheel travel p (m). */
export type NidsPose = { theta: number; p: number };

const R_WHEEL = 0.05; // m
const UNITS_PER_M = 10;
const FLOOR_CELL = 1.2; // 120 mm, the mat's major grid

export const NidsScene = forwardRef<
  NidsHandle,
  {
    interactive: boolean;
    reducedMotion: boolean;
    onReady?: () => void;
    active: boolean;
    compact?: boolean;
    /** Live-sim mode: the robot follows this pose, and clicks call onPush instead. */
    drive?: RefObject<NidsPose>;
    onPush?: (dir: number) => void;
  }
>(function NidsScene(
  { interactive, reducedMotion, onReady, active, compact = false, drive, onPush },
  ref,
) {
  const bot = useRef<BotHandle>(null);
  useImperativeHandle(ref, () => ({ push: (dir = 1) => bot.current?.push(dir) }));

  return (
    <Canvas
      dpr={[1, 1.75]}
      frameloop={active ? "always" : "never"}
      camera={{
        position: compact ? [4.7, 2.7, 5.5] : [4.4, 2.6, 5.2],
        fov: 32,
        near: 0.1,
        far: 50,
      }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      onCreated={() => onReady?.()}
      style={{ touchAction: interactive ? "none" : "pan-y" }}
    >
      <hemisphereLight args={["#f6f1df", "#0c241a", 0.7]} />
      <directionalLight position={[3, 6, 4]} intensity={1.6} color="#fff6e0" />
      <Environment resolution={128}>
        <Lightformer
          form="rect"
          intensity={2.2}
          position={[0, 5, 2]}
          scale={[8, 3, 1]}
          color="#fff4dc"
        />
        <Lightformer
          form="rect"
          intensity={0.8}
          position={[-5, 2, -2]}
          scale={[4, 4, 1]}
          color="#9fd3b8"
        />
        <Lightformer form="ring" intensity={1.2} position={[4, 3, -3]} scale={2} color="#ffd9a0" />
      </Environment>

      <Bot ref={bot} reducedMotion={reducedMotion} drive={drive} onPush={onPush} />
      {drive && <Floor drive={drive} />}

      <ContactShadows
        position={[0, 0.001, 0]}
        opacity={0.55}
        scale={7}
        blur={2.6}
        far={3}
        color="#04140d"
        frames={reducedMotion ? 1 : Infinity}
      />

      <OrbitControls
        makeDefault
        target={[0, 1.15, 0]}
        enablePan={false}
        enableZoom={false}
        enableRotate={interactive}
        minPolarAngle={Math.PI * 0.18}
        maxPolarAngle={Math.PI * 0.49}
        autoRotate={!reducedMotion && !drive}
        autoRotateSpeed={0.55}
        enableDamping
      />
    </Canvas>
  );
});

export type BotHandle = { push: (dir: number) => void };

/** The robot alone, for scenes that bring their own canvas (the home-page bench). */
export const Bot = forwardRef<
  BotHandle,
  {
    reducedMotion: boolean;
    drive?: RefObject<NidsPose>;
    onPush?: (dir: number) => void;
    /** False when a parent handles hover (the bench), so pointer events reach it. */
    ownHover?: boolean;
    /** The CoG callout; off on the bench, where it would crowd the other builds. */
    labels?: boolean;
  }
>(function Bot({ reducedMotion, drive, onPush: onPushProp, ownHover = true, labels = true }, ref) {
  const body = useRef<THREE.Group>(null);
  const wheels = useRef<THREE.Group[]>([]);
  const pushAt = useRef<number | null>(null);
  const pushDir = useRef(1);
  const clock = useRef(0);
  const roll = useRef(0);
  const [hover, setHover] = useState(false);

  useImperativeHandle(ref, () => ({
    push: (dir: number) => {
      pushDir.current = dir;
      pushAt.current = clock.current;
    },
  }));

  useFrame((_, dt) => {
    if (drive) {
      const pose = drive.current;
      if (body.current) body.current.rotation.x = -pose.theta;
      for (const w of wheels.current) if (w) w.rotation.x = pose.p / R_WHEEL;
      return;
    }
    clock.current += Math.min(dt, 1 / 30);
    let theta = 0;
    let thetaDot = 0;
    if (pushAt.current !== null) {
      const t = clock.current - pushAt.current;
      const k = ((PEAK_DEG * Math.PI) / 180 / PEAK_GAIN) * pushDir.current;
      const e = Math.exp(-SIGMA * t);
      theta = k * e * Math.sin(OMEGA_D * t);
      thetaDot = k * e * (OMEGA_D * Math.cos(OMEGA_D * t) - SIGMA * Math.sin(OMEGA_D * t));
      if (t > 5) pushAt.current = null;
    }
    if (!reducedMotion) {
      // IMU noise and the motor dead zone keep a real balancer from ever sitting still.
      theta += 0.0035 * Math.sin(clock.current * 3.1) + 0.002 * Math.sin(clock.current * 7.7);
    }
    if (body.current) body.current.rotation.x = theta;
    // The wheels drive under the body to catch it.
    roll.current += thetaDot * 0.9 * Math.min(dt, 1 / 30) * 6;
    for (const w of wheels.current) if (w) w.rotation.x = roll.current;
  });

  const onPush = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (onPushProp) {
      // A click on the front face shoves the top backwards, and vice versa.
      onPushProp(e.point.z >= 0 ? 1 : -1);
      return;
    }
    pushDir.current = e.point.z >= 0 ? -1 : 1;
    pushAt.current = clock.current;
  };

  return (
    <group
      onClick={onPush}
      onPointerOver={
        ownHover
          ? (e) => {
              e.stopPropagation();
              setHover(true);
              document.body.style.cursor = "pointer";
            }
          : undefined
      }
      onPointerOut={
        ownHover
          ? () => {
              setHover(false);
              document.body.style.cursor = "";
            }
          : undefined
      }
    >
      {/* Wheels and motors stay on the axle; the body pitches about it. */}
      {[-1, 1].map((side) => (
        <group
          key={side}
          position={[side * 1.43, AXLE_Y, 0]}
          ref={(g) => {
            if (g) wheels.current[side < 0 ? 0 : 1] = g;
          }}
        >
          <Wheel />
        </group>
      ))}

      <group ref={body} position={[0, AXLE_Y, 0]}>
        <group position={[0, -AXLE_Y, 0]}>
          {/* Motors along the axle, under the bottom plate */}
          {[-1, 1].map((side) => (
            <group key={side} position={[side * 0.72, AXLE_Y, 0]} rotation={[0, 0, Math.PI / 2]}>
              <mesh material={steel}>
                <cylinderGeometry args={[0.17, 0.17, 0.62, 28]} />
              </mesh>
              <mesh material={black} position={[0, side * 0.38, 0]}>
                <cylinderGeometry args={[0.18, 0.18, 0.14, 28]} />
              </mesh>
            </group>
          ))}
          {/* Motor brackets */}
          {[-1, 1].map((side) => (
            <mesh key={side} material={steel} position={[side * 0.95, 0.58, 0]}>
              <boxGeometry args={[0.04, 0.2, 0.42]} />
            </mesh>
          ))}

          {/* Plates */}
          {PLATE_Y.map((y) => (
            <RoundedBox
              key={y}
              args={[2.3, 0.06, 1.0]}
              radius={0.015}
              position={[0, y + 0.03, 0]}
              material={acrylic}
            />
          ))}

          {/* M6 rods with nuts */}
          {[
            [-1.05, -0.42],
            [1.05, -0.42],
            [-1.05, 0.42],
            [1.05, 0.42],
          ].map(([x, z]) => (
            <group key={`${x}${z}`} position={[x, 0, z]}>
              <mesh material={steel} position={[0, 1.39, 0]}>
                <cylinderGeometry args={[0.03, 0.03, 1.56, 10]} />
              </mesh>
              {PLATE_Y.flatMap((y) => [y - 0.02, y + 0.08]).map((y) => (
                <mesh key={y} material={steel} position={[0, y, 0]}>
                  <cylinderGeometry args={[0.058, 0.058, 0.04, 6]} />
                </mesh>
              ))}
            </group>
          ))}

          {/* L298N with its heatsink on the bottom plate */}
          <group position={[0.35, 0.72, 0.05]}>
            <mesh material={pcbRed}>
              <boxGeometry args={[0.43, 0.025, 0.43]} />
            </mesh>
            {Array.from({ length: 7 }, (_, i) => (
              <mesh key={i} material={black} position={[-0.15 + i * 0.05, 0.13, -0.08]}>
                <boxGeometry args={[0.012, 0.23, 0.2]} />
              </mesh>
            ))}
            {[-0.12, 0.12].map((x) => (
              <mesh key={x} material={pcbBlue} position={[x, 0.05, 0.15]}>
                <boxGeometry args={[0.14, 0.08, 0.08]} />
              </mesh>
            ))}
          </group>

          {/* Arduino Mega and MPU6500 on the middle plate */}
          <group position={[-0.15, 1.375, 0]}>
            <mesh material={pcbTeal}>
              <boxGeometry args={[1.02, 0.02, 0.53]} />
            </mesh>
            <mesh material={black} position={[0, 0.04, -0.23]}>
              <boxGeometry args={[0.9, 0.07, 0.03]} />
            </mesh>
            <mesh material={black} position={[0.1, 0.04, 0.23]}>
              <boxGeometry args={[0.7, 0.07, 0.03]} />
            </mesh>
            <mesh material={black} position={[0.05, 0.025, 0]}>
              <boxGeometry args={[0.14, 0.02, 0.14]} />
            </mesh>
            <mesh material={steel} position={[-0.47, 0.05, -0.12]}>
              <boxGeometry args={[0.12, 0.1, 0.14]} />
            </mesh>
          </group>
          <mesh material={pcbBlue} position={[0.7, 1.375, 0.12]}>
            <boxGeometry args={[0.2, 0.02, 0.16]} />
          </mesh>

          {/* 3S LiPo on the top plate, strapped */}
          <RoundedBox
            args={[1.38, 0.26, 0.44]}
            radius={0.04}
            position={[0, 2.19, 0]}
            material={lipo}
          />
          <mesh material={black} position={[0.35, 2.19, 0]}>
            <boxGeometry args={[0.06, 0.28, 0.46]} />
          </mesh>

          <Wires />

          {/* Centre of gravity, 108 mm above the axle */}
          <mesh material={brass} position={[0, AXLE_Y + 1.08, 0.55]}>
            <sphereGeometry args={[0.05, 20, 14]} />
          </mesh>
          {labels && (
            <Html
              position={[0, AXLE_Y + 1.08, 0.55]}
              center
              distanceFactor={7}
              className="pointer-events-none select-none"
              zIndexRange={[20, 0]}
            >
              <span className="ml-12 font-mono text-[10px] whitespace-nowrap text-brass">
                CoG · 108 mm above axle
              </span>
            </Html>
          )}
        </group>
      </group>

      {hover && (
        <Html position={[0, 2.75, 0]} center className="pointer-events-none select-none">
          <span className="rounded-[3px] bg-mat-shade/80 px-2 py-1 font-mono text-[10px] whitespace-nowrap text-ink">
            click to push
          </span>
        </Html>
      )}
    </group>
  );
});

/** The floor slides under the robot as the wheels roll, so the robot stays in frame. */
function Floor({ drive }: { drive: RefObject<NidsPose> }) {
  const grid = useRef<THREE.Group>(null);
  useFrame(() => {
    if (!grid.current) return;
    const z = drive.current.p * UNITS_PER_M;
    grid.current.position.z = -(((z % FLOOR_CELL) + FLOOR_CELL) % FLOOR_CELL);
  });
  return (
    <group ref={grid}>
      <Grid
        position={[0, 0.002, 0]}
        args={[12, 12]}
        cellSize={0.12}
        cellThickness={0.6}
        cellColor="#3d6b57"
        sectionSize={FLOOR_CELL}
        sectionThickness={1}
        sectionColor="#6f9a83"
        fadeDistance={11}
        fadeStrength={1.6}
      />
    </group>
  );
}

function Wheel() {
  const tread = useMemo(() => {
    const g = new THREE.CylinderGeometry(0.5, 0.5, 0.44, 48, 1, true);
    return g;
  }, []);
  return (
    <group rotation={[0, 0, Math.PI / 2]}>
      <mesh geometry={tread} material={rubber} />
      {/* Tread ribs */}
      {Array.from({ length: 36 }, (_, i) => {
        const a = (i / 36) * Math.PI * 2;
        return (
          <mesh
            key={i}
            material={rubber}
            position={[Math.cos(a) * 0.505, 0, Math.sin(a) * 0.505]}
            rotation={[0, -a, 0]}
          >
            <boxGeometry args={[0.03, 0.42, 0.035]} />
          </mesh>
        );
      })}
      {/* White hub faces with spokes */}
      {[-1, 1].map((s) => (
        <group key={s} position={[0, s * 0.2, 0]}>
          <mesh material={hubWhite}>
            <cylinderGeometry args={[0.4, 0.4, 0.04, 40]} />
          </mesh>
          <mesh material={steel} position={[0, s * 0.03, 0]}>
            <cylinderGeometry args={[0.07, 0.07, 0.03, 20]} />
          </mesh>
        </group>
      ))}
      <mesh material={hubWhite}>
        <cylinderGeometry args={[0.41, 0.41, 0.36, 40, 1, true]} />
      </mesh>
    </group>
  );
}

function Wires() {
  const curves = useMemo(() => {
    const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
    return [
      {
        c: "#d8b33a",
        pts: [v(-0.4, 1.38, 0.2), v(-0.2, 1.1, 0.45), v(0.2, 0.9, 0.4), v(0.3, 0.76, 0.2)],
      },
      {
        c: "#c0392b",
        pts: [v(0.3, 2.06, 0.15), v(0.8, 1.7, 0.45), v(0.9, 1.0, 0.4), v(0.5, 0.76, 0.2)],
      },
      {
        c: "#2b6cb0",
        pts: [v(-0.6, 1.38, -0.2), v(-0.9, 1.0, -0.45), v(-0.75, 0.66, -0.3), v(-0.72, 0.55, -0.1)],
      },
      {
        c: "#27ae60",
        pts: [v(0.1, 1.38, -0.2), v(0.5, 1.15, -0.48), v(0.75, 0.75, -0.3), v(0.72, 0.6, -0.1)],
      },
      { c: "#e8e8e8", pts: [v(0.6, 1.38, 0.1), v(0.7, 1.45, 0.3), v(0.7, 1.4, 0.15)] },
    ];
  }, []);
  return (
    <>
      {curves.map(({ c, pts }) => (
        <mesh key={c}>
          <tubeGeometry args={[new THREE.CatmullRomCurve3(pts), 40, 0.012, 6, false]} />
          <meshStandardMaterial color={c} roughness={0.6} />
        </mesh>
      ))}
    </>
  );
}
