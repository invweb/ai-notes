import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Switch,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Props {
  apiKey: string;
  onApiKeyChange: (key: string) => void;
}

const API_KEY_STORAGE = '@deepseek_api_key';

export default function SettingsScreen({ apiKey, onApiKeyChange }: Props) {
  const [key, setKey] = useState(apiKey);
  const [showKey, setShowKey] = useState(false);

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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f7' },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1a1a1a',
    padding: 20,
    paddingBottom: 8,
    paddingTop: 60,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  sectionTitle: { fontSize: 17, fontWeight: '600', color: '#1a1a1a' },
  hint: { fontSize: 13, color: '#999', marginTop: 4, marginBottom: 12 },
  inputRow: { flexDirection: 'row', gap: 8 },
  input: {
    flex: 1,
    backgroundColor: '#f5f5f7',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    fontFamily: 'monospace',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  switchLabel: { fontSize: 14, color: '#333' },
  btn: {
    backgroundColor: '#007AFF',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  btnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  aboutText: { fontSize: 14, color: '#666', lineHeight: 20, marginTop: 8 },
  version: { fontSize: 12, color: '#999', marginTop: 12, textAlign: 'right' },
});
