import React, { memo, useLayoutEffect, useRef, forwardRef, useImperativeHandle, useCallback } from 'react'
import { Animated, LayoutAnimation, Text, View } from 'react-native'
import { FlatList, PanGestureHandler, PinchGestureHandler } from 'react-native-gesture-handler'

import styles from './styles'
import { useMeasure } from 'helpers/hooks'
import { foldAnimation } from './animations'
import ItemFocused from './ItemFocused'
import Item from './Item'
import { useItems } from './useItems'
import { usePinchGesture } from './usePinchGesture'
import { useScroll } from './useScroll'
import { usePanGesture } from './usePanGesture'
import { useVisibility } from './useVisibility'
import ItemReader from './ItemReader'

type Props = {
  itemDict: object
  ordering: string[]
  levels: number[]
  addItem: (item: object) => void
  changeItems: any
  deleteItems: any
  setLevels: (levels: number[]) => void
  setOrdering: (ordering: string[]) => void
  onChangeFocusedItem: ({ position: number, item: object}) => void
} & typeof defaultProps &
  React.ComponentProps<typeof FlatList>

const defaultProps = {
  mode: 'outliner' as 'outliner' | 'skeleton' | 'reader' | 'concept',
  canAddItems: true,
}

const createAnimatedValues = () => ({
  draggable: {
    level: new Animated.Value(0),
    opacity: new Animated.Value(0),
    translateY: new Animated.Value(0),
  },
  targetIndicator: {
    opacity: new Animated.Value(0.2),
    translateY: new Animated.Value(0),
  },
  scroll: new Animated.Value(0),
})

function Outliner({ renderItem, ...props }: Props, ref) {
  useImperativeHandle(ref, () => ({
    focusItem,
    scrollToItem,
  }))

  const bench = useMeasure('ReorderableTree')

  const {
    ordering,
    setOrdering,
    levels,
    setLevels,
    changeItems,
    deleteItems,
    onChangeFocusedItem,
    mode,
    openHandler,
  } = props

  const refs = useRef({
    itemHeights: [] as number[],
    panGesture: {
      x: 0,
      y: 0,
    },
    pinchGesture: {
      isActive: false,
    },
    lastOffset: 0,
    draggable: {
      levelOffset: 0,
      state: 'inactive' as 'inactive' | 'active' | 'edit',
    },
    moveAxis: 'h',
    move: {
      fromPosition: null as number | null,
      toLevel: null as number | null,
      toPosition: null,
    },
    scrollPosition: 0,
    animating: false,
    actions: {
      open: openHandler,
    },
  })

  const animatedValuesRef = useRef(createAnimatedValues())
  const animatedValues = animatedValuesRef.current
  const refsData = refs.current

  const draggableItemRef = useRef<ItemDraggable>()
  const flatlistRef = useRef<FlatList<{}>>()

  const scrollToItem = (item: number |  string) => {
    const index = typeof item === 'string' ? ordering.findIndex((id) => id === item) : item
    LayoutAnimation.configureNext(foldAnimation)
    flatlistRef.current.getNode().scrollToIndex({
      index,
      viewPosition: 0.2,
      animated: true,
    })
  }

  const focusItem = (index: number) => {
    activateItem(index)
  }

  const [hideDict, setItemVisibility] = useVisibility(ordering)

  const itemsData = { hideDict, levels, ordering }

  const {
    items,
    createNewItem,
    onItemIndicatorPress,
    onItemLayoutCallback,
    activateItem,
    getItemLayout,
    loadingItems,
  } = useItems(
    itemsData,
    refsData,
    draggableItemRef,
    props,
    setItemVisibility,
    animatedValues,
    onChangeFocusedItem
  )

  const { onPanCallback, onPanHandlerStateCallback } = usePanGesture(
    itemsData,
    refsData,
    draggableItemRef,
    setOrdering,
    setLevels,
    animatedValues
  )

  const { onPinchCallback, onPinchStateCallback } = usePinchGesture(
    itemsData,
    refsData,
    setItemVisibility
  )

  const onScrollEventCallback = useScroll(refsData, animatedValues)

  const onItemPress = useCallback((item) => {
    activateItem(item.position)
  },[])

  if (loadingItems) {
    return (
      <View>
        <Text>Loading</Text>
      </View>
    )
  }

  bench.step('reorderable')

  const OutlinerItem = mode === 'outliner' ? Item : ItemReader
  return (
    <ReorderableTreeFlatListContext.Provider value={refs}>
      <PinchGestureHandler
        onGestureEvent={onPinchCallback}
        onHandlerStateChange={onPinchStateCallback}
      >
        <View>
          <Animated.FlatList
            renderItem={({ item, index }) => (
              <OutlinerItem
                mode={props.mode}
                item={item}
                position={index}
                onItemPress={onItemPress}
                onItemIndicatorPress={onItemIndicatorPress}
                onItemLayoutCallback={onItemLayoutCallback}
                itemHeight={refsData.itemHeights[index]}
                {...itemsData}
              />
            )}
            ref={flatlistRef}
            data={items}
            getItemLayout={mode !== 'reader' && getItemLayout}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { y: animatedValues.scroll } } }],
              { useNativeDriver: true, listener: onScrollEventCallback }
            )}
            {...props}
          />

          <PanGestureHandler
            onGestureEvent={Animated.event(
              [{ nativeEvent: { translationY: animatedValues.draggable.translateY } }],
              {
                useNativeDriver: true,
                listener: event => {
                  onPanCallback(event)
                },
              }
            )}
            onHandlerStateChange={onPanHandlerStateCallback}
          >
            <Animated.View
              style={[
                styles.draggableWrapper,
                {
                  opacity: animatedValues.draggable.opacity,
                  transform: [
                    {
                      translateY: Animated.add(
                        animatedValues.draggable.translateY,
                        Animated.divide(animatedValues.scroll, -1)
                      ),
                    },
                  ],
                },
              ]}
            >
              <Animated.View
                style={[
                  styles.row,
                  { transform: [{ translateX: animatedValues.draggable.level }] },
                ]}
              >
                <ItemFocused
                  onAddButtonPress={createNewItem}
                  onItemPress={activateItem}
                  onItemIndicatorPress={onItemIndicatorPress}
                  renderItem={renderItem}
                  ref={draggableItemRef}
                  focus={focusItem}
                  activateItem={activateItem}
                  canAddItems={props.canAddItems}
                  deleteItems={deleteItems}
                  changeItems={changeItems}
                  refs={refs}
                  {...itemsData}
                />
              </Animated.View>
            </Animated.View>
          </PanGestureHandler>

          <Animated.View
            style={[
              styles.targetIndicator,
              { opacity: animatedValues.targetIndicator.opacity },
              { transform: [{ translateY: animatedValues.targetIndicator.translateY }] },
            ]}
          />
        </View>
      </PinchGestureHandler>
    </ReorderableTreeFlatListContext.Provider>
  )
}

Outliner.defaultProps = defaultProps

export const ReorderableTreeFlatListContext = React.createContext<Context>({})

export type Refs = typeof gestureData
export type AnimatedValues = ReturnType<typeof createAnimatedValues>

export default memo(forwardRef(Outliner))
