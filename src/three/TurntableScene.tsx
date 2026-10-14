"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, Environment, Lightformer } from "@react-three/drei";
import { Suspense, useEffect, useRef, type ReactNode } from "react";
import * as THREE from "three";
import { Bot, type BotHandle } from "./NidsScene";
import { Pod } from "./PodScene";
import { Tower } from "./TowerScene";
import { Scooter, camBody, pole } from "./GateScene";

/*
  The home-page turntable: one build at a time on a slowly turning plinth, like a part
  under a desk lamp. Same procedural models as the project pages. `current` picks the
  build; switching sinks the old one into the plinth and raises the new one.

  The models answer clicks the way they do on their own pages: the robot gets pushed and
  catches itself, the Pod comes apart while hovered.
*/

export const TURNTABLE_ORDER = [
  "nids-self-balancing-robot",
  "station-parking",
  "ss-filters-energy-audit",
  "pod",
] as const;

export function TurntableScene({
  current,
  active,
  reducedMotion,
}: {
  current: number;
  active: boolean;
  reducedMotion: boolean;
}) {
  return (
    <Canvas
      dpr={[1, 1.75]}
      frameloop={active ? "always" : "never"}
      camera={{ position: [0, 2.1, 6.8], fov: 30, near: 0.1, far: 60 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      style={{ touchAction: "pan-y" }}
    >
      <hemisphereLight args={["#f6f1df", "#0a1a13", 0.55]} />
      <directionalLight position={[3, 6, 4]} intensity={1.6} color="#fff3dc" />
      <directionalLight position={[-4, 3, -3]} intensity={0.7} color="#9fd3b8" />
      <Environment resolution={128}>
        <Lightformer form="rect" intensity={2.4} position={[0, 6, 3]} scale={[10, 3, 1]} />
        <Lightformer
          form="rect"
          intensity={0.9}
          position={[-6, 2, -2]}
          scale={[4, 4, 1]}
          color="#9fd3b8"
        />
        <Lightformer form="ring" intensity={1.2} position={[5, 3, -3]} scale={2} color="#ffd2a8" />
      </Environment>

      <Rig reducedMotion={reducedMotion} />
      <Table current={current} reducedMotion={reducedMotion} />

      <ContactShadows
        position={[0, 0.081, 0]}
        opacity={0.7}
        scale={5}
        blur={2.2}
        far={3}
        resolution={512}
        color="#020806"
        frames={reducedMotion ? 1 : Infinity}
      />
    </Canvas>
  );
}

/** Camera: a little pointer parallax, aimed at the middle of the build. */
function Rig({ reducedMotion }: { reducedMotion: boolean }) {
  const target = useRef(new THREE.Vector3());
  useFrame(({ camera, pointer, size }, dt) => {
    const px = reducedMotion ? 0 : pointer.x;
    const py = reducedMotion ? 0 : pointer.y;
    // Square frames (phones) step back so the whole plinth stays in view.
    const dist = Math.max(6.6, 7.7 / (size.width / Math.max(1, size.height)));
    target.current.set(px * 0.5, 2.5 + py * 0.25, dist);
    camera.position.lerp(target.current, 1 - Math.exp(-4 * dt));
    camera.lookAt(0, 1.0, 0);
  });
  return null;
}

const plinthMat = new THREE.MeshStandardMaterial({
  color: "#15241e",
  roughness: 0.55,
  metalness: 0.1,
});
const rimMat = new THREE.MeshStandardMaterial({
  color: "#f4b08c",
  emissive: "#f4b08c",
  emissiveIntensity: 0.35,
  roughness: 0.4,
  metalness: 0.6,
});

function Table({ current, reducedMotion }: { current: number; reducedMotion: boolean }) {
  const spin = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (spin.current && !reducedMotion) spin.current.rotation.y += Math.min(dt, 1 / 30) * 0.32;
  });
  return (
    <group>
      <mesh material={plinthMat} position={[0, 0.04, 0]}>
        <cylinderGeometry args={[1.75, 1.83, 0.08, 96]} />
      </mesh>
      <mesh material={rimMat} position={[0, 0.081, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.7, 1.722, 128]} />
      </mesh>
      <group ref={spin} position={[0, 0.08, 0]} rotation={[0, 0.6, 0]}>
        <Slot on={current === 0} reducedMotion={reducedMotion}>
          <Nids reducedMotion={reducedMotion} on={current === 0} />
        </Slot>
        <Slot on={current === 1} reducedMotion={reducedMotion}>
          <group scale={1.15}>
            <MiniGate reducedMotion={reducedMotion} />
          </group>
        </Slot>
        <Slot on={current === 2} reducedMotion={reducedMotion}>
          <group scale={0.72}>
            <Tower />
          </group>
        </Slot>
        <Slot on={current === 3} reducedMotion={reducedMotion}>
          <PodStanding reducedMotion={reducedMotion} />
        </Slot>
      </group>
    </group>
  );
}

