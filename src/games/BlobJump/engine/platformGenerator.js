import { GAME_WIDTH, GAME_HEIGHT, PLATFORM, lerp } from './physics'

export function generatePlatforms(rng, count = 500) {
  const platforms = []
  let y = GAME_HEIGHT - 80

  // Starting platform centered under the blob
  platforms.push({
    x: GAME_WIDTH / 2 - 50,
    y,
    width: 100,
    type: 'normal',
    broken: false,
    movingDir: 0,
    movingSpeed: 0,
    originX: GAME_WIDTH / 2 - 50,
  })

  for (let i = 1; i < count; i++) {
    const progress = i / count

    const minGap = lerp(55, 100, progress)
    const maxGap = lerp(85, 155, progress)
    y -= minGap + rng() * (maxGap - minGap)

    const width = lerp(80, 42, progress)
    const x = rng() * (GAME_WIDTH - width)

    const typeRoll = rng()
    let type = 'normal'
    if (progress > 0.15 && typeRoll < 0.20) type = 'moving'
    if (progress > 0.08 && typeRoll >= 0.20 && typeRoll < 0.40) type = 'fragile'
    if (typeRoll >= 0.90) type = 'spring'

    const movingSpeed =
      type === 'moving'
        ? lerp(PLATFORM.MOVING_SPEED_MIN, PLATFORM.MOVING_SPEED_MAX, progress) *
          (rng() > 0.5 ? 1 : -1)
        : 0

    platforms.push({
      x,
      y,
      width,
      type,
      broken: false,
      movingDir: movingSpeed > 0 ? 1 : -1,
      movingSpeed: Math.abs(movingSpeed),
      originX: x,
    })
  }

  return platforms
}
