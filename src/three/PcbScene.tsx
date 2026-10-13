"use client";

import { Canvas, useLoader } from "@react-three/fiber";
import { ContactShadows, Environment, Lightformer, OrbitControls } from "@react-three/drei";
import { useMemo } from "react";
import * as THREE from "three";

/*
  The NIDS remote PCB, 76.2 × 50.8 × 1.6 mm, textured with its own Gerbers.
  tools/remote-pcb/render.mjs renders the copper, mask, silkscreen and drills
  with pcb-stackup. Scene units: 1 = 10 mm.
*/
const W = 7.62;
const D = 5.08;
const T = 0.16;
const BASE = "/media/nids-self-balancing-robot/";

function Board() {
  const [top, bottom] = useLoader(THREE.TextureLoader, [
    `${BASE}remote-pcb-top.png`,
    `${BASE}remote-pcb-bottom.png`,
  ]);
  const materials = useMemo(() => {
    // Work on copies: the loader's cached textures are shared.
    const [t, b] = [top.clone(), bottom.clone()];
    for (const tex of [t, b]) {
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = 8;
    }
    // The bottom render is drawn as seen from below; flip it back for the box's −y face.
    b.wrapS = b.wrapT = THREE.RepeatWrapping;
    b.repeat.set(1, -1);
    const edge = new THREE.MeshStandardMaterial({ color: "#3e5a32", roughness: 0.7 });
    const face = (map: THREE.Texture) =>
      new THREE.MeshStandardMaterial({ map, roughness: 0.42, metalness: 0.08 });
    // Box face order: +x, −x, +y, −y, +z, −z
    return [edge, edge, face(t), face(b), edge, edge];
  }, [top, bottom]);

  return (
    <mesh material={materials} position={[0, 0.9, 0]} rotation={[0.18, -0.4, 0]}>
      <boxGeometry args={[W, T, D]} />
    </mesh>
  );
}

export function PcbScene({ active, reducedMotion }: { active: boolean; reducedMotion: boolean }) {
  return (
    <Canvas
      dpr={[1, 1.75]}
      frameloop={active ? "always" : "never"}
      camera={{ position: [0, 9.6, 9.4], fov: 35 }}
      gl={{ antialias: true, alpha: true }}
    >
      <hemisphereLight args={["#f6f1df", "#0c241a", 0.9]} />
      <directionalLight position={[3, 8, 4]} intensity={1.5} color="#fff6e0" />
      <Environment resolution={64}>
        <Lightformer
          form="rect"
          intensity={2}
          position={[0, 5, 2]}
          scale={[8, 3, 1]}
          color="#fff4dc"
        />
      </Environment>
      <Board />
      <ContactShadows
        position={[0, 0, 0]}
        opacity={0.5}
        scale={12}
        blur={2.4}
        far={3}
        color="#04140d"
      />
      <OrbitControls
        target={[0, 0.9, 0]}
        enablePan={false}
        enableZoom={false}
        autoRotate={!reducedMotion}
        autoRotateSpeed={0.7}
        enableDamping
      />
    </Canvas>
  );
}
