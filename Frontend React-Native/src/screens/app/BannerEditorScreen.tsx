import React, { useMemo, useRef, useState, useCallback } from 'react';
import { useTranslation } from '../../i18n/I18nContext';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,

  Text,
  TextInput,
  TouchableWithoutFeedback,
  View
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { createBanner } from '../../api/services/bannerService';
import { uploadImage } from '../../api/services/uploadService';
import {
  BannerCanvas,
  BannerElement,
  Template
} from '../../api/services/templateService';
import { BannerRenderer } from '../../components/banner/BannerRenderer';
import { FONT_OPTIONS } from '../../utils/fontUtils';

import { editorStyles as lightStyles } from '../../styles/editorStyles';
import { editorDarkStyles as darkStyles } from '../../styles/editorDarkStyles';
import { Appearance } from 'react-native';
import { ResizeControls } from '../../components/editor/ResizeControls';
import { exportCanvas } from '../../utils/canvasExport';
import * as Sharing from 'expo-sharing';
import { CanvasPreset, Design } from '../../features/editor/resize/types';



type BannerEditorScreenProps = {
  template: Template;
  onCancel: () => void;
  onSaved: () => void;
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const COLOR_PALETTE = [
  '#FFFFFF',
  '#000000',
  '#FCD34D',
  '#38BDF8',
  '#4ADE80',
  '#F87171',
  '#C084FC'
];
const SIZE_PRESETS = [14, 18, 22, 26, 32, 38];
const ALIGNMENT_OPTIONS: ('left' | 'center' | 'right')[] = ['left', 'center', 'right'];

const PRESET_PHOTO_CHOICES = [
  { label: 'Person 1', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500' },
  { label: 'Person 2', url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=500' },
  { label: 'Celebrant', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500' },
  { label: 'Speaker', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500' },
  { label: 'Symbol (Diya)', url: 'https://images.unsplash.com/photo-1607344645866-009c320b5ab8?w=200' },
  { label: 'Party Symbol', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200' }
];

export function BannerEditorScreen({ template, onCancel, onSaved }: BannerEditorScreenProps) {
  const { t } = useTranslation();
const colorScheme = Appearance.getColorScheme();
const styles = colorScheme === 'dark' ? darkStyles : lightStyles;
  const canvasWidth = template.canvas?.width || 1080;
  const canvasHeight = template.canvas?.height || 1350;
  const aspectRatio = canvasWidth / canvasHeight;

  // Max preview width that fits nicely on mobile screen
  const previewContainerWidth = Math.min(SCREEN_WIDTH - 32, 380);
  const previewContainerHeight = Math.round(previewContainerWidth / aspectRatio);

  // Initialize elements from template copy
  const initialElements = useMemo<BannerElement[]>(() => {
    if (template.elements && template.elements.length > 0) {
      return template.elements.map((e) => ({
        ...e,
        position: { ...e.position },
        size: { ...e.size },
        style: e.style ? { ...e.style } : undefined
      }));
    }

    return [
      {
        id: 'heading',
        type: 'text',
        label: 'Heading',
        content: 'Meet Sanwadkar',
        position: { x: 50, y: 50 },
        size: { width: 70, height: 10 },
        style: { fontFamily: 'Modern', fontSize: 26, color: '#FFFFFF', alignment: 'center' },
        required: true,
        editable: true,
        movable: true,
        zIndex: 1
      }
    ];
  }, [template]);

  const [elements, setElements] = useState<BannerElement[]>(initialElements);
  const [selectedElementId, setSelectedElementId] = useState<string>(
    initialElements[0]?.id || ''
  );
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Replace Image Modal state
  const [replaceModalVisible, setReplaceModalVisible] = useState(false);
  const [customImageUrl, setCustomImageUrl] = useState('');

  // Refs for gesture handling
  const elementsRef = useRef(elements);
  // Ref for capturing the canvas view for export
  const canvasRef = useRef<View>(null);
  elementsRef.current = elements;
  const selectedElementIdRef = useRef(selectedElementId);
  selectedElementIdRef.current = selectedElementId;
  const dragStartPos = useRef({ x: 50, y: 50 });
  const [canvasPreset, setCanvasPreset] = useState<CanvasPreset>({ name: 'Custom', width: canvasWidth, height: canvasHeight });
  const handleCanvasResize = useCallback((newDesign: Design) => {
  setCanvasPreset(newDesign.preset);
  setElements(newDesign.elements as unknown as BannerElement[]);
}, []);

  // Export current banner as PNG and share (Export button)
  const handleExport = async () => {
    if (!canvasRef.current) {
      Alert.alert(t('exportError'), t('canvasNotReady'));
      return;
    }
    try {
      setExporting(true);
      const uri = await exportCanvas(canvasRef.current, canvasPreset);
      await Sharing.shareAsync(uri, {
        mimeType: 'image/png',
        dialogTitle: t('exportBanner'),
      });
    } catch (e: any) {
      console.error('Export failed', e);
      Alert.alert(t('exportError'), e.message ?? t('unexpectedError'));
    } finally {
      setExporting(false);
    }
  };

  // Share current banner (Share button) – re‑uses exportCanvas then opens share sheet
  const handleShare = async () => {
    if (!canvasRef.current) {
      Alert.alert(t('shareError'), t('canvasNotReady'));
      return;
    }
    try {
      setExporting(true);
      const uri = await exportCanvas(canvasRef.current, canvasPreset);
      await Sharing.shareAsync(uri, {
        mimeType: 'image/png',
        dialogTitle: t('shareBanner'),
      });
    } catch (e: any) {
      console.error('Share failed', e);
      Alert.alert(t('shareError'), e.message ?? t('unexpectedError'));
    } finally {
      setExporting(false);
    }
  };


  const activeElement =
    elements.find((e) => e.id === selectedElementId) || elements[0];

  // Pick PNG / Image from Mobile Gallery
  const handlePickFromDevice = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          t('permissionRequired'),
          t('photoPermission')
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.85,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        // Upload the local image to backend and get URL
        const uploaded = await uploadImage(asset.uri);
        handleApplyImageReplacement(uploaded.url);
      }
    } catch (error) {
      Alert.alert(t('uploadFailed'), t('selectedImageError'));
    }
  };

  // PanResponder to drag movable elements on canvas
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_, gestureState) => {
          return Math.abs(gestureState.dx) > 3 || Math.abs(gestureState.dy) > 3;
        },
        onPanResponderGrant: () => {
          const current = elementsRef.current.find(
            (e) => e.id === selectedElementIdRef.current
          );
          if (current) {
            dragStartPos.current = { ...current.position };
          }
        },
        onPanResponderMove: (_, gestureState) => {
          const current = elementsRef.current.find(
            (e) => e.id === selectedElementIdRef.current
          );
          if (!current || current.locked || current.movable === false) {
            return;
          }

          const deltaXPercent = (gestureState.dx / previewContainerWidth) * 100;
          const deltaYPercent = (gestureState.dy / previewContainerHeight) * 100;

          const newX = Math.round(
            Math.min(Math.max(dragStartPos.current.x + deltaXPercent, 6), 94)
          );
          const newY = Math.round(
            Math.min(Math.max(dragStartPos.current.y + deltaYPercent, 6), 94)
          );

          setElements((prev) =>
            prev.map((e) =>
              e.id === selectedElementIdRef.current
                ? { ...e, position: { x: newX, y: newY } }
                : e
            )
          );
        },
        onPanResponderRelease: () => {},
        onPanResponderTerminate: () => {}
      }),
    [previewContainerWidth, previewContainerHeight]
  );

  const handleTextContentChange = (text: string) => {
    if (!activeElement || activeElement.locked || !activeElement.editable) return;
    setElements((prev) =>
      prev.map((e) => (e.id === activeElement.id ? { ...e, content: text } : e))
    );
  };

  const handleStyleChange = (key: string, val: any) => {
    if (!activeElement || activeElement.locked) return;
    setElements((prev) =>
      prev.map((e) =>
        e.id === activeElement.id
          ? {
              ...e,
              style: {
                ...(e.style || {}),
                [key]: val
              }
            }
          : e
      )
    );
  };

  const handleResize = (delta: number) => {
    if (!activeElement || activeElement.locked || activeElement.resizable === false) return;
    setElements((prev) =>
      prev.map((e) => {
        if (e.id !== activeElement.id) return e;
        const newWidth = Math.min(Math.max((e.size.width || 40) + delta, 15), 90);
        const newHeight = e.size.height ? Math.min(Math.max(e.size.height + delta, 10), 90) : undefined;
        return {
          ...e,
          size: { width: newWidth, height: newHeight }
        };
      })
    );
  };

  const handleResetPosition = () => {
    if (!activeElement) return;
    const templateEl = template.elements?.find((te) => te.id === activeElement.id);
    if (!templateEl) return;

    setElements((prev) =>
      prev.map((e) =>
        e.id === activeElement.id
          ? {
              ...e,
              position: { ...templateEl.position },
              size: { ...templateEl.size }
            }
          : e
      )
    );
  };

  const handleApplyImageReplacement = (url: string) => {
    if (!activeElement || !url.trim()) return;
    setElements((prev) =>
      prev.map((e) => (e.id === activeElement.id ? { ...e, source: url.trim() } : e))
    );
    setReplaceModalVisible(false);
    setCustomImageUrl('');
  };

  const handleSave = async () => {
    // Validate required elements
    for (const el of elements) {
      if (el.required) {
        if (el.type === 'text' && (!el.content || !el.content.trim())) {
          Alert.alert(t('requiredElement'), `Please enter ${el.label}.`);
          return;
        }
      }
    }

    try {
      setSaving(true);
      await createBanner({
        templateId: template.id,
        title: `${template.title} Customized`,
        canvas: template.canvas,
        background: template.background,
        elements
      });

      Alert.alert(t('success'), t('bannerSaved'), [
        {
          text: 'View My Banners',
          onPress: onSaved
        }
      ]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unable to save banner.';
      Alert.alert(t('saveFailed'), msg);
    } finally {
      setSaving(false);
    }
  };

  // Group elements for user-friendly element selection
  const userEditableElements = elements.filter((e) => !e.locked);

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Top Header */}
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={onCancel} disabled={saving}>
            <Text style={styles.backButtonText}>← {t('backTemplates')}</Text>
          </Pressable>
          <Text style={styles.headerTitle}>{t('editBanner')}</Text>
          {/* Save Button */}
          <Pressable style={styles.headerSaveBtn} onPress={handleSave} disabled={saving}>
            {saving ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text style={styles.headerSaveText}>{t('save')}</Text>
            )}
          </Pressable>
          {/* Export Button */}
          <Pressable style={styles.exportButton} onPress={handleExport} disabled={exporting}>
            {exporting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.exportButtonText}>{t('export')}</Text>
            )}
          </Pressable>
          {/* Share Button */}
          <Pressable style={styles.shareButton} onPress={handleShare} disabled={exporting}>
            {exporting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.shareButtonText}>{t('share')}</Text>
            )}
          </Pressable>
        </View>

        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Live Canvas Preview */}
          <View style={styles.previewSection}>
            <View style={styles.previewHeaderRow}>
              <Text style={styles.sectionLabel}>{t('livePreview')}</Text>
              <Text style={styles.dragHintText}>
                {activeElement?.locked
                  ? `🔒 ${t('fixed')}`
                  : activeElement?.movable
                  ? `✨ ${t('dragHint')}`
                  : t('tapToEdit')}
              </Text>
            </View>

            <View style={styles.rendererWrapper} ref={canvasRef}>
              <BannerRenderer
                canvas={template.canvas}
                background={template.background}
                elements={elements}
                containerWidth={previewContainerWidth}
                selectedElementId={selectedElementId}
                onSelectElement={setSelectedElementId}
                panHandlers={
                  !activeElement?.locked && activeElement?.movable
                    ? panResponder.panHandlers
                    : undefined
                }
                interactive={true}
              />
            </View>
          </View>

          {/* Element Selection Chips */}
          <View style={styles.elementTabsContainer}>
            <Text style={styles.sectionSubLabel}>{t('editableContent')}</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.tabsScroll}
            >
              {elements.map((el) => {
                const isSelected = el.id === selectedElementId;
                const icon =
                  el.type === 'text'
                    ? '📝'
                    : el.type === 'logo'
                    ? '🏷️'
                    : el.type === 'symbol'
                    ? '✨'
                    : '🖼️';

                return (
                  <Pressable
                    key={el.id}
                    style={[styles.tabChip, isSelected && styles.tabChipActive]}
                    onPress={() => setSelectedElementId(el.id)}
                  >
                    <Text
                      style={[styles.tabChipText, isSelected && styles.tabChipTextActive]}
                    >
                      {icon} {el.label} {el.locked ? '🔒' : el.required ? '*' : ''}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          {/* Simple Contextual Controls for Active Element */}
          {activeElement && (
            <View style={styles.editorCard}>
              <View style={styles.editorCardHeader}>
                <View>
                  <Text style={styles.cardTitle}>
                    {activeElement.label}{' '}
                    {activeElement.required ? (
                      <Text style={{ color: '#ef4444' }}>*</Text>
                    ) : (
                      ''
                    )}
                  </Text>
                  <Text style={styles.cardTypeSub}>
                    {t('type')}: {activeElement.type.toUpperCase()}{' '}
                    {activeElement.locked ? `• 🔒 ${t('fixed')}` : ''}
                  </Text>
                </View>

                {!activeElement.locked && (
                  <Pressable style={styles.resetPosBtn} onPress={handleResetPosition}>
                    <Text style={styles.resetPosBtnText}>{t('reset')}</Text>
                  </Pressable>
                )}
              </View>

              {activeElement.locked ? (
                <View style={styles.lockedNoteBox}>
                  <Text style={styles.lockedNoteText}>
                    🔒 {t('fixedElementNote')}
                  </Text>
                </View>
              ) : activeElement.type === 'text' ? (
                <>
                  {/* Text Content Input */}
                  <Text style={styles.controlLabel}>{t('text')}</Text>
                  <TextInput
                    style={styles.input}
                    placeholder={`Enter ${activeElement.label.toLowerCase()}...`}
                    placeholderTextColor="#94a3b8"
                    value={activeElement.content}
                    onChangeText={handleTextContentChange}
                  />

                  {/* Font Family Selection */}
                  <Text style={styles.controlLabel}>{t('fontStyle')}</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.chipsScroll}
                  >
                    {FONT_OPTIONS.map((font) => {
                      const isSelected =
                        activeElement.style?.fontFamily?.toLowerCase() ===
                          font.id.toLowerCase() ||
                        activeElement.style?.fontFamily?.toLowerCase() ===
                          font.label.toLowerCase();

                      return (
                        <Pressable
                          key={font.id}
                          style={[styles.chipBtn, isSelected && styles.chipBtnActive]}
                          onPress={() => handleStyleChange('fontFamily', font.id)}
                        >
                          <Text
                            style={[
                              styles.chipText,
                              font.getStyle(),
                              isSelected && styles.chipTextActive
                            ]}
                          >
                            {font.label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </ScrollView>

                  {/* Font Size Preset Controls */}
                  <View style={styles.sizeHeaderRow}>
                    <Text style={styles.controlLabel}>
                      Size:{' '}
                      <Text style={{ color: '#2563eb', fontWeight: '800' }}>
                        {activeElement.style?.fontSize || 22}px
                      </Text>
                    </Text>
                    <View style={styles.stepBtnRow}>
                      <Pressable
                        style={styles.stepBtn}
                        onPress={() =>
                          handleStyleChange(
                            'fontSize',
                            Math.max(10, (activeElement.style?.fontSize || 22) - 2)
                          )
                        }
                      >
                        <Text style={styles.stepBtnText}>−</Text>
                      </Pressable>
                      <Pressable
                        style={styles.stepBtn}
                        onPress={() =>
                          handleStyleChange(
                            'fontSize',
                            Math.min(48, (activeElement.style?.fontSize || 22) + 2)
                          )
                        }
                      >
                        <Text style={styles.stepBtnText}>+</Text>
                      </Pressable>
                    </View>
                  </View>

                  {/* Text Color Palette */}
                  <Text style={styles.controlLabel}>{t('color')}</Text>
                  <View style={styles.colorPaletteRow}>
                    {COLOR_PALETTE.map((clr) => (
                      <Pressable
                        key={clr}
                        style={[
                          styles.colorDot,
                          { backgroundColor: clr },
                          activeElement.style?.color === clr && styles.colorDotSelected
                        ]}
                        onPress={() => handleStyleChange('color', clr)}
                      />
                    ))}
                  </View>

                  {/* Text Alignment */}
                  <Text style={styles.controlLabel}>{t('alignment')}</Text>
                  <View style={styles.chipsRow}>
                    {ALIGNMENT_OPTIONS.map((align) => (
                      <Pressable
                        key={align}
                        style={[
                          styles.chipBtn,
                          activeElement.style?.alignment === align && styles.chipBtnActive
                        ]}
                        onPress={() => handleStyleChange('alignment', align)}
                      >
                        <Text
                          style={[
                            styles.chipText,
                            activeElement.style?.alignment === align && styles.chipTextActive
                          ]}
                        >
                          {align.charAt(0).toUpperCase() + align.slice(1)}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </>
              ) : (
                /* Image / Logo / Symbol Controls */
                <>
                  {activeElement.editable !== false && (
                    <View style={styles.imageControlBox}>
                      <Text style={styles.controlLabel}>{t('replaceImage')}</Text>
                      <Pressable
                        style={styles.replaceBtn}
                        onPress={() => setReplaceModalVisible(true)}
                      >
                        <Text style={styles.replaceBtnText}>📷 {t('selectReplaceImage')}</Text>
                      </Pressable>
                    </View>
                  )}

                  {activeElement.resizable && (
                    <View style={styles.resizeBox}>
                      <Text style={styles.controlLabel}>
                        Size Scale: {activeElement.size.width}%
                      </Text>
                      <View style={styles.stepBtnRow}>
                        <Pressable style={styles.stepBtn} onPress={() => handleResize(-5)}>
                          <Text style={styles.stepBtnText}>−</Text>
                        </Pressable>
                        <Pressable style={styles.stepBtn} onPress={() => handleResize(5)}>
                          <Text style={styles.stepBtnText}>+</Text>
                        </Pressable>
                      </View>
                    </View>
                  )}
                  <ResizeControls canvasPreset={canvasPreset} elements={elements} onResize={handleCanvasResize} />
                </>
              )}
            </View>
          )}

          {/* Primary Save Action */}
          <View style={styles.actionContainer}>
            <Pressable style={styles.saveButton} onPress={handleSave} disabled={saving}>
              {saving ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text style={styles.saveButtonText}>{t('saveBanner')}</Text>
              )}
            </Pressable>
          </View>
        </ScrollView>

        {/* Replace Image Modal */}
        <Modal
          visible={replaceModalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setReplaceModalVisible(false)}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={styles.modalHeader}>{t('replace')} {activeElement?.label}</Text>

                {/* Upload from Mobile Gallery */}
                <Pressable
                  style={styles.deviceUploadBtn}
                  onPress={handlePickFromDevice}
                >
                  <Text style={styles.deviceUploadBtnText}>📁 {t('uploadPhoto')}</Text>
                  <Text style={styles.deviceUploadSubText}>{t('uploadPhotoSupport')}</Text>
                </Pressable>

                <Text style={styles.modalSubLabel}>{t('choosePresets')}</Text>
                <View style={styles.presetGrid}>
                  {PRESET_PHOTO_CHOICES.map((p) => (
                    <Pressable
                      key={p.label}
                      style={styles.presetChoiceCard}
                      onPress={() => handleApplyImageReplacement(p.url)}
                    >
                      <Text style={styles.presetChoiceText}>{p.label}</Text>
                    </Pressable>
                  ))}
                </View>

                <Text style={styles.modalSubLabel}>{t('customImageUrl')}</Text>
                <TextInput
                  style={styles.input}
                  placeholder={t('urlPlaceholder')}
                  placeholderTextColor="#94a3b8"
                  value={customImageUrl}
                  onChangeText={setCustomImageUrl}
                />

                <View style={styles.modalActions}>
                  <Pressable
                    style={styles.modalCancelBtn}
                    onPress={() => setReplaceModalVisible(false)}
                  >
                    <Text style={styles.modalCancelText}>{t('cancel')}</Text>
                  </Pressable>
                  <Pressable
                    style={styles.modalApplyBtn}
                    onPress={() => handleApplyImageReplacement(customImageUrl)}
                  >
                    <Text style={styles.modalApplyText}>{t('applyUrl')}</Text>
                  </Pressable>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}



