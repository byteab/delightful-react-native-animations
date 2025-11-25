const hash = (n: number): number => {
  'worklet'
  let h = Math.floor(n) | 0
  h = ((h << 13) ^ h) >>> 0
  h = (h * (h * h * 15731 + 789221) + 1376312589) >>> 0
  return (h & 0x7fffffff) / 2147483648.0
}

const smoothstep = (t: number): number => {
  'worklet'
  return t * t * (3.0 - 2.0 * t)
}

export function noise(x: number): number {
  'worklet'
  const i = Math.floor(x)
  const f = x - i
  const s = smoothstep(f)
  return hash(i) * (1.0 - s) + hash(i + 1) * s
}
