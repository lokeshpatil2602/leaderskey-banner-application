import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

const STICKER_CATEGORIES = [
  {
    id: 'festive',
    title: 'उत्सव व सण (Festive)',
    stickers: ['🚩', '🪔', '🌸', '🌺', '🥥', '🪕', '👑', '🕉️', '☸️', '🎊']
  },
  {
    id: 'celebration',
    title: 'वाढदिवस व शुभेच्छा (Birthday)',
    stickers: ['🎂', '🎁', '🎉', '🎈', '🥳', '💐', '🥂', '🎆', '🌟', '✨']
  },
  {
    id: 'honour',
    title: 'सन्मान व पद (Honour & Badges)',
    stickers: ['🏆', '🎖️', '🎗️', '🥇', '🎯', '👑', '💎', '🏅', '⭐', '🌟']
  },
  {
    id: 'national',
    title: 'राष्ट्रीय व सामाजिक (Symbols)',
    stickers: ['🇮🇳', '☀️', '🕊️', '🪷', '🦁', '⚖️', '🤝', '🏹', '🔥', '🛡️']
  },
  {
    id: 'social',
    title: 'सोशल व मीडिया (Social Icons)',
    stickers: ['📱', '💬', '📢', '📜', '✍️', '🔔', '🔖', '📍', '🌐', '📞']
  }
];

type StickerPanelProps = {
  onAddSticker: (sticker: string) => void;
  onClose: () => void;
};

export const StickerPanel: React.FC<StickerPanelProps> = ({ onAddSticker, onClose }) => {
  const [selectedCat, setSelectedCat] = useState('festive');

  const currentCategory = STICKER_CATEGORIES.find((c) => c.id === selectedCat) || STICKER_CATEGORIES[0];

  return (
    <View style={styles.panelContainer}>
      <View style={styles.panelHeader}>
        <Text style={styles.panelTitle}>स्टिकर्स व चिन्हे (Stickers & Badges)</Text>
        <Pressable onPress={onClose} style={styles.closeBtn}>
          <Text style={styles.closeBtnText}>✕</Text>
        </Pressable>
      </View>

      {/* Category Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRow}>
        {STICKER_CATEGORIES.map((cat) => (
          <Pressable
            key={cat.id}
            style={[styles.catTab, selectedCat === cat.id && styles.catTabActive]}
            onPress={() => setSelectedCat(cat.id)}
          >
            <Text style={[styles.catTabText, selectedCat === cat.id && styles.catTabTextActive]}>
              {cat.title}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Grid of Stickers */}
      <ScrollView contentContainerStyle={styles.gridContainer}>
        {currentCategory.stickers.map((stk, idx) => (
          <Pressable
            key={idx}
            style={styles.stickerBox}
            onPress={() => {
              onAddSticker(stk);
              onClose();
            }}
          >
            <Text style={styles.stickerEmoji}>{stk}</Text>
          </Pressable>
        ))}
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
  categoryRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6'
  },
  catTab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F3F4F6'
  },
  catTabActive: {
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#6366F1'
  },
  catTabText: {
    fontSize: 12,
    color: '#4B5563',
    fontWeight: '600'
  },
  catTabTextActive: {
    color: '#4F46E5',
    fontWeight: '700'
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    padding: 16,
    justifyContent: 'flex-start'
  },
  stickerBox: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 1
  },
  stickerEmoji: {
    fontSize: 32
  }
});
