"use client";

import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import {
  ContactShadows,
  Environment,
  Html,
  Lightformer,
  OrbitControls,
  RoundedBox,
  useTexture,
} from "@react-three/drei";
import { useEffect, useRef, useState } from "react";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { PodEngine, POD_H, POD_W } from "@/pod/podEngine";
import * as THREE from "three";

/*
  Pod, from the iPOD repo (docs/pcb-plan.md): device about 57 × 115 × 24 mm, 52 × 109 mm board
  with the Pico 2 W in a 23 mm strip at the top, the 2.8" 240×320 screen module below it facing
  down onto the board, the PCM5102 DAC near the jack at the bottom right, and a 503450
  (5 × 34 × 50 mm) 1000 mAh LiPo on the underside, planned. Scene units: 1 = 10 mm.
  Tap or click the case to explode it into layers. The screen is live: it runs the firmware's
  own display code (src/pod/podEngine.ts), so it can be tapped and dragged like the real Pod.
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

// Screen-module active area, in scene units (43.2 × 57.6 mm), and where it sits on its layer.
const SCREEN_W = 4.32;
const SCREEN_H = 5.76;
const SCREEN_Y = -1.0;
// Scratch objects for pointer maths, reused every event.
const plane = new THREE.Plane();
const hit = new THREE.Vector3();
const normal = new THREE.Vector3();
const origin = new THREE.Vector3();
// Close enough that the screen fills most of the frame, a little high to clear the buttons.
const FOCUS_CAM = new THREE.Vector3(0, SCREEN_Y - 0.35, 13.6);
const FOCUS_TARGET = new THREE.Vector3(0, SCREEN_Y - 0.35, 0.97);

export function PodScene({
  active,
  reducedMotion,
  focus = false,
  explode,
  onCaseClick,
  side = false,
}: {
  active: boolean;
  /** Start from a three-quarter side view, so the exploded layers separate on screen. */
  side?: boolean;
  reducedMotion: boolean;
  /** Face the screen and hand all pointer input to it. */
  focus?: boolean;
  /** 0 assembled … 1 fully exploded, from a slider; clicks then call onCaseClick. */
  explode?: number;
  onCaseClick?: () => void;
}) {
  return (
    <Canvas
      dpr={[1, 1.5]}
      frameloop={active ? "always" : "never"}
      camera={{ position: side ? [21, 7, 18] : [17, 6, 23], fov: 32 }}
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
      <Pod
        reducedMotion={reducedMotion}
        focus={focus}
        explode={explode}
        onCaseClick={onCaseClick}
      />
      <ContactShadows
        position={[0, -6.2, 0]}
        opacity={0.5}
        scale={20}
        blur={2.4}
        far={8}
        color="#04140d"
      />
    </Canvas>
  );
}

