import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from '../../i18n/I18nContext';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { getTemplates, Template } from '../../api/services/templateService';
import { BannerRenderer } from '../../components/banner/BannerRenderer';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const CATEGORIES = [
  'All',
  'Politics',
  'Festival',
  'Business',
  'Birthday',
  'Education',
  'Events',
  'Other'
] as const;

const SIZES = ['All', 'Portrait', 'Square', 'Story', 'Landscape'] as const;

type TemplatesScreenProps = {
  onSelectTemplate?: (template: Template) => void;
};

export function TemplatesScreen({ onSelectTemplate }: TemplatesScreenProps) {
  const { t } = useTranslation();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedSize, setSelectedSize] = useState<string>('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);

  const fetchTemplates = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getTemplates(selectedCategory, selectedSize);
      setTemplates(data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : t('unableLoadTemplates');
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, selectedSize]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const handleUseTemplate = (template: Template) => {
    setPreviewTemplate(null);
    if (onSelectTemplate) {
      onSelectTemplate(template);
    }
  };

  return (
    <View style={styles.container}>
      {/* Screen Title */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('templateLibrary')}</Text>
      </View>

      {/* Filter Selectors */}
      <View style={styles.filtersSection}>
        {/* Category Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <Pressable
                key={cat}
                style={[styles.chip, isSelected && styles.chipActive]}
                onPress={() => setSelectedCategory(cat)}
              >
                <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                  {cat}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Size Preset Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[styles.filterScroll, { marginTop: 6 }]}
        >
          <Text style={styles.sizeFilterLabel}>{t('size')}</Text>
          {SIZES.map((sz) => {
            const isSelected = selectedSize === sz;
            return (
              <Pressable
                key={sz}
                style={[styles.sizeChip, isSelected && styles.sizeChipActive]}
                onPress={() => setSelectedSize(sz)}
              >
                <Text style={[styles.sizeChipText, isSelected && styles.sizeChipTextActive]}>
                  {sz}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Main Content Area */}
      {loading ? (
        <View style={styles.stateContainer}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingText}>{t('loadingTemplates')}</Text>
        </View>
      ) : error ? (
        <View style={styles.stateContainer}>
          <Text style={styles.errorText}>{t('unableLoadTemplates')}</Text>
          <Pressable style={styles.retryButton} onPress={fetchTemplates}>
            <Text style={styles.retryButtonText}>{t('retry')}</Text>
          </Pressable>
        </View>
      ) : templates.length === 0 ? (
        <View style={styles.stateContainer}>
          <Text style={styles.emptyText}>{t('noTemplatesMatch')}</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.gridContent}>
          <View style={styles.grid}>
            {templates.map((tmpl) => {
              const preset = tmpl.canvas?.sizePreset || 'Portrait';

              return (
                <Pressable
                  key={tmpl.id}
                  style={styles.card}
                  onPress={() => setPreviewTemplate(tmpl)}
                >
                  <View style={styles.cardThumbBox}>
                    <Image
                      source={{ uri: tmpl.imageUrl }}
                      style={styles.cardImage}
                      resizeMode="cover"
                    />
                    <View style={styles.sizeBadge}>
                      <Text style={styles.sizeBadgeText}>{preset}</Text>
                    </View>
                  </View>

                  <View style={styles.cardInfo}>
                    <Text style={styles.cardCategory}>{tmpl.category}</Text>
                    <Text style={styles.cardTitle} numberOfLines={1}>
                      {tmpl.title}
                    </Text>
                    <Pressable
                      style={styles.useButton}
                      onPress={() => handleUseTemplate(tmpl)}
                    >
                      <Text style={styles.useButtonText}>{t('useTemplate')}</Text>
                    </Pressable>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
      )}

      {/* Template Preview Modal */}
      <Modal
        visible={Boolean(previewTemplate)}
        transparent
        animationType="fade"
        onRequestClose={() => setPreviewTemplate(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            {previewTemplate && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={styles.modalTitle}>{previewTemplate.title}</Text>
                <Text style={styles.modalCategory}>
                  {previewTemplate.category} • {previewTemplate.canvas?.sizePreset || 'Standard'} (
                  {previewTemplate.canvas?.width || 1080}×{previewTemplate.canvas?.height || 1350})
                </Text>

                {/* Unified Dynamic Banner Renderer */}
                <View style={styles.modalPreviewWrapper}>
                  <BannerRenderer
                    canvas={previewTemplate.canvas}
                    background={previewTemplate.background}
                    elements={previewTemplate.elements}
                    containerWidth={Math.min(SCREEN_WIDTH - 64, 340)}
                  />
                </View>

                <View style={styles.modalActions}>
                  <Pressable
                    style={styles.cancelButton}
                    onPress={() => setPreviewTemplate(null)}
                  >
                    <Text style={styles.cancelButtonText}>{t('close')}</Text>
                  </Pressable>
                  <Pressable
                    style={styles.confirmButton}
                    onPress={() => handleUseTemplate(previewTemplate)}
                  >
                    <Text style={styles.confirmButtonText}>{t('useTemplate')}</Text>
                  </Pressable>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc'
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderColor: '#e2e8f0'
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a'
  },
  filtersSection: {
    backgroundColor: '#ffffff',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: '#e2e8f0'
  },
  filterScroll: {
    paddingHorizontal: 16,
    gap: 6,
    alignItems: 'center'
  },
  sizeFilterLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
    marginRight: 4
  },
  chip: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: '#f1f5f9'
  },
  chipActive: {
    backgroundColor: '#2563eb'
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569'
  },
  chipTextActive: {
    color: '#ffffff',
    fontWeight: '700'
  },
  sizeChip: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  sizeChipActive: {
    backgroundColor: '#eff6ff',
    borderColor: '#2563eb'
  },
  sizeChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b'
  },
  sizeChipTextActive: {
    color: '#2563eb',
    fontWeight: '700'
  },
  stateContainer: {
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
  gridContent: {
    padding: 16,
    paddingBottom: 90
  },
  grid: {
    gap: 14
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2
  },
  cardThumbBox: {
    height: 160,
    backgroundColor: '#0f172a',
    position: 'relative'
  },
  cardImage: {
    width: '100%',
    height: '100%'
  },
  sizeBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6
  },
  sizeBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700'
  },
  cardInfo: {
    padding: 14
  },
  cardCategory: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563eb',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 10
  },
  useButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center'
  },
  useButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '90%',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 18
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a'
  },
  modalCategory: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
    marginTop: 2,
    marginBottom: 12
  },
  modalPreviewWrapper: {
    alignItems: 'center',
    marginVertical: 6
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center'
  },
  cancelButtonText: {
    color: '#475569',
    fontWeight: '700',
    fontSize: 14
  },
  confirmButton: {
    flex: 2,
    backgroundColor: '#2563eb',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center'
  },
  confirmButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14
  }
});
