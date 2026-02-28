import React, { useState } from 'react';
import { Pressable, StyleSheet, Alert } from 'react-native';
import { Avatar, ActivityIndicator } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '@/lib/supabase';

interface AvatarUploadProps {
  userId: string;
  avatarUrl?: string;
  initials: string;
  size?: number;
  onUploaded: (newUrl: string) => void;
}

export function AvatarUpload({ userId, avatarUrl, initials, size = 80, onUploaded }: AvatarUploadProps) {
  const [uploading, setUploading] = useState(false);

  const handlePress = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant photo library access to upload an avatar.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (result.canceled || !result.assets?.[0]) return;

    setUploading(true);
    try {
      const asset = result.assets[0];
      const fileName = `${userId}.jpg`;

      // Fetch the image as blob
      const response = await fetch(asset.uri);
      const blob = await response.blob();

      // Upload to avatars bucket
      const { error: uploadErr } = await supabase.storage
        .from('avatars')
        .upload(fileName, blob, { upsert: true, contentType: 'image/jpeg' });
      if (uploadErr) throw uploadErr;

      // Get public URL
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(fileName);
      const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;

      // Update user record
      const { error: updateErr } = await supabase
        .from('users')
        .update({ avatar_url: publicUrl })
        .eq('id', userId);
      if (updateErr) throw updateErr;

      onUploaded(publicUrl);
    } catch {
      Alert.alert('Error', 'Failed to upload avatar');
    } finally {
      setUploading(false);
    }
  };

  if (uploading) {
    return (
      <Pressable style={[styles.container, { width: size, height: size, borderRadius: size / 2 }]}>
        <ActivityIndicator size="small" />
      </Pressable>
    );
  }

  return (
    <Pressable onPress={handlePress}>
      {avatarUrl ? (
        <Avatar.Image size={size} source={{ uri: avatarUrl }} />
      ) : (
        <Avatar.Text size={size} label={initials} style={styles.fallback} />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallback: {
    backgroundColor: '#e5e7eb',
  },
});
