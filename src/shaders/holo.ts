/**
 * Holographic portrait plane: scan light, edge glow from the image's alpha
 * gradient, slight RGB separation at the edges, noise displacement, and a
 * reveal front that sweeps upward.
 */
export const holoVertex = /* glsl */ `
  uniform float uTime;
  uniform vec2 uPointer;
  varying vec2 vUv;

  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

  void main() {
    vUv = uv;
    vec3 p = position;
    float n = hash(floor(uv * 40.0) + floor(uTime * 6.0));
    p.z += (n - 0.5) * 0.02 + sin(uv.y * 12.0 + uTime) * 0.015;
    p.xy += uPointer * 0.06 * (uv.y - 0.5);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;

export const holoFragment = /* glsl */ `
  uniform sampler2D uTex;
  uniform float uTime;
  uniform float uReveal;
  uniform float uOpacity;
  uniform vec3 uGold;
  uniform vec3 uElectric;
  uniform float uPhoto;
  varying vec2 vUv;

  void main() {
    vec2 px = vec2(1.0 / 512.0);
    float a = texture2D(uTex, vUv).a;
    float ax = texture2D(uTex, vUv + vec2(px.x * 3.0, 0.0)).a - texture2D(uTex, vUv - vec2(px.x * 3.0, 0.0)).a;
    float ay = texture2D(uTex, vUv + vec2(0.0, px.y * 3.0)).a - texture2D(uTex, vUv - vec2(0.0, px.y * 3.0)).a;
    float edge = clamp(length(vec2(ax, ay)) * 2.2, 0.0, 1.0);
    // Break the outline into flowing energy so it never reads as a cut-out.
    float flow = 0.5 + 0.5 * sin(vUv.y * 46.0 - uTime * 2.4 + sin(vUv.x * 9.0 + uTime) * 2.0);
    edge *= 0.15 + 0.85 * flow * flow;

    // RGB separation only where the image has an edge.
    float shift = edge * 0.006;
    vec3 tex = vec3(
      texture2D(uTex, vUv + vec2(shift, 0.0)).r,
      texture2D(uTex, vUv).g,
      texture2D(uTex, vUv - vec2(shift, 0.0)).b
    );

    float scan = 0.85 + 0.15 * sin(vUv.y * 420.0 + uTime * 2.0);
    float sweep = smoothstep(0.0, 0.05, 0.05 - abs(fract(vUv.y * 0.5 - uTime * 0.07) - 0.5));
    float front = smoothstep(uReveal, uReveal - 0.02, vUv.y);
    float frontGlow = smoothstep(0.04, 0.0, abs(vUv.y - uReveal)) * step(0.01, uReveal) * step(uReveal, 0.99);

    // Mostly edge light and scan lines: the body itself is carried by particles.
    vec3 rim = mix(uGold, uElectric, 0.5 + 0.5 * sin(vUv.y * 7.0 + uTime * 0.6));
    vec3 col = tex * uGold * 0.5 * scan + rim * edge * 0.8 + uGold * sweep * a * 0.9;
    col += uGold * frontGlow * 2.0 * (a + edge);
    float alpha = (a * (0.05 + sweep * 0.22) * scan + edge * 0.55) * front * uOpacity + frontGlow * a * uOpacity;

    // A real photograph: her own image as a light-borne duotone — warm in the
    // highlights, cold in the shadows — with scan lines and a fringe at edges.
    if (uPhoto > 0.5) {
      float l = dot(tex, vec3(0.299, 0.587, 0.114));
      vec3 duo = mix(uElectric * 0.35, vec3(1.0, 0.86, 0.68), smoothstep(0.08, 0.75, l));
      col = mix(duo, tex, 0.45) * scan * (0.9 + sweep * 0.6) + rim * edge * 0.5;
      col += uGold * frontGlow * 1.5 * a;
      alpha = (a * 0.72 * (0.85 + 0.15 * scan) + edge * 0.25) * front * uOpacity + frontGlow * a * uOpacity;
    }
    if (alpha < 0.01) discard;
    gl_FragColor = vec4(col, alpha);
  }
`;
