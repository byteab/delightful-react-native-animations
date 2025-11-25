import { Canvas, Path, Skia, useClock } from '@shopify/react-native-skia'
import { generateLSystemString, noise } from './utils'
import { useWindowDimensions, View } from '@my/ui'
import { useDerivedValue, type SharedValue } from 'react-native-reanimated'
import { useMemo } from 'react'

const idealTree = {
  axiom: 'F',
  rules: {
    F: 'FF+[+F-F-F]-[-F+F+F]',
  },
  iterations: 4,
}

const ROTATE_ANGLE = (15 / 180) * Math.PI
const INITIAL_ANGLE = Math.PI / 2
const BRANCH_LENGTH = 8
const NOISE_OFFSET = 0.1
const ANGLE_MIN = -Math.PI / 25
const ANGLE_MAX = Math.PI / 40
const ANGLE_RANGE = ANGLE_MAX - ANGLE_MIN

let savedInfos: { angle: number; originX: number; originY: number; depth: number }[] = []
function generateTreePaths(
  wind: number,
  windowWidth: number,
  windowHeight: number,
  treeString: string
) {
  'worklet'
  savedInfos = []
  let length = BRANCH_LENGTH
  const rotateAngle = ROTATE_ANGLE
  let angle = INITIAL_ANGLE
  let originX = windowWidth / 2 - 100
  let originY = windowHeight / 2

  let depth = 0
  const maxDepth = idealTree.iterations

  // Number of stroke width levels ( more = smoother)
  const STROKE_QUANTIZATION = 20
  const pathsByStrokeWidth: any[] = []

  for (let i = 0; i <= STROKE_QUANTIZATION; i++) {
    pathsByStrokeWidth.push(Skia.Path.Make())
  }

  // Helper to get stroke width index from depth
  // Higher depth (leaves) should map to higher indices (thinner strokes)
  const getStrokeWidthIndex = (normalizedDepth: number): number => {
    'worklet'
    // Invert: higher depth -> higher index (thinner stroke)
    // normalizedDepth 0 (trunk) -> index 0 (thick)
    // normalizedDepth 1 (leaves) -> index STROKE_QUANTIZATION (thin)
    const quantized = Math.round(normalizedDepth * STROKE_QUANTIZATION)
    return Math.max(0, Math.min(STROKE_QUANTIZATION, quantized))
  }

  let branchIndex = 0
  let lastWasF = false

  for (let i = 0; i < treeString.length; i++) {
    const char = treeString[i]
    if (char === '+') {
      angle -= rotateAngle
      lastWasF = false
    } else if (char === '-') {
      angle += rotateAngle
      lastWasF = false
    } else if (char === '[') {
      savedInfos.push({
        angle: angle,
        originX: originX,
        originY: originY,
        depth: depth,
      })
      depth++
      lastWasF = false
    } else if (char === ']') {
      const savedInfo = savedInfos.pop()
      if (savedInfo) {
        angle = savedInfo.angle
        originX = savedInfo.originX
        originY = savedInfo.originY
        depth = savedInfo.depth
      }
      lastWasF = false
    } else if (char === 'F') {
      const noiseValue = noise(wind + branchIndex * NOISE_OFFSET)
      const clampedNoise = Math.max(0, Math.min(1, noiseValue))
      const newAngle = ANGLE_MIN + clampedNoise * ANGLE_RANGE
      angle += newAngle
      branchIndex++

      const x1 = originX
      const y1 = originY
      const normalizedDepth = depth / maxDepth
      const easedDepth = 1 - (1 - normalizedDepth) ** 3
      // Reduced length reduction for more visible branches
      const currentLength = length * (1 - easedDepth * 0.15) // Reduced from 0.2 to 0.15
      const cosAngle = Math.cos(angle)
      const sinAngle = Math.sin(angle)
      const x2 = x1 + currentLength * cosAngle
      const y2 = y1 - currentLength * sinAngle

      // Use quantized stroke width index for smoother transitions
      const strokeWidthIndex = getStrokeWidthIndex(normalizedDepth)
      const path = pathsByStrokeWidth[strokeWidthIndex]

      // Move to start point if this is a new segment
      if (!lastWasF) {
        path.moveTo(x1, y1)
      }
      path.lineTo(x2, y2)

      originX = x2
      originY = y2
      lastWasF = true
    }
  }

  return { paths: pathsByStrokeWidth }
}

interface TreePathProps {
  strokeWidthIndex: number
  treePaths: SharedValue<{ paths: any[] }>
  color: string
  strokeWidth: number
}

function TreePath({ strokeWidthIndex, treePaths, color, strokeWidth }: TreePathProps) {
  const path = useDerivedValue(() => {
    const treeData = treePaths.value
    const paths = treeData?.paths
    return paths && paths[strokeWidthIndex] ? paths[strokeWidthIndex] : Skia.Path.Make()
  })

  return (
    <Path
      path={path}
      color={color}
      style="stroke"
      strokeWidth={strokeWidth}
      strokeCap="round"
      strokeJoin="round"
    />
  )
}

export const HomeScreen = () => {
  const clock = useClock()

  const { width, height } = useWindowDimensions()

  const tree = useMemo(() => {
    return generateLSystemString(idealTree.axiom, idealTree.rules, idealTree.iterations)
  }, [])

  const treePaths = useDerivedValue(() => {
    const wind = ((clock.value / 1000) % 100) * 1.3
    return generateTreePaths(wind, width, height, tree)
  })

  // Pre-calculate colors and stroke widths for each stroke width level
  // Using finer granularity (20 levels) for smoother transitions
  // Index 0 = trunk (thick), Index 20 = leaves (thin)
  const STROKE_QUANTIZATION = 20
  const strokeWidthStyles = useMemo(() => {
    return Array.from({ length: STROKE_QUANTIZATION + 1 }, (_, index) => {
      // t represents normalized depth: 0 = trunk, 1 = top leaves
      const t = index / STROKE_QUANTIZATION
      // Less aggressive decay for thicker leaves: reduced exponent from 2.5 to 2.0
      const decayFactor = (1 - t) ** 2.0
      // Increased minimum stroke width from 0.6 to 1.2 for less thin appearance
      const strokeWidth = 1.2 + (4.0 - 1.2) * decayFactor

      // Use same color calculation based on normalized position
      const easedDepth = t * 0.7 + t ** 2 * 0.3
      const r = Math.round(100 + (180 - 100) * easedDepth)
      const g = Math.round(150 + (220 - 150) * easedDepth)
      const b = Math.round(20 + (50 - 20) * easedDepth)
      const color = `rgb(${r}, ${g}, ${b})`

      return { color, strokeWidth, index }
    })
  }, [])

  return (
    <View flex={1} bg="#fff">
      <Canvas style={{ flex: 1 }}>
        {strokeWidthStyles.map((style) => (
          <TreePath
            key={style.index}
            strokeWidthIndex={style.index}
            treePaths={treePaths}
            color={style.color}
            strokeWidth={style.strokeWidth}
          />
        ))}
      </Canvas>
    </View>
  )
}
