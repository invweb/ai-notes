import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Switch,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useThemeContext } from '../config/ThemeContext';
import { ThemeColors, ThemeMode } from '../config/theme';

interface Props {
  apiKey: string;
  onApiKeyChange: (key: string) => void;
}

const API_KEY_STORAGE = '@deepseek_api_key';

const isWeb = Platform.OS === 'web';

let authModule: any;
if (isWeb) {
  authModule = require('../services/firebase-web');
} else {
  authModule = require('@react-native-firebase/auth').default;
}

export default function SettingsScreen({ apiKey, onApiKeyChange }: Props) {
  const [key, setKey] = useState(apiKey);
  const [showKey, setShowKey] = useState(false);
  const { colors, mode, setMode } = useThemeContext();
  const styles = createStyles(colors);
  const user = isWeb ? authModule.getCurrentUser() : authModule.currentUser;

  useEffect(() => {
    AsyncStorage.getItem(API_KEY_STORAGE).then((k) => {
      if (k) {
        setKey(k);
        onApiKeyChange(k);
      }
    });
  }, []);

  const handleSave = async () => {
    if (!key.trim()) {
      Alert.alert('Error', 'Please enter API key');
      return;
    }
    await AsyncStorage.setItem(API_KEY_STORAGE, key.trim());
    onApiKeyChange(key.trim());
    Alert.alert('Done', 'API key saved');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>DeepSeek API</Text>
        <Text style={styles.hint}>
          Get your key at platform.deepseek.com
        </Text>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={key}
            onChangeText={setKey}
            placeholder="sk-..."
            secureTextEntry={!showKey}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Show key</Text>
          <Switch value={showKey} onValueChange={setShowKey} />
        </View>
        <TouchableOpacity style={styles.btn} onPress={handleSave}>
          <Text style={styles.btnText}>Save</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Appearance</Text>
        <View style={styles.themeRow}>
          {(['system', 'light', 'dark'] as ThemeMode[]).map((themeMode) => (
            <TouchableOpacity
              key={themeMode}
              style={[
                styles.themeBtn,
                mode === themeMode && styles.themeBtnActive,
              ]}
              onPress={() => setMode(themeMode)}
            >
              <Text
                style={[
                  styles.themeBtnText,
                  mode === themeMode && styles.themeBtnTextActive,
                ]}
              >
                {themeMode === 'system' ? '📱 Auto' : themeMode === 'light' ? '☀️ Light' : '🌙 Dark'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {user && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <Text style={styles.email}>{user.email}</Text>
          <TouchableOpacity
            style={styles.logoutBtn}
            onPress={() => {
              Alert.alert('Sign out?', '', [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Sign out',
                  style: 'destructive',
                  onPress: () => {
                    if (isWeb) {
                      authModule.signOut();
                    } else {
                      authModule.signOut();
                    }
                  },
                },
              ]);
            }}
          >
            <Text style={styles.logoutText}>Sign out</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <Text style={styles.aboutText}>
          AI Notes — quick notes with AI structuring.
          {'\n\n'}
          Capture ideas by voice or text, and AI transforms them into tasks,
          key points, and plans.
        </Text>
        <Text style={styles.version}>v0.1.0</Text>
      </View>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    title: {
      fontSize: 28,
      fontWeight: '700',
      color: colors.text,
      padding: 20,
      paddingBottom: 8,
      paddingTop: 60,
    },
    section: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      marginHorizontal: 16,
      marginTop: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    sectionTitle: { fontSize: 17, fontWeight: '600', color: colors.text },
    hint: { fontSize: 13, color: colors.textTertiary, marginTop: 4, marginBottom: 12 },
    inputRow: { flexDirection: 'row', gap: 8 },
    input: {
      flex: 1,
      backgroundColor: colors.background,
      borderRadius: 8,
      padding: 12,
      fontSize: 14,
      fontFamily: 'monospace',
      color: colors.text,
    },
    switchRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 12,
    },
    switchLabel: { fontSize: 14, color: colors.text },
    btn: {
      backgroundColor: colors.primary,
      borderRadius: 10,
      paddingVertical: 12,
      alignItems: 'center',
      marginTop: 16,
    },
    btnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
    aboutText: { fontSize: 14, color: colors.textSecondary, lineHeight: 20, marginTop: 8 },
    version: { fontSize: 12, color: colors.textTertiary, marginTop: 12, textAlign: 'right' },
    themeRow: {
      flexDirection: 'row',
      gap: 8,
      marginTop: 12,
    },
    themeBtn: {
      flex: 1,
      paddingVertical: 10,
      paddingHorizontal: 8,
      borderRadius: 8,
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
    },
    themeBtnActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    themeBtnText: {
      fontSize: 12,
      color: colors.text,
    },
    themeBtnTextActive: {
      color: '#fff',
      fontWeight: '600',
    },
    email: {
      fontSize: 14,
      color: colors.textSecondary,
      marginTop: 8,
    },
    logoutBtn: {
      backgroundColor: '#ff3b30',
      borderRadius: 10,
      paddingVertical: 12,
      alignItems: 'center',
      marginTop: 12,
    },
    logoutText: {
      color: '#fff',
      fontWeight: '600',
      fontSize: 14,
    },
  });
}
