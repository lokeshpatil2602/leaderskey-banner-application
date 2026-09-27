import * as Clipboard from 'expo-clipboard';
import { useTranslation } from '../../i18n/I18nContext';
import * as Sharing from 'expo-sharing';
import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';
import ViewShot, { captureRef } from 'react-native-view-shot';
import { Banner } from '../../api/services/bannerService';
import { SocialPlatform } from '../../api/services/templateService';
import { BannerRenderer } from '../../components/banner/BannerRenderer';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type ShareBannerScreenProps = {
  banner: Banner;
  onBack: () => void;
};

const PLATFORMS: { key: SocialPlatform; label: string; icon: string; maxChars?: number }[] = [
  { key: 'facebook', label: 'Facebook', icon: '📘' },
  { key: 'instagram', label: 'Instagram', icon: '📸' },
  { key: 'x', label: 'X', icon: '𝕏', maxChars: 280 },
  { key: 'threads', label: 'Threads', icon: '🧵', maxChars: 500 }
];

export function ShareBannerScreen({ banner, onBack }: ShareBannerScreenProps) {
  const { t } = useTranslation();
  const [selectedPlatform, setSelectedPlatform] = useState<SocialPlatform>('facebook');
  const viewShotRef = useRef<React.ElementRef<typeof ViewShot>>(null);

  // Initialize platform content state from template defaults (Optional caption & hashtags)
  const templateSocial = banner.template?.socialContent;

  const [platformContent, setPlatformContent] = useState<
    Record<SocialPlatform, { caption: string; hashtags: string }>
  >({
    facebook: {
      caption: templateSocial?.facebook?.caption || '',
      hashtags: (templateSocial?.facebook?.hashtags || []).join(' ')
    },
    instagram: {
      caption: templateSocial?.instagram?.caption || '',
      hashtags: (templateSocial?.instagram?.hashtags || []).join(' ')
    },
    x: {
      caption: templateSocial?.x?.caption || '',
      hashtags: (templateSocial?.x?.hashtags || []).join(' ')
    },
    threads: {
      caption: templateSocial?.threads?.caption || '',
      hashtags: (templateSocial?.threads?.hashtags || []).join(' ')
    }
  });

  const [sharing, setSharing] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  const currentContent = platformContent[selectedPlatform];
  const activePlatformConfig = PLATFORMS.find((p) => p.key === selectedPlatform);

  const handleUpdateCaption = (text: string) => {
    setPlatformContent((prev) => ({
      ...prev,
      [selectedPlatform]: {
        ...prev[selectedPlatform],
        caption: text
      }
    }));
  };

  const handleUpdateHashtags = (text: string) => {
    setPlatformContent((prev) => ({
      ...prev,
      [selectedPlatform]: {
        ...prev[selectedPlatform],
        hashtags: text
      }
    }));
  };

  const formattedShareMessage = [currentContent.caption.trim(), currentContent.hashtags.trim()]
    .filter(Boolean)
    .join('\n\n');

  const currentChars = formattedShareMessage.length;
  const maxLimit = activePlatformConfig?.maxChars;
  const isOverLimit = maxLimit ? currentChars > maxLimit : false;

  const handleCopyCaption = async () => {
    if (!formattedShareMessage) {
      Alert.alert(t('info'), t('emptyCaptionHashtags'));
      return;
    }
    await Clipboard.setStringAsync(formattedShareMessage);
    setCopyFeedback('Copied to clipboard! 📋');
    setTimeout(() => setCopyFeedback(null), 2500);
  };

  /**
   * Captures the full-resolution banner preview and invokes the native sharing mechanism
   */
  const handleShareImage = async () => {
    if (!viewShotRef.current) {
      Alert.alert(t('error'), t('previewNotReady'));
      return;
    }

    try {
      setSharing(true);

      // 1. Capture the exact BannerRenderer view as a high-quality PNG
      const capturedUri = await captureRef(viewShotRef, {
        format: 'png',
        quality: 1.0,
        result: 'tmpfile'
      });

      if (!capturedUri) {
        throw new Error('Failed to generate banner image.');
      }

      // 2. If caption/hashtags exist, auto-copy to clipboard for quick paste in target app
      if (formattedShareMessage) {
        await Clipboard.setStringAsync(formattedShareMessage);
      }

      // 3. Verify native sharing support
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert(
          'Sharing Unavailable',
          'Native sharing is not supported on this device/environment. The image was captured: ' +
            capturedUri
        );
        return;
      }

      // 4. Open native share sheet with the generated image file
      await Sharing.shareAsync(capturedUri, {
        mimeType: 'image/png',
        dialogTitle: `Share Banner (${activePlatformConfig?.label || 'Social'})`,
        UTI: 'public.png'
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unable to share banner image.';
      Alert.alert(t('shareFailed'), msg);
    } finally {
      setSharing(false);
    }
  };

  const previewWidth = Math.min(SCREEN_WIDTH - 48, 340);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Top Header */}
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={onBack}>
          <Text style={styles.backBtnText}>← Back</Text>
        </Pressable>
        <Text style={styles.headerTitle}>{t('shareBanner')}</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Banner Preview at Top (Captured directly by ViewShot) */}
        <View style={styles.previewCard}>
          <Text style={styles.sectionHeader}>{t('exportReadyImage')}</Text>
          <View style={styles.previewWrapper}>
            <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 1.0 }}>
              <BannerRenderer
                canvas={banner.canvas}
                background={banner.background}
                elements={banner.elements || []}
                containerWidth={previewWidth}
                showBadge={false}
                showBorder={false}
                cleanExport={true}
              />
            </ViewShot>
          </View>
        </View>

        {/* Platform Selection */}
        <View style={styles.platformSection}>
          <Text style={styles.sectionHeader}>{t('targetPlatform')}</Text>
          <View style={styles.platformTabsRow}>
            {PLATFORMS.map((p) => {
              const isSelected = selectedPlatform === p.key;
              return (
                <Pressable
                  key={p.key}
                  style={[styles.platformTab, isSelected && styles.platformTabActive]}
                  onPress={() => setSelectedPlatform(p.key)}
                >
                  <Text style={styles.platformIcon}>{p.icon}</Text>
                  <Text style={[styles.platformLabel, isSelected && styles.platformLabelActive]}>
                    {p.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Platform-Specific Content (Caption & Hashtags Optional) */}
        <View style={styles.contentCard}>
          <View style={styles.formHeaderRow}>
            <Text style={styles.formPlatformTitle}>
              {activePlatformConfig?.icon} {activePlatformConfig?.label} Post Details (Optional)
            </Text>
            {maxLimit ? (
              <Text
                style={[
                  styles.charCountText,
                  isOverLimit && styles.charCountOverLimit
                ]}
              >
                {currentChars} / {maxLimit}
              </Text>
            ) : (
              <Text style={styles.charCountText}>{currentChars} chars</Text>
            )}
          </View>

          {/* Caption */}
          <Text style={styles.inputLabel}>{t('captionOptional')}</Text>
          <TextInput
            style={styles.captionInput}
            multiline
            numberOfLines={3}
            value={currentContent.caption}
            onChangeText={handleUpdateCaption}
            placeholder={`Enter ${activePlatformConfig?.label} caption...`}
            placeholderTextColor="#94a3b8"
          />

          {/* Hashtags */}
          <Text style={styles.inputLabel}>{t('hashtagsOptional')}</Text>
          <TextInput
            style={styles.hashtagsInput}
            value={currentContent.hashtags}
            onChangeText={handleUpdateHashtags}
            placeholder={t('hashtagsPlaceholder')}
            placeholderTextColor="#94a3b8"
          />

          {/* Quick Copy Action */}
          {formattedShareMessage ? (
            <Pressable style={styles.copyBtn} onPress={handleCopyCaption}>
              <Text style={styles.copyBtnText}>
                {copyFeedback ? `✓ ${copyFeedback}` : '📋 Copy Caption & Hashtags'}
              </Text>
            </Pressable>
          ) : null}
        </View>

        {/* Primary Action Buttons */}
        <View style={styles.actionsContainer}>
          {/* Share Image with System / App Share Sheet */}
          <Pressable
            style={[styles.primaryShareBtn, sharing && { opacity: 0.7 }]}
            onPress={handleShareImage}
            disabled={sharing}
          >
            {sharing ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text style={styles.primaryShareBtnText}>
                🖼️ Share Banner Image ({activePlatformConfig?.label})
              </Text>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderColor: '#e2e8f0'
  },
  backBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#f1f5f9'
  },
  backBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155'
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a'
  },
  scrollArea: {
    flex: 1
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 110
  },
  previewCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
    alignSelf: 'flex-start'
  },
  previewWrapper: {
    alignItems: 'center',
    justifyContent: 'center'
  },
  platformSection: {
    marginBottom: 16
  },
  platformTabsRow: {
    flexDirection: 'row',
    gap: 8
  },
  platformTab: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#e2e8f0'
  },
  platformTabActive: {
    borderColor: '#2563eb',
    backgroundColor: '#eff6ff'
  },
  platformIcon: {
    fontSize: 20,
    marginBottom: 2
  },
  platformLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569'
  },
  platformLabelActive: {
    color: '#2563eb',
    fontWeight: '700'
  },
  contentCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16
  },
  formHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderColor: '#f1f5f9',
    paddingBottom: 8
  },
  formPlatformTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a'
  },
  charCountText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b'
  },
  charCountOverLimit: {
    color: '#dc2626',
    fontWeight: '800'
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
    marginTop: 6
  },
  captionInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: '#0f172a',
    minHeight: 75,
    textAlignVertical: 'top'
  },
  hashtagsInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    padding: 10,
    fontSize: 13,
    color: '#0f172a'
  },
  copyBtn: {
    marginTop: 12,
    backgroundColor: '#f1f5f9',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  copyBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2563eb'
  },
  actionsContainer: {
    gap: 10,
    marginTop: 4
  },
  primaryShareBtn: {
    backgroundColor: '#2563eb',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: '#2563eb',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4
  },
  primaryShareBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700'
  }
});
