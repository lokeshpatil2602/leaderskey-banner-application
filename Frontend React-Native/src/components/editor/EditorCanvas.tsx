import React, { useRef, useMemo } from 'react';
import {
  Dimensions,
  Image,
  PanResponder,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { EditorElement, EditorSnapshot, DrawingStroke } from '../../state/editorState';
import { TransformHandles } from './TransformHandles';
import { getResolvedFontStyle } from '../../utils/fontUtils';

const { width: WINDOW_WIDTH } = Dimensions.get('window');

type EditorCanvasProps = {
  snapshot: EditorSnapshot;
  selectedElementId: string | null;
  onSelectElement: (id: string | null) => void;
  onUpdateElementPosition: (id: string, newPosition: { x: number; y: number }) => void;
  onRotateElement?: (id: string) => void;
  onResizeElement?: (id: string) => void;
  onDeleteElement: (id: string) => void;
  onDuplicateElement: (id: string) => void;
  isExporting?: boolean;
  isBrushMode?: boolean;
  currentBrushStroke?: DrawingStroke | null;
  onBrushTouchStart?: (x: number, y: number) => void;
  onBrushTouchMove?: (x: number, y: number) => void;
  onBrushTouchEnd?: () => void;
  canvasRef?: React.RefObject<View | null>;
};

export const EditorCanvas: React.FC<EditorCanvasProps> = ({
  snapshot,
  selectedElementId,
  onSelectElement,
  onUpdateElementPosition,
  onRotateElement,
  onResizeElement,
  onDeleteElement,
  onDuplicateElement,
  isExporting = false,
  isBrushMode = false,
  currentBrushStroke = null,
  onBrushTouchStart,
  onBrushTouchMove,
  onBrushTouchEnd,
  canvasRef
}) => {
  const { elements, background, canvasWidth, canvasHeight, drawingStrokes } = snapshot;
  const aspectRatio = canvasWidth / canvasHeight;

  // Max display width on device screen
  const displayWidth = Math.min(WINDOW_WIDTH - 24, 380);
  const displayHeight = Math.round(displayWidth / aspectRatio);
  const scale = displayWidth / 360;

  // Touch handling for Brush Drawing mode
  const brushPanResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => isBrushMode,
        onMoveShouldSetPanResponder: () => isBrushMode,
        onPanResponderGrant: (evt) => {
          const { locationX, locationY } = evt.nativeEvent;
          onBrushTouchStart?.(locationX, locationY);
        },
        onPanResponderMove: (evt) => {
          const { locationX, locationY } = evt.nativeEvent;
          onBrushTouchMove?.(locationX, locationY);
        },
        onPanResponderRelease: () => {
          onBrushTouchEnd?.();
        },
        onPanResponderTerminate: () => {
          onBrushTouchEnd?.();
        }
      }),
    [isBrushMode, onBrushTouchStart, onBrushTouchMove, onBrushTouchEnd]
  );

  // Sorted elements by zIndex
  const sortedElements = useMemo(() => {
    return [...elements]
      .filter((el) => el.visible !== false)
      .sort((a, b) => a.zIndex - b.zIndex);
  }, [elements]);

  return (
    <View
      style={[
        styles.outerContainer,
        {
          width: displayWidth,
          height: displayHeight
        }
      ]}
      onStartShouldSetResponder={() => !isBrushMode}
      onResponderRelease={() => onSelectElement(null)}
      {...(isBrushMode ? brushPanResponder.panHandlers : {})}
    >
      {/* 
        Native View container targeted for captureRef export.
        collapsable={false} is critical for Android view hierarchy capture.
      */}
      <View
        ref={canvasRef as any}
        collapsable={false}
        style={[
          styles.canvasArea,
          {
            width: displayWidth,
            height: displayHeight,
            backgroundColor: background.color || '#FFFFFF'
          }
        ]}
      >
        {/* Background Image if present */}
        {background.imageUrl ? (
          <Image
            source={{ uri: background.imageUrl }}
            style={styles.backgroundImage}
            resizeMode="cover"
          />
        ) : null}

        {/* Render Canvas Elements */}
        {sortedElements.map((el) => {
          const isSelected = selectedElementId === el.id && !isExporting && !isBrushMode;
          return (
            <CanvasElementItem
              key={el.id}
              element={el}
              scale={scale}
              displayWidth={displayWidth}
              displayHeight={displayHeight}
              isSelected={isSelected}
              onSelect={() => onSelectElement(el.id)}
              onUpdatePosition={(pos) => onUpdateElementPosition(el.id, pos)}
              onRotate={() => onRotateElement?.(el.id)}
              onResize={() => onResizeElement?.(el.id)}
              onDelete={() => onDeleteElement(el.id)}
              onDuplicate={() => onDuplicateElement(el.id)}
              isExporting={isExporting}
            />
          );
        })}

        {/* Render Drawing Strokes */}
        {drawingStrokes.map((stroke) => (
          <RenderStroke key={stroke.id} stroke={stroke} />
        ))}

        {/* Current Active Brush Stroke */}
        {currentBrushStroke ? <RenderStroke stroke={currentBrushStroke} /> : null}
      </View>
    </View>
  );
};

