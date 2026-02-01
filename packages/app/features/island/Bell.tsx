// @ts-nocheck
import { memo } from 'react'
import type { IconProps } from '@tamagui/helpers-icon'
import { Svg, Path, Circle } from 'react-native-svg'
import { themed } from '@tamagui/helpers-icon'

type IconComponent = (propsIn: IconProps) => JSX.Element

export const Bell: IconComponent = themed(
  memo(function Bell(props: IconProps) {
    const { color = 'black', size = 24, ...otherProps } = props
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...otherProps}>
        <Path
          d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326Z"
          fill={color}
        />
        <Circle cx="12" cy="21" r="1.5" fill={color} />
      </Svg>
    )
  })
)
