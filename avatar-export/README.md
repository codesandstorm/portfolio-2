# avatar-neck-lipsync.glb

**Share this one file:** `avatar-export/avatar-neck-lipsync.glb` (4.6 MB). Its texture is embedded, and it references no external files, paths or URLs.

## Model

This is a 3D bust of the avatar, rebuilt from two renders: the front view (`source/front.webp`) and the side profile (`source/side.webp`).

- The front view gives the width of every slice of the head.
- The profile gives its depth, including the real nose, lip and chin profile.
- Both renders are projected onto that closed surface to make the texture.
- It has a split lip line with an inner mouth (dark cavity, upper and lower teeth).

The head can turn about 55° each way and still look 3D. Hair is a solid shell (no separate strands), and the chest is a simple extension under the shoulders. Units are metres, +Y is up, and the avatar faces +Z. Both materials are unlit, so the lighting baked into the renders stays as it is.

| Item | Value |
|---|---|
| Meshes | `AvatarFace` (54k vertices: skin, hair, top), `AvatarMouth` (cavity and teeth); both skinned |
| Bones | `Spine` → `Neck` → `Head` |
| Morph targets | `AvatarFace`: `jawOpen`, `mouthFunnel`, `mouthPucker`, `mouthSmileLeft`, `mouthSmileRight`, `mouthClose`. `AvatarMouth`: `jawOpen` |
| Animation clips | none |
| Textures | 1 JPEG atlas (2048×1024), embedded |

## Bone hierarchy

- **Torso: `Spine`.** It holds the shoulders and chest. Keep it still. For a "turn through the torso" feel, give it at most 15 % of the yaw.
- **Neck: `Neck`.** Give it about 35–43 % of the look rotation.
- **Head: `Head`.** Give it the rest of the look rotation. The hair moves with the head.
- **Jaw:** none. The mouth is driven only by morph targets.

## Lip sync

The mouth uses morph targets with **ARKit blendshape names**. `jawOpen` is a hinged-jaw rotation stored as a morph: the chin swings down and back, the mouth opens as an oval, and the corners stay sealed.

- `jawOpen` is the main speech channel. It exists on **both** meshes, so set it by name on every mesh that has it (see below). That keeps the teeth moving with the lips.
- `mouthFunnel` and `mouthPucker` cover O and U sounds. `mouthClose` covers M, B and P. `mouthSmileLeft` and `mouthSmileRight` add expression.

There are no Oculus visemes. To map them, use roughly:

| Viseme | Morph values |
|---|---|
| `aa` | `jawOpen` 0.8 |
| `O` | `jawOpen` 0.5 + `mouthFunnel` 0.6 |
| `U` | `mouthPucker` 0.7 |
| `E` / `I` | `jawOpen` 0.3 + both smiles 0.4 |
| `PP` | `mouthClose` 1 |

The simplest working method is to drive `jawOpen` from audio loudness (RMS). The example page does exactly that.

## Head tracking: recommended limits

| Axis | Limit |
|---|---|
| Yaw | ±55° |
| Pitch | up 25°, down 20° |
| Roll | ±6° |

Split each rotation about 43 % to the neck and 57 % to the head. With torso follow on, use 15 % torso, 35 % neck and 50 % head. Smooth it with `THREE.MathUtils.damp`, which works the same at any frame rate. Return to neutral when the pointer leaves the window.

Beyond about 60° you start to see the side of the head, which is painted from the profile render and is less detailed.

There are **no animation clips**, so nothing overwrites the bones. If you add an `AnimationMixer` later, call `mixer.update(dt)` **before** applying the neck and head rotations in the same frame. Lip sync only writes `morphTargetInfluences`, never bones, so it can't conflict with tracking.

## Three.js

