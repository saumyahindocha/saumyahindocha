"use client";

import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { ContactShadows, Environment, Lightformer } from "@react-three/drei";
import { Suspense, useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import * as THREE from "three";
import { Bot, type BotHandle } from "./NidsScene";
import { Pod } from "./PodScene";
import { Tower } from "./TowerScene";
import { Scooter, camBody, pole } from "./GateScene";

/*
  The home-page bench: all four builds laid out on the mat at once, the way I'd put parts
  down to show someone. Same procedural models as the project tiles, drawn to one scale
  where the repos give real sizes (NIDS and Pod: 1 unit = 100 mm × 0.6). The tower and the
  parking gate are illustrative and sized to sit comfortably next to them.

  Hover lifts a build and names it; a click hands its key to `onPick` (the page scrolls to
  that chapter). As the hero scrolls away (`progress` 0 to 1) the camera rises from a
  three-quarter view to looking straight down at the bench.
*/

export type BenchKey =
  "nids-self-balancing-robot" | "station-parking" | "ss-filters-energy-audit" | "pod";

const LABEL: Record<BenchKey, string> = {
  "nids-self-balancing-robot": "NIDS, self-balancing robot",
  "station-parking": "Station Parking, ANPR gate",
  "ss-filters-energy-audit": "Cooling-tower energy audit",
  pod: "Pod, music player",
};

const SILK: Record<BenchKey, string> = {
  "nids-self-balancing-robot": "SH-01 NIDS",
  "station-parking": "SH-02 ANPR",
  "ss-filters-energy-audit": "SH-03 SSF",
  pod: "SH-04 POD",
};

const CAM_FROM = new THREE.Vector3(0.3, 4.0, 9.3);
const CAM_TO = new THREE.Vector3(0, 11.5, 1.4);
const LOOK_FROM = new THREE.Vector3(0, 0.15, 0.1);
const LOOK_TO = new THREE.Vector3(0, 0, -0.2);

export function BenchScene({
  active,
  reducedMotion,
  progress,
  onPick,
}: {
  active: boolean;
  reducedMotion: boolean;
  progress: RefObject<number>;
  onPick: (key: BenchKey) => void;
}) {
  const [hover, setHover] = useState<BenchKey | null>(null);
  const labels = useRef<Partial<Record<BenchKey, HTMLSpanElement | null>>>({});
  return (
    <div className="relative size-full">
      <Canvas
        dpr={[1, 1.75]}
        frameloop={active ? "always" : "never"}
        camera={{ position: CAM_FROM.toArray(), fov: 30, near: 0.1, far: 60 }}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        style={{ touchAction: "pan-y" }}
      >
        <hemisphereLight args={["#f6f1df", "#0c241a", 0.75]} />
        <directionalLight position={[3, 7, 4]} intensity={1.5} color="#fff6e0" />
        <Environment resolution={128}>
          <Lightformer
            form="rect"
            intensity={2.2}
            position={[0, 6, 3]}
            scale={[10, 3, 1]}
            color="#fff4dc"
          />
          <Lightformer
            form="rect"
            intensity={0.8}
            position={[-6, 2, -2]}
            scale={[4, 4, 1]}
            color="#9fd3b8"
          />
          <Lightformer
            form="ring"
            intensity={1.1}
            position={[5, 3, -3]}
            scale={2}
            color="#ffd9a0"
          />
        </Environment>

        <Rig progress={progress} reducedMotion={reducedMotion} />
        <Builds
          reducedMotion={reducedMotion}
          onPick={onPick}
          hover={hover}
          setHover={setHover}
          labels={labels}
        />

        <ContactShadows
          position={[0, 0.001, 0]}
          opacity={0.6}
          scale={14}
          blur={2.4}
          far={3.5}
          resolution={512}
          color="#04140d"
          frames={reducedMotion ? 1 : Infinity}
        />
      </Canvas>
      {/* Labels are plain DOM over the canvas; each Item moves its own every frame. */}
      <div
        aria-hidden
        data-bench-labels
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        {(Object.keys(SILK) as BenchKey[]).map((k) => (
          <span
            key={k}
            ref={(el) => {
              labels.current[k] = el;
            }}
            className={`absolute top-0 left-0 rounded-[3px] border px-1.5 py-0.5 font-mono text-[10px] tracking-[0.12em] whitespace-nowrap uppercase opacity-0 transition-[color,border-color,background-color] duration-300 ${hover === k ? "border-copper/70 bg-mat-shade/90 text-copper" : "border-transparent text-sage"}`}
          >
            {hover === k ? `${LABEL[k]} ↓` : SILK[k]}
          </span>
        ))}
      </div>
    </div>
  );
}

/** Camera: scroll raises it to a top-down view; the pointer adds a little parallax. */
function Rig({ progress, reducedMotion }: { progress: RefObject<number>; reducedMotion: boolean }) {
  const camera = useThree((s) => s.camera);
  const aspect = useThree((s) => s.size.width / Math.max(1, s.size.height));
  const look = useRef(LOOK_FROM.clone());
  const pos = useRef(new THREE.Vector3());
  const eased = useRef(0);
  useFrame((state, dt) => {
    const p = progress.current ?? 0;
    eased.current = reducedMotion ? p : THREE.MathUtils.damp(eased.current, p, 5, dt);
    const k = THREE.MathUtils.smootherstep(eased.current, 0, 1);
    pos.current.lerpVectors(CAM_FROM, CAM_TO, k);
    // Narrow frames (phones) pull the camera back so all four builds still fit across.
    const fit = Math.max(1, 1.0 / aspect);
    if (fit > 1) pos.current.sub(LOOK_FROM).multiplyScalar(fit).add(LOOK_FROM);
    if (!reducedMotion) {
      pos.current.x += state.pointer.x * 0.6 * (1 - k);
      pos.current.y += state.pointer.y * 0.25 * (1 - k);
    }
    camera.position.lerp(pos.current, reducedMotion ? 1 : 1 - Math.exp(-6 * dt));
    look.current.lerpVectors(LOOK_FROM, LOOK_TO, k);
    camera.lookAt(look.current);
  });
  return null;
}

type Labels = RefObject<Partial<Record<BenchKey, HTMLSpanElement | null>>>;

function Builds({
  reducedMotion,
  onPick,
  hover,
  setHover,
  labels,
}: {
  reducedMotion: boolean;
  onPick: (key: BenchKey) => void;
  hover: BenchKey | null;
  setHover: (f: (h: BenchKey | null) => BenchKey | null) => void;
  labels: Labels;
}) {
  const bot = useRef<BotHandle>(null);
  const podExplode = useRef(0);

  // NIDS gets a nudge now and then, so the balancing is visible without a click.
  useEffect(() => {
    if (reducedMotion) return;
    let dir = 1;
    const first = window.setTimeout(() => bot.current?.push(dir), 1400);
    const every = window.setInterval(() => {
      dir = -dir;
      bot.current?.push(dir);
    }, 6500);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(every);
    };
  }, [reducedMotion]);

  useFrame((_, dt) => {
    const target = hover === "pod" ? 0.75 : 0;
    podExplode.current = reducedMotion
      ? target
      : THREE.MathUtils.damp(podExplode.current, target, 5, dt);
  });

  const item = (key: BenchKey) => ({
    k: key,
    hovered: hover === key,
    onHover: (on: boolean) => setHover((h) => (on ? key : h === key ? null : h)),
    onPick,
    reducedMotion,
    labels,
  });

  return (
    <>
      <Item
        {...item("nids-self-balancing-robot")}
        position={[-1.75, 0, 0.25]}
        rotationY={0.5}
        labelY={1.4}
      >
        <group scale={0.48}>
          <Bot
            ref={bot}
            reducedMotion={reducedMotion}
            ownHover={false}
            labels={false}
            onPush={() => onPick("nids-self-balancing-robot")}
          />
        </group>
      </Item>

      <Item {...item("pod")} position={[0.45, 0.02, 1.45]} rotationY={-0.3} labelY={0.45}>
        {/* Lying on its back, screen up, the way a phone sits on a bench. */}
        <group rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.07, 0]} scale={0.075}>
          <Suspense fallback={null}>
            <Pod
              reducedMotion={reducedMotion}
              focus={false}
              bare
              explodeRef={podExplode}
              onCaseClick={() => onPick("pod")}
            />
          </Suspense>
        </group>
      </Item>

      <Item
        {...item("ss-filters-energy-audit")}
        position={[1.85, 0, -0.35]}
        rotationY={-0.6}
        labelY={1.55}
      >
        <group scale={0.42}>
          <Tower />
        </group>
      </Item>

      <Item {...item("station-parking")} position={[-0.2, 0, -1.55]} rotationY={0.12} labelY={1.1}>
        <MiniGate reducedMotion={reducedMotion} />
      </Item>
    </>
  );
}

