/**
 * Reading and setting the name marquee's phase (components/hero/Ticker, globals.css
 * `marquee-track`). The track moves by one copy group (-50 % of the track) per loop, so a phase
 * is a fraction of one group: 0 at rest, approaching 1 just before the seam.
 *
 * Only `currentTime` is ever written. Calling `pause()` or `play()` on a CSS animation would
 * detach it from `animation-play-state` for good, and the marquee relies on that property to
 * pause off-screen and in hidden tabs.
 */

/** The running `marquee` keyframe animation of a track, if any (none under reduced motion). */
export function marqueeAnimation(track: Element): CSSAnimation | undefined {
  return track
    .getAnimations()
    .find(
      (animation): animation is CSSAnimation =>
        (animation as CSSAnimation).animationName === 'marquee',
    )
}

/** Fraction of one group the track has travelled, 0 ≤ phase < 1; 0 without an animation. */
export function marqueePhase(track: Element): number {
  const progress = marqueeAnimation(track)?.effect?.getComputedTiming().progress
  return typeof progress === 'number' ? progress % 1 : 0
}

/** Moves the track to `fraction` of one group, keeping its play state. */
export function setMarqueePhase(track: Element, fraction: number): void {
  const animation = marqueeAnimation(track)
  const timing = animation?.effect?.getTiming()
  const duration = Number(timing?.duration)
  if (!animation || !Number.isFinite(duration) || duration <= 0) return
  const wrapped = ((fraction % 1) + 1) % 1
  const forward = timing?.direction !== 'reverse' && timing?.direction !== 'alternate-reverse'
  animation.currentTime = (forward ? wrapped : 1 - wrapped) * duration
}
