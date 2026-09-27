import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTranslation } from '../../i18n/I18nContext';

type LoginScreenProps = {
  onLogin: (email: string, password: string) => Promise<void>;
  onSwitchToRegister: () => void;
  isSubmitting?: boolean;
  errorMessage?: string | null;
};

export function LoginScreen({ onLogin, onSwitchToRegister, isSubmitting = false, errorMessage = null }: LoginScreenProps) {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('welcomeBackTitle')}</Text>
      <Text style={styles.subtitle}>{t('signInContinue')}</Text>

      <TextInput
        value={email}
        onChangeText={setEmail}
        placeholder={t('email')}
        autoCapitalize="none"
        keyboardType="email-address"
        style={styles.input}
      />

      <TextInput
        value={password}
        onChangeText={setPassword}
        placeholder={t('password')}
        secureTextEntry
        style={styles.input}
      />

      {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}

      <Pressable
        style={[styles.button, isSubmitting && styles.buttonDisabled]}
        onPress={() => onLogin(email, password)}
        disabled={isSubmitting}
      >
        <Text style={styles.buttonText}>{isSubmitting ? t('signingIn') : t('login')}</Text>
      </Pressable>

      <Text style={styles.footerText}>
        {t('needAccount')}{' '}
        <Text style={styles.linkText} onPress={onSwitchToRegister}>
          {t('register')}
        </Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#f3f4f6'
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 20
  },
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
    fontSize: 16,
    color: '#111827'
  },
  button: {
    marginTop: 8,
    backgroundColor: '#2563eb',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center'
  },
  buttonDisabled: {
    opacity: 0.7
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: '700'
  },
  footerText: {
    marginTop: 16,
    fontSize: 14,
    color: '#374151',
    textAlign: 'center'
  },
  linkText: {
    color: '#2563eb',
    fontWeight: '600'
  },
  error: {
    color: '#b91c1c',
    fontSize: 14,
    marginBottom: 10
  }
});
