import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';
import { forgotPassword, resetPassword } from '../../api/services/authService';

type ForgotPasswordScreenProps = {
  onBackToLogin: () => void;
};

export const ForgotPasswordScreen: React.FC<ForgotPasswordScreenProps> = ({ onBackToLogin }) => {
  const [step, setStep] = useState<'request' | 'reset'>('request');
  const [email, setEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleRequestToken = async () => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      Alert.alert('त्रुटी (Error)', 'कृपया वैध ईमेल पत्ता प्रविष्ट करा (Please enter a valid email address).');
      return;
    }

    setIsLoading(true);
    setStatusMessage(null);
    try {
      const res = await forgotPassword(cleanEmail);
      if (res.resetToken) {
        setResetToken(res.resetToken);
        setStatusMessage(`रीसेट टोकन तयार झाले (Token generated): ${res.resetToken}`);
      } else {
        setStatusMessage(res.message);
      }
      setStep('reset');
    } catch (err: any) {
      Alert.alert('त्रुटी (Error)', err?.message || 'Failed to request password reset.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    const cleanToken = resetToken.trim();
    if (!cleanToken) {
      Alert.alert('त्रुटी (Error)', 'कृपया पासवर्ड रीसेट टोकन प्रविष्ट करा (Please enter reset token).');
      return;
    }

    if (!newPassword || newPassword.length < 8) {
      Alert.alert('त्रुटी (Error)', 'पासवर्ड किमान ८ अक्षरांचा असावा (Password must be at least 8 characters).');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('त्रुटी (Error)', 'पासवर्ड जुळत नाहीत (Passwords do not match).');
      return;
    }

    setIsLoading(true);
    try {
      const res = await resetPassword(cleanToken, newPassword);
      Alert.alert(
        'यशस्वी (Success)',
        res.message || 'पासवर्ड यशस्वीरित्या बदलला आहे! (Password reset successful!)',
        [{ text: 'लॉगिन करा (Login)', onPress: onBackToLogin }]
      );
    } catch (err: any) {
      Alert.alert('त्रुटी (Error)', err?.message || 'Failed to reset password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          <Text style={styles.title}>
            {step === 'request' ? 'पासवर्ड विसरलात?' : 'नवीन पासवर्ड सेट करा'}
          </Text>
          <Text style={styles.subtitle}>
            {step === 'request'
              ? 'आपला नोंदणीकृत ईमेल पत्ता प्रविष्ट करा (Enter your registered email).'
              : 'टोकन आणि नवीन सुरक्षित पासवर्ड प्रविष्ट करा (Enter token & new password).'}
          </Text>

          {statusMessage ? (
            <View style={styles.messageBox}>
              <Text style={styles.messageText}>{statusMessage}</Text>
            </View>
          ) : null}

          {step === 'request' ? (
            <>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="ईमेल पत्ता (Email address)"
                placeholderTextColor="#94A3B8"
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                style={styles.input}
              />

              <Pressable
                style={[styles.primaryButton, isLoading && styles.buttonDisabled]}
                onPress={handleRequestToken}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.buttonText}>रीसेट टोकन मिळवा (Get Reset Token)</Text>
                )}
              </Pressable>
            </>
          ) : (
            <>
              <TextInput
                value={resetToken}
                onChangeText={setResetToken}
                placeholder="रीसेट टोकन (Reset Token)"
                placeholderTextColor="#94A3B8"
                autoCapitalize="none"
                autoCorrect={false}
                style={styles.input}
              />

              <TextInput
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="नवीन पासवर्ड (New Password - min 8 chars)"
                placeholderTextColor="#94A3B8"
                autoCapitalize="none"
                autoCorrect={false}
                secureTextEntry
                style={styles.input}
              />

              <TextInput
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="पासवर्ड पुष्टी करा (Confirm Password)"
                placeholderTextColor="#94A3B8"
                autoCapitalize="none"
                autoCorrect={false}
                secureTextEntry
                style={styles.input}
              />

              <Pressable
                style={[styles.primaryButton, isLoading && styles.buttonDisabled]}
                onPress={handleResetPassword}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.buttonText}>पासवर्ड बदला (Update Password)</Text>
                )}
              </Pressable>

              <Pressable
                style={styles.secondaryButton}
                onPress={() => setStep('request')}
              >
                <Text style={styles.secondaryButtonText}>← पुन्हा ईमेल प्रविष्ट करा (Change Email)</Text>
              </Pressable>
            </>
          )}

          <Pressable style={styles.backButton} onPress={onBackToLogin}>
            <Text style={styles.backButtonText}>लॉगिन कडे परत जा (Back to Login)</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A'
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20
  },
  card: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#334155'
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center'
  },
  subtitle: {
    fontSize: 14,
    color: '#94A3B8',
    marginBottom: 20,
    textAlign: 'center',
    lineHeight: 20
  },
  messageBox: {
    backgroundColor: '#064E3B',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#059669'
  },
  messageText: {
    color: '#A7F3D0',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center'
  },
  input: {
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#475569',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 14,
    fontSize: 15,
    color: '#FFFFFF'
  },
  primaryButton: {
    backgroundColor: '#2563EB',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 12
  },
  buttonDisabled: {
    opacity: 0.6
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700'
  },
  secondaryButton: {
    paddingVertical: 8,
    alignItems: 'center',
    marginBottom: 8
  },
  secondaryButtonText: {
    color: '#94A3B8',
    fontSize: 14
  },
  backButton: {
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 8
  },
  backButtonText: {
    color: '#60A5FA',
    fontSize: 14,
    fontWeight: '600'
  }
});
