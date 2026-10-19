"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { smooth, world } from "@/lib/world";
import { fragments } from "@/content/story";

/** Words drawn to a canvas so they live in true depth with any web font. */
function wordTexture(word: string, note: string) {
  const c = document.createElement("canvas");
  c.width = 1024;
  c.height = 256;
  const ctx = c.getContext("2d")!;
  const style = getComputedStyle(document.documentElement);
  const mono = style.getPropertyValue("--font-geist-mono").trim() || "monospace";
  const serif = style.getPropertyValue("--font-instrument").trim() || "serif";
  ctx.fillStyle = "#f3ead8";
  ctx.font = `400 120px ${serif}`;
  ctx.textBaseline = "alphabetic";
  ctx.fillText(word, 8, 140);
  ctx.fillStyle = "rgba(255,179,71,0.9)";
  ctx.font = `500 30px ${mono}`;
  ctx.fillText(note.toUpperCase(), 12, 205);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

/** The six fragments of her that the visitor flies through in "Just start". */
export function Fragments() {
  const group = useRef<THREE.Group>(null);
  const meshes = useRef<(THREE.Mesh | null)[]>([]);
  // All on the right of the axis: the story text holds the left of the frame.
  const placed = useMemo(() => {
    const xy = [[3.4, 1.8], [5.4, -1.5], [2.0, 3.0], [6.0, 1.0], [3.0, -2.6], [4.8, 2.6]];
    return fragments.map((f, i) => ({ ...f, base: new THREE.Vector3(xy[i][0], xy[i][1], 38 - i * 4.6) }));
  }, []);
  const materials = useMemo(
    () => placed.map(() => new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, opacity: 0, blending: THREE.AdditiveBlending })),
    [placed],
  );

  useEffect(() => {
    void document.fonts.ready.then(() => {
      placed.forEach((f, i) => {
        materials[i].map = wordTexture(f.word, f.note);
        materials[i].needsUpdate = true;
      });
    });
    return () => materials.forEach((m) => { m.map?.dispose(); m.dispose(); });
  }, [placed, materials]);

  useFrame(({ camera }) => {
    const t = world.t;
    const g = group.current;
    if (!g) return;
    g.visible = t > 0.6 && t < 2.3;
    if (!g.visible) return;
    // Near the end of the chapter the fragments converge on Akshita.
    const converge = smooth(1.62, 1.95, t);
    placed.forEach((f, i) => {
      const m = meshes.current[i];
      if (!m) return;
      m.position.copy(f.base).multiplyScalar(1 - converge);
      m.position.z = f.base.z * (1 - converge);
      m.lookAt(camera.position);
      const d = camera.position.z - m.position.z;
      materials[i].opacity = smooth(28, 14, d) * smooth(0.5, 3.5, d) * (1 - converge) * smooth(0.9, 1.08, t);
    });
  });

  return (
    <group ref={group}>
      {placed.map((f, i) => (
        <mesh key={f.word} ref={(m) => { meshes.current[i] = m; }} material={materials[i]}>
          <planeGeometry args={[4, 1]} />
        </mesh>
      ))}
    </group>
  );
}
