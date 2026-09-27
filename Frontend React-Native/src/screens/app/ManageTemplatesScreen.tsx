import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from '../../i18n/I18nContext';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { AuthUser } from '../../api/services/authService';
import {
  BannerCanvas,
  BannerElement,
  BannerElementType,
  BannerSizePreset,
  createTemplate,
  deleteTemplate,
  getTemplates,
  Template,
  updateTemplate
} from '../../api/services/templateService';
import { uploadImage } from '../../api/services/uploadService';
import { getCategories } from '../../api/services/categoryService';
import { BannerRenderer } from '../../components/banner/BannerRenderer';
import { RoleGuard } from '../../components/common/RoleGuard';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const PREDEFINED_CATEGORIES = [
  'Politics',
  'Festival',
  'Business',
  'Birthday',
  'Education',
  'Events',
  'Other'
];

const SIZE_PRESETS: { label: BannerSizePreset; width: number; height: number }[] = [
  { label: 'Portrait', width: 1080, height: 1350 },
  { label: 'Square', width: 1080, height: 1080 },
  { label: 'Story', width: 1080, height: 1920 },
  { label: 'Landscape', width: 1920, height: 1080 }
];

const POSITION_PRESETS = [
  { label: 'Top', x: 50, y: 18 },
  { label: 'Center', x: 50, y: 50 },
  { label: 'Bottom', x: 50, y: 82 },
  { label: 'Top-Left', x: 20, y: 15 },
  { label: 'Top-Right', x: 80, y: 15 },
  { label: 'Bottom-Left', x: 25, y: 80 },
  { label: 'Bottom-Right', x: 75, y: 80 }
];

type ManageTemplatesScreenProps = {
  user: AuthUser;
  onNavigateHome?: () => void;
};

