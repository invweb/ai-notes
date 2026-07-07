import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import * as Speech from 'expo-speech';
import { addNote } from '../services/storage';
import { structureNote, generateTags } from '../services/deepseek';
import { Note, StructuredNote } from '../types';
import { exportMarkdown, exportPDF } from '../services/export';

interface Props {
  apiKey: string;
  onNoteSaved: () => void;
}

export default function NewNoteScreen({ apiKey, onNoteSaved }: Props) {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<StructuredNote | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [isRecording, setIsRecording] = useState(false);

  const handleVoiceInput = () => {
    if (isRecording) {
      Speech.stop();
      setIsRecording(false);
      return;
    }

    setIsRecording(true);
    Speech.speak(text || 'Начните говорить', {
      language: 'ru-RU',
      onDone: () => setIsRecording(false),
      onError: () => {
        setIsRecording(false);
        Alert.alert('Ошибка', 'Распознавание речи недоступно');
      },
    });
  };

  const handleStructure = async () => {
    if (!text.trim()) {
      Alert.alert('Ошибка', 'Введите текст заметки');
      return;
    }
    if (!apiKey) {
      Alert.alert('Ошибка', 'Задайте API ключ DeepSeek в настройках');
      return;
    }

    setLoading(true);
    try {
      const [structured, generatedTags] = await Promise.all([
        structureNote(text, apiKey),
        generateTags(text, apiKey),
      ]);
      setResult(structured);
      setTags(generatedTags);
    } catch (err: any) {
      Alert.alert('Ошибка', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!result) return;

    const note: Note = {
      id: Date.now().toString(),
      rawText: text,
      structured: result,
      tags,
      createdAt: new Date(),
      updatedAt: new Date(),
      userId: 'local',
      synced: false,
    };

    await addNote(note);
    setText('');
    setResult(null);
    setTags([]);
    Alert.alert('Готово', 'Заметка сохранена!');
    onNoteSaved();
  };

  const handleExport = async (format: 'md' | 'pdf') => {
    if (!result) return;
    const note: Note = {
      id: Date.now().toString(),
      rawText: text,
      structured: result,
      tags,
      createdAt: new Date(),
      updatedAt: new Date(),
      userId: 'local',
      synced: false,
    };

    try {
      if (format === 'md') await exportMarkdown(note);
      else await exportPDF(note);
    } catch (err: any) {
      Alert.alert('Ошибка экспорта', err.message);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Новая заметка</Text>

        <TextInput
          style={styles.input}
          multiline
          placeholder="Напишите или надиктуйте мысль..."
          value={text}
          onChangeText={setText}
          textAlignVertical="top"
        />

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.btn, styles.btnSecondary]}
            onPress={handleVoiceInput}
          >
            <Text style={styles.btnText}>
              {isRecording ? '⏹ Стоп' : '🎤 Голос'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={handleStructure}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.btnText}>✨ Структурировать</Text>
            )}
          </TouchableOpacity>
        </View>

        {result && (
          <View style={styles.result}>
            <Text style={styles.resultTitle}>{result.title}</Text>
            <Text style={styles.resultSummary}>{result.summary}</Text>

            {result.tasks.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Задачи:</Text>
                {result.tasks.map((t) => (
                  <Text key={t.id} style={styles.taskItem}>
                    {t.done ? '✅' : '⬜'} {t.text}{' '}
                    {t.priority === 'high' ? '🔴' : t.priority === 'low' ? '🟢' : ''}
                  </Text>
                ))}
              </View>
            )}

            {result.keyPoints.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Тезисы:</Text>
                {result.keyPoints.map((kp, i) => (
                  <Text key={i} style={styles.listItem}>• {kp}</Text>
                ))}
              </View>
            )}

            {result.questions.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Вопросы:</Text>
                {result.questions.map((q, i) => (
                  <Text key={i} style={styles.listItem}>❓ {q}</Text>
                ))}
              </View>
            )}

            {tags.length > 0 && (
              <View style={styles.tagsRow}>
                {tags.map((t, i) => (
                  <View key={i} style={styles.tag}>
                    <Text style={styles.tagText}>{t}</Text>
                  </View>
                ))}
              </View>
            )}

            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.btn} onPress={handleSave}>
                <Text style={styles.btnText}>💾 Сохранить</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btn, styles.btnSecondary]}
                onPress={() => handleExport('md')}
              >
                <Text style={styles.btnText}>📄 Markdown</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btn, styles.btnSecondary]}
                onPress={() => handleExport('pdf')}
              >
                <Text style={styles.btnText}>📑 PDF</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f7' },
  scroll: { padding: 20, paddingTop: 60 },
  title: { fontSize: 28, fontWeight: '700', color: '#1a1a1a', marginBottom: 16 },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    minHeight: 160,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    lineHeight: 24,
  },
  buttonRow: { flexDirection: 'row', gap: 8, marginTop: 12, flexWrap: 'wrap' },
  btn: {
    backgroundColor: '#007AFF',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  btnSecondary: { backgroundColor: '#e8e8ed' },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  result: {
    marginTop: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  resultTitle: { fontSize: 20, fontWeight: '700', color: '#1a1a1a' },
  resultSummary: { fontSize: 14, color: '#666', marginTop: 4, marginBottom: 12 },
  section: { marginTop: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 4 },
  taskItem: { fontSize: 14, color: '#333', marginVertical: 2 },
  listItem: { fontSize: 14, color: '#333', marginVertical: 2 },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 12 },
  tag: {
    backgroundColor: '#e8f4fd',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  tagText: { fontSize: 12, color: '#007AFF' },
});
