import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

export type ActivePanel =
  | 'none'
  | 'text'
  | 'image'
  | 'background'
  | 'brush'
  | 'effects'
  | 'stickers'
  | 'shapes'
  | 'emoji'
  | 'layers';

type ToolbarItem = {
  id: ActivePanel | 'camera' | 'gallery';
  label: string;
  icon: string;
};

const TOOLBAR_ITEMS: ToolbarItem[] = [
  { id: 'camera', label: 'Camera', icon: '📷' },
  { id: 'gallery', label: 'Gallery', icon: '🖼️' },
  { id: 'text', label: 'Text', icon: '📝' },
  { id: 'background', label: 'Background', icon: '🎨' },
  { id: 'brush', label: 'Brush', icon: '🖌️' },
  { id: 'effects', label: 'Effects', icon: '✨' },
  { id: 'stickers', label: 'Stickers', icon: '🏷️' },
  { id: 'shapes', label: 'Shapes', icon: '🔷' },
  { id: 'emoji', label: 'Emoji', icon: '😀' },
  { id: 'layers', label: 'Layers', icon: '📚' }
];

type EditorToolbarProps = {
  activePanel: ActivePanel;
  onSelectTool: (toolId: ActivePanel | 'camera' | 'gallery') => void;
};

export const EditorToolbar: React.FC<EditorToolbarProps> = ({ activePanel, onSelectTool }) => {
  return (
    <View style={styles.toolbarContainer}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {TOOLBAR_ITEMS.map((item) => {
          const isActive = activePanel === item.id;
          return (
            <Pressable
              key={item.id}
              style={[styles.toolItem, isActive && styles.toolItemActive]}
              onPress={() => onSelectTool(item.id)}
            >
              <View style={[styles.iconBubble, isActive && styles.iconBubbleActive]}>
                <Text style={styles.toolIcon}>{item.icon}</Text>
              </View>
              <Text style={[styles.toolLabel, isActive && styles.toolLabelActive]}>{item.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  toolbarContainer: {
    height: 76,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingVertical: 6,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 4
  },
  scrollContent: {
    paddingHorizontal: 12,
    alignItems: 'center',
    gap: 12
  },
  toolItem: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 60
  },
  toolItemActive: {},
  iconBubble: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4
  },
  iconBubbleActive: {
    backgroundColor: '#EEF2FF',
    borderWidth: 1.5,
    borderColor: '#4F46E5'
  },
  toolIcon: {
    fontSize: 20
  },
  toolLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4B5563',
    textAlign: 'center'
  },
  toolLabelActive: {
    color: '#4F46E5',
    fontWeight: '700'
  }
});
