"use client";

import { useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useUI } from "@/lib/store";
import { world } from "@/lib/world";
import { posOf } from "@/world/layout";
import { shotAt } from "@/world/shots";

/** Flies the camera between shots; adds pointer parallax, drag orbit and click-to-approach. */
export function CameraRig() {
  const { camera, size } = useThree();
  const pos = useMemo(() => new THREE.Vector3(0, 0, 46), []);
  const look = useMemo(() => new THREE.Vector3(), []);
  const wantPos = useMemo(() => new THREE.Vector3(), []);
  const wantLook = useMemo(() => new THREE.Vector3(), []);
  const node = useMemo(() => new THREE.Vector3(), []);
  const offset = useMemo(() => new THREE.Vector3(), []);
  const spherical = useMemo(() => new THREE.Spherical(), []);

  useFrame((_, rawDt) => {
    // Exponential damping is stable at any step, so slow frames still arrive.
    const dt = Math.min(rawDt, 0.5);
    const shot = shotAt(world.t, size.width / size.height);
    wantPos.set(...shot.pos);
    wantLook.set(...shot.look);

    if (shot.orbit) {
      // Drag turns the whole network around its centre.
      offset.copy(wantPos).sub(wantLook);
      spherical.setFromVector3(offset);
      spherical.theta += world.drag.x;
      spherical.phi = THREE.MathUtils.clamp(spherical.phi - world.drag.y, 0.35, 2.4);
      offset.setFromSpherical(spherical);
      wantPos.copy(wantLook).add(offset);
      // Selecting a node draws the camera toward it.
      const sel = useUI.getState().selected;
      if (sel) {
        node.set(...posOf(sel));
        wantLook.lerp(node, 0.7);
        offset.copy(wantPos).sub(node).setLength(14);
        wantPos.copy(node).add(offset);
      }
    }

    // Level-2 parallax: the world leans with the pointer.
    wantPos.x += world.pointer.x * 0.6;
    wantPos.y += world.pointer.y * 0.35;

    const k = 1 - Math.exp(-dt * 2.4);
    pos.lerp(wantPos, k);
    look.lerp(wantLook, k);
    camera.position.copy(pos);
    // Collision impulse: a tiny, quickly-damped tremor.
    if (world.shake > 0) {
      const s = world.shake * world.shake * 0.35;
      camera.position.x += (Math.random() - 0.5) * s;
      camera.position.y += (Math.random() - 0.5) * s;
    }
    world.shake = Math.max(0, world.shake - dt * 3);
    world.heroFlash = Math.max(0, world.heroFlash - dt * 2.2);
    camera.lookAt(look);
    const cam = camera as THREE.PerspectiveCamera;
    if (Math.abs(cam.fov - shot.fov) > 0.01) {
      cam.fov += (shot.fov - cam.fov) * k;
      cam.updateProjectionMatrix();
    }
  });

  return null;
}
