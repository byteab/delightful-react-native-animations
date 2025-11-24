export function generateLSystemString(
  axiom: string,
  rules: Record<string, string>,
  iterations: number
): string {
  'worklet'
  let current = axiom
  for (let i = 0; i < iterations; i++) {
    let next = ''
    for (const char of current) {
      next += rules[char] || char
    }
    current = next
  }
  return current
}
