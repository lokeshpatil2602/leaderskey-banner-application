import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { EditorElement } from '../../state/editorState';

type LayersPanelProps = {
  elements: EditorElement[];
  selectedElementId: string | null;
  onSelectElement: (id: string) => void;
  onToggleVisibility: (id: string) => void;
  onToggleLock: (id: string) => void;
  onMoveLayerUp: (id: string) => void;
  onMoveLayerDown: (id: string) => void;
  onBringToFront: (id: string) => void;
  onSendToBack: (id: string) => void;
  onDuplicateElement: (id: string) => void;
  onDeleteElement: (id: string) => void;
  onClose: () => void;
};

const getSemanticLayerName = (el: EditorElement): string => {
  switch (el.type) {
    case 'text':
      return `मजकूर: "${el.content ? el.content.slice(0, 20) : 'Text'}"`;
    case 'image':
      return `फोटो: ${el.label || 'Image'}`;
    case 'sticker':
      return `स्टिकर: ${el.label || el.content || 'Sticker'}`;
    case 'shape':
      return `आकार: ${el.style?.shapeType || el.label || 'Shape'}`;
    case 'drawing':
      return 'ब्रश रेखाटन (Drawing)';
    default:
      return el.label || el.type;
  }
};

export const LayersPanel: React.FC<LayersPanelProps> = ({
  elements,
  selectedElementId,
  onSelectElement,
  onToggleVisibility,
  onToggleLock,
  onMoveLayerUp,
  onMoveLayerDown,
  onBringToFront,
  onSendToBack,
  onDuplicateElement,
  onDeleteElement,
  onClose
}) => {
  // Show from top-most layer to bottom-most layer
  const reversedElements = [...elements].sort((a, b) => b.zIndex - a.zIndex);

  return (
    <View style={styles.panelContainer}>
      <View style={styles.panelHeader}>
        <Text style={styles.panelTitle}>लेयर्स व्यवस्थापन (Layers: {elements.length})</Text>
        <Pressable onPress={onClose} style={styles.closeBtn}>
          <Text style={styles.closeBtnText}>✕</Text>
        </Pressable>
      </View>

      {elements.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>कॅनव्हासवर अजून कोणतेही घटक नाहीत.</Text>
          <Text style={styles.emptySubText}>(No elements on canvas yet)</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.layersList}>
          {reversedElements.map((el, idx) => {
            const isSelected = selectedElementId === el.id;
            const isVisible = el.visible !== false;
            const isLocked = Boolean(el.locked);

            return (
              <View key={el.id} style={[styles.layerItem, isSelected && styles.layerItemActive]}>
                {/* Select / Label */}
                <Pressable style={styles.layerInfo} onPress={() => onSelectElement(el.id)}>
                  <Text style={styles.layerTypeIcon}>
                    {el.type === 'text'
                      ? '📝'
                      : el.type === 'image'
                      ? '🖼️'
                      : el.type === 'sticker'
                      ? '🏷️'
                      : el.type === 'shape'
                      ? '🔷'
                      : '🖌️'}
                  </Text>
                  <View style={styles.layerTextGroup}>
                    <Text style={[styles.layerLabel, isSelected && styles.layerLabelActive]} numberOfLines={1}>
                      {getSemanticLayerName(el)}
                    </Text>
                    <Text style={styles.layerSub}>
                      Layer #{elements.length - idx} • zIndex: {el.zIndex}
                    </Text>
                  </View>
                </Pressable>

                {/* Layer Control Buttons */}
                <View style={styles.layerControls}>
                  {/* Eye Toggle */}
                  <Pressable style={styles.ctrlBtn} onPress={() => onToggleVisibility(el.id)} hitSlop={6}>
                    <Text style={styles.ctrlIcon}>{isVisible ? '👁️' : '🙈'}</Text>
                  </Pressable>

                  {/* Lock Toggle */}
                  <Pressable style={styles.ctrlBtn} onPress={() => onToggleLock(el.id)} hitSlop={6}>
                    <Text style={styles.ctrlIcon}>{isLocked ? '🔒' : '🔓'}</Text>
                  </Pressable>

                  {/* Move Up */}
                  <Pressable style={styles.ctrlBtn} onPress={() => onMoveLayerUp(el.id)} hitSlop={6}>
                    <Text style={styles.ctrlIcon}>▲</Text>
                  </Pressable>

                  {/* Move Down */}
                  <Pressable style={styles.ctrlBtn} onPress={() => onMoveLayerDown(el.id)} hitSlop={6}>
                    <Text style={styles.ctrlIcon}>▼</Text>
                  </Pressable>

                  {/* Duplicate */}
                  <Pressable style={styles.ctrlBtn} onPress={() => onDuplicateElement(el.id)} hitSlop={6}>
                    <Text style={styles.ctrlIcon}>⧉</Text>
                  </Pressable>

                  {/* Delete */}
                  <Pressable style={[styles.ctrlBtn, styles.delBtn]} onPress={() => onDeleteElement(el.id)} hitSlop={6}>
                    <Text style={[styles.ctrlIcon, { color: '#EF4444' }]}>✕</Text>
                  </Pressable>
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  panelContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingTop: 12,
    maxHeight: 380,
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8
  },
  panelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 8
  },
  panelTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827'
  },
  closeBtn: {
    padding: 4
  },
  closeBtnText: {
    fontSize: 18,
    color: '#6B7280',
    fontWeight: '700'
  },
  layersList: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    gap: 8
  },
  layerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB'
  },
  layerItemActive: {
    backgroundColor: '#EEF2FF',
    borderColor: '#6366F1',
    borderWidth: 1.5
  },
  layerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1
  },
  layerTypeIcon: {
    fontSize: 18
  },
  layerTextGroup: {
    flex: 1
  },
  layerLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151'
  },
  layerLabelActive: {
    color: '#4F46E5',
    fontWeight: '700'
  },
  layerSub: {
    fontSize: 10,
    color: '#9CA3AF'
  },
  layerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  ctrlBtn: {
    width: 28,
    height: 28,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center'
  },
  delBtn: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FECACA'
  },
  ctrlIcon: {
    fontSize: 12,
    color: '#4B5563'
  },
  emptyContainer: {
    padding: 24,
    alignItems: 'center'
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4B5563'
  },
  emptySubText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4
  }
});
