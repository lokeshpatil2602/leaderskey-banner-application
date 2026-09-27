import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from '../../i18n/I18nContext';

type ErrorStateProps = {
  message: string;
  onRetry?: () => void;
};

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  const { t } = useTranslation();
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('connectionUnavailable')}</Text>
      <Text style={styles.message}>{message}</Text>
      {onRetry ? (
        <Text style={styles.retry} onPress={onRetry}>
          {t('retry')}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#991b1b',
    marginBottom: 4
  },
  message: {
    fontSize: 14,
    color: '#7f1d1d',
    lineHeight: 20
  },
  retry: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '600',
    color: '#1d4ed8'
  }
});
