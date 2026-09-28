import React, { useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from 'react-native';

type ExportControlsProps = {
  visible: boolean;
  onExport: (format: 'png' | 'jpg') => Promise<void>;
  onShare: (format: 'png' | 'jpg') => Promise<void>;
  onClose: () => void;
  isProcessing?: boolean;
};

export const ExportControls: React.FC<ExportControlsProps> = ({
  visible,
  onExport,
  onShare,
  onClose,
  isProcessing = false
}) => {
  const [selectedFormat, setSelectedFormat] = useState<'png' | 'jpg'>('png');

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>बॅनर एक्सपोर्ट व शेअर (Export & Share)</Text>
            <Pressable onPress={onClose} style={styles.closeBtn} disabled={isProcessing}>
              <Text style={styles.closeBtnText}>✕</Text>
            </Pressable>
          </View>

          <Text style={styles.sectionLabel}>फॉरमॅट निवडा (Select Image Format):</Text>
          <View style={styles.formatRow}>
            <Pressable
              style={[styles.formatOption, selectedFormat === 'png' && styles.formatOptionActive]}
              onPress={() => setSelectedFormat('png')}
              disabled={isProcessing}
            >
              <Text style={[styles.formatText, selectedFormat === 'png' && styles.formatTextActive]}>
                PNG (High Quality)
              </Text>
            </Pressable>
            <Pressable
              style={[styles.formatOption, selectedFormat === 'jpg' && styles.formatOptionActive]}
              onPress={() => setSelectedFormat('jpg')}
              disabled={isProcessing}
            >
              <Text style={[styles.formatText, selectedFormat === 'jpg' && styles.formatTextActive]}>
                JPG (Compressed)
              </Text>
            </Pressable>
          </View>

          {isProcessing ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#2563EB" />
              <Text style={styles.loadingText}>बॅनर तयार करत आहे (Rendering banner image)...</Text>
            </View>
          ) : (
            <View style={styles.actionButtons}>
              {/* Direct Share Button */}
              <Pressable
                style={[styles.btn, styles.shareBtn]}
                onPress={() => onShare(selectedFormat)}
              >
                <Text style={styles.shareBtnText}>📲 सोशल मीडियावर शेअर करा (Share)</Text>
              </Pressable>

              {/* Direct Save/Download Button */}
              <Pressable
                style={[styles.btn, styles.saveBtn]}
                onPress={() => onExport(selectedFormat)}
              >
                <Text style={styles.saveBtnText}>💾 गॅलरीमध्ये सेव्ह करा (Save to Gallery)</Text>
              </Pressable>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
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
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8
  },
  formatRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20
  },
  formatOption: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center'
  },
  formatOptionActive: {
    backgroundColor: '#EEF2FF',
    borderColor: '#4F46E5',
    borderWidth: 1.5
  },
  formatText: {
    fontSize: 12,
    color: '#4B5563',
    fontWeight: '600'
  },
  formatTextActive: {
    color: '#4F46E5',
    fontWeight: '700'
  },
  loadingContainer: {
    paddingVertical: 20,
    alignItems: 'center'
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
    color: '#4B5563',
    fontWeight: '600'
  },
  actionButtons: {
    gap: 10
  },
  btn: {
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center'
  },
  shareBtn: {
    backgroundColor: '#4F46E5'
  },
  saveBtn: {
    backgroundColor: '#10B981'
  },
  shareBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14
  }
});
