import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { AppNavigator } from './src/navigation/AppNavigator';
import { LoginScreen } from './src/screens/auth/LoginScreen';
import { RegisterScreen } from './src/screens/auth/RegisterScreen';
import { I18nProvider } from './src/i18n/I18nContext';

function AppContent() {
  const { loading, isAuthenticated, user, login, register, logout } = useAuth();
  const [showRegister, setShowRegister] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  if (isAuthenticated && user) {
    return <AppNavigator user={user} onLogout={logout} />;
  }

  if (showRegister) {
    return (
      <RegisterScreen
        onRegister={async (name, email, password) => {
          setSubmitting(true);
          setAuthError(null);
          try {
            await register(name, email, password);
          } catch (error) {
            const message = error instanceof Error ? error.message : 'Unable to register account.';
            setAuthError(message);
          } finally {
            setSubmitting(false);
          }
        }}
        onSwitchToLogin={() => {
          setAuthError(null);
          setShowRegister(false);
        }}
        isSubmitting={submitting}
        errorMessage={authError}
      />
    );
  }

  return (
    <LoginScreen
      onLogin={async (email, password) => {
        setSubmitting(true);
        setAuthError(null);
        try {
          await login(email, password);
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Unable to log in.';
          setAuthError(message);
        } finally {
          setSubmitting(false);
        }
      }}
      onSwitchToRegister={() => {
        setAuthError(null);
        setShowRegister(true);
      }}
      isSubmitting={submitting}
      errorMessage={authError}
    />
  );
}

export default function App() {
  return (
    <I18nProvider>
      <AuthProvider>
        <StatusBar style="dark" />
        <AppContent />
      </AuthProvider>
    </I18nProvider>
  );
}
