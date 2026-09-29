import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Clipboard from 'expo-clipboard';
import { uploadImage } from '../api/services/uploadService';

const UploadImage: React.FC = () => {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [uploadHistory, setUploadHistory] = useState<string[]>([]);

  const pickFromGallery = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('परवानगी आवश्यक (Permission Required)', 'गॅलरी वापरण्यासाठी परवानगी द्या (Please grant gallery permission).');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.9
    });

    if (!result.canceled && result.assets?.[0]?.uri) {
      setImageUri(result.assets[0].uri);
      setUploadedUrl(null);
    }
  };

  const captureFromCamera = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('परवानगी आवश्यक (Permission Required)', 'कॅमेरा वापरण्यासाठी परवानगी द्या (Please grant camera permission).');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.9
    });

    if (!result.canceled && result.assets?.[0]?.uri) {
      setImageUri(result.assets[0].uri);
      setUploadedUrl(null);
    }
  };

  const handleUpload = async () => {
    if (!imageUri) return;
    setUploading(true);
    try {
      const result = await uploadImage(imageUri);
      setUploadedUrl(result.url);
      setUploadHistory((prev) => [result.url, ...prev.slice(0, 8)]);
      Alert.alert('यशस्वी (Success)', 'फोटो यशस्वीरित्या क्लाउडवर अपलोड झाला आहे! (Image uploaded to Cloudinary successfully!)');
    } catch (err: any) {
      Alert.alert('अपलोड त्रुटी (Upload Error)', err?.message || 'Failed to upload photo to Cloudinary.');
    } finally {
      setUploading(false);
    }
  };

  const copyToClipboard = async (url: string) => {
    await Clipboard.setStringAsync(url);
    Alert.alert('कॉपी झाले (Copied)', 'URL क्लिपबोर्डवर कॉपी केली आहे (URL copied to clipboard).');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>मीडिया व ग्राफिक्स अपलोड (Media Assets)</Text>
        <Text style={styles.subtitle}>
          आपल्या बॅनरसाठी फोटो क्लाउडवर अपलोड करा आणि त्वरित वापरा.
        </Text>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionRow}>
        <Pressable style={styles.actionButton} onPress={pickFromGallery}>
          <Text style={styles.actionIcon}>🖼️</Text>
          <Text style={styles.actionText}>गॅलरीतून निवडा (Gallery)</Text>
        </Pressable>

        <Pressable style={[styles.actionButton, styles.cameraButton]} onPress={captureFromCamera}>
          <Text style={styles.actionIcon}>📷</Text>
          <Text style={styles.actionText}>फोटो काढा (Camera)</Text>
        </Pressable>
      </View>

      {/* Selected Image Preview & Upload Button */}
      {imageUri ? (
        <View style={styles.card}>
          <Text style={styles.cardHeader}>निवडलेला फोटो (Selected Preview):</Text>
          <Image source={{ uri: imageUri }} style={styles.previewImage} resizeMode="contain" />

          <Pressable
            style={[styles.uploadButton, uploading && styles.btnDisabled]}
            onPress={handleUpload}
            disabled={uploading}
          >
            {uploading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.uploadBtnText}>क्लाउडवर अपलोड करा (Upload to Cloudinary)</Text>
            )}
          </Pressable>
        </View>
      ) : null}

      {/* Successfully Uploaded URL */}
      {uploadedUrl ? (
        <View style={styles.successCard}>
          <Text style={styles.successTitle}>✅ अपलोड यशस्वी (Upload Complete):</Text>
          <Text style={styles.urlText} numberOfLines={2}>
            {uploadedUrl}
          </Text>
          <Pressable style={styles.copyButton} onPress={() => copyToClipboard(uploadedUrl)}>
            <Text style={styles.copyBtnText}>📋 URL कॉपी करा (Copy URL)</Text>
          </Pressable>
        </View>
      ) : null}

      {/* Recent Upload History */}
      {uploadHistory.length > 0 ? (
        <View style={styles.card}>
          <Text style={styles.cardHeader}>अलीकडील अपलोड (Recent Uploads):</Text>
          {uploadHistory.map((url, idx) => (
            <View key={idx} style={styles.historyRow}>
              <Image source={{ uri: url }} style={styles.historyThumbnail} />
              <Text style={styles.historyUrl} numberOfLines={1}>
                {url}
              </Text>
              <Pressable style={styles.historyCopyBtn} onPress={() => copyToClipboard(url)}>
                <Text style={styles.historyCopyText}>Copy</Text>
              </Pressable>
            </View>
          ))}
        </View>
      ) : null}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A'
  },
  content: {
    padding: 16,
    paddingBottom: 40
  },
  header: {
    marginBottom: 20
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4
  },
  subtitle: {
    fontSize: 13,
    color: '#94A3B8',
    lineHeight: 18
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#1E293B',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155'
  },
  cameraButton: {
    backgroundColor: '#1E293B'
  },
  actionIcon: {
    fontSize: 28,
    marginBottom: 8
  },
  actionText: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center'
  },
  card: {
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155'
  },
  cardHeader: {
    fontSize: 14,
    fontWeight: '700',
    color: '#E2E8F0',
    marginBottom: 12
  },
  previewImage: {
    width: '100%',
    height: 220,
    borderRadius: 8,
    backgroundColor: '#0F172A',
    marginBottom: 14
  },
  uploadButton: {
    backgroundColor: '#2563EB',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center'
  },
  btnDisabled: {
    opacity: 0.6
  },
  uploadBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700'
  },
  successCard: {
    backgroundColor: '#064E3B',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#059669'
  },
  successTitle: {
    color: '#A7F3D0',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8
  },
  urlText: {
    color: '#FFFFFF',
    fontSize: 12,
    backgroundColor: 'rgba(0,0,0,0.3)',
    padding: 8,
    borderRadius: 6,
    marginBottom: 10,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace'
  },
  copyButton: {
    backgroundColor: '#059669',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center'
  },
  copyBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700'
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
    gap: 10
  },
  historyThumbnail: {
    width: 36,
    height: 36,
    borderRadius: 6,
    backgroundColor: '#0F172A'
  },
  historyUrl: {
    flex: 1,
    color: '#94A3B8',
    fontSize: 12
  },
  historyCopyBtn: {
    backgroundColor: '#334155',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6
  },
  historyCopyText: {
    color: '#38BDF8',
    fontSize: 12,
    fontWeight: '600'
  }
});

export default UploadImage;
