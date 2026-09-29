import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  View
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Template } from '../../api/services/templateService';
import { createBanner } from '../../api/services/bannerService';
import { uploadImage } from '../../api/services/uploadService';
import {
  CANVAS_SIZE_PRESETS,
  CanvasSizePreset,
  DrawingStroke,
  EditorElement,
  EditorSnapshot,
  createDefaultEditorState
} from '../../state/editorState';
import { EditorHeader } from '../../components/editor/EditorHeader';
import { EditorCanvas } from '../../components/editor/EditorCanvas';
import { ActivePanel, EditorToolbar } from '../../components/editor/EditorToolbar';
import { TextEditorPanel } from '../../components/editor/TextEditorPanel';
import { BackgroundPanel } from '../../components/editor/BackgroundPanel';
import { StickerPanel } from '../../components/editor/StickerPanel';
import { ShapePanel } from '../../components/editor/ShapePanel';
import { BrushPanel } from '../../components/editor/BrushPanel';
import { EffectsPanel } from '../../components/editor/EffectsPanel';
import { LayersPanel } from '../../components/editor/LayersPanel';
import { CanvasResizeModal } from '../../components/editor/CanvasResizeModal';
import { ExportControls } from '../../components/editor/ExportControls';
import { exportCanvas, shareCanvasImage } from '../../utils/canvasExport';

type BannerEditorScreenProps = {
  template?: Template | null;
  onCancel: () => void;
  onSaved: () => void;
};

