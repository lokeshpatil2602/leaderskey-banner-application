import React, { useMemo } from 'react';
import { useTranslation } from '../../i18n/I18nContext';
import {
  GestureResponderHandlers,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View
} from 'react-native';
import {
  BannerBackground,
  BannerCanvas,
  BannerElement
} from '../../api/services/templateService';
import { getResolvedFontStyle } from '../../utils/fontUtils';

type BannerRendererProps = {
  canvas?: BannerCanvas;
  background?: BannerBackground;
  elements: BannerElement[];
  containerWidth: number;
  selectedElementId?: string;
  onSelectElement?: (elementId: string) => void;
  panHandlers?: GestureResponderHandlers;
  interactive?: boolean;
  showBadge?: boolean;
  showBorder?: boolean;
  cleanExport?: boolean;
};

export const BannerRenderer = React.memo(function BannerRenderer({
  canvas = { width: 1080, height: 1350, sizePreset: 'Portrait' },
  background = { type: 'image', source: '', color: '#0f172a' },
  elements = [],
  containerWidth,
  selectedElementId,
  onSelectElement,
  panHandlers,
  interactive = false,
  showBadge = false,
  showBorder = false,
  cleanExport = false
}: BannerRendererProps) {
  const { t } = useTranslation();
  // Preserve canvas aspect ratio exactly
  const canvasWidth = canvas.width || 1080;
  const canvasHeight = canvas.height || 1350;
  const aspectRatio = canvasWidth / canvasHeight;

  const renderWidth = Math.round(containerWidth);
  const renderHeight = Math.round(renderWidth / aspectRatio);
  const scale = renderWidth / 360; // Scale base for font sizes relative to standard 360px viewport

  // Memoized sorting of elements by zIndex to avoid re-sorting on every render
  const sortedElements = useMemo(() => {
    return [...elements].sort((a, b) => (a.zIndex || 1) - (b.zIndex || 1));
  }, [elements]);

  return (
    <View
      style={[
        styles.canvasContainer,
        {
          width: renderWidth,
          height: renderHeight,
          backgroundColor: background.color || '#0f172a',
          borderRadius: cleanExport ? 0 : 12,
          borderWidth: cleanExport || !showBorder ? 0 : 1,
          borderColor: '#cbd5e1',
          shadowOpacity: cleanExport ? 0 : 0.08,
          elevation: cleanExport ? 0 : 2
        }
      ]}
      {...(panHandlers || {})}
    >
      {/* Background Image / Color Layer */}
      {background.type === 'image' && background.source ? (
        <Image
          source={{ uri: background.source }}
          style={styles.backgroundImage}
          resizeMode="cover"
        />
      ) : null}

      {/* Elements Layer */}
      {sortedElements.map((el) => {
        if (el.visible === false) return null;

        const isSelected = selectedElementId === el.id;
        const posX = el.position?.x !== undefined ? el.position.x : 50;
        const posY = el.position?.y !== undefined ? el.position.y : 50;
        const widthPercent = el.size?.width || 60;
        const heightPercent = el.size?.height || 15;

        // Render Text Element
        if (el.type === 'text') {
          const fontStyle = getResolvedFontStyle(el.style?.fontFamily);
          const rawFontSize = el.style?.fontSize || 20;
          const scaledFontSize = Math.round(Math.max(10, rawFontSize * scale * 0.9));

          return (
            <Pressable
              key={el.id}
              disabled={!interactive}
              onPress={() => onSelectElement?.(el.id)}
              style={[
                styles.textElementWrapper,
                {
                  left: `${posX}%`,
                  top: `${posY}%`,
                  width: `${widthPercent}%`
                },
                isSelected && styles.elementSelected
              ]}
            >
              <Text
                style={[
                  styles.elementText,
                  fontStyle,
                  {
                    fontSize: scaledFontSize,
                    color: el.style?.color || '#FFFFFF',
                    textAlign: el.style?.alignment || 'center'
                  }
                ]}
                numberOfLines={3}
              >
                {el.content || (el.label ? `[${el.label}]` : '')}
              </Text>

              {isSelected && (
                <View style={styles.selectedIndicator}>
                  <Text style={styles.selectedIndicatorText}>
                    {el.locked ? t('fixed') : el.movable ? t('movable') : t('selected')}
                  </Text>
                </View>
              )}
            </Pressable>
          );
        }

        // Render Image / Logo / Symbol Element
        const imageSource =
          el.source ||
          (el.type === 'logo'
            ? 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200'
            : el.type === 'symbol'
            ? 'https://images.unsplash.com/photo-1607344645866-009c320b5ab8?w=200'
            : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500');

        return (
          <Pressable
            key={el.id}
            disabled={!interactive}
            onPress={() => onSelectElement?.(el.id)}
            style={[
              styles.imageElementWrapper,
              {
                left: `${posX}%`,
                top: `${posY}%`,
                width: `${widthPercent}%`,
                height: `${heightPercent}%`,
                opacity: el.style?.opacity !== undefined ? el.style.opacity : 1
              },
              isSelected && styles.elementSelected
            ]}
          >
            <Image
              source={{ uri: imageSource }}
              style={[
                styles.imageContent,
                {
                  borderRadius:
                    el.style?.borderRadius !== undefined
                      ? (el.style.borderRadius * renderWidth) / 360
                      : el.type === 'logo' || el.type === 'symbol'
                      ? 8
                      : 12
                }
              ]}
              resizeMode={el.type === 'logo' || el.type === 'symbol' ? 'contain' : 'cover'}
            />

            {isSelected && (
              <View style={styles.selectedIndicator}>
                <Text style={styles.selectedIndicatorText}>
                  {el.locked ? t('fixed') : el.movable ? t('movable') : t('selected')}
                </Text>
              </View>
            )}
          </Pressable>
        );
      })}

      {/* Preset Badge (Only shown in editor/preview when explicitly requested) */}
      {showBadge && canvas.sizePreset ? (
        <View style={styles.sizeBadge}>
          <Text style={styles.sizeBadgeText}>
            {canvas.sizePreset} ({canvasWidth}×{canvasHeight})
          </Text>
        </View>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  canvasContainer: {
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
  textElementWrapper: {
    position: 'absolute',
    transform: [{ translateX: -100 }, { translateY: -12 }], // Centered offset
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 6
  },
  imageElementWrapper: {
    position: 'absolute',
    transform: [{ translateX: -50 }, { translateY: -25 }], // Centered offset
    alignItems: 'center',
    justifyContent: 'center'
  },
  imageContent: {
    width: '100%',
    height: '100%'
  },
  elementSelected: {
    borderWidth: 2,
    borderColor: '#38bdf8',
    backgroundColor: 'rgba(2, 132, 199, 0.2)',
    borderRadius: 8
  },
  selectedIndicator: {
    position: 'absolute',
    top: -10,
    right: -4,
    backgroundColor: '#0284c7',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4
  },
  selectedIndicatorText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '700'
  },
  elementText: {
    textShadowColor: 'rgba(0, 0, 0, 0.85)',
    textShadowRadius: 4,
    textShadowOffset: { width: 0, height: 1 }
  },
  sizeBadge: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4
  },
  sizeBadgeText: {
    color: '#94a3b8',
    fontSize: 9,
    fontWeight: '600'
  }
});