/** One build on the bench: lifts on hover, names itself, and reports clicks. */
function Item({
  k,
  hovered,
  onHover,
  onPick,
  position,
  rotationY,
  labelY,
  reducedMotion,
  labels,
  children,
}: {
  labels: Labels;
  k: BenchKey;
  hovered: boolean;
  onHover: (on: boolean) => void;
  onPick: (key: BenchKey) => void;
  position: [number, number, number];
  rotationY: number;
  labelY: number;
  reducedMotion: boolean;
  children: ReactNode;
}) {
  const lift = useRef<THREE.Group>(null);
  const at = useRef(new THREE.Vector3());
  useFrame(({ camera, size }, dt) => {
    const g = lift.current;
    if (!g) return;
    const target = hovered ? 0.22 : 0;
    g.position.y = reducedMotion ? target : THREE.MathUtils.damp(g.position.y, target, 7, dt);
    // Pin the label above the build: project its top to screen pixels.
    const el = labels.current?.[k];
    if (!el) return;
    g.updateWorldMatrix(true, false);
    at.current.set(0, labelY, 0).applyMatrix4(g.matrixWorld).project(camera);
    const x = ((at.current.x + 1) / 2) * size.width;
    const y = ((1 - at.current.y) / 2) * size.height;
    place(el, x, y);
  });
  return (
    <group
      position={position}
      rotation={[0, rotationY, 0]}
      onPointerOver={(e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation();
        onHover(true);
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        onHover(false);
        document.body.style.cursor = "";
      }}
      onClick={(e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation();
        onPick(k);
      }}
    >
      <group ref={lift}>{children}</group>
    </group>
  );
}

