import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { CANVAS_SIZE_PRESETS, CanvasSizePreset } from '../../state/editorState';

type CanvasResizeModalProps = {
  visible: boolean;
  activePresetId: string;
  onSelectPreset: (preset: CanvasSizePreset) => void;
  onClose: () => void;
};

export const CanvasResizeModal: React.FC<CanvasResizeModalProps> = ({
  visible,
  activePresetId,
  onSelectPreset,
  onClose
}) => {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>बॅनरचा आकार निवडा (Select Canvas Size)</Text>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </Pressable>
          </View>

          <View style={styles.presetsList}>
            {CANVAS_SIZE_PRESETS.map((preset) => {
              const isSelected = activePresetId === preset.id;
              return (
                <Pressable
                  key={preset.id}
                  style={[styles.presetItem, isSelected && styles.presetItemActive]}
                  onPress={() => {
                    onSelectPreset(preset);
                    onClose();
                  }}
                >
                  <Text style={styles.presetIcon}>{preset.icon}</Text>
                  <View style={styles.presetInfo}>
                    <Text style={[styles.presetLabel, isSelected && styles.presetLabelActive]}>
                      {preset.label}
                    </Text>
                    <Text style={styles.presetDimensions}>
                      {preset.width} × {preset.height} px
                    </Text>
                  </View>
                  {isSelected ? <Text style={styles.checkIcon}>✓</Text> : null}
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end'
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    elevation: 20
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16
  },
  modalTitle: {
    fontSize: 16,
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
  presetsList: {
    gap: 10,
    paddingBottom: 20
  },
  presetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB'
  },
  presetItemActive: {
    backgroundColor: '#EEF2FF',
    borderColor: '#4F46E5',
    borderWidth: 1.5
  },
  presetIcon: {
    fontSize: 24,
    marginRight: 12
  },
  presetInfo: {
    flex: 1
  },
  presetLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151'
  },
  presetLabelActive: {
    color: '#4F46E5'
  },
  presetDimensions: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2
  },
  checkIcon: {
    fontSize: 18,
    fontWeight: '800',
    color: '#4F46E5'
  }
});
