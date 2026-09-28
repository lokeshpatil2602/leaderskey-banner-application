import React, { useState, useEffect } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';
import { EditorElement } from '../../state/editorState';
import { FONT_OPTIONS } from '../../utils/fontUtils';

const COLOR_PALETTE = [
  '#111827', '#FFFFFF', '#EF4444', '#F97316', '#F59E0B',
  '#10B981', '#06B6D4', '#3B82F6', '#6366F1', '#8B5CF6',
  '#EC4899', '#D97706', '#059669', '#1E40AF', '#FFD700'
];

const MARATHI_PHRASE_PRESETS = [
  'हार्दिक शुभेच्छा',
  'वाढदिवसाच्या हार्दिक शुभेच्छा',
  'भव्य सत्कार सोहळा',
  'सस्नेह निमंत्रण',
  'जय महाराष्ट्र',
  'शुभेच्छुक',
  'निमंत्रक',
  'विशेष उपस्थिती',
  'एक ध्येय, एक संकल्प',
  'विजयी भव'
];

const FONT_SIZES = [14, 18, 22, 26, 32, 40, 48, 56];

type TextEditorPanelProps = {
  selectedElement: EditorElement | null;
  onAddText: (text: string, style?: any) => void;
  onUpdateText: (updates: { content?: string; style?: any }) => void;
  onClose: () => void;
};

