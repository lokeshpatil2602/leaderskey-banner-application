import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { EditorElement } from '../../state/editorState';

const OPACITY_PRESETS = [
  { label: '100%', value: 1.0 },
  { label: '85%', value: 0.85 },
  { label: '70%', value: 0.7 },
  { label: '50%', value: 0.5 },
  { label: '30%', value: 0.3 }
];

const SHADOW_PRESETS = [
  { label: 'None', blur: 0, color: undefined },
  { label: 'हल्की (Soft)', blur: 4, color: 'rgba(0,0,0,0.3)' },
  { label: 'मध्यम (Medium)', blur: 8, color: 'rgba(0,0,0,0.5)' },
  { label: 'ठळक (Strong)', blur: 14, color: 'rgba(0,0,0,0.75)' }
];

const BORDER_RADIUS_PRESETS = [
  { label: 'चौरस (0px)', value: 0 },
  { label: 'गोल कोपरे (8px)', value: 8 },
  { label: 'मध्यम (16px)', value: 16 },
  { label: 'अंडगोलाकार (30px)', value: 30 }
];

type EffectsPanelProps = {
  selectedElement: EditorElement | null;
  onUpdateElementStyle: (styleUpdates: any, opacity?: number) => void;
  onClose: () => void;
};

export const EffectsPanel: React.FC<EffectsPanelProps> = ({
  selectedElement,
  onUpdateElementStyle,
  onClose
}) => {
  if (!selectedElement) {
    return (
      <View style={styles.panelContainer}>
        <View style={styles.panelHeader}>
          <Text style={styles.panelTitle}>इफेक्ट्स (Effects)</Text>
          <Pressable onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeBtnText}>✕</Text>
          </Pressable>
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>कृपया आधी कॅनव्हासवरील कोणताही घटक निवडा.</Text>
          <Text style={styles.emptySubText}>(Please select any text, image or shape to apply effects)</Text>
        </View>
      </View>
    );
  }

  const currentOpacity = selectedElement.opacity !== undefined ? selectedElement.opacity : 1;
  const currentShadow = selectedElement.style?.shadowBlur || 0;
  const currentRadius = selectedElement.style?.borderRadius || 0;

  return (
    <View style={styles.panelContainer}>
      <View style={styles.panelHeader}>
        <Text style={styles.panelTitle}>इफेक्ट्स: {selectedElement.label || selectedElement.type}</Text>
        <Pressable onPress={onClose} style={styles.closeBtn}>
          <Text style={styles.closeBtnText}>✕</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scrollBody}>
        {/* Opacity Presets */}
        <Text style={styles.sectionLabel}>पारदर्शकता (Opacity):</Text>
        <View style={styles.presetRow}>
          {OPACITY_PRESETS.map((op) => {
            const isSelected = Math.abs(currentOpacity - op.value) < 0.05;
            return (
              <Pressable
                key={op.label}
                style={[styles.presetBtn, isSelected && styles.presetBtnActive]}
                onPress={() => onUpdateElementStyle({}, op.value)}
              >
                <Text style={[styles.presetText, isSelected && styles.presetTextActive]}>{op.label}</Text>
              </Pressable>
            );
          })}
        </View>

        {/* Shadow Presets */}
        <Text style={styles.sectionLabel}>सावली इफेक्ट (Drop Shadow):</Text>
        <View style={styles.presetRow}>
          {SHADOW_PRESETS.map((sh) => {
            const isSelected = currentShadow === sh.blur;
            return (
              <Pressable
                key={sh.label}
                style={[styles.presetBtn, isSelected && styles.presetBtnActive]}
                onPress={() =>
                  onUpdateElementStyle({
                    shadowColor: sh.color,
                    shadowBlur: sh.blur,
                    shadowOffsetX: sh.blur > 0 ? 2 : 0,
                    shadowOffsetY: sh.blur > 0 ? 3 : 0
                  })
                }
              >
                <Text style={[styles.presetText, isSelected && styles.presetTextActive]}>{sh.label}</Text>
              </Pressable>
            );
          })}
        </View>

        {/* Border Radius for Image / Shape */}
        {selectedElement.type === 'image' || selectedElement.type === 'shape' ? (
          <>
            <Text style={styles.sectionLabel}>कोपरे गोलाकार (Corner Radius):</Text>
            <View style={styles.presetRow}>
              {BORDER_RADIUS_PRESETS.map((br) => {
                const isSelected = currentRadius === br.value;
                return (
                  <Pressable
                    key={br.label}
                    style={[styles.presetBtn, isSelected && styles.presetBtnActive]}
                    onPress={() => onUpdateElementStyle({ borderRadius: br.value })}
                  >
                    <Text style={[styles.presetText, isSelected && styles.presetTextActive]}>{br.label}</Text>
                  </Pressable>
                );
              })}
            </View>
          </>
        ) : null}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  panelContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingTop: 12,
    maxHeight: 340,
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
  scrollBody: {
    paddingHorizontal: 16,
    paddingBottom: 20
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
    marginTop: 8,
    marginBottom: 6
  },
  presetRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8
  },
  presetBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center'
  },
  presetBtnActive: {
    backgroundColor: '#EEF2FF',
    borderColor: '#4F46E5',
    borderWidth: 1.5
  },
  presetText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '600'
  },
  presetTextActive: {
    color: '#4F46E5',
    fontWeight: '700'
  },
  emptyContainer: {
    padding: 24,
    alignItems: 'center'
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4B5563',
    textAlign: 'center'
  },
  emptySubText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
    textAlign: 'center'
  }
});
