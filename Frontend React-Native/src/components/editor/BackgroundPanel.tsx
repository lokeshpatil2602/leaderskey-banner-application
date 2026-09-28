import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { EditorBackground } from '../../state/editorState';
import * as ImagePicker from 'expo-image-picker';
import { uploadImage } from '../../api/services/uploadService';

const SOLID_COLORS = [
  '#FFFFFF', '#F8FAFC', '#FEF3C7', '#FFE4E6', '#F3E8FF',
  '#E0F2FE', '#ECFDF5', '#FEE2E2', '#FFFBEB', '#111827',
  '#1E293B', '#831843', '#1E3A8A', '#064E3B', '#78350F'
];

const GRADIENT_PRESETS = [
  { label: 'भगवा-सुवर्ण (Saffron-Gold)', color: '#EA580C', gradientColors: ['#EA580C', '#FBBF24'] },
  { label: 'रॉयल ब्ल्यू (Royal Blue)', color: '#1E3A8A', gradientColors: ['#1E3A8A', '#38BDF8'] },
  { label: 'मॅरून फेस्टिव्ह (Crimson Gold)', color: '#991B1B', gradientColors: ['#991B1B', '#F59E0B'] },
  { label: 'पाचू हिरवा (Emerald)', color: '#065F46', gradientColors: ['#065F46', '#34D399'] },
  { label: 'गुलाबी रेशमी (Festive Magenta)', color: '#BE185D', gradientColors: ['#BE185D', '#F472B6'] },
  { label: 'क्लासिक डार्क (Velvet Dark)', color: '#0F172A', gradientColors: ['#0F172A', '#334155'] }
];

type BackgroundPanelProps = {
  currentBackground: EditorBackground;
  onUpdateBackground: (bg: EditorBackground) => void;
  onClose: () => void;
  onStartLoading?: (msg: string) => void;
  onStopLoading?: () => void;
};

export const BackgroundPanel: React.FC<BackgroundPanelProps> = ({
  currentBackground,
  onUpdateBackground,
  onClose,
  onStartLoading,
  onStopLoading
}) => {
  const handlePickGalleryImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.9
      });

      if (!result.canceled && result.assets?.[0]?.uri) {
        onStartLoading?.('पार्श्वभूमी अपलोड करत आहे (Uploading background)...');
        const localUri = result.assets[0].uri;
        const uploaded = await uploadImage(localUri);
        onUpdateBackground({
          type: 'image',
          color: '#FFFFFF',
          imageUrl: uploaded.url
        });
      }
    } catch (e) {
      console.warn('Background pick error:', e);
    } finally {
      onStopLoading?.();
    }
  };

  const handleResetBackground = () => {
    onUpdateBackground({
      type: 'solid',
      color: '#FFFFFF'
    });
  };

  return (
    <View style={styles.panelContainer}>
      <View style={styles.panelHeader}>
        <Text style={styles.panelTitle}>पार्श्वभूमी निवडा (Select Background)</Text>
        <Pressable onPress={onClose} style={styles.closeBtn}>
          <Text style={styles.closeBtnText}>✕</Text>
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollBody}>
        {/* Gallery Image & Reset Quick Buttons */}
        <View style={styles.actionRow}>
          <Pressable style={styles.galleryActionBtn} onPress={handlePickGalleryImage}>
            <Text style={styles.galleryActionText}>🖼️ गॅलरीमधून फोटो लावा (Photo BG)</Text>
          </Pressable>
          <Pressable style={styles.resetActionBtn} onPress={handleResetBackground}>
            <Text style={styles.resetActionText}>↺ मूळवत करा (Reset)</Text>
          </Pressable>
        </View>

        {/* Gradient Presets */}
        <Text style={styles.sectionLabel}>भारतीय सण व उत्सव शेड्स (Festive Gradients):</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.gradientRow}>
          {GRADIENT_PRESETS.map((g, idx) => (
            <Pressable
              key={idx}
              style={[
                styles.gradientCard,
                { backgroundColor: g.color },
                currentBackground.color === g.color && styles.cardActive
              ]}
              onPress={() => {
                onUpdateBackground({
                  type: 'solid',
                  color: g.color,
                  gradientColors: g.gradientColors
                });
              }}
            >
              <Text style={styles.gradientLabel}>{g.label}</Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Solid Colors */}
        <Text style={styles.sectionLabel}>साधे रंग (Solid Colors):</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.colorRow}>
          {SOLID_COLORS.map((c) => (
            <Pressable
              key={c}
              style={[
                styles.colorCircle,
                { backgroundColor: c },
                currentBackground.color === c && styles.colorActive
              ]}
              onPress={() => {
                onUpdateBackground({
                  type: 'solid',
                  color: c
                });
              }}
            />
          ))}
        </ScrollView>
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
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginVertical: 6
  },
  galleryActionBtn: {
    flex: 2,
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#6366F1',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center'
  },
  galleryActionText: {
    color: '#4F46E5',
    fontWeight: '700',
    fontSize: 13
  },
  resetActionBtn: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center'
  },
  resetActionText: {
    color: '#374151',
    fontWeight: '600',
    fontSize: 13
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
    marginTop: 10,
    marginBottom: 6
  },
  gradientRow: {
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 4
  },
  gradientCard: {
    width: 140,
    height: 56,
    borderRadius: 8,
    padding: 8,
    justifyContent: 'flex-end',
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E5E7EB'
  },
  cardActive: {
    borderWidth: 3,
    borderColor: '#2563EB',
    transform: [{ scale: 1.05 }]
  },
  gradientLabel: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3
  },
  colorRow: {
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 4
  },
  colorCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D1D5DB'
  },
  colorActive: {
    borderColor: '#2563EB',
    borderWidth: 3,
    transform: [{ scale: 1.15 }]
  }
});