```js
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

const gltf = await new GLTFLoader().loadAsync("/avatar-neck-lipsync.glb");
scene.add(gltf.scene);
const neck = gltf.scene.getObjectByName("Neck");
const head = gltf.scene.getObjectByName("Head");
const n0 = neck.quaternion.clone(), h0 = head.quaternion.clone();
const morphMeshes = [];
gltf.scene.traverse((o) => { if (o.morphTargetDictionary) { o.frustumCulled = false; morphMeshes.push(o); } });

const LIM = { yaw: THREE.MathUtils.degToRad(55), up: THREE.MathUtils.degToRad(25), down: THREE.MathUtils.degToRad(20) };
let tYaw = 0, tPitch = 0, yaw = 0, pitch = 0;
addEventListener("pointermove", (e) => {
  tYaw = (e.clientX / innerWidth * 2 - 1) * LIM.yaw;
  tPitch = THREE.MathUtils.clamp((e.clientY / innerHeight * 2 - 1) * LIM.down, -LIM.up, LIM.down);
});
const e = new THREE.Euler(0, 0, 0, "YXZ"), q = new THREE.Quaternion();

function setMorph(name, v) {
  for (const m of morphMeshes) { const i = m.morphTargetDictionary[name]; if (i !== undefined) m.morphTargetInfluences[i] = v; }
}

function update(dt, speechLevel /* 0..1 */) {
  yaw = THREE.MathUtils.damp(yaw, tYaw, 6, dt);
  pitch = THREE.MathUtils.damp(pitch, tPitch, 6, dt);
  neck.quaternion.copy(n0).multiply(q.setFromEuler(e.set(pitch * 0.43, yaw * 0.43, 0)));
  head.quaternion.copy(h0).multiply(q.setFromEuler(e.set(pitch * 0.57, yaw * 0.57, 0)));
  setMorph("jawOpen", speechLevel);   // runs in the same frame, independently of the bones
}
```

## React Three Fiber

```jsx
import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useMemo, useRef } from "react";

export function Avatar({ speechLevel }) {      // speechLevel: ref with .current in 0..1
  const { scene } = useGLTF("/avatar-neck-lipsync.glb");
  const rig = useMemo(() => {
    const neck = scene.getObjectByName("Neck"), head = scene.getObjectByName("Head");
    const meshes = []; scene.traverse((o) => o.morphTargetDictionary && meshes.push(o));
    return { neck, head, n0: neck.quaternion.clone(), h0: head.quaternion.clone(), meshes };
  }, [scene]);
  const s = useRef({ yaw: 0, pitch: 0 }), e = new THREE.Euler(0, 0, 0, "YXZ"), q = new THREE.Quaternion();

  useFrame(({ pointer }, dt) => {
    const D = THREE.MathUtils.degToRad;
    s.current.yaw = THREE.MathUtils.damp(s.current.yaw, pointer.x * D(55), 6, dt);
    s.current.pitch = THREE.MathUtils.damp(s.current.pitch, THREE.MathUtils.clamp(-pointer.y * D(20), -D(25), D(20)), 6, dt);
    const { yaw, pitch } = s.current;
    rig.neck.quaternion.copy(rig.n0).multiply(q.setFromEuler(e.set(pitch * 0.43, yaw * 0.43, 0)));
    rig.head.quaternion.copy(rig.h0).multiply(q.setFromEuler(e.set(pitch * 0.57, yaw * 0.57, 0)));
    for (const m of rig.meshes) { const i = m.morphTargetDictionary.jawOpen; if (i !== undefined) m.morphTargetInfluences[i] = speechLevel.current; }
  });
  return <primitive object={scene} />;
}
useGLTF.preload("/avatar-neck-lipsync.glb");
```

## Test page

```bash
python -m http.server 8765 --directory avatar-export
```

Then open `http://localhost:8765/example/index.html`. The page has:

- pointer tracking
- a synthetic talk test
- an "audio file" button that drives `jawOpen` from the loudness of any audio file
- a "torso follows a little" switch
- a live check that the torso's world matrix never changes while the switch is off

## Sharing

1. Send `avatar-export/avatar-neck-lipsync.glb` by Drive, WeTransfer, Slack or email, or commit it to git. It's one self-contained file, with the texture embedded.
2. The receiver puts it in their app's `public/` folder and loads `/avatar-neck-lipsync.glb` as above.
3. To check it without any code, drag it into a glTF viewer.

## Rebuilding

```bash
python avatar-export/tools/build_glb.py avatar-export/source/front.webp avatar-export/source/side.webp avatar-export/avatar-neck-lipsync.glb
```

This needs only `numpy` and `opencv-python`. The landmarks (mouth line, mouth corners, front-to-side row mapping, bone pivots, jaw hinge) are pixel constants at the top of the script, measured on the two renders in `source/`.
