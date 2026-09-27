import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AuthUser } from '../../api/services/authService';
import { useTranslation } from '../../i18n/I18nContext';

type HomeScreenProps = {
  user: AuthUser;
  onNavigate: (tabKey: string) => void;
};

export function HomeScreen({ user, onNavigate }: HomeScreenProps) {
  const { t } = useTranslation();
  const getRoleBadgeStyle = () => {
    switch (user.role) {
      case 'SUPER_ADMIN':
        return { bg: '#fef3c7', text: '#b45309', border: '#fde68a', label: t('superAdministrator') };
      case 'ADMIN':
        return { bg: '#ede9fe', text: '#6d28d9', border: '#ddd6fe', label: t('administrator') };
      default:
        return { bg: '#e0f2fe', text: '#0369a1', border: '#bae6fd', label: t('standardUser') };
    }
  };

  const badge = getRoleBadgeStyle();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Welcome Banner Card */}
      <View style={styles.welcomeCard}>
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.greeting}>{t('welcomeBack')}</Text>
            <Text style={styles.userName}>{user.name}</Text>
          </View>
          <View style={[styles.roleBadge, { backgroundColor: badge.bg, borderColor: badge.border }]}>
            <Text style={[styles.roleBadgeText, { color: badge.text }]}>{user.role}</Text>
          </View>
        </View>

        <Text style={styles.roleDescription}>{t('signedInWith', { role: t(user.role === 'SUPER_ADMIN' ? 'superAdministrator' : user.role === 'ADMIN' ? 'administrator' : 'standardUser') })}</Text>
      </View>

      {/* Permissions & Quick Access Section */}
      <Text style={styles.sectionTitle}>{t('availableModules')}</Text>

      <View style={styles.grid}>
        <Pressable style={styles.actionCard} onPress={() => onNavigate('templates')}>
          <View style={[styles.cardIconBox, { backgroundColor: '#e0e7ff' }]}>
            <Text style={styles.cardIcon}>🎨</Text>
          </View>
          <Text style={styles.cardTitle}>{t('browseTemplates')}</Text>
          <Text style={styles.cardSubtitle}>{t('exploreDesigns')}</Text>
          <Text style={styles.accessTag}>{t('allUsers')}</Text>
        </Pressable>

        <Pressable style={styles.actionCard} onPress={() => onNavigate('banners')}>
          <View style={[styles.cardIconBox, { backgroundColor: '#dcfce7' }]}>
            <Text style={styles.cardIcon}>🖼️</Text>
          </View>
          <Text style={styles.cardTitle}>{t('myBanners')}</Text>
          <Text style={styles.cardSubtitle}>{t('viewOrganizeBanners')}</Text>
          <Text style={styles.accessTag}>{t('allUsers')}</Text>
        </Pressable>

        {(user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') && (
          <>
            <Pressable style={styles.actionCard} onPress={() => onNavigate('manage-templates')}>
              <View style={[styles.cardIconBox, { backgroundColor: '#fef3c7' }]}>
                <Text style={styles.cardIcon}>⚙️</Text>
              </View>
              <Text style={styles.cardTitle}>{t('manageTemplates')}</Text>
              <Text style={styles.cardSubtitle}>{t('addEditRemoveTemplates')}</Text>
              <Text style={[styles.accessTag, { color: '#b45309', backgroundColor: '#fef3c7' }]}>{t('adminAccess')}</Text>
            </Pressable>

            <Pressable style={styles.actionCard} onPress={() => onNavigate('categories')}>
              <View style={[styles.cardIconBox, { backgroundColor: '#fae8ff' }]}>
                <Text style={styles.cardIcon}>📂</Text>
              </View>
              <Text style={styles.cardTitle}>{t('categories')}</Text>
              <Text style={styles.cardSubtitle}>{t('manageCategoryTaxonomy')}</Text>
              <Text style={[styles.accessTag, { color: '#86198f', backgroundColor: '#fae8ff' }]}>{t('adminAccess')}</Text>
            </Pressable>
          </>
        )}

        {user.role === 'SUPER_ADMIN' && (
          <Pressable style={styles.actionCard} onPress={() => onNavigate('users')}>
            <View style={[styles.cardIconBox, { backgroundColor: '#fee2e2' }]}>
              <Text style={styles.cardIcon}>👥</Text>
            </View>
            <Text style={styles.cardTitle}>{t('userManagement')}</Text>
            <Text style={styles.cardSubtitle}>{t('assignRolesStatuses')}</Text>
            <Text style={[styles.accessTag, { color: '#b91c1c', backgroundColor: '#fee2e2' }]}>{t('superAdmin')}</Text>
          </Pressable>
        )}

        <Pressable style={styles.actionCard} onPress={() => onNavigate('profile')}>
          <View style={[styles.cardIconBox, { backgroundColor: '#f3f4f6' }]}>
            <Text style={styles.cardIcon}>👤</Text>
          </View>
          <Text style={styles.cardTitle}>{t('profileAccount')}</Text>
          <Text style={styles.cardSubtitle}>{t('manageSessionCredentials')}</Text>
          <Text style={styles.accessTag}>{t('allUsers')}</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc'
  },
  content: {
    padding: 20,
    paddingBottom: 90
  },
  welcomeCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12
  },
  greeting: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500'
  },
  userName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 2
  },
  roleBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1
  },
  roleBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5
  },
  roleDescription: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 14
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12
  },
  actionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 16,
    width: '48%',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
    minHeight: 160,
    justifyContent: 'space-between'
  },
  cardIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12
  },
  cardIcon: {
    fontSize: 22
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 4
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#64748b',
    lineHeight: 16,
    flex: 1
  },
  accessTag: {
    marginTop: 10,
    fontSize: 11,
    fontWeight: '600',
    color: '#2563eb',
    backgroundColor: '#eff6ff',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 6,
    alignSelf: 'flex-start'
  }
});