function Pod({
  reducedMotion,
  focus,
  explode,
  onCaseClick,
}: {
  reducedMotion: boolean;
  focus: boolean;
  explode?: number;
  onCaseClick?: () => void;
}) {
  const controls = useRef<OrbitControlsImpl>(null);
  const [explodedState, setExploded] = useState(false);
  const controlled = explode !== undefined;
  const exploded = explodedState && !focus;
  const showLabels = controlled ? !focus && explode > 0.35 : exploded;
  const group = useRef<THREE.Group>(null);
  const screen = useRef<THREE.Mesh>(null);
  const engine = useRef<PodEngine | null>(null);
  const live = useRef<THREE.CanvasTexture | null>(null);
  const screenMat = useRef<THREE.MeshBasicMaterial>(null);
  const pressing = useRef(false);
  const camera = useThree((st) => st.camera);
  const k = useRef(0);
  const bezelRef = useRef<THREE.Group>(null);
  const screenRef = useRef<THREE.Group>(null);
  const boardRef = useRef<THREE.Group>(null);
  const batteryRef = useRef<THREE.Group>(null);
  const shellRef = useRef<THREE.Group>(null);
  const art = useTexture("/media/pod-screen-poster.webp", (t) => {
    t.colorSpace = THREE.SRGBColorSpace;
  });

  // Boot the real screen code once the model is on screen.
  useEffect(() => {
    let tex: THREE.CanvasTexture | null = null;
    let gone = false;
    PodEngine.create()
      .then((e) => {
        if (gone) return;
        engine.current = e;
        e.frame(performance.now());
        tex = new THREE.CanvasTexture(e.canvas);
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = 4;
        live.current = tex;
        if (screenMat.current) {
          screenMat.current.map = tex;
          screenMat.current.needsUpdate = true;
        }
      })
      .catch(() => {}); // no wasm: the static Poster screen stays
    return () => {
      gone = true;
      tex?.dispose();
    };
  }, []);

  useFrame((_, dt) => {
    if (engine.current?.frame(performance.now()) && live.current) live.current.needsUpdate = true;

    // Focus: turn the Pod to face the camera, close enough to use the screen.
    if (focus && group.current) {
      group.current.rotation.y = THREE.MathUtils.damp(group.current.rotation.y, 0, 6, dt);
      camera.position.lerp(FOCUS_CAM, 1 - Math.exp(-6 * dt));
      controls.current?.target.lerp(FOCUS_TARGET, 1 - Math.exp(-6 * dt));
      camera.lookAt(controls.current?.target ?? FOCUS_TARGET);
    }

    const target = focus ? 0 : controlled ? explode : exploded ? 1 : 0;
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
    if (focus) return;
    if (onCaseClick) onCaseClick();
    else setExploded((v) => !v);
  };

  // Pointer → screen pixels: intersect the pointer ray with the screen's plane (works while
  // dragging off the edge too), then map local coordinates to the 240 × 320 panel.
  const toPixels = (e: ThreeEvent<PointerEvent>) => {
    const m = screen.current;
    if (!m) return null;
    m.updateWorldMatrix(true, false);
    normal.set(0, 0, 1).transformDirection(m.matrixWorld);
    plane.setFromNormalAndCoplanarPoint(normal, origin.setFromMatrixPosition(m.matrixWorld));
    if (!e.ray.intersectPlane(plane, hit)) return null;
    const p = m.worldToLocal(hit.clone());
    return { x: (p.x / SCREEN_W + 0.5) * POD_W, y: (0.5 - p.y / SCREEN_H) * POD_H };
  };
  const press = (e: ThreeEvent<PointerEvent>) => {
    if (!engine.current) return;
    e.stopPropagation();
    const px = toPixels(e);
    if (!px) return;
    pressing.current = true;
    (e.target as Element).setPointerCapture?.(e.pointerId);
    if (controls.current) {
      controls.current.enabled = false;
      controls.current.autoRotate = false; // stop turning once someone is using it
    }
    engine.current.touch(px.x, px.y, true);
  };
  const drag = (e: ThreeEvent<PointerEvent>) => {
    if (!pressing.current || !engine.current) return;
    e.stopPropagation();
    const px = toPixels(e);
    if (px) engine.current.touch(px.x, px.y, true);
  };
  const lift = (e: ThreeEvent<PointerEvent>) => {
    if (!pressing.current || !engine.current) return;
    e.stopPropagation();
    pressing.current = false;
    (e.target as Element).releasePointerCapture?.(e.pointerId);
    engine.current.touch(0, 0, false);
    if (controls.current) controls.current.enabled = !focus;
  };

  return (
    <>
      <OrbitControls
        ref={controls}
        target={[0, 0, 0.5]}
        enablePan={false}
        enableZoom={false}
        enabled={!focus}
        autoRotate={!reducedMotion && !focus}
        autoRotateSpeed={0.7}
        enableDamping
      />
      <group ref={group} onClick={toggle} rotation={[0, -0.35, 0]}>
        {/* Front bezel: a frame around the screen */}
        <group ref={bezelRef}>
          {/* Frame pieces around the 43.2 × 57.6 mm active area (centre y = -1.0) */}
          {[
            [0, 3.82, 5.7, 3.86],
            [0, -4.82, 5.7, 1.86],
            [-2.49, -1.0, 0.72, 5.78],
            [2.49, -1.0, 0.72, 5.78],
          ].map(([x, y, w, h]) => (
            <mesh key={`${x}${y}`} material={frame} position={[x, y, 0]}>
              <boxGeometry args={[w, h, 0.15]} />
            </mesh>
          ))}
          {showLabels && <Label at={[-4.0, 3.6, 0]} text="front bezel" left />}
        </group>

        {/* Screen module: red PCB, 2.8" panel showing the Poster Now Playing screen */}
        <group ref={screenRef}>
          <mesh material={redPcb} position={[0, -1.2, -0.1]}>
            <boxGeometry args={[5.0, 8.6, 0.12]} />
          </mesh>
          <mesh
            ref={screen}
            position={[0, SCREEN_Y, 0.02]}
            onPointerDown={press}
            onPointerMove={drag}
            onPointerUp={lift}
            onPointerCancel={lift}
            onClick={(e) => e.stopPropagation()}
            onPointerOver={() => {
              if (engine.current) document.body.style.cursor = "pointer";
            }}
            onPointerOut={() => {
              document.body.style.cursor = "";
            }}
          >
            <planeGeometry args={[SCREEN_W, SCREEN_H]} />
            <meshBasicMaterial ref={screenMat} map={art} toneMapped={false} />
          </mesh>
          {showLabels && <Label at={[3.2, 0.6, 0]} text={'2.8" 240×320 touch screen'} />}
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
          {showLabels && (
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
          {showLabels && <Label at={[2.6, -1.2, 0]} text="1000 mAh LiPo (planned)" />}
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
          {showLabels && <Label at={[3.4, -5.6, 0]} text="57 × 115 × 24 mm" />}
        </group>
      </group>
    </>
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