// Component for Individual Canvas Element
type CanvasElementItemProps = {
  element: EditorElement;
  scale: number;
  displayWidth: number;
  displayHeight: number;
  isSelected: boolean;
  onSelect: () => void;
  onUpdatePosition: (pos: { x: number; y: number }) => void;
  onRotate?: () => void;
  onResize?: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  isExporting: boolean;
};

const CanvasElementItem: React.FC<CanvasElementItemProps> = React.memo(
  ({
    element,
    scale,
    displayWidth,
    displayHeight,
    isSelected,
    onSelect,
    onUpdatePosition,
    onRotate,
    onResize,
    onDelete,
    onDuplicate,
    isExporting
  }) => {
    const elWidth = Math.round((element.size.width / 100) * displayWidth);
    const elHeight = Math.round((element.size.height / 100) * displayHeight);
    const pixelX = Math.round((element.position.x / 100) * displayWidth);
    const pixelY = Math.round((element.position.y / 100) * displayHeight);

    const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

    const panResponder = useMemo(
      () =>
        PanResponder.create({
          onStartShouldSetPanResponder: () => !element.locked && !isExporting,
          onMoveShouldSetPanResponder: () => !element.locked && !isExporting,
          onPanResponderGrant: () => {
            onSelect();
            dragStartRef.current = { x: element.position.x, y: element.position.y };
          },
          onPanResponderMove: (_, gestureState) => {
            const deltaXPercent = (gestureState.dx / displayWidth) * 100;
            const deltaYPercent = (gestureState.dy / displayHeight) * 100;

            const newX = Math.min(100, Math.max(0, Math.round(dragStartRef.current.x + deltaXPercent)));
            const newY = Math.min(100, Math.max(0, Math.round(dragStartRef.current.y + deltaYPercent)));

            onUpdatePosition({ x: newX, y: newY });
          }
        }),
      [element.locked, element.position, displayWidth, displayHeight, isExporting, onSelect, onUpdatePosition]
    );

    const transformStyle = [
      { translateX: -elWidth / 2 },
      { translateY: -elHeight / 2 },
      { rotate: `${element.rotation || 0}deg` }
    ];

    const elementStyle = element.style || {};

    return (
      <View
        {...panResponder.panHandlers}
        style={[
          styles.elementWrapper,
          {
            left: pixelX,
            top: pixelY,
            width: elWidth,
            height: elHeight,
            transform: transformStyle,
            opacity: element.opacity !== undefined ? element.opacity : 1,
            zIndex: element.zIndex
          }
        ]}
      >
        {/* Element Content Rendering */}
        {element.type === 'text' ? (
          <View
            style={[
              styles.textContainer,
              elementStyle.backgroundColor ? { backgroundColor: elementStyle.backgroundColor, paddingHorizontal: 6, borderRadius: 4 } : {}
            ]}
          >
            <Text
              style={[
                styles.baseText,
                getResolvedFontStyle(elementStyle.fontFamily),
                {
                  fontSize: Math.round((elementStyle.fontSize || 18) * scale),
                  color: elementStyle.color || '#111827',
                  textAlign: elementStyle.textAlign || 'center',
                  fontWeight: elementStyle.fontWeight || '700',
                  fontStyle: elementStyle.fontStyle || 'normal',
                  letterSpacing: elementStyle.letterSpacing || 0
                },
                elementStyle.shadowColor
                  ? {
                      textShadowColor: elementStyle.shadowColor,
                      textShadowRadius: elementStyle.shadowBlur || 3,
                      textShadowOffset: { width: elementStyle.shadowOffsetX || 1, height: elementStyle.shadowOffsetY || 1 }
                    }
                  : {}
              ]}
              numberOfLines={4}
            >
              {element.content}
            </Text>
          </View>
        ) : element.type === 'image' ? (
          <Image
            source={{ uri: element.content }}
            style={[
              styles.imageElement,
              {
                borderRadius: elementStyle.borderRadius ? (elementStyle.borderRadius * scale) : 0,
                borderWidth: elementStyle.borderWidth || 0,
                borderColor: elementStyle.borderColor || 'transparent'
              }
            ]}
            resizeMode="cover"
          />
        ) : element.type === 'sticker' ? (
          <View style={styles.stickerContainer}>
            {element.content.startsWith('http') ? (
              <Image source={{ uri: element.content }} style={styles.stickerImage} resizeMode="contain" />
            ) : (
              <Text style={[styles.stickerEmoji, { fontSize: Math.round(36 * scale) }]}>{element.content}</Text>
            )}
          </View>
        ) : element.type === 'shape' ? (
          <View
            style={[
              styles.shapeContainer,
              {
                backgroundColor: elementStyle.backgroundColor || '#2563EB',
                borderColor: elementStyle.borderColor || 'transparent',
                borderWidth: elementStyle.borderWidth || 0,
                borderRadius:
                  elementStyle.shapeType === 'circle'
                    ? elWidth / 2
                    : elementStyle.shapeType === 'rounded'
                    ? 12 * scale
                    : 0
              }
            ]}
          />
        ) : null}

        {/* Transform / Selection Overlay Handles */}
        {isSelected ? (
          <TransformHandles
            width={elWidth}
            height={elHeight}
            rotation={element.rotation}
            locked={element.locked}
            onDelete={onDelete}
            onDuplicate={onDuplicate}
            onRotate={onRotate}
            onResize={onResize}
          />
        ) : null}
      </View>
    );
  }
);

// Stroke Drawing renderer
const RenderStroke: React.FC<{ stroke: DrawingStroke }> = ({ stroke }) => {
  if (!stroke.points || stroke.points.length === 0) return null;

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {stroke.points.map((pt, idx) => (
        <View
          key={idx}
          style={{
            position: 'absolute',
            left: pt.x - stroke.width / 2,
            top: pt.y - stroke.width / 2,
            width: stroke.width,
            height: stroke.width,
            borderRadius: stroke.width / 2,
            backgroundColor: stroke.color
          }}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    alignSelf: 'center',
    marginVertical: 10,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    borderRadius: 8,
    overflow: 'hidden'
  },
  canvasArea: {
    overflow: 'hidden',
    position: 'relative'
  },
  backgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%'
  },
  elementWrapper: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center'
  },
  textContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%'
  },
  baseText: {
    includeFontPadding: false
  },
  imageElement: {
    width: '100%',
    height: '100%'
  },
  stickerContainer: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center'
  },
  stickerImage: {
    width: '100%',
    height: '100%'
  },
  stickerEmoji: {
    textAlign: 'center'
  },
  shapeContainer: {
    width: '100%',
    height: '100%'
  }
});