export function BannerEditorScreen({ template, onCancel, onSaved }: BannerEditorScreenProps) {
  // Initialize Canvas snapshot from template or blank canvas
  const initialSnapshot = useMemo<EditorSnapshot>(() => {
    const width = template?.canvas?.width || 1080;
    const height = template?.canvas?.height || 1350;
    const defaultState = createDefaultEditorState(width, height);

    if (template?.background?.color) {
      defaultState.background.color = template.background.color;
    }
    if (template?.background?.source || template?.imageUrl) {
      defaultState.background.imageUrl = template.background?.source || template.imageUrl;
      defaultState.background.type = 'image';
    }

    if (template?.elements && template.elements.length > 0) {
      defaultState.elements = template.elements.map((el, idx) => ({
        id: el.id || `el_${idx}_${Date.now()}`,
        type: (el.type as any) || 'text',
        label: el.label || el.type,
        content: el.content || '',
        position: { x: el.position?.x ?? 50, y: el.position?.y ?? 50 },
        size: { width: el.size?.width ?? 60, height: el.size?.height ?? 15 },
        rotation: (el as any).rotation || 0,
        opacity: (el as any).opacity !== undefined ? (el as any).opacity : (el.style?.opacity ?? 1),
        zIndex: idx + 1,
        visible: true,
        locked: false,
        style: el.style ? { ...el.style } : {}
      }));
    } else {
      // Default initial starter text for blank canvas
      defaultState.elements = [
        {
          id: `heading_${Date.now()}`,
          type: 'text',
          label: 'शीर्षक (Heading)',
          content: 'हार्दिक शुभेच्छा',
          position: { x: 50, y: 35 },
          size: { width: 80, height: 16 },
          zIndex: 1,
          visible: true,
          style: {
            fontSize: 26,
            fontWeight: 'bold',
            color: '#1E3A8A',
            textAlign: 'center'
          }
        }
      ];
    }

    return defaultState;
  }, [template]);

  // History State
  const [past, setPast] = useState<EditorSnapshot[]>([]);
  const [present, setPresent] = useState<EditorSnapshot>(initialSnapshot);
  const [future, setFuture] = useState<EditorSnapshot[]>([]);

  // Active element & panel
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [activePanel, setActivePanel] = useState<ActivePanel>('none');

  // Brush Mode
  const [isBrushMode, setIsBrushMode] = useState(false);
  const [brushColor, setBrushColor] = useState('#EF4444');
  const [brushWidth, setBrushWidth] = useState(8);
  const [currentBrushStroke, setCurrentBrushStroke] = useState<DrawingStroke | null>(null);

  // Modals & Spinners
  const [resizeModalVisible, setResizeModalVisible] = useState(false);
  const [exportModalVisible, setExportModalVisible] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [loadingOverlayMsg, setLoadingOverlayMsg] = useState<string | null>(null);

  // Native Canvas View Ref for ViewShot capture
  const canvasRef = useRef<View | null>(null);

  // Helper to commit new snapshot to history
  const pushSnapshot = useCallback(
    (newSnapshot: EditorSnapshot) => {
      setPast((prev) => [...prev.slice(-20), present]);
      setPresent(newSnapshot);
      setFuture([]);
    },
    [present]
  );

  // Undo / Redo
  const handleUndo = useCallback(() => {
    if (past.length === 0) return;
    const previous = past[past.length - 1];
    const newPast = past.slice(0, past.length - 1);
    setPast(newPast);
    setFuture((prev) => [present, ...prev]);
    setPresent(previous);
  }, [past, present]);

  const handleRedo = useCallback(() => {
    if (future.length === 0) return;
    const next = future[0];
    const newFuture = future.slice(1);
    setPast((prev) => [...prev, present]);
    setPresent(next);
    setFuture(newFuture);
  }, [future, present]);

  const selectedElement = useMemo(
    () => present.elements.find((el) => el.id === selectedElementId) || null,
    [present.elements, selectedElementId]
  );

  // Element CRUD Operations
  const handleUpdateElementPosition = useCallback(
    (id: string, newPos: { x: number; y: number }) => {
      const updatedElements = present.elements.map((el) =>
        el.id === id ? { ...el, position: newPos } : el
      );
      setPresent((prev) => ({ ...prev, elements: updatedElements }));
    },
    [present.elements]
  );

  const handleDeleteElement = useCallback(
    (id: string) => {
      const updatedElements = present.elements.filter((el) => el.id !== id);
      pushSnapshot({ ...present, elements: updatedElements });
      if (selectedElementId === id) setSelectedElementId(null);
    },
    [present, pushSnapshot, selectedElementId]
  );

  const handleDuplicateElement = useCallback(
    (id: string) => {
      const target = present.elements.find((el) => el.id === id);
      if (!target) return;

      const duplicated: EditorElement = {
        ...target,
        id: `el_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        label: `${target.label} (Copy)`,
        position: {
          x: Math.min(90, target.position.x + 5),
          y: Math.min(90, target.position.y + 5)
        },
        zIndex: present.elements.length + 1
      };

      pushSnapshot({
        ...present,
        elements: [...present.elements, duplicated]
      });
      setSelectedElementId(duplicated.id);
    },
    [present, pushSnapshot]
  );

  const handleRotateElement = useCallback(
    (id: string) => {
      const updated = present.elements.map((el) => {
        if (el.id === id) {
          const nextRotation = ((el.rotation || 0) + 15) % 360;
          return { ...el, rotation: nextRotation };
        }
        return el;
      });
      pushSnapshot({ ...present, elements: updated });
    },
    [present, pushSnapshot]
  );

  const handleResizeElement = useCallback(
    (id: string) => {
      const updated = present.elements.map((el) => {
        if (el.id === id) {
          const newWidth = Math.min(95, Math.max(15, el.size.width + 5));
          const newHeight = Math.min(95, Math.max(10, el.size.height + 5));
          return { ...el, size: { width: newWidth, height: newHeight } };
        }
        return el;
      });
      pushSnapshot({ ...present, elements: updated });
    },
    [present, pushSnapshot]
  );

  // Text Add / Update
  const handleAddText = useCallback(
    (text: string, style?: any) => {
      const newEl: EditorElement = {
        id: `text_${Date.now()}`,
        type: 'text',
        label: text.substring(0, 16),
        content: text,
        position: { x: 50, y: 50 },
        size: { width: 70, height: 14 },
        zIndex: present.elements.length + 1,
        visible: true,
        style: style || { fontSize: 22, color: '#111827', textAlign: 'center', fontWeight: '700' }
      };

      pushSnapshot({
        ...present,
        elements: [...present.elements, newEl]
      });
      setSelectedElementId(newEl.id);
    },
    [present, pushSnapshot]
  );

  const handleUpdateText = useCallback(
    (updates: { content?: string; style?: any }) => {
      if (!selectedElementId) return;
      const updatedElements = present.elements.map((el) => {
        if (el.id === selectedElementId) {
          return {
            ...el,
            content: updates.content !== undefined ? updates.content : el.content,
            label: updates.content ? updates.content.substring(0, 16) : el.label,
            style: updates.style ? { ...(el.style || {}), ...updates.style } : el.style
          };
        }
        return el;
      });

      setPresent((prev) => ({ ...prev, elements: updatedElements }));
    },
    [present.elements, selectedElementId]
  );

  // Image Upload via Camera / Gallery
  const handlePickImage = useCallback(
    async (source: 'camera' | 'gallery') => {
      try {
        let result;
        if (source === 'camera') {
          const perm = await ImagePicker.requestCameraPermissionsAsync();
          if (!perm.granted) {
            Alert.alert('Permission Needed', 'Camera access is required to take photo for banner.');
            return;
          }
          result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            quality: 0.9
          });
        } else {
          result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            quality: 0.9
          });
        }

        if (!result.canceled && result.assets?.[0]?.uri) {
          setLoadingOverlayMsg('फोटो क्लाउडवर अपलोड करत आहे (Uploading photo to Cloudinary)...');
          const uploaded = await uploadImage(result.assets[0].uri);

          const newImgEl: EditorElement = {
            id: `img_${Date.now()}`,
            type: 'image',
            label: 'Photo',
            content: uploaded.url,
            position: { x: 50, y: 60 },
            size: { width: 45, height: 35 },
            zIndex: present.elements.length + 1,
            visible: true,
            style: {
              borderRadius: 8
            }
          };

          pushSnapshot({
            ...present,
            elements: [...present.elements, newImgEl]
          });
          setSelectedElementId(newImgEl.id);
          setActivePanel('none');
        }
      } catch (err: any) {
        Alert.alert('Upload Error', err?.message || 'Failed to upload photo.');
      } finally {
        setLoadingOverlayMsg(null);
      }
    },
    [present, pushSnapshot]
  );

  // Sticker Add
  const handleAddSticker = useCallback(
    (sticker: string) => {
      const newSticker: EditorElement = {
        id: `stk_${Date.now()}`,
        type: 'sticker',
        label: sticker,
        content: sticker,
        position: { x: 50, y: 50 },
        size: { width: 25, height: 20 },
        zIndex: present.elements.length + 1,
        visible: true
      };

      pushSnapshot({
        ...present,
        elements: [...present.elements, newSticker]
      });
      setSelectedElementId(newSticker.id);
    },
    [present, pushSnapshot]
  );

  // Shape Add
  const handleAddShape = useCallback(
    (shapeType: 'rectangle' | 'rounded' | 'circle' | 'nameplate', color: string) => {
      const isNameplate = shapeType === 'nameplate';
      const newShape: EditorElement = {
        id: `shp_${Date.now()}`,
        type: 'shape',
        label: isNameplate ? 'नाव पट्टी' : shapeType,
        content: '',
        position: { x: 50, y: isNameplate ? 85 : 50 },
        size: isNameplate ? { width: 90, height: 12 } : { width: 50, height: 35 },
        zIndex: 1, // shapes usually start behind text
        visible: true,
        style: {
          backgroundColor: color,
          shapeType,
          borderRadius: shapeType === 'rounded' ? 12 : 0
        }
      };

      pushSnapshot({
        ...present,
        elements: [...present.elements, newShape]
      });
      setSelectedElementId(newShape.id);
    },
    [present, pushSnapshot]
  );

  // Background Update
  const handleUpdateBackground = useCallback(
    (bg: any) => {
      pushSnapshot({
        ...present,
        background: bg
      });
    },
    [present, pushSnapshot]
  );

  // Effects & Style Update
  const handleUpdateElementStyle = useCallback(
    (styleUpdates: any, opacity?: number) => {
      if (!selectedElementId) return;
      const updatedElements = present.elements.map((el) => {
        if (el.id === selectedElementId) {
          return {
            ...el,
            opacity: opacity !== undefined ? opacity : el.opacity,
            style: { ...(el.style || {}), ...styleUpdates }
          };
        }
        return el;
      });

      pushSnapshot({ ...present, elements: updatedElements });
    },
    [present, pushSnapshot, selectedElementId]
  );

  // Layers Actions
  const handleToggleVisibility = useCallback(
    (id: string) => {
      const updated = present.elements.map((el) =>
        el.id === id ? { ...el, visible: el.visible === false ? true : false } : el
      );
      pushSnapshot({ ...present, elements: updated });
    },
    [present, pushSnapshot]
  );

  const handleToggleLock = useCallback(
    (id: string) => {
      const updated = present.elements.map((el) =>
        el.id === id ? { ...el, locked: !el.locked } : el
      );
      pushSnapshot({ ...present, elements: updated });
    },
    [present, pushSnapshot]
  );

  const handleMoveLayer = useCallback(
    (id: string, direction: 'up' | 'down') => {
      const idx = present.elements.findIndex((el) => el.id === id);
      if (idx === -1) return;
      const newIdx = direction === 'up' ? idx + 1 : idx - 1;
      if (newIdx < 0 || newIdx >= present.elements.length) return;

      const updated = [...present.elements];
      const temp = updated[idx];
      updated[idx] = updated[newIdx];
      updated[newIdx] = temp;

      // Re-assign zIndexes
      const reindexed = updated.map((el, i) => ({ ...el, zIndex: i + 1 }));
      pushSnapshot({ ...present, elements: reindexed });
    },
    [present, pushSnapshot]
  );

  // Brush Touch Callbacks
  const handleBrushTouchStart = useCallback(
    (x: number, y: number) => {
      setCurrentBrushStroke({
        id: `stroke_${Date.now()}`,
        points: [{ x, y }],
        color: brushColor,
        width: brushWidth
      });
    },
    [brushColor, brushWidth]
  );

  const handleBrushTouchMove = useCallback((x: number, y: number) => {
    setCurrentBrushStroke((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        points: [...prev.points, { x, y }]
      };
    });
  }, []);

  const handleBrushTouchEnd = useCallback(() => {
    if (currentBrushStroke && currentBrushStroke.points.length > 1) {
      pushSnapshot({
        ...present,
        drawingStrokes: [...present.drawingStrokes, currentBrushStroke]
      });
    }
    setCurrentBrushStroke(null);
  }, [currentBrushStroke, present, pushSnapshot]);

  const handleUndoStroke = useCallback(() => {
    if (present.drawingStrokes.length === 0) return;
    const newStrokes = present.drawingStrokes.slice(0, -1);
    pushSnapshot({ ...present, drawingStrokes: newStrokes });
  }, [present, pushSnapshot]);

  const handleClearStrokes = useCallback(() => {
    pushSnapshot({ ...present, drawingStrokes: [] });
  }, [present, pushSnapshot]);

  // Canvas Resize Preset Select
  const handleSelectSizePreset = useCallback(
    (preset: CanvasSizePreset) => {
      pushSnapshot({
        ...present,
        canvasWidth: preset.width,
        canvasHeight: preset.height,
        sizePreset: preset.id
      });
    },
    [present, pushSnapshot]
  );

  // Save Banner to Backend API
  const handleSaveBanner = async () => {
    if (isSaving) return;
    try {
      setIsSaving(true);
      setSelectedElementId(null);
      setActivePanel('none');

      // 1. Export thumbnail preview of banner
      let previewUrl = '';
      try {
        const fileUri = await exportCanvas(canvasRef, { format: 'jpg', quality: 0.8 });
        const uploadedThumb = await uploadImage(fileUri);
        previewUrl = uploadedThumb.url;
      } catch (e) {
        console.warn('Thumbnail upload skipped:', e);
      }

      // 2. Save payload to backend
      const bannerPayload = {
        title: template?.title || 'माझा बॅनर (My Banner)',
        templateId: template?.id,
        canvas: {
          width: present.canvasWidth,
          height: present.canvasHeight,
          sizePreset: present.sizePreset,
          backgroundColor: present.background.color,
          backgroundImage: present.background.imageUrl
        },
        elements: present.elements.map((el) => ({
          id: el.id,
          type: el.type,
          label: el.label,
          content: el.content,
          position: el.position,
          size: el.size,
          opacity: el.opacity,
          zIndex: el.zIndex,
          style: el.style
        })),
        previewUrl: previewUrl || template?.imageUrl || ''
      };

      await createBanner(bannerPayload as any);

      Alert.alert(
        'यशस्वी (Success)',
        'बॅनर यशस्वीरित्या सेव्ह झाला आहे! (Banner saved successfully!)',
        [{ text: 'ठीक आहे (OK)', onPress: onSaved }]
      );
    } catch (error: any) {
      Alert.alert('Save Error', error?.message || 'Failed to save banner.');
    } finally {
      setIsSaving(false);
    }
  };

  // Export to Local Gallery
  const handleExport = async (format: 'png' | 'jpg') => {
    try {
      setIsExporting(true);
      setSelectedElementId(null);
      const uri = await exportCanvas(canvasRef, {
        format,
        width: present.canvasWidth,
        height: present.canvasHeight
      });
      setExportModalVisible(false);
      Alert.alert('एक्सपोर्ट यशस्वी (Export Successful)', `बॅनर फाईल तयार झाली:\n${uri}`);
    } catch (e: any) {
      Alert.alert('Export Error', e?.message || 'Could not export canvas.');
    } finally {
      setIsExporting(false);
    }
  };

  // Share via Android Native Share Sheet
  const handleShare = async (format: 'png' | 'jpg') => {
    try {
      setIsExporting(true);
      setSelectedElementId(null);
      await shareCanvasImage(
        canvasRef,
        {
          format,
          width: present.canvasWidth,
          height: present.canvasHeight
        },
        'Share My LeadersKey Banner'
      );
      setExportModalVisible(false);
    } catch (e: any) {
      Alert.alert('Share Error', e?.message || 'Could not share canvas.');
    } finally {
      setIsExporting(false);
    }
  };

  // Bottom Toolbar Item Selection
  const handleSelectTool = (tool: ActivePanel | 'camera' | 'gallery') => {
    if (tool === 'camera') {
      handlePickImage('camera');
      return;
    }
    if (tool === 'gallery') {
      handlePickImage('gallery');
      return;
    }
    if (tool === 'brush') {
      setIsBrushMode(true);
      setSelectedElementId(null);
      setActivePanel('brush');
      return;
    }

    setIsBrushMode(false);
    setActivePanel((prev) => (prev === tool ? 'none' : tool));
  };

  return (
    <KeyboardAvoidingView
      style={styles.screenContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Editor Header Bar */}
      <EditorHeader
        title={template?.title || 'Banner Editor'}
        canUndo={past.length > 0}
        canRedo={future.length > 0}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onBack={() => {
          if (past.length > 0) {
            Alert.alert(
              'बाहेर पडायचे का? (Exit?)',
              'तुम्ही केलेले बदल सेव्ह केलेले नसतील तर ते नष्ट होतील. बाहेर पडायचे?',
              [
                { text: 'रद्द करा (Cancel)', style: 'cancel' },
                { text: 'बाहेर पडा (Exit)', style: 'destructive', onPress: onCancel }
              ]
            );
          } else {
            onCancel();
          }
        }}
        onSave={handleSaveBanner}
        onExport={() => setExportModalVisible(true)}
        onShare={() => setExportModalVisible(true)}
        onOpenResizeModal={() => setResizeModalVisible(true)}
        isSaving={isSaving}
        isExporting={isExporting}
      />

      {/* Main Canvas Workspace */}
      <View style={styles.workspace}>
        <EditorCanvas
          snapshot={present}
          selectedElementId={selectedElementId}
          onSelectElement={(id) => {
            setSelectedElementId(id);
            if (id) {
              const el = present.elements.find((e) => e.id === id);
              if (el?.type === 'text') setActivePanel('text');
            }
          }}
          onUpdateElementPosition={handleUpdateElementPosition}
          onRotateElement={handleRotateElement}
          onResizeElement={handleResizeElement}
          onDeleteElement={handleDeleteElement}
          onDuplicateElement={handleDuplicateElement}
          isExporting={isExporting}
          isBrushMode={isBrushMode}
          currentBrushStroke={currentBrushStroke}
          onBrushTouchStart={handleBrushTouchStart}
          onBrushTouchMove={handleBrushTouchMove}
          onBrushTouchEnd={handleBrushTouchEnd}
          canvasRef={canvasRef}
        />
      </View>

      {/* Contextual Active Bottom Panel */}
      {activePanel === 'text' ? (
        <TextEditorPanel
          selectedElement={selectedElement}
          onAddText={handleAddText}
          onUpdateText={handleUpdateText}
          onClose={() => setActivePanel('none')}
        />
      ) : activePanel === 'background' ? (
        <BackgroundPanel
          currentBackground={present.background}
          onUpdateBackground={handleUpdateBackground}
          onClose={() => setActivePanel('none')}
          onStartLoading={(msg) => setLoadingOverlayMsg(msg)}
          onStopLoading={() => setLoadingOverlayMsg(null)}
        />
      ) : activePanel === 'stickers' || activePanel === 'emoji' ? (
        <StickerPanel
          onAddSticker={handleAddSticker}
          onClose={() => setActivePanel('none')}
        />
      ) : activePanel === 'shapes' ? (
        <ShapePanel
          onAddShape={handleAddShape}
          onClose={() => setActivePanel('none')}
        />
      ) : activePanel === 'brush' && isBrushMode ? (
        <BrushPanel
          brushColor={brushColor}
          brushWidth={brushWidth}
          onSetBrushColor={setBrushColor}
          onSetBrushWidth={setBrushWidth}
          onUndoStroke={handleUndoStroke}
          onClearStrokes={handleClearStrokes}
          onExitBrush={() => {
            setIsBrushMode(false);
            setActivePanel('none');
          }}
        />
      ) : activePanel === 'effects' ? (
        <EffectsPanel
          selectedElement={selectedElement}
          onUpdateElementStyle={handleUpdateElementStyle}
          onClose={() => setActivePanel('none')}
        />
      ) : activePanel === 'layers' ? (
        <LayersPanel
          elements={present.elements}
          selectedElementId={selectedElementId}
          onSelectElement={(id) => setSelectedElementId(id)}
          onToggleVisibility={handleToggleVisibility}
          onToggleLock={handleToggleLock}
          onMoveLayerUp={(id) => handleMoveLayer(id, 'up')}
          onMoveLayerDown={(id) => handleMoveLayer(id, 'down')}
          onBringToFront={(id) => {
            const el = present.elements.find((e) => e.id === id);
            if (!el) return;
            const remaining = present.elements.filter((e) => e.id !== id);
            const updated = [...remaining, el].map((e, i) => ({ ...e, zIndex: i + 1 }));
            pushSnapshot({ ...present, elements: updated });
          }}
          onSendToBack={(id) => {
            const el = present.elements.find((e) => e.id === id);
            if (!el) return;
            const remaining = present.elements.filter((e) => e.id !== id);
            const updated = [el, ...remaining].map((e, i) => ({ ...e, zIndex: i + 1 }));
            pushSnapshot({ ...present, elements: updated });
          }}
          onDuplicateElement={handleDuplicateElement}
          onDeleteElement={handleDeleteElement}
          onClose={() => setActivePanel('none')}
        />
      ) : null}

      {/* Bottom Design Tools Toolbar */}
      <EditorToolbar activePanel={activePanel} onSelectTool={handleSelectTool} />

      {/* Resize Modal */}
      <CanvasResizeModal
        visible={resizeModalVisible}
        activePresetId={present.sizePreset}
        onSelectPreset={handleSelectSizePreset}
        onClose={() => setResizeModalVisible(false)}
      />

      {/* Export & Share Modal */}
      <ExportControls
        visible={exportModalVisible}
        onExport={handleExport}
        onShare={handleShare}
        onClose={() => setExportModalVisible(false)}
        isProcessing={isExporting}
      />

      {/* Loading Overlay Spinner */}
      {loadingOverlayMsg ? (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.loadingOverlayText}>{loadingOverlayMsg}</Text>
        </View>
      ) : null}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: '#0F172A'
  },
  workspace: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    backgroundColor: '#0F172A'
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    zIndex: 9999
  },
  loadingOverlayText: {
    marginTop: 16,
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center'
  }
});
