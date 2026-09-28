import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

const SHAPES = [
  { id: 'rectangle', label: 'आयत (Rectangle)', icon: '⬛' },
  { id: 'rounded', label: 'कार्ड (Rounded Card)', icon: '🔲' },
  { id: 'circle', label: 'वर्तुळ (Circle Frame)', icon: '⭕' },
  { id: 'nameplate', label: 'नाव पट्टी (Nameplate)', icon: '🏷️' }
];

const SHAPE_COLORS = [
  '#2563EB', '#DC2626', '#EA580C', '#D97706', '#059669',
  '#0891B2', '#7C3AED', '#DB2777', '#111827', '#FFFFFF',
  '#F59E0B', '#1E40AF', '#065F46', '#991B1B', '#F3F4F6'
];

type ShapePanelProps = {
  onAddShape: (shapeType: 'rectangle' | 'rounded' | 'circle' | 'nameplate', color: string) => void;
  onClose: () => void;
};

export const ShapePanel: React.FC<ShapePanelProps> = ({ onAddShape, onClose }) => {
  const [selectedShape, setSelectedShape] = useState<'rectangle' | 'rounded' | 'circle' | 'nameplate'>('rounded');
  const [selectedColor, setSelectedColor] = useState('#2563EB');

  const handleAdd = () => {
    onAddShape(selectedShape, selectedColor);
    onClose();
  };

  return (
    <View style={styles.panelContainer}>
      <View style={styles.panelHeader}>
        <Text style={styles.panelTitle}>आकार जोडा (Add Shapes & Badges)</Text>
        <Pressable onPress={onClose} style={styles.closeBtn}>
          <Text style={styles.closeBtnText}>✕</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scrollBody}>
        {/* Shape Types */}
        <Text style={styles.sectionLabel}>आकाराचा प्रकार (Shape Type):</Text>
        <View style={styles.shapesGrid}>
          {SHAPES.map((sh) => {
            const isSelected = selectedShape === sh.id;
            return (
              <Pressable
                key={sh.id}
                style={[styles.shapeCard, isSelected && styles.shapeCardActive]}
                onPress={() => setSelectedShape(sh.id as any)}
              >
                <Text style={styles.shapeIcon}>{sh.icon}</Text>
                <Text style={[styles.shapeLabel, isSelected && styles.shapeLabelActive]}>{sh.label}</Text>
              </Pressable>
            );
          })}
        </View>

        {/* Color Palette */}
        <Text style={styles.sectionLabel}>रंग (Shape Color):</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.colorRow}>
          {SHAPE_COLORS.map((c) => (
            <Pressable
              key={c}
              style={[styles.colorCircle, { backgroundColor: c }, selectedColor === c && styles.colorActive]}
              onPress={() => setSelectedColor(c)}
            />
          ))}
        </ScrollView>

        <Pressable style={styles.addActionBtn} onPress={handleAdd}>
          <Text style={styles.addActionText}>+ आकार जोडा (Insert Shape)</Text>
        </Pressable>
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
    maxHeight: 360,
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
  shapesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10
  },
  shapeCard: {
    flex: 1,
    minWidth: '45%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB'
  },
  shapeCardActive: {
    backgroundColor: '#EEF2FF',
    borderColor: '#4F46E5',
    borderWidth: 1.5
  },
  shapeIcon: {
    fontSize: 20
  },
  shapeLabel: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '600'
  },
  shapeLabelActive: {
    color: '#4F46E5',
    fontWeight: '700'
  },
  colorRow: {
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 8
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
  addActionBtn: {
    marginTop: 16,
    backgroundColor: '#2563EB',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center'
  },
  addActionText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14
  }
});
