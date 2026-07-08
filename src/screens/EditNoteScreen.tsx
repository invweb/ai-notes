import React, { useState, useEffect } from 'react';
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
  Modal,
} from 'react-native';
import { Note, StructuredNote, Task } from '../types';
import { updateNote } from '../services/storage';
import { structureNote, generateTags } from '../services/deepseek';
import { useThemeContext } from '../config/ThemeContext';
import { ThemeColors } from '../config/theme';

interface Props {
  visible: boolean;
  note: Note | null;
  apiKey: string;
  onClose: () => void;
  onSaved: () => void;
}

export default function EditNoteScreen({ visible, note, apiKey, onClose, onSaved }: Props) {
  const [rawText, setRawText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<StructuredNote | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const { colors } = useThemeContext();
  const styles = createStyles(colors);

  useEffect(() => {
    if (note) {
      setRawText(note.rawText);
      setResult(note.structured);
      setTags(note.tags);
    }
  }, [note]);

  const handleRestructure = async () => {
    if (!rawText.trim()) {
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
        structureNote(rawText, apiKey),
        generateTags(rawText, apiKey),
      ]);
      setResult(structured);
      setTags(generatedTags);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Неизвестная ошибка';
      Alert.alert('Ошибка', message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!note || !result) return;

    const updatedNote: Note = {
      ...note,
      rawText,
      structured: result,
      tags,
      updatedAt: new Date(),
    };

    await updateNote(updatedNote);
    Alert.alert('Готово', 'Заметка обновлена!');
    onSaved();
    onClose();
  };

  const handleToggleTask = (taskId: string) => {
    if (!result) return;
    setResult({
      ...result,
      tasks: result.tasks.map((t) =>
        t.id === taskId ? { ...t, done: !t.done } : t
      ),
    });
  };

  const handleClose = () => {
    setRawText('');
    setResult(null);
    setTags([]);
    onClose();
  };

  if (!note) return null;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose}>
            <Text style={styles.closeBtn}>Закрыть</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Редактировать</Text>
          <TouchableOpacity onPress={handleSave}>
            <Text style={styles.saveBtn}>Сохранить</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={styles.label}>Текст заметки</Text>
          <TextInput
            style={styles.input}
            multiline
            placeholder="Отредактируйте текст..."
            value={rawText}
            onChangeText={setRawText}
            textAlignVertical="top"
          />

          <TouchableOpacity
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={handleRestructure}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.btnText}>✨ Пере estructурировать</Text>
            )}
          </TouchableOpacity>

          {result && (
            <View style={styles.result}>
              <Text style={styles.label}>Заголовок</Text>
              <TextInput
                style={styles.titleInput}
                value={result.title}
                onChangeText={(t) => setResult({ ...result, title: t })}
              />

              <Text style={styles.label}>Описание</Text>
              <TextInput
                style={styles.summaryInput}
                multiline
                value={result.summary}
                onChangeText={(t) => setResult({ ...result, summary: t })}
              />

              {result.tasks.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Задачи:</Text>
                  {result.tasks.map((t) => (
                    <TouchableOpacity
                      key={t.id}
                      style={styles.taskRow}
                      onPress={() => handleToggleTask(t.id)}
                    >
                      <Text style={styles.taskCheck}>
                        {t.done ? '✅' : '⬜'}
                      </Text>
                      <Text
                        style={[
                          styles.taskText,
                          t.done && styles.taskDone,
                        ]}
                      >
                        {t.text}
                      </Text>
                    </TouchableOpacity>
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
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 16,
      paddingTop: 60,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerTitle: {
      fontSize: 17,
      fontWeight: '600',
      color: colors.text,
    },
    closeBtn: {
      fontSize: 16,
      color: colors.textSecondary,
    },
    saveBtn: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.primary,
    },
    scroll: {
      padding: 16,
    },
    label: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 8,
      marginTop: 12,
    },
    input: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      fontSize: 16,
      minHeight: 120,
      borderWidth: 1,
      borderColor: colors.border,
      color: colors.text,
      lineHeight: 24,
    },
    titleInput: {
      backgroundColor: colors.surface,
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      fontWeight: '600',
      borderWidth: 1,
      borderColor: colors.border,
      color: colors.text,
    },
    summaryInput: {
      backgroundColor: colors.surface,
      borderRadius: 8,
      padding: 12,
      fontSize: 14,
      minHeight: 60,
      borderWidth: 1,
      borderColor: colors.border,
      color: colors.text,
      lineHeight: 20,
    },
    btn: {
      backgroundColor: colors.primary,
      borderRadius: 10,
      paddingVertical: 12,
      alignItems: 'center',
      marginTop: 12,
    },
    btnDisabled: {
      opacity: 0.6,
    },
    btnText: {
      color: '#fff',
      fontWeight: '600',
      fontSize: 14,
    },
    result: {
      marginTop: 20,
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    section: {
      marginTop: 12,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 4,
    },
    taskRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginVertical: 4,
    },
    taskCheck: {
      fontSize: 16,
    },
    taskText: {
      fontSize: 14,
      color: colors.text,
      flex: 1,
    },
    taskDone: {
      textDecorationLine: 'line-through',
      color: colors.textTertiary,
    },
    listItem: {
      fontSize: 14,
      color: colors.text,
      marginVertical: 2,
    },
    tagsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
      marginTop: 12,
    },
    tag: {
      backgroundColor: colors.tagBg,
      borderRadius: 12,
      paddingHorizontal: 10,
      paddingVertical: 4,
    },
    tagText: {
      fontSize: 12,
      color: colors.tagText,
    },
  });
}
