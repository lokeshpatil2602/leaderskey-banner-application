import React from 'react';
import { useTranslation } from '../../i18n/I18nContext';
import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { AuthUser } from '../../api/services/authService';

type AuthenticatedScreenProps = {
  user: AuthUser;
  onLogout: () => Promise<void>;
};

export function AuthenticatedScreen({ user, onLogout }: AuthenticatedScreenProps) {
  const { t } = useTranslation();
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>{t('authenticated')}</Text>
        <Text style={styles.subTitle}>{t('welcomeName', { name: user.name })}</Text>
        <Text style={styles.meta}>{t('emailLabel')} {user.email}</Text>
        <Text style={styles.meta}>{t('roleLabel')} {user.role}</Text>

        <Pressable style={styles.button} onPress={onLogout}>
          <Text style={styles.buttonText}>{t('logout')}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#f3f4f6'
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8
  },
  subTitle: {
    fontSize: 18,
    color: '#111827',
    marginBottom: 16
  },
  meta: {
    fontSize: 15,
    color: '#374151',
    marginBottom: 8
  },
  button: {
    marginTop: 20,
    backgroundColor: '#dc2626',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center'
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: '700'
  }
});
