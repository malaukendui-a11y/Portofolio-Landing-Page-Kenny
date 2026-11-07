/**
 * Glass lens and WebGL ticker settings (DESIGN §6, PRD F-03 / F-04). Plain values only:
 * nothing here imports `three`, so the hero can read them without pulling the lazy 3D chunk
 * into the initial bundle (CLAUDE.md rule 3). Colours that exist as design tokens are read
 * from CSS at runtime; the few values below that are not tokens (the §6 tint, the light
 * colours) describe the 3D material and lights, not UI.
 */

/**
 * Every glyph the WebGL ticker may draw: both languages' `hero.name`, the space and the three
 * dashes the marquee unit can end with. The ticker font is cut from exactly this list
 * (docs/DECISIONS.md, "ticker font subset"); `three.spec.ts` checks the shipped font's cmap
 * against the unit text of both languages, because troika fetches a fallback font from a CDN
 * for any glyph the font lacks.
 */
export const TICKER_GLYPHS = 'AKadeny —–-'

/** WOFF (troika cannot read WOFF2), subset to `TICKER_GLYPHS`, GPOS `kern` only. */
export const TICKER_FONT_URL = '/fonts/InterDisplay-Medium-ticker.woff'

/** Glyph SDF size for 228 px letters (troika's default 64 rounds the corners). */
export const TICKER_SDF_SIZE = 128

/** DESIGN §6 MeshTransmissionMaterial, starting values. */
export const GLASS = {
  transmission: 1,
  thickness: 0.45,
  roughness: 0.08,
  ior: 1.32,
  chromaticAberration: 0.035,
  /** DESIGN's "anisotropy": drei 10 names the transmission blur `anisotropicBlur`. */
  anisotropicBlur: 0.1,
  distortion: 0.12,
  /** Per lens radius: the noise is sampled in world space, so the scene divides it by r. */
  distortionScale: 0.3,
  temporalDistortion: 0.1,
  backside: true,
  samples: 6,
  resolution: 512,
  backsideResolution: 512,
  /**
   * Per surface. With `backside` the light crosses two surfaces, so the tint applies twice:
   * `#fff9f7` is the square root (in linear light) of DESIGN §6's `#fff3ef`, which is what the
   * lens shows overall. `#fff3ef` itself read as a pink disc (measured: G −22, B −27).
   */
  color: '#fff9f7',
} as const

/** The lens: a flattened sphere, never a torus (DESIGN §2.3, §6). */
export const LENS = {
  /** Centre as a fraction of the stage width: the middle of the hero's accent glow. */
  x: 0.18,
  /** Radius as a fraction of the ticker font size. */
  radiusEm: 0.42,
  /** DESIGN §8: slightly smaller between 1024 and 1439 px. */
  scaleBelow1440: 0.9,
  /** Depth relative to the radius (sphere scaled 1 : 1 : 0.45). */
  depth: 0.45,
  widthSegments: 64,
  heightSegments: 32,
  /** Side of the fallback image relative to the lens diameter (room for edge highlights). */
  exportExtent: 1.25,
} as const

/**
 * The static lens (DESIGN §6 "Static fallback"): a lens-only RGBA WebP exported at 2× from the
 * dev scene (`scripts/export-glass-fallback.mjs`), at the 1440 px lens size. `size` is the
 * export canvas side in CSS px: the lens diameter times `LENS.exportExtent`.
 */
export const FALLBACK = {
  src: '/3d/hero-glass-fallback@2x.webp',
  size: 240,
  width: 480,
  height: 480,
} as const

/** drei Float values from DESIGN §6. */
export const FLOAT = { speed: 1.2, rotationIntensity: 0.4, floatIntensity: 0.6 } as const

/**
 * drei Float's motion (v10.7.9, `core/Float.js`) as a pure function of time, so the lens can
 * run it on its own clock: R3F resets `clock.elapsedTime` whenever `frameloop` changes, which
 * would snap drei's Float to a new pose on every pause. Position is in lens radii.
 */
export function floatPose(t: number): { x: number; y: number; z: number; lift: number } {
  const a = (t / 4) * FLOAT.speed
  return {
    x: (Math.cos(a) / 8) * FLOAT.rotationIntensity,
    y: (Math.sin(a) / 8) * FLOAT.rotationIntensity,
    z: (Math.sin(a) / 20) * FLOAT.rotationIntensity,
    lift: (Math.sin(a) / 10) * FLOAT.floatIntensity,
  }
}

/** Pointer tilt, scroll yaw and drift (DESIGN §6 "Animation"). */
export const MOTION_3D = {
  /** Maximum tilt toward the cursor, radians. */
  parallax: 0.18,
  /** `damp` smoothing for the tilt (higher follows faster). */
  parallaxLambda: 4,
  /** Extra Y rotation at the bottom of the hero, degrees. */
  scrollYaw: 12,
  /** Downward drift at the bottom of the hero, CSS px. */
  scrollDrift: 40,
  /** Largest frame step the scene integrates, seconds (no jump after a stall or a pause). */
  maxStep: 0.1,
} as const

/** Perspective camera: 1 world unit = 1 CSS px at z = 0 (camera z = h / (2·tan(fov / 2))). */
export const CAMERA = { fov: 30 } as const

/** Device-pixel-ratio clamp (DESIGN §6). */
export const DPR: [number, number] = [1, 1.5]

/** Mount gate timings, ms. */
export const MOUNT = {
  /** From the chunk request to the first frame; past it the static lens takes over. */
  watchdog: 10_000,
  /** How long a lost WebGL context may take to come back before the static lens takes over. */
  restoreWindow: 2_000,
  /** Fallback when `requestIdleCallback` is missing. */
  idleFallback: 200,
} as const

/**
 * Lighting with zero downloads (CLAUDE.md rule 10): an Environment built from Lightformers,
 * authored in unit space (only direction and angular size reach the environment map). Colours
 * name a CSS token, or give a light colour that has no UI token.
 */
export const LIGHTFORMERS = [
  // Warm key above-left.
  { token: '--color-text-on-dark', intensity: 2.2, position: [-5, 4, 4], scale: [6, 3] },
  // Cool fill on the right: a neutral daylight white, not a UI colour.
  { color: '#eef1f5', intensity: 1, position: [6, 0, 2], scale: [3, 7] },
  // Thin rim strip behind and below.
  { token: '--color-paper-50', intensity: 3, position: [0, -5, -3], scale: [12, 0.35] },
] as const

/** Soft key light for the rim highlight, top-left. */
export const KEY_LIGHT = { position: [-3, 4, 3], intensity: 0.8 } as const
