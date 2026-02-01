import { DynamicIslandScreen } from 'app/features/island/screen'
import { Stack } from 'expo-router'

export default function Screen() {
  return (
    <>
      <Stack.Screen
        options={{
          title: 'Dynamic Island',
        }}
      />
      <DynamicIslandScreen />
    </>
  )
}