export function ManageTemplatesScreen({ user, onNavigateHome }: ManageTemplatesScreenProps) {
  const { t } = useTranslation();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Designer Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Politics');
  const [imageUrl, setImageUrl] = useState('');
  const [canvas, setCanvas] = useState<BannerCanvas>({
    width: 1080,
    height: 1350,
    sizePreset: 'Portrait'
  });
  const [elements, setElements] = useState<BannerElement[]>([]);
  const [isActive, setIsActive] = useState(true);

  // Social Media Defaults State (Admin configuration)
  const [fbCaption, setFbCaption] = useState('');
  const [fbHashtags, setFbHashtags] = useState('');
  const [instaCaption, setInstaCaption] = useState('');
  const [instaHashtags, setInstaHashtags] = useState('');
  const [xCaption, setXCaption] = useState('');
  const [xHashtags, setXHashtags] = useState('');
  const [threadsCaption, setThreadsCaption] = useState('');
  const [threadsHashtags, setThreadsHashtags] = useState('');
  const [adminSocialTab, setAdminSocialTab] = useState<'facebook' | 'instagram' | 'x' | 'threads'>('facebook');
  const [socialExpanded, setSocialExpanded] = useState(true);

  // Add Element Sub-form
  const [showAddElementModal, setShowAddElementModal] = useState(false);
  const [newElType, setNewElType] = useState<BannerElementType>('text');
  const [newElLabel, setNewElLabel] = useState('');
  const [newElContent, setNewElContent] = useState('');
  const [newElSource, setNewElSource] = useState('');
  const [newElPos, setNewElPos] = useState({ x: 50, y: 50 });
  const [newElWidth, setNewElWidth] = useState(60);
  const [newElHeight, setNewElHeight] = useState(15);
  const [newElRequired, setNewElRequired] = useState(false);
  const [newElEditable, setNewElEditable] = useState(true);
  const [newElMovable, setNewElMovable] = useState(true);
  const [newElResizable, setNewElResizable] = useState(false);
  const [newElLocked, setNewElLocked] = useState(false);

  const [saving, setSaving] = useState(false);

  // Pick Background Image from Phone
  const handlePickBgImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(t('permissionRequired'), t('galleryBackgroundPermission'));
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.85,
        base64: true
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        try {
          const uploadRes = await uploadImage(asset.uri);
          setImageUrl(uploadRes.url);
        } catch {
          const dataUri = asset.base64 ? `data:image/png;base64,${asset.base64}` : asset.uri;
          setImageUrl(dataUri);
        }
      }
    } catch (e) {
      Alert.alert(t('uploadError'), t('backgroundUploadError'));
    }
  };

  // Pick Element Graphic / PNG from Phone
  const handlePickElementImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(t('permissionRequired'), t('galleryElementPermission'));
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.85,
        base64: true
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        try {
          const uploadRes = await uploadImage(asset.uri);
          setNewElSource(uploadRes.url);
        } catch {
          const dataUri = asset.base64 ? `data:image/png;base64,${asset.base64}` : asset.uri;
          setNewElSource(dataUri);
        }
      }
    } catch (e) {
      Alert.alert(t('uploadError'), t('elementUploadError'));
    }
  };

  const fetchTemplates = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getTemplates();
      setTemplates(data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : t('unableLoadTemplates');
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const openAddModal = () => {
    setEditingTemplate(null);
    setTitle('');
    setCategory('Politics');
    setImageUrl('https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?w=800');
    setCanvas({ width: 1080, height: 1350, sizePreset: 'Portrait' });
    setElements([
      {
        id: 'heading',
        type: 'text',
        label: 'Main Heading',
        content: 'FESTIVAL RALLY 2026',
        position: { x: 50, y: 20 },
        size: { width: 80, height: 10 },
        style: { fontFamily: 'Impact', fontSize: 26, color: '#FFFFFF', alignment: 'center' },
        required: true,
        editable: true,
        movable: true,
        zIndex: 1
      },
      {
        id: 'candidate_photo',
        type: 'image',
        label: 'Person Photo',
        source: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500',
        position: { x: 50, y: 50 },
        size: { width: 42, height: 32 },
        style: { borderRadius: 12 },
        required: true,
        editable: true,
        movable: true,
        resizable: true,
        zIndex: 2
      },
      {
        id: 'candidate_name',
        type: 'text',
        label: 'Candidate Name',
        content: 'Meet Patel',
        position: { x: 50, y: 76 },
        size: { width: 75, height: 8 },
        style: { fontFamily: 'Modern', fontSize: 28, color: '#FDE68A', alignment: 'center' },
        required: true,
        editable: true,
        movable: true,
        zIndex: 3
      }
    ]);
    setFbCaption('');
    setFbHashtags('');
    setInstaCaption('');
    setInstaHashtags('');
    setXCaption('');
    setXHashtags('');
    setThreadsCaption('');
    setThreadsHashtags('');
    setIsActive(true);
    setModalVisible(true);
  };

  const openEditModal = (tmpl: Template) => {
    setEditingTemplate(tmpl);
    setTitle(tmpl.title);
    setCategory(tmpl.category);
    setImageUrl(tmpl.imageUrl);
    setCanvas(tmpl.canvas || { width: 1080, height: 1350, sizePreset: 'Portrait' });
    setElements(tmpl.elements ? tmpl.elements.map((e) => ({ ...e })) : []);
    const sc = tmpl.socialContent;
    setFbCaption(sc?.facebook?.caption || '');
    setFbHashtags((sc?.facebook?.hashtags || []).join(' '));
    setInstaCaption(sc?.instagram?.caption || '');
    setInstaHashtags((sc?.instagram?.hashtags || []).join(' '));
    setXCaption(sc?.x?.caption || '');
    setXHashtags((sc?.x?.hashtags || []).join(' '));
    setThreadsCaption(sc?.threads?.caption || '');
    setThreadsHashtags((sc?.threads?.hashtags || []).join(' '));
    setIsActive(tmpl.isActive);
    setModalVisible(true);
  };

  const handleSelectSize = (sz: (typeof SIZE_PRESETS)[number]) => {
    setCanvas({
      width: sz.width,
      height: sz.height,
      sizePreset: sz.label
    });
  };

  const handleAddElement = () => {
    if (!newElLabel.trim()) {
      Alert.alert(t('validation'), t('elementLabelRequired'));
      return;
    }

    const id = `${newElType}_${Date.now().toString().slice(-4)}`;
    const newElement: BannerElement = {
      id,
      type: newElType,
      label: newElLabel.trim(),
      content: newElContent.trim() || newElLabel.trim(),
      source:
        newElSource.trim() ||
        (newElType === 'logo'
          ? 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200'
          : newElType === 'symbol'
          ? 'https://images.unsplash.com/photo-1607344645866-009c320b5ab8?w=200'
          : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500'),
      position: { ...newElPos },
      size: { width: newElWidth, height: newElHeight },
      style: {
        fontFamily: 'Modern',
        fontSize: 22,
        color: '#FFFFFF',
        alignment: 'center',
        borderRadius: newElType === 'image' ? 12 : 0
      },
      required: newElRequired,
      editable: newElEditable,
      movable: newElMovable,
      resizable: newElResizable,
      locked: newElLocked,
      zIndex: elements.length + 1,
      visible: true
    };

    setElements((prev) => [...prev, newElement]);
    setShowAddElementModal(false);
    setNewElLabel('');
    setNewElContent('');
    setNewElSource('');
  };

  const handleRemoveElement = (id: string) => {
    setElements((prev) => prev.filter((e) => e.id !== id));
  };

  const handleMoveLayer = (index: number, direction: 'up' | 'down') => {
    setElements((prev) => {
      const copy = [...prev];
      const targetIndex = direction === 'up' ? index + 1 : index - 1;
      if (targetIndex < 0 || targetIndex >= copy.length) return prev;

      const temp = copy[index];
      copy[index] = copy[targetIndex];
      copy[targetIndex] = temp;

      // Re-assign zIndexes
      return copy.map((el, idx) => ({ ...el, zIndex: idx + 1 }));
    });
  };

  const handleToggleLock = (id: string) => {
    setElements((prev) =>
      prev.map((e) =>
        e.id === id
          ? {
              ...e,
              locked: !e.locked,
              movable: e.locked, // if locked, disable movable
              editable: e.locked // if locked, disable editable
            }
          : e
      )
    );
  };

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert(t('validation'), t('titleRequired'));
      return;
    }
    if (!category.trim()) {
      Alert.alert(t('validation'), t('categoryRequired'));
      return;
    }
    if (!imageUrl.trim()) {
      Alert.alert(t('validation'), t('imageUrlRequired'));
      return;
    }
    if (elements.length === 0) {
      Alert.alert(t('validation'), t('elementRequired'));
      return;
    }

    try {
      setSaving(true);
      const background = {
        type: 'image' as const,
        source: imageUrl.trim(),
        color: '#0f172a'
      };

      const parseHashtags = (str: string) =>
        str
          .split(/\s+/)
          .map((t) => t.trim())
          .filter((t) => t.length > 0)
          .map((t) => (t.startsWith('#') ? t : `#${t}`));

      const socialContent = {
        facebook: { caption: fbCaption.trim(), hashtags: parseHashtags(fbHashtags) },
        instagram: { caption: instaCaption.trim(), hashtags: parseHashtags(instaHashtags) },
        x: { caption: xCaption.trim(), hashtags: parseHashtags(xHashtags) },
        threads: { caption: threadsCaption.trim(), hashtags: parseHashtags(threadsHashtags) }
      };

      if (editingTemplate) {
        const updated = await updateTemplate(editingTemplate.id, {
          title: title.trim(),
          category: category.trim(),
          imageUrl: imageUrl.trim(),
          canvas,
          background,
          elements,
          socialContent,
          isActive
        });
        setTemplates((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
        Alert.alert(t('success'), t('templateUpdated'));
      } else {
        const created = await createTemplate({
          title: title.trim(),
          category: category.trim(),
          imageUrl: imageUrl.trim(),
          canvas,
          background,
          elements,
          socialContent,
          isActive
        });
        setTemplates((prev) => [created, ...prev]);
        Alert.alert(t('success'), t('templateCreated'));
      }
      setModalVisible(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to save template.';
      Alert.alert(t('actionFailed'), msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (tmpl: Template) => {
    Alert.alert(t('confirmDelete'), t('confirmDeleteTemplate', { name: tmpl.title }), [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('delete'),
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteTemplate(tmpl.id);
            setTemplates((prev) => prev.filter((t) => t.id !== tmpl.id));
            Alert.alert(t('deleted'), t('templateDeleted'));
          } catch (err) {
            const msg = err instanceof Error ? err.message : 'Failed to delete template.';
            Alert.alert(t('deleteFailed'), msg);
          }
        }
      }
    ]);
  };

  return (
    <RoleGuard user={user} allowedRoles={['ADMIN', 'SUPER_ADMIN']} onNavigateHome={onNavigateHome}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{t('manageTemplates')}</Text>
          <Pressable style={styles.addButton} onPress={openAddModal}>
            <Text style={styles.addButtonText}>{t('addTemplate')}</Text>
          </Pressable>
        </View>

        {loading ? (
          <View style={styles.centerState}>
            <ActivityIndicator size="large" color="#2563eb" />
            <Text style={styles.loadingText}>{t('loadingTemplates')}</Text>
          </View>
        ) : error ? (
          <View style={styles.centerState}>
            <Text style={styles.errorText}>{t('unableLoadTemplates')}</Text>
            <Pressable style={styles.retryButton} onPress={fetchTemplates}>
              <Text style={styles.retryButtonText}>{t('retry')}</Text>
            </Pressable>
          </View>
        ) : templates.length === 0 ? (
          <View style={styles.centerState}>
            <Text style={styles.emptyText}>{t('noTemplates')}</Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.listContent}>
            {templates.map((tmpl) => (
              <View key={tmpl.id} style={styles.card}>
                <Image source={{ uri: tmpl.imageUrl }} style={styles.cardThumb} resizeMode="cover" />
                <View style={styles.cardBody}>
                  <View style={styles.cardHeaderRow}>
                    <Text style={styles.cardTitle} numberOfLines={1}>
                      {tmpl.title}
                    </Text>
                    <View
                      style={[
                        styles.statusBadge,
                        tmpl.isActive ? styles.statusActive : styles.statusInactive
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusText,
                          tmpl.isActive ? styles.statusTextActive : styles.statusTextInactive
                        ]}
                      >
                        {tmpl.isActive ? t('activeStatusValue') : t('inactiveStatusValue')}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.cardCategory}>
                    {tmpl.category} • {tmpl.canvas?.sizePreset || 'Portrait'} (
                    {tmpl.canvas?.width || 1080}×{tmpl.canvas?.height || 1350})
                  </Text>

                  {/* Elements Summary */}
                  <View style={styles.fieldsPreviewRow}>
                    {tmpl.elements?.map((el, idx) => (
                      <View key={idx} style={styles.fieldTag}>
                        <Text style={styles.fieldTagText}>
                          {el.type === 'text' ? '📝' : el.type === 'logo' ? '🏷️' : el.type === 'symbol' ? '✨' : '🖼️'}{' '}
                          {el.label} {el.locked ? '🔒' : ''}
                        </Text>
                      </View>
                    ))}
                  </View>

                  <View style={styles.actionRow}>
                    <Pressable style={styles.editBtn} onPress={() => openEditModal(tmpl)}>
                      <Text style={styles.editBtnText}>{t('editDesigner')}</Text>
                    </Pressable>
                    <Pressable style={styles.deleteBtn} onPress={() => handleDelete(tmpl)}>
                      <Text style={styles.deleteBtnText}>{t('delete')}</Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            ))}
          </ScrollView>
        )}

        {/* Admin Template Designer Modal */}
        <Modal
          visible={modalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={styles.modalHeader}>
                  {editingTemplate ? t('adminTemplateDesigner') : t('createTemplate')}
                </Text>

                {/* Banner Dimensions & Aspect Ratio Presets */}
                <Text style={styles.fieldLabel}>{t('bannerSizePreset')}</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
                  {SIZE_PRESETS.map((sz) => {
                    const isSelected = canvas.sizePreset === sz.label;
                    return (
                      <Pressable
                        key={sz.label}
                        style={[styles.sizePresetBtn, isSelected && styles.sizePresetBtnActive]}
                        onPress={() => handleSelectSize(sz)}
                      >
                        <Text style={[styles.sizePresetTitle, isSelected && styles.sizePresetTextActive]}>
                          {sz.label}
                        </Text>
                        <Text style={[styles.sizePresetSub, isSelected && styles.sizePresetTextActive]}>
                          {sz.width}×{sz.height}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>

                {/* Real-time Canvas Renderer Preview */}
                <Text style={styles.fieldLabel}>{t('canvasPreview')}</Text>
                <View style={styles.designerPreviewWrapper}>
                  <BannerRenderer
                    canvas={canvas}
                    background={{ type: 'image', source: imageUrl, color: '#0f172a' }}
                    elements={elements}
                    containerWidth={Math.min(SCREEN_WIDTH - 64, 320)}
                  />
                </View>

                <Text style={styles.fieldLabel}>{t('templateTitle')}</Text>
                <TextInput
                  style={styles.input}
                  placeholder={t('templateTitlePlaceholder')}
                  placeholderTextColor="#94a3b8"
                  value={title}
                  onChangeText={setTitle}
                />

                <Text style={styles.fieldLabel}>{t('category')}</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryPickerRow}>
                  {PREDEFINED_CATEGORIES.map((cat) => (
                    <Pressable
                      key={cat}
                      style={[
                        styles.catOptionChip,
                        category.toLowerCase() === cat.toLowerCase() && styles.catOptionChipActive
                      ]}
                      onPress={() => setCategory(cat)}
                    >
                      <Text
                        style={[
                          styles.catOptionText,
                          category.toLowerCase() === cat.toLowerCase() && styles.catOptionTextActive
                        ]}
                      >
                        {cat}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>

                <Text style={styles.fieldLabel}>{t('backgroundImage')}</Text>
                <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    placeholder={t('urlPlaceholder')}
                    placeholderTextColor="#94a3b8"
                    value={imageUrl}
                    onChangeText={setImageUrl}
                  />
                  <Pressable style={styles.uploadPhoneBtn} onPress={handlePickBgImage}>
                    <Text style={styles.uploadPhoneBtnText}>📁 {t('uploadShort')}</Text>
                  </Pressable>
                </View>

                {/* Elements & Layers Section */}
                <View style={styles.editableFieldsSection}>
                  <View style={styles.fieldsHeaderRow}>
                    <Text style={styles.fieldsSectionTitle}>{t('templateElementsCount', { count: elements.length })}</Text>
                    <Pressable
                      style={styles.addFieldSmallBtn}
                      onPress={() => setShowAddElementModal(true)}
                    >
                      <Text style={styles.addFieldSmallBtnText}>{t('addElement')}</Text>
                    </Pressable>
                  </View>

                  {elements.length === 0 ? (
                    <Text style={styles.noFieldsText}>{t('noElements')}</Text>
                  ) : (
                    <View style={styles.fieldsList}>
                      {elements.map((el, index) => (
                        <View key={el.id} style={styles.elementRow}>
                          <View style={styles.elementRowHeader}>
                            <Text style={styles.elementRowLabel}>
                              {index + 1}. [{el.type.toUpperCase()}] {el.label}
                            </Text>

                            <View style={styles.badgeGroup}>
                              <Pressable
                                style={[styles.lockBtn, el.locked ? styles.lockActive : styles.lockInactive]}
                                onPress={() => handleToggleLock(el.id)}
                              >
                                <Text style={styles.lockBtnText}>{el.locked ? '🔒 Locked' : '🔓 Open'}</Text>
                              </Pressable>
                              <Pressable
                                style={styles.removeFieldBtn}
                                onPress={() => handleRemoveElement(el.id)}
                              >
                                <Text style={styles.removeFieldBtnText}>✕</Text>
                              </Pressable>
                            </View>
                          </View>

                          <Text style={styles.elementRowSub}>
                            Pos: ({el.position.x}%, {el.position.y}%) • Size: ({el.size.width}%) • Layer: {el.zIndex}
                          </Text>

                          {/* Layer Reorder */}
                          <View style={styles.layerControlsRow}>
                            <Text style={styles.layerLabel}>{t('layerOrder')}</Text>
                            <Pressable
                              style={[styles.layerBtn, index === 0 && { opacity: 0.4 }]}
                              onPress={() => handleMoveLayer(index, 'down')}
                              disabled={index === 0}
                            >
                              <Text style={styles.layerBtnText}>↓ Down</Text>
                            </Pressable>
                            <Pressable
                              style={[styles.layerBtn, index === elements.length - 1 && { opacity: 0.4 }]}
                              onPress={() => handleMoveLayer(index, 'up')}
                              disabled={index === elements.length - 1}
                            >
                              <Text style={styles.layerBtnText}>↑ Up</Text>
                            </Pressable>
                          </View>
                        </View>
                      ))}
                    </View>
                  )}
                </View>

                {/* Social Media Defaults Configuration */}
                <View style={styles.socialConfigSection}>
                  <Pressable
                    style={styles.socialHeaderToggle}
                    onPress={() => setSocialExpanded(!socialExpanded)}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={styles.fieldsSectionTitle}>🌐 Social Media Defaults</Text>
                    </View>
                    <Text style={styles.toggleArrowText}>{socialExpanded ? '▲ Hide' : '▼ Expand'}</Text>
                  </Pressable>

                  {socialExpanded && (
                    <View style={styles.socialConfigBody}>
                      {/* Platform Tabs */}
                      <View style={styles.socialPlatformTabsRow}>
                        {(
                          [
                            { key: 'facebook', label: 'Facebook', icon: '📘' },
                            { key: 'instagram', label: 'Instagram', icon: '📸' },
                            { key: 'x', label: 'X', icon: '𝕏' },
                            { key: 'threads', label: 'Threads', icon: '🧵' }
                          ] as const
                        ).map((p) => (
                          <Pressable
                            key={p.key}
                            style={[
                              styles.socialPlatformTabBtn,
                              adminSocialTab === p.key && styles.socialPlatformTabBtnActive
                            ]}
                            onPress={() => setAdminSocialTab(p.key)}
                          >
                            <Text style={styles.socialTabIconText}>{p.icon}</Text>
                            <Text
                              style={[
                                styles.socialPlatformTabText,
                                adminSocialTab === p.key && styles.socialPlatformTabTextActive
                              ]}
                            >
                              {p.label}
                            </Text>
                          </Pressable>
                        ))}
                      </View>

                      {/* Active Platform Fields */}
                      {adminSocialTab === 'facebook' && (
                        <View style={styles.platformFieldBox}>
                          <Text style={styles.fieldLabelSmall}>{t('facebookCaption')}</Text>
                          <TextInput
                            style={styles.socialTextInput}
                            multiline
                            numberOfLines={3}
                            placeholder={t('facebookCaptionPlaceholder')}
                            placeholderTextColor="#94a3b8"
                            value={fbCaption}
                            onChangeText={setFbCaption}
                          />
                          <Text style={styles.fieldLabelSmall}>{t('facebookHashtags')}</Text>
                          <TextInput
                            style={styles.socialTagInput}
                            placeholder={t('facebookHashtagsPlaceholder')}
                            placeholderTextColor="#94a3b8"
                            value={fbHashtags}
                            onChangeText={setFbHashtags}
                          />
                        </View>
                      )}

                      {adminSocialTab === 'instagram' && (
                        <View style={styles.platformFieldBox}>
                          <Text style={styles.fieldLabelSmall}>{t('instagramCaption')}</Text>
                          <TextInput
                            style={styles.socialTextInput}
                            multiline
                            numberOfLines={3}
                            placeholder={t('instagramCaptionPlaceholder')}
                            placeholderTextColor="#94a3b8"
                            value={instaCaption}
                            onChangeText={setInstaCaption}
                          />
                          <Text style={styles.fieldLabelSmall}>{t('instagramHashtags')}</Text>
                          <TextInput
                            style={styles.socialTagInput}
                            placeholder={t('instagramHashtagsPlaceholder')}
                            placeholderTextColor="#94a3b8"
                            value={instaHashtags}
                            onChangeText={setInstaHashtags}
                          />
                        </View>
                      )}

                      {adminSocialTab === 'x' && (
                        <View style={styles.platformFieldBox}>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                            <Text style={styles.fieldLabelSmall}>{t('xCaption')}</Text>
                            <Text style={styles.charCountAdmin}>
                              {`${xCaption} ${xHashtags}`.trim().length} / 280
                            </Text>
                          </View>
                          <TextInput
                            style={styles.socialTextInput}
                            multiline
                            numberOfLines={3}
                            placeholder={t('xCaptionPlaceholder')}
                            placeholderTextColor="#94a3b8"
                            value={xCaption}
                            onChangeText={setXCaption}
                          />
                          <Text style={styles.fieldLabelSmall}>{t('xHashtags')}</Text>
                          <TextInput
                            style={styles.socialTagInput}
                            placeholder={t('xHashtagsPlaceholder')}
                            placeholderTextColor="#94a3b8"
                            value={xHashtags}
                            onChangeText={setXHashtags}
                          />
                        </View>
                      )}

                      {adminSocialTab === 'threads' && (
                        <View style={styles.platformFieldBox}>
                          <Text style={styles.fieldLabelSmall}>{t('threadsCaption')}</Text>
                          <TextInput
                            style={styles.socialTextInput}
                            multiline
                            numberOfLines={3}
                            placeholder={t('threadsCaptionPlaceholder')}
                            placeholderTextColor="#94a3b8"
                            value={threadsCaption}
                            onChangeText={setThreadsCaption}
                          />
                          <Text style={styles.fieldLabelSmall}>{t('threadsHashtags')}</Text>
                          <TextInput
                            style={styles.socialTagInput}
                            placeholder={t('threadsHashtagsPlaceholder')}
                            placeholderTextColor="#94a3b8"
                            value={threadsHashtags}
                            onChangeText={setThreadsHashtags}
                          />
                        </View>
                      )}
                    </View>
                  )}
                </View>

                {editingTemplate && (
                  <View style={styles.switchRow}>
                    <Text style={styles.switchLabel}>{t('activeStatus')}</Text>
                    <Switch
                      value={isActive}
                      onValueChange={setIsActive}
                      trackColor={{ false: '#cbd5e1', true: '#93c5fd' }}
                      thumbColor={isActive ? '#2563eb' : '#f4f3f4'}
                    />
                  </View>
                )}

                <View style={styles.modalActions}>
                  <Pressable
                    style={styles.cancelBtn}
                    onPress={() => setModalVisible(false)}
                    disabled={saving}
                  >
                    <Text style={styles.cancelBtnText}>{t('cancel')}</Text>
                  </Pressable>
                  <Pressable style={styles.saveBtn} onPress={handleSave} disabled={saving}>
                    {saving ? (
                      <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                      <Text style={styles.saveBtnText}>
                        {editingTemplate ? t('saveChanges') : t('saveTemplate')}
                      </Text>
                    )}
                  </Pressable>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Add Element Submodal */}
        <Modal
          visible={showAddElementModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowAddElementModal(false)}
        >
          <View style={styles.subModalBackdrop}>
            <View style={styles.subModalCard}>
              <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={styles.subModalTitle}>{t('addElementTitle')}</Text>

                {/* Element Type Selector */}
                <Text style={styles.fieldLabelSmall}>{t('elementType')}</Text>
                <View style={styles.typeSelectorRow}>
                  {(['text', 'image', 'logo', 'symbol'] as BannerElementType[]).map((t) => (
                    <Pressable
                      key={t}
                      style={[styles.typeBtn, newElType === t && styles.typeBtnActive]}
                      onPress={() => setNewElType(t)}
                    >
                      <Text style={[styles.typeBtnText, newElType === t && styles.typeBtnTextActive]}>
                        {t === 'text' ? '📝 Text' : t === 'image' ? '🖼️ Photo' : t === 'logo' ? '🏷️ Logo' : '✨ Symbol'}
                      </Text>
                    </Pressable>
                  ))}
                </View>

                <Text style={styles.fieldLabelSmall}>{t('label')}</Text>
                <TextInput
                  style={styles.inputSmall}
                  placeholder={t('elementLabelPlaceholder')}
                  placeholderTextColor="#94a3b8"
                  value={newElLabel}
                  onChangeText={setNewElLabel}
                />

                {newElType === 'text' ? (
                  <>
                    <Text style={styles.fieldLabelSmall}>{t('defaultTextContent')}</Text>
                    <TextInput
                      style={styles.inputSmall}
                      placeholder={t('elementContentPlaceholder')}
                      placeholderTextColor="#94a3b8"
                      value={newElContent}
                      onChangeText={setNewElContent}
                    />
                  </>
                ) : (
                  <>
                    <Text style={styles.fieldLabelSmall}>{t('imageLogoSymbol')}</Text>
                    <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
                      <TextInput
                        style={[styles.inputSmall, { flex: 1 }]}
                        placeholder={t('urlPlaceholder')}
                        placeholderTextColor="#94a3b8"
                        value={newElSource}
                        onChangeText={setNewElSource}
                      />
                      <Pressable style={styles.uploadPhoneBtnSmall} onPress={handlePickElementImage}>
                        <Text style={styles.uploadPhoneBtnSmallText}>📁 {t('uploadPng')}</Text>
                      </Pressable>
                    </View>
                  </>
                )}

                {/* Position Presets */}
                <Text style={styles.fieldLabelSmall}>{t('position')} ({newElPos.x}%, {newElPos.y}%)</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 4 }}>
                  {POSITION_PRESETS.map((p) => (
                    <Pressable
                      key={p.label}
                      style={[styles.posChip, newElPos.x === p.x && newElPos.y === p.y && styles.posChipActive]}
                      onPress={() => setNewElPos({ x: p.x, y: p.y })}
                    >
                      <Text style={[styles.posChipText, newElPos.x === p.x && newElPos.y === p.y && styles.posChipTextActive]}>
                        {p.label}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>

                {/* Permissions Toggles */}
                <View style={styles.switchRowSmall}>
                  <Text style={styles.switchLabelSmall}>{t('required')}</Text>
                  <Switch value={newElRequired} onValueChange={setNewElRequired} />
                </View>
                <View style={styles.switchRowSmall}>
                  <Text style={styles.switchLabelSmall}>{t('userEditable')}</Text>
                  <Switch value={newElEditable} onValueChange={setNewElEditable} />
                </View>
                <View style={styles.switchRowSmall}>
                  <Text style={styles.switchLabelSmall}>{t('userMovable')}</Text>
                  <Switch value={newElMovable} onValueChange={setNewElMovable} />
                </View>
                <View style={styles.switchRowSmall}>
                  <Text style={styles.switchLabelSmall}>{t('userResizable')}</Text>
                  <Switch value={newElResizable} onValueChange={setNewElResizable} />
                </View>
                <View style={styles.switchRowSmall}>
                  <Text style={styles.switchLabelSmall}>{t('adminLocked')}</Text>
                  <Switch value={newElLocked} onValueChange={setNewElLocked} />
                </View>

                <View style={styles.subModalActions}>
                  <Pressable
                    style={styles.cancelBtn}
                    onPress={() => setShowAddElementModal(false)}
                  >
                    <Text style={styles.cancelBtnText}>{t('cancel')}</Text>
                  </Pressable>
                  <Pressable style={styles.confirmSubBtn} onPress={handleAddElement}>
                    <Text style={styles.confirmSubBtnText}>{t('addToCanvas')}</Text>
                  </Pressable>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>
      </View>
    </RoleGuard>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderColor: '#e2e8f0'
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a'
  },
  addButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8
  },
  addButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13
  },
  centerState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748b'
  },
  errorText: {
    fontSize: 15,
    color: '#ef4444',
    marginBottom: 14,
    textAlign: 'center'
  },
  retryButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 8
  },
  retryButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13
  },
  emptyText: {
    fontSize: 15,
    color: '#64748b',
    textAlign: 'center'
  },
  listContent: {
    padding: 16,
    gap: 12,
    paddingBottom: 90
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    flexDirection: 'row',
    overflow: 'hidden',
    marginBottom: 8
  },
  cardThumb: {
    width: 90,
    height: 90,
    backgroundColor: '#e2e8f0'
  },
  cardBody: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between'
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
    flex: 1,
    marginRight: 8
  },
  statusBadge: {
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4
  },
  statusActive: {
    backgroundColor: '#dcfce7'
  },
  statusInactive: {
    backgroundColor: '#fee2e2'
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700'
  },
  statusTextActive: {
    color: '#166534'
  },
  statusTextInactive: {
    color: '#991b1b'
  },
  cardCategory: {
    fontSize: 12,
    color: '#2563eb',
    fontWeight: '600',
    marginTop: 2
  },
  fieldsPreviewRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 4
  },
  fieldTag: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4
  },
  fieldTagText: {
    fontSize: 10,
    color: '#475569',
    fontWeight: '600'
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 6
  },
  editBtn: {
    backgroundColor: '#eff6ff',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 6
  },
  editBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2563eb'
  },
  deleteBtn: {
    backgroundColor: '#fee2e2',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 6
  },
  deleteBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#b91c1c'
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    padding: 16
  },
  modalCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 18,
    maxHeight: '92%'
  },
  modalHeader: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 12
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
    marginTop: 10
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: '#0f172a'
  },
  sizePresetBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    marginRight: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  sizePresetBtnActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb'
  },
  sizePresetTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155'
  },
  sizePresetSub: {
    fontSize: 10,
    color: '#64748b'
  },
  sizePresetTextActive: {
    color: '#ffffff'
  },
  designerPreviewWrapper: {
    alignItems: 'center',
    marginVertical: 4
  },
  categoryPickerRow: {
    flexDirection: 'row',
    gap: 6,
    paddingVertical: 4
  },
  catOptionChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#f1f5f9'
  },
  catOptionChipActive: {
    backgroundColor: '#2563eb'
  },
  catOptionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569'
  },
  catOptionTextActive: {
    color: '#ffffff'
  },
  editableFieldsSection: {
    marginTop: 14,
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  fieldsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  fieldsSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a'
  },
  addFieldSmallBtn: {
    backgroundColor: '#eff6ff',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#bfdbfe'
  },
  addFieldSmallBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563eb'
  },
  noFieldsText: {
    fontSize: 12,
    color: '#94a3b8',
    fontStyle: 'italic',
    paddingVertical: 4
  },
  fieldsList: {
    gap: 8
  },
  elementRow: {
    backgroundColor: '#ffffff',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  elementRowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  elementRowLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
    flex: 1
  },
  badgeGroup: {
    flexDirection: 'row',
    gap: 6
  },
  lockBtn: {
    paddingVertical: 3,
    paddingHorizontal: 6,
    borderRadius: 4
  },
  lockActive: {
    backgroundColor: '#fee2e2'
  },
  lockInactive: {
    backgroundColor: '#dcfce7'
  },
  lockBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#334155'
  },
  removeFieldBtn: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    backgroundColor: '#fee2e2',
    borderRadius: 4
  },
  removeFieldBtnText: {
    color: '#b91c1c',
    fontSize: 11,
    fontWeight: '700'
  },
  elementRowSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2
  },
  layerControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderColor: '#f1f5f9'
  },
  layerLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600'
  },
  layerBtn: {
    backgroundColor: '#f1f5f9',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 4
  },
  layerBtnText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#334155'
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14
  },
  switchLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155'
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 18
  },
  cancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#f1f5f9'
  },
  cancelBtnText: {
    color: '#475569',
    fontWeight: '600'
  },
  saveBtn: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 8,
    backgroundColor: '#2563eb',
    minWidth: 110,
    alignItems: 'center'
  },
  saveBtnText: {
    color: '#ffffff',
    fontWeight: '700'
  },
  subModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    padding: 20
  },
  subModalCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    maxHeight: '85%'
  },
  subModalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 8
  },
  fieldLabelSmall: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginTop: 8,
    marginBottom: 4
  },
  typeSelectorRow: {
    flexDirection: 'row',
    gap: 6
  },
  typeBtn: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  typeBtnActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb'
  },
  typeBtnText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '600'
  },
  typeBtnTextActive: {
    color: '#ffffff',
    fontWeight: '700'
  },
  inputSmall: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 13,
    color: '#0f172a'
  },
  posChip: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: '#f1f5f9',
    marginRight: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  posChipActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb'
  },
  posChipText: {
    fontSize: 10,
    color: '#475569',
    fontWeight: '600'
  },
  posChipTextActive: {
    color: '#ffffff',
    fontWeight: '700'
  },
  switchRowSmall: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 3
  },
  switchLabelSmall: {
    fontSize: 12,
    color: '#334155',
    fontWeight: '600'
  },
  subModalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 12
  },
  confirmSubBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#2563eb',
    borderRadius: 8
  },
  confirmSubBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13
  },
  uploadPhoneBtn: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#3b82f6',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center'
  },
  uploadPhoneBtnText: {
    color: '#2563eb',
    fontWeight: '700',
    fontSize: 12
  },
  uploadPhoneBtnSmall: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#3b82f6',
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    alignItems: 'center'
  },
  uploadPhoneBtnSmallText: {
    color: '#2563eb',
    fontWeight: '700',
    fontSize: 11
  },
  socialConfigSection: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 12,
    marginVertical: 10
  },
  socialHeaderToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  toggleArrowText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2563eb'
  },
  socialConfigBody: {
    marginTop: 10
  },
  socialPlatformTabsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 10
  },
  socialPlatformTabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 6,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1'
  },
  socialPlatformTabBtnActive: {
    borderColor: '#2563eb',
    backgroundColor: '#eff6ff'
  },
  socialTabIconText: {
    fontSize: 12
  },
  socialPlatformTabText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569'
  },
  socialPlatformTabTextActive: {
    color: '#2563eb',
    fontWeight: '700'
  },
  platformFieldBox: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  socialTextInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    padding: 8,
    fontSize: 13,
    color: '#0f172a',
    minHeight: 65,
    textAlignVertical: 'top',
    marginBottom: 8
  },
  socialTagInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    padding: 8,
    fontSize: 12,
    color: '#0f172a'
  },
  charCountAdmin: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b'
  }
});
