import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

type EditorHeaderProps = {
  title?: string;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onBack: () => void;
  onSave: () => void;
  onExport: () => void;
  onShare: () => void;
  onOpenResizeModal: () => void;
  isSaving?: boolean;
  isExporting?: boolean;
};

export const EditorHeader: React.FC<EditorHeaderProps> = ({
  title = 'Banner Editor',
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onBack,
  onSave,
  onExport,
  onShare,
  onOpenResizeModal,
  isSaving = false,
  isExporting = false
}) => {
  return (
    <View style={styles.header}>
      {/* Left: Back & Title */}
      <View style={styles.leftGroup}>
        <Pressable style={styles.iconButton} onPress={onBack} hitSlop={8}>
          <Text style={styles.backIcon}>←</Text>
        </Pressable>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
      </View>

      {/* Center: Undo / Redo & Resize */}
      <View style={styles.centerGroup}>
        <Pressable
          style={[styles.smallIconBtn, !canUndo && styles.btnDisabled]}
          onPress={onUndo}
          disabled={!canUndo}
          hitSlop={6}
        >
          <Text style={[styles.undoRedoIcon, !canUndo && styles.textDisabled]}>↺</Text>
        </Pressable>
        <Pressable
          style={[styles.smallIconBtn, !canRedo && styles.btnDisabled]}
          onPress={onRedo}
          disabled={!canRedo}
          hitSlop={6}
        >
          <Text style={[styles.undoRedoIcon, !canRedo && styles.textDisabled]}>↻</Text>
        </Pressable>
        <Pressable style={styles.smallIconBtn} onPress={onOpenResizeModal} hitSlop={6}>
          <Text style={styles.resizeIcon}>📐</Text>
        </Pressable>
      </View>

      {/* Right: Save, Share, Export */}
      <View style={styles.rightGroup}>
        <Pressable
          style={[styles.actionBtn, styles.shareBtn, (isSaving || isExporting) && styles.btnDisabled]}
          onPress={onShare}
          disabled={isSaving || isExporting}
        >
          <Text style={styles.actionBtnText}>Share</Text>
        </Pressable>

        <Pressable
          style={[styles.actionBtn, styles.saveBtn, isSaving && styles.btnDisabled]}
          onPress={onSave}
          disabled={isSaving || isExporting}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={[styles.actionBtnText, styles.saveBtnText]}>Save</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    zIndex: 100
  },
  leftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: '35%'
  },
  iconButton: {
    padding: 6,
    marginRight: 6,
    borderRadius: 8
  },
  backIcon: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827'
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827'
  },
  centerGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  smallIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center'
  },
  undoRedoIcon: {
    fontSize: 18,
    fontWeight: '700',
    color: '#374151'
  },
  resizeIcon: {
    fontSize: 16
  },
  rightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  actionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center'
  },
  shareBtn: {
    backgroundColor: '#EEF2FF'
  },
  saveBtn: {
    backgroundColor: '#2563EB'
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4F46E5'
  },
  saveBtnText: {
    color: '#FFFFFF'
  },
  btnDisabled: {
    opacity: 0.4
  },
  textDisabled: {
    color: '#9CA3AF'
  }
});
