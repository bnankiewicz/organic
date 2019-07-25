import { Animated } from "react-native";
import { LayoutAnimation } from "react-native";
import { AnimatedValues, Refs } from ".";
import {getDraggableToTargetOffset, getItemLevelOffset} from "./useItems";

export const foldAnimation = {
  duration: 300,
  update: {
    property: LayoutAnimation.Properties.scaleXY,
    type: LayoutAnimation.Types.easeOut,
  },
  create: {
    property: LayoutAnimation.Properties.scaleXY,
    type: LayoutAnimation.Types.easeOut,
  },
  delete: {
    property: LayoutAnimation.Properties.scaleXY,
    type: LayoutAnimation.Types.easeOut,
  },
}

export const opacityAnimation = {
  duration: 1500,
  update: {
    property: LayoutAnimation.Properties.opacity,
    type: LayoutAnimation.Types.easeOut,
  },
  create: {
    property: LayoutAnimation.Properties.opacity,
    type: LayoutAnimation.Types.easeOut,
  },
  delete: {
    property: LayoutAnimation.Properties.opacity,
    type: LayoutAnimation.Types.easeOut,
  },
}

export const startShiftLevelAnimation = (values: AnimatedValues, data: Refs) => {
  if (!data.animating && data.move.toLevel) {
    data.animating = true
    const toValue = getItemLevelOffset(data.move.toLevel)
    Animated.timing(values.draggable.level, {
      toValue,
      duration: 70,
      useNativeDriver: true,
    }).start(() => {
      data.animating = false
    })
  }
}

export function startActivateAnimation(values: AnimatedValues) {
  Animated.timing(values.draggable.opacity, {
    toValue: 1,
    duration: 200,
    useNativeDriver: true,
  }).start()
}

export function startDragAnimation(values: AnimatedValues) {
  Animated.timing(values.draggable.opacity, {
    toValue: 0.8,
    duration: 200,
    useNativeDriver: true,
  }).start()
}

export function endDragAnimation(values: AnimatedValues, data: Refs, ordering: string[], visibility: {}) {
  const dY = getDraggableToTargetOffset(data, ordering, visibility)
  Animated.sequence([
    Animated.timing(values.draggable.translateY, {
      toValue: dY,
      duration: 200,
      useNativeDriver: true,
    }),
    Animated.timing(values.draggable.opacity, {
      toValue: 0,
      duration: 500,
      useNativeDriver: true,
    }),
  ]).start()
}
