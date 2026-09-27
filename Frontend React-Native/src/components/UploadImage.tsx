import React, { useState, useRef } from 'react';
import { View, Text, Image, Pressable, ActivityIndicator, StyleSheet, Animated, Easing } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { uploadImage } from '../api/services/uploadService';

const UploadImage: React.FC = () => {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const animatePress = (toValue: number) => {
    Animated.timing(scaleAnim, {
      toValue,
      duration: 100,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  };

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      alert('Permission required to access media library');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!result.canceled) {
      const uri = result.assets?.[0]?.uri;
      if (uri) {
        setImageUri(uri);
        setUploadedUrl(null);
      }
    }
  };

  const handleUpload = async () => {
    if (!imageUri) return;
    setUploading(true);
    try {
      const result = await uploadImage(imageUri);
      setUploadedUrl(result.url);
    } catch (err) {
      console.error(err);
      alert('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Pressable
        onPressIn={() => animatePress(0.95)}
        onPressOut={() => animatePress(1)}
        onPress={pickImage}
        style={styles.button}
      >
        <Animated.Text style={[styles.buttonText, { transform: [{ scale: scaleAnim }] }]}>Pick Image</Animated.Text>
      </Pressable>

      {imageUri && (
        <View style={styles.previewContainer}>
          <Image source={{ uri: imageUri }} style={styles.image} />
          <Pressable
            onPressIn={() => animatePress(0.95)}
            onPressOut={() => animatePress(1)}
            onPress={handleUpload}
            style={styles.uploadButton}
            disabled={uploading}
          >
            {uploading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Animated.Text style={[styles.uploadText, { transform: [{ scale: scaleAnim }] }]}>Upload</Animated.Text>
            )}
          </Pressable>
        </View>
      )}

      {uploadedUrl && (
        <View style={styles.resultContainer}>
          <Text style={styles.resultText}>Uploaded URL:</Text>
          <Text style={styles.urlText}>{uploadedUrl}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0a0a0a',
    padding: 20,
  },
  button: {
    backgroundColor: '#ff6f61',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  previewContainer: {
    alignItems: 'center',
  },
  image: {
    width: 200,
    height: 200,
    borderRadius: 12,
    marginBottom: 15,
  },
  uploadButton: {
    backgroundColor: '#4a90e2',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 6,
  },
  uploadText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  resultContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  resultText: {
    color: '#fff',
    fontSize: 14,
    marginBottom: 4,
  },
  urlText: {
    color: '#a0e7e5',
    fontSize: 13,
  },
});

export default UploadImage;
