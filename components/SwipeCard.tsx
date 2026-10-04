import { type ReactNode, useRef } from "react"
import { Animated, PanResponder, StyleSheet, View } from "react-native"

export function SwipeCard({
  children,
  disabled,
  onPass,
  onSave,
  onYes,
}: {
  children: ReactNode
  disabled?: boolean
  onPass: () => void
  onSave?: () => void
  onYes: () => void
}) {
  const x = useRef(new Animated.Value(0)).current
  const y = useRef(new Animated.Value(0)).current
  const pan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_e, g) => Math.abs(g.dx) > 8 || Math.abs(g.dy) > 8,
      onPanResponderMove: (_e, g) => {
        x.setValue(g.dx)
        y.setValue(g.dy)
      },
      onPanResponderRelease: (_e, g) => {
        if (disabled) {
          Animated.spring(x, { toValue: 0, useNativeDriver: true }).start()
          Animated.spring(y, { toValue: 0, useNativeDriver: true }).start()
          return
        }
        if (g.dx > 90) onYes()
        else if (g.dx < -90) onPass()
        else if (onSave && g.dy < -90) onSave()
        Animated.spring(x, { toValue: 0, useNativeDriver: true }).start()
        Animated.spring(y, { toValue: 0, useNativeDriver: true }).start()
      },
    })
  ).current

  return (
    <Animated.View
      style={[styles.wrap, { transform: [{ translateX: x }, { translateY: y }, { rotate: x.interpolate({
        inputRange: [-180, 0, 180],
        outputRange: ["-8deg", "0deg", "8deg"],
      }) }] }]}
      {...pan.panHandlers}
    >
      <View>{children}</View>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  wrap: { flex: 1 },
})