/** Raises its build out of the plinth when `on`, sinks it when not, hides it once gone. */
function Slot({
  on,
  reducedMotion,
  children,
}: {
  on: boolean;
  reducedMotion: boolean;
  children: ReactNode;
}) {
  const g = useRef<THREE.Group>(null);
  const k = useRef(on ? 1 : 0);
  useFrame((_, dt) => {
    const el = g.current;
    if (!el) return;
    const target = on ? 1 : 0;
    k.current = reducedMotion ? target : THREE.MathUtils.damp(k.current, target, on ? 4 : 7, dt);
    const s = THREE.MathUtils.smoothstep(k.current, 0, 1);
    el.visible = s > 0.01;
    el.scale.setScalar(0.6 + 0.4 * s);
    el.position.y = (s - 1) * 0.8;
    el.rotation.y = (1 - s) * -1.2;
  });
  return <group ref={g}>{children}</group>;
}

function Nids({ reducedMotion, on }: { reducedMotion: boolean; on: boolean }) {
  const bot = useRef<BotHandle>(null);
  // A nudge now and then, so the balancing shows without a click.
  useEffect(() => {
    if (reducedMotion || !on) return;
    let dir = 1;
    const first = window.setTimeout(() => bot.current?.push(dir), 1600);
    const every = window.setInterval(() => {
      dir = -dir;
      bot.current?.push(dir);
    }, 5200);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(every);
    };
  }, [reducedMotion, on]);
  return (
    <group scale={0.82}>
      <Bot ref={bot} reducedMotion={reducedMotion} labels={false} />
    </group>
  );
}

const q = new THREE.Quaternion();
const e = new THREE.Euler();

function PodStanding({ reducedMotion }: { reducedMotion: boolean }) {
  const explode = useRef(0);
  const hover = useRef(false);
  const face = useRef<THREE.Group>(null);
  useFrame(({ clock }, dt) => {
    const target = hover.current ? 0.8 : 0;
    explode.current = reducedMotion ? target : THREE.MathUtils.damp(explode.current, target, 4, dt);
    // A slab this thin vanishes edge-on, so the Pod keeps its screen to the viewer and
    // only sways while the table turns under it.
    const g = face.current;
    if (!g?.parent) return;
    g.parent.getWorldQuaternion(q);
    e.setFromQuaternion(q, "YXZ");
    g.rotation.y = -e.y + (reducedMotion ? -0.35 : Math.sin(clock.elapsedTime * 0.5) * 0.5);
  });
  return (
    <group
      ref={face}
      position={[0, 0.97, 0]}
      scale={0.17}
      onPointerOver={() => {
        hover.current = true;
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        hover.current = false;
        document.body.style.cursor = "";
      }}
    >
      <Suspense fallback={null}>
        <Pod reducedMotion={reducedMotion} focus={false} bare explodeRef={explode} />
      </Suspense>
    </group>
  );
}

const road = new THREE.MeshStandardMaterial({ color: "#2a2f2c", roughness: 0.95 });
const lineMat = new THREE.MeshStandardMaterial({
  color: "#eaa682",
  emissive: "#eaa682",
  emissiveIntensity: 0.3,
});
const RUN = 1.3;

/** A strip of road with one camera pole; a scooter rides through and the capture line flashes. */
function MiniGate({ reducedMotion }: { reducedMotion: boolean }) {
  const bike = useRef<THREE.Group>(null);
  const x = useRef(-RUN);
  const flash = useRef(0);
  useFrame((_, dt) => {
    const d = Math.min(dt, 1 / 30);
    if (!reducedMotion) {
      const before = x.current;
      x.current += d * 0.8;
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
        <planeGeometry args={[RUN * 2 + 0.4, 1.0]} />
      </mesh>
      <mesh material={lineMat} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <planeGeometry args={[0.05, 0.9]} />
      </mesh>
      <group position={[0.4, 0, -0.62]}>
        <mesh material={pole} position={[0, 0.7, 0]}>
          <cylinderGeometry args={[0.03, 0.035, 1.4, 12]} />
        </mesh>
        <group position={[0, 1.36, 0.14]} rotation={[0, Math.PI / 2, -0.45]}>
          <mesh material={camBody}>
            <boxGeometry args={[0.24, 0.1, 0.11]} />
          </mesh>
        </group>
      </group>
      <group ref={bike} scale={0.55}>
        <Scooter color="#c94f3d" />
      </group>
    </group>
  );
}
