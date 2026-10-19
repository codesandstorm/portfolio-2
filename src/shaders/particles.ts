/** Morphing energy particles: name, tunnel, portrait, threads, finale. */
export const particlesVertex = /* glsl */ `
  uniform float uTime;
  uniform float uSize;
  uniform float uPixelRatio;
  attribute float aSeed;
  attribute vec3 aColor;
  varying vec3 vColor;
  varying float vTwinkle;

  void main() {
    vec3 p = position;
    float s = aSeed * 6.2831;
    p += vec3(sin(uTime * 0.7 + s), cos(uTime * 0.5 + s * 1.3), sin(uTime * 0.6 + s * 0.7)) * 0.025;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    vTwinkle = 0.65 + 0.35 * sin(uTime * (1.2 + aSeed * 2.0) + s);
    float scale = 0.55 + aSeed * 0.9;
    gl_PointSize = uSize * scale * uPixelRatio * (24.0 / max(0.5, -mv.z));
    vColor = aColor;
  }
`;

export const particlesFragment = /* glsl */ `
  uniform float uOpacity;
  varying vec3 vColor;
  varying float vTwinkle;

  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.0, d);
    a = pow(a, 1.8) * vTwinkle * uOpacity;
    if (a < 0.01) discard;
    gl_FragColor = vec4(vColor * (1.0 + a * 0.6), a);
  }
`;

/** Background dust: far, slow, never interactive. */
export const dustVertex = /* glsl */ `
  uniform float uTime;
  uniform float uPixelRatio;
  attribute float aSeed;
  varying float vAlpha;

  void main() {
    vec3 p = position;
    p.x += sin(uTime * 0.03 + aSeed * 40.0) * 0.6;
    p.y += cos(uTime * 0.025 + aSeed * 30.0) * 0.6;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    float depth = -mv.z;
    vAlpha = smoothstep(140.0, 20.0, depth) * smoothstep(0.5, 6.0, depth) * (0.25 + aSeed * 0.5);
    gl_PointSize = (1.0 + aSeed * 2.2) * uPixelRatio * (18.0 / max(1.0, depth)) + 0.6;
  }
`;

export const dustFragment = /* glsl */ `
  varying float vAlpha;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.0, d) * vAlpha;
    if (a < 0.01) discard;
    gl_FragColor = vec4(vec3(0.78, 0.8, 1.0), a);
  }
`;
