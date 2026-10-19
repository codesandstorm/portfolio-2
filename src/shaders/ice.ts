/** Crystalline shards: Fresnel-lit edges, a cold faint body, a facet glint. */
export const iceVertex = /* glsl */ `
  attribute float aLife;
  varying vec3 vNormal;
  varying vec3 vView;
  varying float vLife;

  void main() {
    vLife = aLife;
    vec4 mv = modelViewMatrix * instanceMatrix * vec4(position, 1.0);
    vNormal = normalize(normalMatrix * mat3(instanceMatrix) * normal);
    vView = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }
`;

export const iceFragment = /* glsl */ `
  uniform float uTime;
  uniform vec3 uCold;
  uniform vec3 uWhite;
  varying vec3 vNormal;
  varying vec3 vView;
  varying float vLife;

  void main() {
    float f = 1.0 - abs(dot(normalize(vNormal), normalize(vView)));
    float rim = pow(f, 2.2);
    float glint = pow(max(0.0, dot(normalize(vNormal), normalize(vec3(0.4, 0.8, 0.5)))), 24.0);
    vec3 col = uCold * (0.12 + rim * 1.4) + uWhite * glint * 1.5;
    float a = (0.1 + rim * 0.8 + glint) * vLife;
    if (a < 0.01) discard;
    gl_FragColor = vec4(col, a);
  }
`;
