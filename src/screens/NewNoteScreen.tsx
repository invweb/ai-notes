import React, { useState, useEffect, useCallback } from 'react';
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
import { addNote } from '../services/storage';
import { structureNote, generateTags } from '../services/deepseek';
import { Note, StructuredNote } from '../types';
import { exportMarkdown, exportPDF } from '../services/export';
import { useSpeechRecognition } from '../services/speech';
import { useThemeContext } from '../config/ThemeContext';

interface Props {
  apiKey: string;
  onNoteSaved: () => void;
}

const showAlert = (title: string, message: string) => {
  if (Platform.OS === 'web') {
    window.alert(`${title}: ${message}`);
  } else {
    Alert.alert(title, message);
  }
};

export default function NewNoteScreen({ apiKey, onNoteSaved }: Props) {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<StructuredNote | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const { colors } = useThemeContext();

  const styles = createStyles(colors);

  const handleTranscript = useCallback((newText: string) => {
    setText((prev) => (prev ? `${prev} ${newText}` : newText));
  }, []);

  const {
    isRecording,
    error: speechError,
    startRecording,
    stopRecording,
  } = useSpeechRecognition(handleTranscript);

  useEffect(() => {
    if (speechError) {
      showAlert('Ошибка', speechError);
    }
  }, [speechError]);

  const handleVoiceInput = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording('ru-RU');
    }
  };

  const handleStructure = async () => {
    if (!text.trim()) {
      showAlert('Ошибка', 'Введите текст заметки');
      return;
    }
    if (!apiKey) {
      showAlert('Ошибка', 'Задайте API ключ DeepSeek в настройках');
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
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Неизвестная ошибка';
      showAlert('Ошибка', message);
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
    showAlert('Готово', 'Заметка сохранена!');
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
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Неизвестная ошибка экспорта';
      showAlert('Ошибка экспорта', message);
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

import { ThemeColors } from '../config/theme';

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scroll: { padding: 20, paddingTop: 60 },
    title: { fontSize: 28, fontWeight: '700', color: colors.text, marginBottom: 16 },
    input: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      fontSize: 16,
      minHeight: 160,
      borderWidth: 1,
      borderColor: colors.border,
      color: colors.text,
      lineHeight: 24,
    },
    buttonRow: { flexDirection: 'row', gap: 8, marginTop: 12, flexWrap: 'wrap' },
    btn: {
      backgroundColor: colors.primary,
      borderRadius: 10,
      paddingVertical: 12,
      paddingHorizontal: 16,
      alignItems: 'center',
    },
    btnSecondary: { backgroundColor: colors.surfaceSecondary },
    btnDisabled: { opacity: 0.6 },
    btnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
    result: {
      marginTop: 20,
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    resultTitle: { fontSize: 20, fontWeight: '700', color: colors.text },
    resultSummary: { fontSize: 14, color: colors.textSecondary, marginTop: 4, marginBottom: 12 },
    section: { marginTop: 12 },
    sectionTitle: { fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 4 },
    taskItem: { fontSize: 14, color: colors.text, marginVertical: 2 },
    listItem: { fontSize: 14, color: colors.text, marginVertical: 2 },
    tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 12 },
    tag: {
      backgroundColor: colors.tagBg,
      borderRadius: 12,
      paddingHorizontal: 10,
      paddingVertical: 4,
    },
    tagText: { fontSize: 12, color: colors.tagText },
  });
}
