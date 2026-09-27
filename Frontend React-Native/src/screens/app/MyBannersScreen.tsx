import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from '../../i18n/I18nContext';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { AuthUser } from '../../api/services/authService';
import { Banner, deleteBanner, getBanners } from '../../api/services/bannerService';
import { BannerRenderer } from '../../components/banner/BannerRenderer';
import { ShareBannerScreen } from './ShareBannerScreen';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type MyBannersScreenProps = {
  user: AuthUser;
  onNavigateToTemplates?: () => void;
};

export function MyBannersScreen({ user, onNavigateToTemplates }: MyBannersScreenProps) {
  const { t } = useTranslation();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeBanner, setActiveBanner] = useState<Banner | null>(null);
  const [sharingBanner, setSharingBanner] = useState<Banner | null>(null);

  const fetchBanners = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getBanners();
      setBanners(data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : t('unableLoadBanners');
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBanners();
  }, [fetchBanners]);

  const handleDelete = (banner: Banner) => {
    const title = banner.title || banner.mainText || 'this banner';
    Alert.alert(t('deleteBanner'), `Are you sure you want to delete "${title}"?`, [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('delete'),
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteBanner(banner.id);
            setBanners((prev) => prev.filter((b) => b.id !== banner.id));
            if (activeBanner?.id === banner.id) {
              setActiveBanner(null);
            }
            Alert.alert(t('deleted'), t('bannerDeleted'));
          } catch (err) {
            const msg = err instanceof Error ? err.message : 'Failed to delete banner.';
            Alert.alert(t('error'), msg);
          }
        }
      }
    ]);
  };

  if (sharingBanner) {
    return (
      <ShareBannerScreen
        banner={sharingBanner}
        onBack={() => setSharingBanner(null)}
      />
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>{t('myBanners')}</Text>
          <Text style={styles.subtitle}>Saved custom designs for {user.name}</Text>
        </View>
        {onNavigateToTemplates ? (
          <Pressable style={styles.newBtn} onPress={onNavigateToTemplates}>
            <Text style={styles.newBtnText}>{t('newBanner')}</Text>
          </Pressable>
        ) : null}
      </View>

      {/* Main Content Area */}
      {loading ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingText}>{t('loadingBanners')}</Text>
        </View>
      ) : error ? (
        <View style={styles.centerState}>
          <Text style={styles.errorText}>{t('unableLoadBanners')}</Text>
          <Pressable style={styles.retryBtn} onPress={fetchBanners}>
            <Text style={styles.retryBtnText}>{t('retry')}</Text>
          </Pressable>
        </View>
      ) : banners.length === 0 ? (
        <View style={styles.centerState}>
          <Text style={styles.emptyTitle}>{t('noBanners')}</Text>
          <Text style={styles.emptySubtitle}>
            Choose a template from the library to customize and save your first banner!
          </Text>
          {onNavigateToTemplates ? (
            <Pressable style={styles.createBtn} onPress={onNavigateToTemplates}>
              <Text style={styles.createBtnText}>{t('createBanner')}</Text>
            </Pressable>
          ) : null}
        </View>
      ) : (
        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.bannerGrid}>
            {banners.map((item) => {
              const formattedDate = item.createdAt
                ? new Date(item.createdAt).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })
                : 'Recently';

              const mainDisplay =
                item.title ||
                item.elements?.find((e) => e.type === 'text')?.content ||
                item.mainText ||
                'Custom Banner';

              const category = item.template?.category || 'Custom';
              const cardCanvasWidth = Math.min(SCREEN_WIDTH - 48, 340);

              return (
                <Pressable
                  key={item.id}
                  style={styles.bannerCard}
                  onPress={() => setActiveBanner(item)}
                >
                  <View style={styles.cardPreviewBox}>
                    <BannerRenderer
                      canvas={item.canvas}
                      background={item.background}
                      elements={item.elements || []}
                      containerWidth={cardCanvasWidth}
                    />
                  </View>

                  <View style={styles.cardFooter}>
                    <View style={{ flex: 1, marginRight: 8 }}>
                      <Text style={styles.cardCategory}>{category}</Text>
                      <Text style={styles.cardMainTitle} numberOfLines={1}>
                        {mainDisplay}
                      </Text>
                      <Text style={styles.cardDate}>Created {formattedDate}</Text>
                    </View>

                    <View style={styles.cardActionsRow}>
                      <Pressable
                        style={styles.cardShareBtn}
                        onPress={(e) => {
                          e.stopPropagation?.();
                          setSharingBanner(item);
                        }}
                      >
                        <Text style={styles.cardShareBtnText}>🚀 Share</Text>
                      </Pressable>
                      <Pressable
                        style={styles.deleteBtn}
                        onPress={(e) => {
                          e.stopPropagation?.();
                          handleDelete(item);
                        }}
                      >
                        <Text style={styles.deleteBtnText}>🗑️</Text>
                      </Pressable>
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
      )}

      {/* Banner Preview Detail Modal */}
      <Modal
        visible={Boolean(activeBanner)}
        transparent
        animationType="fade"
        onRequestClose={() => setActiveBanner(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            {activeBanner && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={styles.modalTitle}>{activeBanner.title || t('bannerPreview')}</Text>
                <Text style={styles.modalCategory}>
                  {activeBanner.template?.category || 'Custom'} •{' '}
                  {activeBanner.canvas?.sizePreset || 'Standard'} ({activeBanner.canvas?.width || 1080}×
                  {activeBanner.canvas?.height || 1350})
                </Text>

                <View style={styles.modalRendererWrapper}>
                  <BannerRenderer
                    canvas={activeBanner.canvas}
                    background={activeBanner.background}
                    elements={activeBanner.elements || []}
                    containerWidth={Math.min(SCREEN_WIDTH - 64, 340)}
                  />
                </View>

                <View style={styles.modalDetails}>
                  {activeBanner.template?.title ? (
                    <Text style={styles.modalTemplateName}>
                      Template: {activeBanner.template.title}
                    </Text>
                  ) : null}
                  <Text style={styles.modalDate}>
                    Saved on: {new Date(activeBanner.createdAt).toLocaleString()}
                  </Text>
                </View>

                <View style={styles.modalActions}>
                  <Pressable
                    style={styles.modalDeleteBtn}
                    onPress={() => handleDelete(activeBanner)}
                  >
                    <Text style={styles.modalDeleteBtnText}>{t('delete')}</Text>
                  </Pressable>
                  <Pressable
                    style={styles.modalShareBtn}
                    onPress={() => {
                      const bannerToShare = activeBanner;
                      setActiveBanner(null);
                      setSharingBanner(bannerToShare);
                    }}
                  >
                    <Text style={styles.modalShareBtnText}>🚀 Share</Text>
                  </Pressable>
                  <Pressable
                    style={styles.modalCloseBtn}
                    onPress={() => setActiveBanner(null)}
                  >
                    <Text style={styles.modalCloseBtnText}>{t('close')}</Text>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderColor: '#e2e8f0'
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a'
  },
  subtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2
  },
  newBtn: {
    backgroundColor: '#2563eb',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10
  },
  newBtnText: {
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
  retryBtn: {
    backgroundColor: '#2563eb',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 8
  },
  retryBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 6
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    maxWidth: 280,
    marginBottom: 18,
    lineHeight: 20
  },
  createBtn: {
    backgroundColor: '#2563eb',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10
  },
  createBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14
  },
  scrollArea: {
    flex: 1
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 90
  },
  bannerGrid: {
    gap: 16
  },
  bannerCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    padding: 10
  },
  cardPreviewBox: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    overflow: 'hidden'
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    paddingHorizontal: 4
  },
  cardCategory: {
    fontSize: 10,
    fontWeight: '700',
    color: '#2563eb',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2
  },
  cardMainTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 2
  },
  cardDate: {
    fontSize: 11,
    color: '#64748b'
  },
  cardActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  cardShareBtn: {
    backgroundColor: '#eff6ff',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bfdbfe'
  },
  cardShareBtnText: {
    color: '#2563eb',
    fontSize: 12,
    fontWeight: '700'
  },
  deleteBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#fee2e2'
  },
  deleteBtnText: {
    fontSize: 14
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
    fontWeight: '600',
    color: '#64748b',
    marginTop: 2,
    marginBottom: 10
  },
  modalRendererWrapper: {
    alignItems: 'center',
    marginVertical: 4
  },
  modalDetails: {
    marginVertical: 10
  },
  modalTemplateName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 2
  },
  modalDate: {
    fontSize: 11,
    color: '#64748b'
  },
  modalActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6
  },
  modalDeleteBtn: {
    flex: 1,
    backgroundColor: '#fee2e2',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center'
  },
  modalDeleteBtnText: {
    color: '#b91c1c',
    fontWeight: '700',
    fontSize: 13
  },
  modalShareBtn: {
    flex: 1.5,
    backgroundColor: '#2563eb',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center'
  },
  modalShareBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13
  },
  modalCloseBtn: {
    flex: 1,
    backgroundColor: '#0f172a',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center'
  },
  modalCloseBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13
  }
});
