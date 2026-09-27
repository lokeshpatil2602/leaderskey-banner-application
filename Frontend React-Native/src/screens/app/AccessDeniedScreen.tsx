import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AuthUserRole } from '../../api/services/authService';
import { useTranslation } from '../../i18n/I18nContext';

type AccessDeniedScreenProps = {
  userRole?: AuthUserRole;
  onNavigateHome?: () => void;
};

export function AccessDeniedScreen({ userRole, onNavigateHome }: AccessDeniedScreenProps) {
  const { t } = useTranslation();
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.iconCircle}>
          <Text style={styles.iconText}>⛔</Text>
        </View>

        <Text style={styles.title}>{t('accessDenied')}</Text>
        <Text style={styles.message}>{t('noPermission')}</Text>

        {userRole ? (
          <View style={styles.roleBox}>
            <Text style={styles.roleLabel}>{t('currentRole')}</Text>
            <Text style={styles.roleValue}>{userRole}</Text>
          </View>
        ) : null}

        {onNavigateHome ? (
          <Pressable style={styles.button} onPress={onNavigateHome}>
            <Text style={styles.buttonText}>{t('returnHome')}</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24
  },
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    width: '100%',
    maxWidth: 420,
    borderWidth: 1,
    borderColor: '#334155',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8
  },
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20
  },
  iconText: {
    fontSize: 32
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#f8fafc',
    marginBottom: 10
  },
  message: {
    fontSize: 15,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24
  },
  roleBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 24
  },
  roleLabel: {
    fontSize: 13,
    color: '#64748b',
    marginRight: 6
  },
  roleValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#f59e0b'
  },
  button: {
    backgroundColor: '#3b82f6',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 28,
    width: '100%',
    alignItems: 'center'
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700'
  }
});
