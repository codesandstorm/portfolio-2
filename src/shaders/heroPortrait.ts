/**
 * Her photograph on the landing: placed in screen space, emerging out of the
 * smoke through a noise dissolve, lit by ice from the left and fire from the
 * right, fading into darkness at the shoulders so her name can sit over it.
 */
export const heroPortraitVertex = /* glsl */ `
  uniform vec4 uRect; // x, y (bottom-left, NDC), width, height (NDC)
  varying vec2 vUv;
  void main() {
    vUv = uv;
    vec2 ndc = uRect.xy + uv * uRect.zw;
    gl_Position = vec4(ndc, 0.9997, 1.0);
  }
`;

export const heroPortraitFragment = /* glsl */ `
  uniform sampler2D uTex;
  uniform float uReveal;
  uniform float uOpacity;
  uniform float uTime;
  uniform float uFlash;
  uniform float uVoice;
  varying vec2 vUv;

  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
  }
  float fbm(vec2 p) { float v = 0.0, a = 0.5; for (int i = 0; i < 4; i++) { v += a * noise(p); p *= 2.1; a *= 0.5; } return v; }

  void main() {
    vec4 tex = texture2D(uTex, vUv);
    float a = tex.a;
    // Edge of her silhouette, for the rim light.
    vec2 px = vec2(1.0 / 1024.0) * 4.0;
    float edge = clamp(length(vec2(
      texture2D(uTex, vUv + vec2(px.x, 0.0)).a - texture2D(uTex, vUv - vec2(px.x, 0.0)).a,
      texture2D(uTex, vUv + vec2(0.0, px.y)).a - texture2D(uTex, vUv - vec2(0.0, px.y)).a)) * 1.6, 0.0, 1.0);

    vec3 ice = vec3(0.35, 0.62, 1.0);
    vec3 fire = vec3(1.0, 0.5, 0.16);
    float lum = dot(tex.rgb, vec3(0.299, 0.587, 0.114));
    // A cinematic grade: warm skin, deep shadows.
    vec3 col = pow(tex.rgb, vec3(1.08)) * vec3(1.02, 0.95, 0.88);
    // Key light: ice from the left, fire from the right, as the smoke around her.
    col += ice * smoothstep(0.55, 0.15, vUv.x) * lum * 0.32;
    col += fire * smoothstep(0.45, 0.85, vUv.x) * lum * 0.42;
    col += mix(ice, fire, smoothstep(0.35, 0.65, vUv.x)) * edge * 0.55;
    // Lightning from the title illuminates her for an instant; the narrator's voice warms her a touch.
    col += vec3(0.6, 0.75, 1.0) * uFlash * (lum * 0.7 + edge * 0.6);
    col *= 1.0 + uVoice * 0.25;

    // She emerges out of the smoke: a soft noise dissolve, from the face outward.
    float n = fbm(vUv * 5.0 + vec2(0.0, uTime * 0.05));
    float fromFace = length((vUv - vec2(0.6, 0.62)) * vec2(1.0, 1.1));
    float reveal = smoothstep(0.0, 0.25, uReveal * 1.6 - fromFace - n * 0.5);
    // Into darkness below the shoulders, where her name sits.
    float fade = smoothstep(0.02, 0.4, vUv.y);
    float alpha = a * reveal * fade * uOpacity;
    if (alpha < 0.004) discard;
    gl_FragColor = vec4(col, alpha);
  }
`;
