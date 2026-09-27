import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from '../../i18n/I18nContext';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { getHealthStatus, HealthCheckResponse } from '../../api/endpoints/health';
import { ErrorState } from '../../components/common/ErrorState';
import { LoadingState } from '../../components/common/LoadingState';

export function FoundationScreen() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [health, setHealth] = useState<HealthCheckResponse | null>(null);

  const loadHealth = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await getHealthStatus();
      setHealth(response);
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : 'Failed to reach the backend API.';
      setError(message);
      setHealth(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHealth();
  }, [loadHealth]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>{t('bannerApplication')}</Text>
        <Text style={styles.subtitle}>{t('frontendFoundation')}</Text>

        <View style={styles.panel}>
          <Text style={styles.label}>{t('backendConnection')}</Text>

          {loading ? (
            <LoadingState message={t('checkingBackend')} />
          ) : error ? (
            <ErrorState message={error} onRetry={loadHealth} />
          ) : health ? (
            <View style={styles.successContainer}>
              <Text style={styles.successTitle}>{health.message}</Text>
              <Text style={styles.details}>{t('environmentLabel')} {health.environment}</Text>
              <Text style={styles.details}>{t('timestampLabel')} {health.timestamp}</Text>
              {health.data ? (
                <>
                  <Text style={styles.details}>{t('apiStatusLabel')} {health.data.api}</Text>
                  <Text style={styles.details}>{t('serverStatusLabel')} {health.data.server}</Text>
                  <Text style={styles.details}>{t('databaseStatusLabel')} {health.data.database.state}</Text>
                </>
              ) : null}
              <Pressable style={styles.button} onPress={loadHealth}>
                <Text style={styles.buttonText}>{t('refreshStatus')}</Text>
              </Pressable>
            </View>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6'
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 24
  },
  panel: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4
  },
  label: {
    fontSize: 14,
    letterSpacing: 0.4,
    color: '#6b7280',
    textTransform: 'uppercase',
    marginBottom: 12
  },
  successContainer: {
    gap: 8
  },
  successTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#166534'
  },
  details: {
    fontSize: 14,
    color: '#374151'
  },
  button: {
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: '#2563eb',
    alignSelf: 'flex-start'
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: '600'
  }
});
