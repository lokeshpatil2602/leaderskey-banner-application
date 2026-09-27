import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from '../../i18n/I18nContext';

type LoadingStateProps = {
  message?: string;
};

export function LoadingState({ message = 'Loading...' }: LoadingStateProps) {
  const { t } = useTranslation();
  return (
    <View style={styles.container}>
      <ActivityIndicator size="small" color="#2563eb" />
      <Text style={styles.message}>{message === 'Loading...' ? t('loading') : message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8
  },
  message: {
    fontSize: 15,
    color: '#374151'
  }
});
