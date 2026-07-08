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
      Alert.alert('Ошибка', 'Введите API ключ');
      return;
    }
    await AsyncStorage.setItem(API_KEY_STORAGE, key.trim());
    onApiKeyChange(key.trim());
    Alert.alert('Готово', 'API ключ сохранён');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Настройки</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>DeepSeek API</Text>
        <Text style={styles.hint}>
          Получите ключ на platform.deepseek.com
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
          <Text style={styles.switchLabel}>Показать ключ</Text>
          <Switch value={showKey} onValueChange={setShowKey} />
        </View>
        <TouchableOpacity style={styles.btn} onPress={handleSave}>
          <Text style={styles.btnText}>Сохранить</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Оформление</Text>
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
                {themeMode === 'system' ? '📱 Авто' : themeMode === 'light' ? '☀️ Светлая' : '🌙 Тёмная'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {user && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Аккаунт</Text>
          <Text style={styles.email}>{user.email}</Text>
          <TouchableOpacity
            style={styles.logoutBtn}
            onPress={() => {
              Alert.alert('Выйти?', '', [
                { text: 'Отмена', style: 'cancel' },
                {
                  text: 'Выйти',
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
            <Text style={styles.logoutText}>Выйти</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>О приложении</Text>
        <Text style={styles.aboutText}>
          AI Assistant — быстрые заметки с ИИ-структурированием.
          {'\n\n'}
          Записывайте мысли голосом или текстом, а ИИ превращает их в задачи,
          тезисы и планы.
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
