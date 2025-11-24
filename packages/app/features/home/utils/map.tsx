// credit to p5.js for the implementation
export function map(
  n: number,
  start1: number,
  stop1: number,
  start2: number,
  stop2: number,
  withinBounds: boolean
) {
  'worklet'
  const newval = ((n - start1) / (stop1 - start1)) * (stop2 - start2) + start2
  if (!withinBounds) {
    return newval
  }
  if (start2 < stop2) {
    return Math.max(Math.min(newval, stop2), start2)
  }

  return Math.max(Math.min(newval, start2), stop2)
}