function place(el: HTMLElement, x: number, y: number) {
  el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) translate(-50%, -50%)`;
  el.style.opacity = "1";
}

const road = new THREE.MeshStandardMaterial({ color: "#2c302e", roughness: 0.95 });
const lineMat = new THREE.MeshStandardMaterial({
  color: "#ddb06f",
  emissive: "#ddb06f",
  emissiveIntensity: 0.3,
});
const RUN = 1.05;

/** A short strip of road with one camera pole; a scooter rides through and the line flashes. */
function MiniGate({ reducedMotion }: { reducedMotion: boolean }) {
  const bike = useRef<THREE.Group>(null);
  const x = useRef(-RUN);
  const flash = useRef(0);
  useFrame((_, dt) => {
    const d = Math.min(dt, 1 / 30);
    if (!reducedMotion) {
      const before = x.current;
      x.current += d * 0.9;
      if (x.current > RUN) x.current = -RUN;
      if (before < 0 && x.current >= 0) flash.current = 1;
    }
    flash.current = Math.max(0, flash.current - d * 1.6);
    lineMat.emissiveIntensity = 0.3 + flash.current * 2.4;
    if (bike.current) bike.current.position.x = reducedMotion ? -0.6 : x.current;
  });
  return (
    <group>
      <mesh material={road} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.004, 0]}>
        <planeGeometry args={[RUN * 2 + 0.6, 0.9]} />
      </mesh>
      <mesh material={lineMat} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <planeGeometry args={[0.05, 0.8]} />
      </mesh>
      <group position={[0.35, 0, -0.55]}>
        <mesh material={pole} position={[0, 0.55, 0]}>
          <cylinderGeometry args={[0.025, 0.03, 1.1, 10]} />
        </mesh>
        <group position={[0, 1.08, 0.12]} rotation={[0, Math.PI / 2, -0.45]}>
          <mesh material={camBody}>
            <boxGeometry args={[0.2, 0.08, 0.09]} />
          </mesh>
        </group>
      </group>
      <group ref={bike} scale={0.42}>
        <Scooter color="#c94f3d" />
      </group>
    </group>
  );
}
