import React, { useState } from 'react';
import { View, Text, Modal, Pressable, StyleSheet } from 'react-native';
import { useTranslation } from '../../i18n/I18nContext';
import { resizeDesign } from '../../features/editor/resize/resizeEngine';
import { CanvasPreset, Design } from '../../features/editor/resize/types';

type ResizeControlsProps = {
  canvasPreset: CanvasPreset;
  elements: any[]; // BannerElement[]
  onResize: (newDesign: Design) => void;
};

export const ResizeControls: React.FC<ResizeControlsProps> = ({ canvasPreset, elements, onResize }) => {
  const { t } = useTranslation();
  const [modalVisible, setModalVisible] = useState(false);

  const PRESETS: CanvasPreset[] = [
    { name: 'Square', width: 1080, height: 1080 },
    { name: 'Portrait', width: 1080, height: 1350 },
    { name: 'Landscape', width: 1920, height: 1080 },
    { name: 'Story', width: 1080, height: 1920 },
  ];

  const applyPreset = (preset: CanvasPreset) => {
    const design: Design = { preset: canvasPreset, elements };
    const newDesign = resizeDesign(design, preset);
    onResize(newDesign);
    setModalVisible(false);
  };

  return (
    <View style={styles.container}>
      <Pressable onPress={() => setModalVisible(true)} style={styles.button}>
        <Text style={styles.buttonText}>{t('resize')}</Text>
      </Pressable>

      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.title}>{t('selectResizePreset')}</Text>
            {PRESETS.map((p) => (
              <Pressable key={p.name} onPress={() => applyPreset(p)} style={styles.presetButton}>
                <Text style={styles.presetText}>{p.name} ({p.width}×{p.height})</Text>
              </Pressable>
            ))}
            <Pressable onPress={() => setModalVisible(false)} style={styles.cancelButton}>
              <Text style={styles.cancelText}>{t('cancel')}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginVertical: 8 },
  button: { backgroundColor: '#4a90e2', padding: 10, borderRadius: 6 },
  buttonText: { color: '#fff', fontSize: 14, textAlign: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#fff', padding: 20, borderRadius: 8, width: '80%' },
  title: { fontSize: 16, fontWeight: '600', marginBottom: 12, textAlign: 'center' },
  presetButton: { paddingVertical: 8 },
  presetText: { fontSize: 14, textAlign: 'center' },
  cancelButton: { marginTop: 12, paddingVertical: 8 },
  cancelText: { color: '#ff6f61', fontSize: 14, textAlign: 'center' },
});
