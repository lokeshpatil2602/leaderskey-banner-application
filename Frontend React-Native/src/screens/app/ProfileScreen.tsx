import React, { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { apiRequest } from '../../api/client';
import { AuthUser } from '../../api/services/authService';
import { getAuthToken } from '../../utils/tokenStorage';
import { Language, useTranslation } from '../../i18n/I18nContext';

type ProfileScreenProps = {
  user: AuthUser;
  onLogout: () => Promise<void>;
};

export function ProfileScreen({ user, onLogout }: ProfileScreenProps) {
  const { t, language, setLanguage } = useTranslation();
  const [testingApi, setTestingApi] = useState(false);
  const [testResult, setTestResult] = useState<{
    endpoint: string;
    status: 'success' | 'forbidden' | 'error';
    message: string;
  } | null>(null);

  const getRoleBadgeStyle = () => {
    switch (user.role) {
      case 'SUPER_ADMIN':
        return { bg: '#fef3c7', text: '#b45309', label: t('superAdministrator') };
      case 'ADMIN':
        return { bg: '#ede9fe', text: '#6d28d9', label: t('administrator') };
      default:
        return { bg: '#e0f2fe', text: '#0369a1', label: t('standardUser') };
    }
  };

  const badge = getRoleBadgeStyle();

  const handleTestApi = async (endpoint: string, method = 'GET') => {
    try {
      setTestingApi(true);
      setTestResult(null);
      const token = await getAuthToken();
      const response = await apiRequest<{ message: string; success: boolean }>(endpoint, {
        method,
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setTestResult({
        endpoint,
        status: 'success',
        message: `200 OK: ${response.message || t('accessGranted')}`
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : t('requestFailed');
      const isForbidden = msg.toLowerCase().includes('denied') || msg.includes('403');
      setTestResult({
        endpoint,
        status: isForbidden ? 'forbidden' : 'error',
        message: msg
      });
    } finally {
      setTestingApi(false);
    }
  };

  const handleLogoutConfirm = () => {
    Alert.alert(t('signOut'), t('confirmLogout'), [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('logout'),
        style: 'destructive',
        onPress: () => onLogout()
      }
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Profile Card */}
      <View style={styles.profileCard}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>{user.name ? user.name.charAt(0).toUpperCase() : 'U'}</Text>
        </View>

        <Text style={styles.userName}>{user.name}</Text>
        <Text style={styles.userEmail}>{user.email}</Text>

        <View style={[styles.roleBadge, { backgroundColor: badge.bg }]}>
          <Text style={[styles.roleBadgeText, { color: badge.text }]}>{user.role}</Text>
        </View>
      </View>

      {/* Account Details */}
      <View style={styles.detailsCard}>
        <Text style={styles.cardHeader}>{t('accountInformation')}</Text>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>{t('userId')}</Text>
          <Text style={styles.infoValue} numberOfLines={1}>
            {user.id}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>{t('roleType')}</Text>
          <Text style={[styles.infoValue, { fontWeight: '700' }]}>{badge.label}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>{t('accountStatus')}</Text>
          <Text style={[styles.infoValue, { color: user.isActive ? '#16a34a' : '#dc2626' }]}>
            {user.isActive ? t('active') : t('inactive')}
          </Text>
        </View>

        <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
          <Text style={styles.infoLabel}>{t('security')}</Text>
          <Text style={styles.infoValue}>{t('jwtAuthenticated')}</Text>
        </View>
      </View>

      {/* API Authorization Tester Card (Super Admin Only) */}
      {user.role === 'SUPER_ADMIN' ? (
        <View style={styles.detailsCard}>
          <Text style={styles.cardHeader}>{t('testRoleAuthorization')}</Text>
          <Text style={styles.testDesc}>
            Test API access with your current role ({user.role}):
          </Text>

          <View style={styles.buttonGroup}>
            <Pressable
              style={[styles.testBtn, { backgroundColor: '#eff6ff' }]}
              onPress={() => handleTestApi('/templates')}
              disabled={testingApi}
            >
              <Text style={[styles.testBtnText, { color: '#2563eb' }]}>{t('apiGetTemplates')}</Text>
            </Pressable>

            <Pressable
              style={[styles.testBtn, { backgroundColor: '#fef3c7' }]}
              onPress={() => handleTestApi('/templates', 'POST')}
              disabled={testingApi}
            >
              <Text style={[styles.testBtnText, { color: '#b45309' }]}>{t('apiPostTemplates')}</Text>
            </Pressable>

            <Pressable
              style={[styles.testBtn, { backgroundColor: '#fee2e2' }]}
              onPress={() => handleTestApi('/users')}
              disabled={testingApi}
            >
              <Text style={[styles.testBtnText, { color: '#b91c1c' }]}>{t('apiGetUsers')}</Text>
            </Pressable>
          </View>

          {testingApi ? (
            <View style={styles.testLoading}>
              <ActivityIndicator size="small" color="#2563eb" />
              <Text style={styles.testLoadingText}>{t('testingEndpoint')}</Text>
            </View>
          ) : null}

          {testResult ? (
            <View
              style={[
                styles.testResultBox,
                testResult.status === 'success'
                  ? styles.resultSuccess
                  : testResult.status === 'forbidden'
                  ? styles.resultForbidden
                  : styles.resultError
              ]}
            >
              <Text style={styles.resultTitle}>
                {testResult.status === 'success'
                  ? '✅ Permitted'
                  : testResult.status === 'forbidden'
                  ? '⛔ 403 Forbidden (Protected)'
                  : '❌ Request Error'}
              </Text>
              <Text style={styles.resultDetails}>{testResult.message}</Text>
            </View>
          ) : null}
        </View>
      ) : null}

      <View style={styles.detailsCard}>
        <Text style={styles.cardHeader}>{t('settings')}</Text>
        <Text style={styles.testDesc}>{t('language')}</Text>
        <View style={styles.buttonGroup}>
          {([
            ['en', t('english')],
            ['mr', t('marathi')],
            ['hin', t('hindi')]
          ] as const).map(([value, label]) => (
            <Pressable
              key={value}
              style={[styles.testBtn, language === value && styles.languageSelected]}
              onPress={() => setLanguage(value as Language)}
            >
              <Text style={[styles.testBtnText, language === value && styles.languageSelectedText]}>{label}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Logout Button */}
      <Pressable style={styles.logoutBtn} onPress={handleLogoutConfirm}>
        <Text style={styles.logoutBtnText}>{t('logOut')}</Text>
      </Pressable>
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
  profileCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2
  },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12
  },
  avatarText: {
    fontSize: 30,
    fontWeight: '800',
    color: '#ffffff'
  },
  userName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 4
  },
  userEmail: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 12
  },
  roleBadge: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 999
  },
  roleBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5
  },
  detailsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1
  },
  cardHeader: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 12
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: '#f1f5f9'
  },
  infoLabel: {
    fontSize: 13,
    color: '#64748b'
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0f172a',
    maxWidth: '60%'
  },
  testDesc: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 12
  },
  buttonGroup: {
    gap: 8,
    marginBottom: 12
  },
  testBtn: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  testBtnText: {
    fontSize: 13,
    fontWeight: '700'
  },
  languageSelected: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb'
  },
  languageSelectedText: {
    color: '#ffffff'
  },
  testLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8
  },
  testLoadingText: {
    fontSize: 13,
    color: '#64748b'
  },
  testResultBox: {
    padding: 12,
    borderRadius: 12,
    marginTop: 8
  },
  resultSuccess: {
    backgroundColor: '#dcfce7',
    borderColor: '#bbf7d0',
    borderWidth: 1
  },
  resultForbidden: {
    backgroundColor: '#fee2e2',
    borderColor: '#fecaca',
    borderWidth: 1
  },
  resultError: {
    backgroundColor: '#fef3c7',
    borderColor: '#fde68a',
    borderWidth: 1
  },
  resultTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 2
  },
  resultDetails: {
    fontSize: 12,
    color: '#334155'
  },
  logoutBtn: {
    backgroundColor: '#fee2e2',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8
  },
  logoutBtnText: {
    color: '#b91c1c',
    fontWeight: '700',
    fontSize: 15
  }
});
