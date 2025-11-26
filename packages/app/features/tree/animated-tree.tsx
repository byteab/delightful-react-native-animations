import { Canvas, Path, Skia, useClock } from '@shopify/react-native-skia'
import { generateLSystemString, noise } from './utils'
import { View } from '@my/ui'
import { useDerivedValue, type SharedValue } from 'react-native-reanimated'
import { useMemo } from 'react'

const idealTree = {
  axiom: 'F',
  rules: {
    F: 'FF+[+F-F-F]-[-F+F+F]',
  },
  iterations: 4,
}

const ROTATE_ANGLE = (20 / 180) * Math.PI
const INITIAL_ANGLE = Math.PI / 2
const BRANCH_LENGTH = 8
const NOISE_OFFSET = 0.1
const ANGLE_MIN = -Math.PI / 25
const ANGLE_MAX = Math.PI / 40
const ANGLE_RANGE = ANGLE_MAX - ANGLE_MIN
const STROKE_QUANTIZATION = 20

const getStrokeWidthIndex = (normalizedDepth: number): number => {
  'worklet'
  const quantized = Math.round(normalizedDepth * STROKE_QUANTIZATION)
  return Math.max(0, Math.min(STROKE_QUANTIZATION, quantized))
}

let savedInfos: { angle: number; originX: number; originY: number; depth: number }[] = []

function generateTreePaths(wind: number, treeString: string) {
  'worklet'
  savedInfos = []
  let length = BRANCH_LENGTH
  const rotateAngle = ROTATE_ANGLE
  let angle = INITIAL_ANGLE
  let originX = 100
  let originY = 400

  let depth = 0
  const maxDepth = idealTree.iterations

  const pathsByStrokeWidth: any[] = []

  for (let i = 0; i <= STROKE_QUANTIZATION; i++) {
    pathsByStrokeWidth.push(Skia.Path.Make())
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

      const currentLength = length * (1 - easedDepth * 0.15)
      const cosAngle = Math.cos(angle)
      const sinAngle = Math.sin(angle)
      const x2 = x1 + currentLength * cosAngle
      const y2 = y1 - currentLength * sinAngle

      const strokeWidthIndex = getStrokeWidthIndex(normalizedDepth)
      const path = pathsByStrokeWidth[strokeWidthIndex]

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

const AnimatedTree = () => {
  const clock = useClock()

  const tree = useMemo(() => {
    return generateLSystemString(idealTree.axiom, idealTree.rules, idealTree.iterations)
  }, [])

  const treePaths = useDerivedValue(() => {
    const wind = ((clock.value / 1000) % 200) * 1.3
    return generateTreePaths(wind, tree)
  })

  const strokeWidthStyles = useMemo(() => {
    return Array.from({ length: STROKE_QUANTIZATION + 1 }, (_, index) => {
      const t = index / STROKE_QUANTIZATION
      const decayFactor = (1 - t) ** 2.0
      const strokeWidth = 1.2 + (4.0 - 1.2) * decayFactor

      const easedDepth = t * 0.7 + t ** 2 * 0.3
      const r = Math.round(100 + (180 - 100) * easedDepth)
      const g = Math.round(150 + (220 - 150) * easedDepth)
      const b = Math.round(20 + (50 - 20) * easedDepth)
      const color = `rgb(${r}, ${g}, ${b})`

      return { color, strokeWidth, index }
    })
  }, [])

  return (
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
  )
}

export const AnimatedTreeScreen = () => {
  return (
    <View jc="center" ai="center" f={1} bg="#fff" gap="$4">
      <View w={500} h={450}>
        <View
          jc="center"
          ai="center"
          x={85}
          y={386}
          scaleY={0.4}
          pos="absolute"
          w={30}
          h={30}
          bg="$gray4"
          br={1000}
        >
          <View w="50%" h="50%" bg="$gray8" br={1000} />
        </View>
        <AnimatedTree />
      </View>
    </View>
  )
}
