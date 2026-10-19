"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { projects } from "@/content/data";
import type { Project } from "@/content/types";
import { chapterIndex } from "@/lib/chapters";
import { focusOf, useUI } from "@/lib/store";
import { world } from "@/lib/world";
import { artifactGeometry } from "@/world/artifacts";
import { posOf } from "@/world/layout";

const STATUS_COLOR: Record<Project["status"], string> = {
  live: "#ffb347",
  internship: "#6fb6ff",
  built: "#8fc4ff",
  hackathon: "#ff8a1f",
};

function Artifact({ project }: { project: Project }) {
  const group = useRef<THREE.Group>(null);
  const parts = useRef<(THREE.LineSegments | null)[]>([]);
  const seed = useRef<THREE.Mesh>(null);
  const pulse = useRef<THREE.Mesh>(null);
  const grow = useRef(0);
  const activeSince = useRef(0);

  const geometries = useMemo(() => artifactGeometry(project.artifact.form, project.artifact.count), [project]);
  const material = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color: new THREE.Color(STATUS_COLOR[project.status]).multiplyScalar(1.6),
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    [project],
  );
  const pulseMat = useMemo(
    () => new THREE.MeshBasicMaterial({ color: "#ffb347", transparent: true, opacity: 0, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false }),
    [],
  );
  useEffect(
    () => () => {
      geometries.forEach((g) => g.dispose());
      material.dispose();
      pulseMat.dispose();
    },
    [geometries, material, pulseMat],
  );

  useFrame((_, dt) => {
    const g = group.current;
    if (!g) return;
    const inBuild = Math.floor(world.t) === chapterIndex.build;
    const ui = useUI.getState();
    const active = inBuild && focusOf(ui) === project.id;
    const now = performance.now() / 1000;
    if (active && grow.current < 0.02) activeSince.current = now;
    grow.current += ((active ? 1 : 0) - grow.current) * (1 - Math.exp(-dt * 2.6));
    const visible = inBuild || grow.current > 0.01;
    g.visible = visible;
    if (!visible) return;

    const e = grow.current;
    material.opacity = e * 0.85;
    g.rotation.y += dt * 0.18;
    parts.current.forEach((m, k) => {
      if (!m) return;
      // The seed form's second shell grows after the first — the second attempt.
      const delay = project.artifact.form === "seed" && k === 1 ? Math.min(1, Math.max(0, (now - activeSince.current - 1.1) / 1.4)) : 1;
      const s = Math.max(0.001, e * (k === 1 ? delay : 1));
      m.scale.setScalar(s);
    });
    if (seed.current) seed.current.scale.setScalar(inBuild ? 0.12 + (1 - e) * 0.1 : 0.001);
    if (pulse.current) {
      // PRAHARI: an early-warning pulse leaves the sentinel every two seconds.
      const ph = project.artifact.form === "sentinel" ? ((now - activeSince.current) % 2) / 2 : 0;
      pulse.current.scale.setScalar(0.2 + ph * 2.8);
      pulseMat.opacity = project.artifact.form === "sentinel" ? e * (1 - ph) * 0.5 : 0;
    }
  });

  return (
    <group ref={group} position={posOf(project.id)}>
      {geometries.map((geo, k) => (
        <lineSegments key={k} ref={(m) => { parts.current[k] = m; }} geometry={geo} material={material} />
      ))}
      <mesh ref={seed}>
        <icosahedronGeometry args={[1, 0]} />
        <meshBasicMaterial color={STATUS_COLOR[project.status]} wireframe transparent opacity={0.8} />
      </mesh>
      <mesh ref={pulse} rotation={[-Math.PI / 2, 0, 0]} material={pulseMat}>
        <ringGeometry args={[0.98, 1, 96]} />
      </mesh>
    </group>
  );
}

export function Artifacts() {
  return (
    <>
      {projects.map((p) => (
        <Artifact key={p.id} project={p} />
      ))}
    </>
  );
}