export const TextEditorPanel: React.FC<TextEditorPanelProps> = ({
  selectedElement,
  onAddText,
  onUpdateText,
  onClose
}) => {
  const isEditing = Boolean(selectedElement && selectedElement.type === 'text');
  const [textValue, setTextValue] = useState(isEditing ? selectedElement?.content || '' : '');
  const [selectedFont, setSelectedFont] = useState(selectedElement?.style?.fontFamily || 'Sans-Serif');
  const [selectedColor, setSelectedColor] = useState(selectedElement?.style?.color || '#111827');
  const [selectedBgColor, setSelectedBgColor] = useState(selectedElement?.style?.backgroundColor || '');
  const [fontSize, setFontSize] = useState(selectedElement?.style?.fontSize || 22);
  const [textAlign, setTextAlign] = useState<'left' | 'center' | 'right'>(selectedElement?.style?.textAlign || 'center');
  const [isBold, setIsBold] = useState(selectedElement?.style?.fontWeight === 'bold');
  const [isItalic, setIsItalic] = useState(selectedElement?.style?.fontStyle === 'italic');
  const [hasShadow, setHasShadow] = useState(Boolean(selectedElement?.style?.shadowColor));

  useEffect(() => {
    if (selectedElement && selectedElement.type === 'text') {
      setTextValue(selectedElement.content);
      setSelectedFont(selectedElement.style?.fontFamily || 'Sans-Serif');
      setSelectedColor(selectedElement.style?.color || '#111827');
      setSelectedBgColor(selectedElement.style?.backgroundColor || '');
      setFontSize(selectedElement.style?.fontSize || 22);
      setTextAlign(selectedElement.style?.textAlign || 'center');
      setIsBold(selectedElement.style?.fontWeight === 'bold');
      setIsItalic(selectedElement.style?.fontStyle === 'italic');
      setHasShadow(Boolean(selectedElement.style?.shadowColor));
    }
  }, [selectedElement]);

  const handleApplyChanges = (newContent?: string, partialStyle?: any) => {
    const updatedContent = newContent !== undefined ? newContent : textValue;
    const mergedStyle = {
      ...(selectedElement?.style || {}),
      color: selectedColor,
      backgroundColor: selectedBgColor,
      fontFamily: selectedFont,
      fontSize,
      textAlign,
      fontWeight: isBold ? 'bold' : 'normal',
      fontStyle: isItalic ? 'italic' : 'normal',
      shadowColor: hasShadow ? 'rgba(0,0,0,0.5)' : undefined,
      shadowBlur: hasShadow ? 4 : undefined,
      ...(partialStyle || {})
    };

    if (isEditing) {
      onUpdateText({ content: updatedContent, style: mergedStyle });
    }
  };

  const handleInsertNew = () => {
    const finalContent = textValue.trim() || 'नवीन मजकूर';
    onAddText(finalContent, {
      color: selectedColor,
      backgroundColor: selectedBgColor,
      fontFamily: selectedFont,
      fontSize,
      textAlign,
      fontWeight: isBold ? 'bold' : 'normal',
      fontStyle: isItalic ? 'italic' : 'normal',
      shadowColor: hasShadow ? 'rgba(0,0,0,0.5)' : undefined
    });
    onClose();
  };

  return (
    <View style={styles.panelContainer}>
      <View style={styles.panelHeader}>
        <Text style={styles.panelTitle}>{isEditing ? 'मजकूर संपादित करा (Edit Text)' : 'मजकूर जोडा (Add Text)'}</Text>
        <Pressable onPress={onClose} style={styles.closeBtn}>
          <Text style={styles.closeBtnText}>✕</Text>
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollBody}>
        {/* Text Input */}
        <TextInput
          value={textValue}
          onChangeText={(txt) => {
            setTextValue(txt);
            if (isEditing) handleApplyChanges(txt);
          }}
          placeholder="येथे मजकूर टाईप करा..."
          placeholderTextColor="#9CA3AF"
          style={styles.textInput}
          multiline
        />

        {/* Quick Marathi Presets */}
        <Text style={styles.sectionLabel}>मराठी शुभेच्छा व मथळे (Quick Phrases):</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          {MARATHI_PHRASE_PRESETS.map((phrase, idx) => (
            <Pressable
              key={idx}
              style={styles.phraseChip}
              onPress={() => {
                setTextValue(phrase);
                if (isEditing) handleApplyChanges(phrase);
              }}
            >
              <Text style={styles.phraseChipText}>{phrase}</Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Font Style Selection */}
        <Text style={styles.sectionLabel}>फॉन्ट (Font Family):</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          {FONT_OPTIONS.map((f) => {
            const isFSelected = selectedFont === f.id;
            return (
              <Pressable
                key={f.id}
                style={[styles.fontChip, isFSelected && styles.chipActive]}
                onPress={() => {
                  setSelectedFont(f.id);
                  if (isEditing) handleApplyChanges(undefined, { fontFamily: f.id });
                }}
              >
                <Text style={[styles.fontChipText, isFSelected && styles.chipTextActive, f.getStyle()]}>
                  {f.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Text Formatting Controls: Bold, Italic, Alignment, Shadow */}
        <View style={styles.formatRow}>
          <Pressable
            style={[styles.formatBtn, isBold && styles.formatBtnActive]}
            onPress={() => {
              const next = !isBold;
              setIsBold(next);
              if (isEditing) handleApplyChanges(undefined, { fontWeight: next ? 'bold' : 'normal' });
            }}
          >
            <Text style={[styles.formatBtnText, { fontWeight: 'bold' }]}>B</Text>
          </Pressable>

          <Pressable
            style={[styles.formatBtn, isItalic && styles.formatBtnActive]}
            onPress={() => {
              const next = !isItalic;
              setIsItalic(next);
              if (isEditing) handleApplyChanges(undefined, { fontStyle: next ? 'italic' : 'normal' });
            }}
          >
            <Text style={[styles.formatBtnText, { fontStyle: 'italic' }]}>I</Text>
          </Pressable>

          <Pressable
            style={[styles.formatBtn, hasShadow && styles.formatBtnActive]}
            onPress={() => {
              const next = !hasShadow;
              setHasShadow(next);
              if (isEditing)
                handleApplyChanges(undefined, {
                  shadowColor: next ? 'rgba(0,0,0,0.5)' : undefined,
                  shadowBlur: next ? 4 : undefined
                });
            }}
          >
            <Text style={styles.formatBtnText}>Shadow</Text>
          </Pressable>

          {/* Alignment */}
          {(['left', 'center', 'right'] as const).map((align) => (
            <Pressable
              key={align}
              style={[styles.formatBtn, textAlign === align && styles.formatBtnActive]}
              onPress={() => {
                setTextAlign(align);
                if (isEditing) handleApplyChanges(undefined, { textAlign: align });
              }}
            >
              <Text style={styles.formatBtnText}>{align === 'left' ? '⇤' : align === 'center' ? '≡' : '⇥'}</Text>
            </Pressable>
          ))}
        </View>

        {/* Font Size Preset */}
        <Text style={styles.sectionLabel}>आकार (Font Size):</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          {FONT_SIZES.map((sz) => {
            const isSzSelected = fontSize === sz;
            return (
              <Pressable
                key={sz}
                style={[styles.sizeChip, isSzSelected && styles.chipActive]}
                onPress={() => {
                  setFontSize(sz);
                  if (isEditing) handleApplyChanges(undefined, { fontSize: sz });
                }}
              >
                <Text style={[styles.sizeChipText, isSzSelected && styles.chipTextActive]}>{sz}px</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Color Palette */}
        <Text style={styles.sectionLabel}>रंग (Text Color):</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.colorRow}>
          {COLOR_PALETTE.map((c) => (
            <Pressable
              key={c}
              style={[styles.colorCircle, { backgroundColor: c }, selectedColor === c && styles.colorActive]}
              onPress={() => {
                setSelectedColor(c);
                if (isEditing) handleApplyChanges(undefined, { color: c });
              }}
            />
          ))}
        </ScrollView>

        {/* Background Highlight Box Color */}
        <Text style={styles.sectionLabel}>पार्श्वभूमी रंग (Highlight Box):</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.colorRow}>
          <Pressable
            style={[styles.colorCircle, styles.noneColor, !selectedBgColor && styles.colorActive]}
            onPress={() => {
              setSelectedBgColor('');
              if (isEditing) handleApplyChanges(undefined, { backgroundColor: undefined });
            }}
          >
            <Text style={{ fontSize: 10, color: '#6B7280' }}>None</Text>
          </Pressable>
          {COLOR_PALETTE.map((c) => (
            <Pressable
              key={c}
              style={[styles.colorCircle, { backgroundColor: c }, selectedBgColor === c && styles.colorActive]}
              onPress={() => {
                setSelectedBgColor(c);
                if (isEditing) handleApplyChanges(undefined, { backgroundColor: c });
              }}
            />
          ))}
        </ScrollView>

        {!isEditing ? (
          <Pressable style={styles.addTextActionBtn} onPress={handleInsertNew}>
            <Text style={styles.addTextActionBtnText}>+ कॅनव्हासवर जोडा (Add to Canvas)</Text>
          </Pressable>
        ) : null}
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
    maxHeight: 380,
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
  textInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    color: '#111827',
    minHeight: 50,
    marginBottom: 10
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
    marginTop: 8,
    marginBottom: 6
  },
  chipRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 2
  },
  phraseChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7D2FE'
  },
  phraseChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4338CA'
  },
  fontChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB'
  },
  fontChipText: {
    fontSize: 13,
    color: '#374151'
  },
  chipActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB'
  },
  chipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700'
  },
  formatRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10
  },
  formatBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center'
  },
  formatBtnActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB'
  },
  formatBtnText: {
    fontSize: 13,
    color: '#374151'
  },
  sizeChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB'
  },
  sizeChipText: {
    fontSize: 12,
    color: '#374151'
  },
  colorRow: {
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 4
  },
  colorCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#D1D5DB'
  },
  colorActive: {
    borderColor: '#2563EB',
    borderWidth: 3,
    transform: [{ scale: 1.15 }]
  },
  noneColor: {
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center'
  },
  addTextActionBtn: {
    marginTop: 14,
    backgroundColor: '#2563EB',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center'
  },
  addTextActionBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14
  }
});
