import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

const BRUSH_COLORS = [
  '#EF4444', '#F97316', '#F59E0B', '#10B981', '#06B6D4',
  '#3B82F6', '#8B5CF6', '#EC4899', '#111827', '#FFFFFF',
  '#FFD700', '#EA580C', '#059669', '#1E40AF', '#831843'
];

const BRUSH_SIZES = [
  { label: 'बारीक (Fine)', size: 3 },
  { label: 'मध्यम (Medium)', size: 8 },
  { label: 'जाड (Thick)', size: 14 },
  { label: 'ठळक (Bold)', size: 22 }
];

type BrushPanelProps = {
  brushColor: string;
  brushWidth: number;
  onSetBrushColor: (c: string) => void;
  onSetBrushWidth: (w: number) => void;
  onUndoStroke: () => void;
  onClearStrokes: () => void;
  onExitBrush: () => void;
};

export const BrushPanel: React.FC<BrushPanelProps> = ({
  brushColor,
  brushWidth,
  onSetBrushColor,
  onSetBrushWidth,
  onUndoStroke,
  onClearStrokes,
  onExitBrush
}) => {
  return (
    <View style={styles.panelContainer}>
      <View style={styles.panelHeader}>
        <View style={styles.headerLeft}>
          <Text style={styles.brushStatusDot}>●</Text>
          <Text style={styles.panelTitle}>ब्रश रेखाटन मोड (Brush Drawing Active)</Text>
        </View>
        <Pressable onPress={onExitBrush} style={styles.doneBtn}>
          <Text style={styles.doneBtnText}>पूर्ण झाले (Done)</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scrollBody}>
        {/* Stroke Width Selector */}
        <Text style={styles.sectionLabel}>ब्रशची जाडी (Stroke Width):</Text>
        <View style={styles.sizeRow}>
          {BRUSH_SIZES.map((s) => {
            const isSelected = brushWidth === s.size;
            return (
              <Pressable
                key={s.size}
                style={[styles.sizeOption, isSelected && styles.sizeOptionActive]}
                onPress={() => onSetBrushWidth(s.size)}
              >
                <View
                  style={{
                    width: s.size + 4,
                    height: s.size + 4,
                    borderRadius: (s.size + 4) / 2,
                    backgroundColor: brushColor,
                    marginBottom: 4
                  }}
                />
                <Text style={[styles.sizeLabel, isSelected && styles.sizeLabelActive]}>{s.label}</Text>
              </Pressable>
            );
          })}
        </View>

        {/* Brush Color */}
        <Text style={styles.sectionLabel}>ब्रशचा रंग (Brush Color):</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.colorRow}>
          {BRUSH_COLORS.map((c) => (
            <Pressable
              key={c}
              style={[styles.colorCircle, { backgroundColor: c }, brushColor === c && styles.colorActive]}
              onPress={() => onSetBrushColor(c)}
            />
          ))}
        </ScrollView>

        {/* Undo & Clear Stroke Controls */}
        <View style={styles.actionRow}>
          <Pressable style={styles.undoStrokeBtn} onPress={onUndoStroke}>
            <Text style={styles.undoStrokeText}>↺ शेवटचे रेखाटन रद्द (Undo Stroke)</Text>
          </Pressable>
          <Pressable style={styles.clearStrokeBtn} onPress={onClearStrokes}>
            <Text style={styles.clearStrokeText}>🗑️ सर्व पुसा (Clear All)</Text>
          </Pressable>
        </View>
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
    maxHeight: 320,
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
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  brushStatusDot: {
    fontSize: 16,
    color: '#EF4444'
  },
  panelTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827'
  },
  doneBtn: {
    backgroundColor: '#10B981',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 6
  },
  doneBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12
  },
  scrollBody: {
    paddingHorizontal: 16,
    paddingBottom: 20
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
    marginTop: 6,
    marginBottom: 6
  },
  sizeRow: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'space-between'
  },
  sizeOption: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center'
  },
  sizeOptionActive: {
    backgroundColor: '#EEF2FF',
    borderColor: '#4F46E5',
    borderWidth: 1.5
  },
  sizeLabel: {
    fontSize: 10,
    color: '#4B5563',
    fontWeight: '600'
  },
  sizeLabelActive: {
    color: '#4F46E5',
    fontWeight: '700'
  },
  colorRow: {
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 6
  },
  colorCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#D1D5DB'
  },
  colorActive: {
    borderColor: '#2563EB',
    borderWidth: 3,
    transform: [{ scale: 1.15 }]
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12
  },
  undoStrokeBtn: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center'
  },
  undoStrokeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#374151'
  },
  clearStrokeBtn: {
    flex: 1,
    backgroundColor: '#FEE2E2',
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center'
  },
  clearStrokeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#DC2626'
  }
});
