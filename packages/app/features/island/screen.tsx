import { View, Text, Button, XStack, Theme, styled, AnimatePresence, type ViewProps } from 'tamagui'
import { useEffect, useState } from 'react'
import { Bell } from './Bell'
import Reanimated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated'
import { BlurViewProps, BlurView as ExpoBlurView } from 'expo-blur'

const BlurView = Reanimated.createAnimatedComponent(styled(ExpoBlurView, {}))
const AnimatedView = Reanimated.createAnimatedComponent(View)

import { usePrevious } from 'app/hooks/usePreviouse'

type STATUS = 'idle' | 'ring' | 'silent' | 'timer'

const styles = {
  islandStyle: {
    idle: {
      w: 150,
      h: 40,
      scale: 1,
    },
    ring: {
      w: 190,
      h: 40,
      scale: 1,
    },
    silent: {
      w: 230,
      h: 40,
      scale: 1,
    },
    timer: {
      w: 190,
      h: 40,
      scale: 1.8,
    },
  },
} as const satisfies Record<string, Record<STATUS, ViewProps>>

export const DynamicIslandScreen = () => {
  const [status, setStatus] = useState<STATUS>('idle')
  const previousStatus = usePrevious(status)
  const ringBlurViewIntensity = useSharedValue(20)

  const bellShakingRotation = useSharedValue<number>(0)

  const bellShakingRotationAnimatedStyle = useAnimatedStyle(() => ({
    transformOrigin: 'top',
    transform: [{ rotateZ: `${bellShakingRotation.value}deg` }],
  }))

  useEffect(() => {
    const ANGLE = 20
    if (status !== 'timer') {
      const multiplier = previousStatus === 'idle' || previousStatus === 'ring' ? -1 : 1
      bellShakingRotation.value = withSequence(
        withTiming(multiplier * ANGLE, {
          duration: 200,
        }),
        withSpring(0, { stiffness: 500, damping: 10, mass: 1 })
      )
    }
  }, [status])

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>
    if (status === 'ring') {
      ringBlurViewIntensity.value = withDelay(400, withTiming(0, { duration: 1000 }))
      timer = setTimeout(() => {
        setStatus('silent')
      }, 700)
    }
    return () => {
      clearTimeout(timer)
    }
  }, [status])

  return (
    <View bw={1} jc="center" ai="center" f={1} bg="#fff" gap="$4">
      <XStack
        animation={[
          'responsive',
          {
            stiffness: status === 'silent' ? 500 : 250,
            damping: status === 'silent' ? 22 : 20,
          },
        ]}
        jc="space-between"
        ai="center"
        px="$2"
        transformOrigin="center top"
        animateOnly={['width', 'transform']}
        bg="$gray12"
        br={1000_000}
        {...styles.islandStyle[status]}
      >
        <Theme inverse>
          <AnimatePresence>
            <View
              key="bell"
              animation={'quick'}
              animateOnly={['opacity', 'transform']}
              enterStyle={{ o: 0, scale: 0.9 }}
              exitStyle={{ o: 0, scale: 0.9 }}
              w={50}
              h={25}
              jc="center"
              ai="center"
            >
              <AnimatePresence>
                {status === 'silent' && (
                  <View
                    br={20}
                    bg="#fd4f30"
                    pos="absolute"
                    inset={0}
                    animation={[
                      'responsive',
                      {
                        stiffness: 500,
                        damping: 25,
                      },
                    ]}
                    transformOrigin="left"
                    animateOnly={['opacity', 'width', 'transform']}
                    enterStyle={{ o: 0.5, scale: 0.8, w: 25 }}
                    exitStyle={{ o: 0, scale: 0.9 }}
                    w={50}
                  />
                )}
              </AnimatePresence>
              <View>
                <AnimatePresence>
                  {status !== 'timer' && (
                    <View
                      animation={[
                        'quick',
                        {
                          damping: 45,
                          stiffness: 500,
                        },
                      ]}
                      animateOnly={['transform', 'opacity']}
                      x={status !== 'silent' ? -10 : 0}
                      enterStyle={{ o: 0, scale: 0.9 }}
                      exitStyle={{ o: 0, scale: 0.9 }}
                    >
                      <AnimatedView style={bellShakingRotationAnimatedStyle}>
                        <Bell size={16} />
                      </AnimatedView>
                      {/* cross icon line */}
                      {status === 'silent' && (
                        <View
                          animation={[
                            'responsive',
                            {
                              stiffness: 400,
                              damping: 30,
                            },
                          ]}
                          transformOrigin="left"
                          animateOnly={['height']}
                          enterStyle={{ h: 0, o: 0 }}
                          exitStyle={{ h: 0, o: 0 }}
                          x={8}
                          y={-1}
                          rotate="-45deg"
                          pos="absolute"
                          w={3}
                          bw={1}
                          h={20}
                          bg="#fff"
                          boc="#fd4f30"
                        />
                      )}
                    </View>
                  )}
                </AnimatePresence>
              </View>
            </View>
            <AnimatePresence>
              {status === 'ring' ? (
                <View
                  pos="absolute"
                  r="$3"
                  key="ring"
                  animation={'quick'}
                  animateOnly={['opacity', 'transform']}
                  enterStyle={{ o: 0 }}
                  exitStyle={{ o: 0 }}
                  transformOrigin="right"
                  p={4}
                >
                  <Text>Ring</Text>
                </View>
              ) : status === 'silent' ? (
                <View
                  pos="absolute"
                  r="$3"
                  key="silent"
                  animation={'quick'}
                  animateOnly={['opacity', 'transform']}
                  enterStyle={{ o: 0 }}
                  exitStyle={{ o: 0 }}
                  transformOrigin="left"
                  p={4}
                >
                  <Text col="#fd4f30">Silent</Text>
                </View>
              ) : null}
            </AnimatePresence>
          </AnimatePresence>
        </Theme>
      </XStack>

      <XStack pos="absolute" b={48} gap="$4">
        <Button onPress={() => setStatus('idle')}>
          <Button.Text>State 1</Button.Text>
        </Button>
        <Button onPress={() => setStatus('ring')}>
          <Button.Text>State 2</Button.Text>
        </Button>
        <Button onPress={() => setStatus('timer')}>
          <Button.Text>State 3</Button.Text>
        </Button>
      </XStack>
    </View>
  )
}
