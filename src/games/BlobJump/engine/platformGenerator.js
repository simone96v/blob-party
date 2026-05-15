import { GAME_WIDTH, GAME_HEIGHT, PHYSICS, PLATFORM, lerp } from './physics'

/**
 * Progressive difficulty zones:
 *   0-20%   EASY     — wide platforms, small gaps, mostly normal
 *   20-45%  MEDIUM   — narrower, moving platforms appear, some fragile
 *   45-70%  HARD     — tight gaps, lots of moving + fragile, springs as relief
 *   70-100% EXTREME  — narrow, fast-moving, fragile clusters, big gaps
 *
 * Key guarantee: every platform is reachable from the one below it.
 * The maximum jump reach is calculated from JUMP_VELOCITY and GRAVITY.
 */

// Maximum height a normal jump can reach (physics-derived)
const MAX_JUMP_HEIGHT = (PHYSICS.JUMP_VELOCITY * PHYSICS.JUMP_VELOCITY) / (2 * PHYSICS.GRAVITY)
// Use 75% of max jump for comfort margin
const SAFE_VERTICAL_GAP = Math.abs(MAX_JUMP_HEIGHT) * 0.75
// Maximum horizontal distance reachable during a jump
const JUMP_TIME = Math.abs(PHYSICS.JUMP_VELOCITY) / PHYSICS.GRAVITY * 2
const MAX_HORIZONTAL_REACH = PHYSICS.MOVE_SPEED * JUMP_TIME

function getZone(progress) {
  if (progress < 0.20) return 'easy'
  if (progress < 0.45) return 'medium'
  if (progress < 0.70) return 'hard'
  return 'extreme'
}

const ZONE_CONFIG = {
  easy: {
    minGap: 50, maxGap: 80,
    minWidth: 75, maxWidth: 100,
    normalChance: 0.85, movingChance: 0.05, fragileChance: 0.0, springChance: 0.10,
    movingSpeedMul: 0.5,
  },
  medium: {
    minGap: 65, maxGap: 105,
    minWidth: 58, maxWidth: 85,
    normalChance: 0.55, movingChance: 0.20, fragileChance: 0.15, springChance: 0.10,
    movingSpeedMul: 0.7,
  },
  hard: {
    minGap: 80, maxGap: 130,
    minWidth: 46, maxWidth: 70,
    normalChance: 0.35, movingChance: 0.25, fragileChance: 0.25, springChance: 0.15,
    movingSpeedMul: 1.0,
  },
  extreme: {
    minGap: 95, maxGap: 155,
    minWidth: 38, maxWidth: 55,
    normalChance: 0.25, movingChance: 0.30, fragileChance: 0.25, springChance: 0.20,
    movingSpeedMul: 1.3,
  },
}

function pickType(rng, zone) {
  const c = ZONE_CONFIG[zone]
  const roll = rng()
  let acc = c.springChance
  if (roll < acc) return 'spring'
  acc += c.movingChance
  if (roll < acc) return 'moving'
  acc += c.fragileChance
  if (roll < acc) return 'fragile'
  return 'normal'
}

// Reference count for difficulty progression — difficulty maxes out at "extreme"
// after this many platforms, then stays there forever.
const DIFFICULTY_RAMP_COUNT = 500

export function generatePlatforms(rng, count = 200) {
  const platforms = []
  let y = GAME_HEIGHT - 80

  // Starting platform — wide and centered
  platforms.push({
    x: GAME_WIDTH / 2 - 55,
    y,
    width: 110,
    type: 'normal',
    broken: false,
    movingDir: 0,
    movingSpeed: 0,
    originX: GAME_WIDTH / 2 - 55,
  })

  // Second platform — easy reach to get the player going
  y -= 65
  platforms.push({
    x: GAME_WIDTH / 2 - 40,
    y,
    width: 80,
    type: 'normal',
    broken: false,
    movingDir: 0,
    movingSpeed: 0,
    originX: GAME_WIDTH / 2 - 40,
  })

  _appendPlatforms(rng, platforms, count - 2, 2)
  return platforms
}

/**
 * Extend an existing platform array with more platforms.
 * Called dynamically when the player approaches the top of generated platforms.
 */
export function extendPlatforms(rng, platforms, count = 200) {
  const startIdx = platforms.length
  _appendPlatforms(rng, platforms, count, startIdx)
}

function _appendPlatforms(rng, platforms, count, globalStartIdx) {
  let y = platforms[platforms.length - 1].y
  let lastFragileStreak = 0

  // Check trailing fragile streak from existing platforms
  for (let j = Math.max(0, platforms.length - 3); j < platforms.length; j++) {
    if (platforms[j].type === 'fragile') lastFragileStreak++
    else lastFragileStreak = 0
  }

  for (let i = 0; i < count; i++) {
    const globalIdx = globalStartIdx + i
    const progress = Math.min(1, globalIdx / DIFFICULTY_RAMP_COUNT)
    const zone = getZone(progress)
    const cfg = ZONE_CONFIG[zone]

    // Vertical gap with slight randomness
    const gap = lerp(cfg.minGap, cfg.maxGap, rng())
    // Clamp to safe jump height so it's always reachable
    const clampedGap = Math.min(gap, SAFE_VERTICAL_GAP)
    y -= clampedGap

    // Platform width
    const width = lerp(cfg.maxWidth, cfg.minWidth, rng() * 0.6 + progress * 0.4)

    // X position — ensure horizontal reachability from previous platform
    const prev = platforms[platforms.length - 1]
    const prevCenterX = prev.x + prev.width / 2
    const maxHReach = MAX_HORIZONTAL_REACH * 0.7 // conservative
    let x = rng() * (GAME_WIDTH - width)

    // Check if the new platform center is within horizontal reach
    const newCenterX = x + width / 2
    const hDist = Math.abs(newCenterX - prevCenterX)
    if (hDist > maxHReach) {
      // Pull it closer — place within reach
      const dir = newCenterX > prevCenterX ? 1 : -1
      x = prevCenterX + dir * maxHReach * (0.4 + rng() * 0.5) - width / 2
      x = Math.max(0, Math.min(GAME_WIDTH - width, x))
    }

    // Type selection with rules
    let type = pickType(rng, zone)

    // Don't allow more than 2 fragile in a row — always give a safe landing
    if (type === 'fragile') {
      lastFragileStreak++
      if (lastFragileStreak > 2) {
        type = rng() < 0.5 ? 'normal' : 'spring'
        lastFragileStreak = 0
      }
    } else {
      lastFragileStreak = 0
    }

    // After a spring, next platform should be reachable from spring height
    // (springs launch much higher, so the next gap can be bigger)
    if (prev.type === 'spring') {
      const springMaxH = (PHYSICS.SPRING_VELOCITY * PHYSICS.SPRING_VELOCITY) / (2 * PHYSICS.GRAVITY) * 0.6
      const extraGap = rng() * springMaxH * 0.3
      y -= extraGap
    }

    // Moving platform speed
    const movingSpeed = type === 'moving'
      ? lerp(PLATFORM.MOVING_SPEED_MIN, PLATFORM.MOVING_SPEED_MAX, progress) * cfg.movingSpeedMul
      : 0

    platforms.push({
      x,
      y,
      width,
      type,
      broken: false,
      movingDir: movingSpeed > 0 ? (rng() > 0.5 ? 1 : -1) : 0,
      movingSpeed: Math.abs(movingSpeed),
      originX: x,
    })
  }
}
