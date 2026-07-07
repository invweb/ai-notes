import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Note } from '../types';
import { getNotes, deleteNote } from '../services/storage';
import { exportMarkdown, exportPDF, noteToGitHubIssue } from '../services/export';

interface Props {
  refreshKey?: number;
}

export default function NotesListScreen({ refreshKey }: Props) {
  const [notes, setNotes] = useState<Note[]>([]);

  useFocusEffect(
    useCallback(() => {
      getNotes().then(setNotes);
    }, [refreshKey])
  );

  const handleDelete = (id: string) => {
    Alert.alert('Удалить заметку?', '', [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Удалить',
        style: 'destructive',
        onPress: async () => {
          await deleteNote(id);
          setNotes((prev) => prev.filter((n) => n.id !== id));
        },
      },
    ]);
  };

  const handleExport = async (note: Note, format: 'md' | 'pdf') => {
    try {
      if (format === 'md') await exportMarkdown(note);
      else await exportPDF(note);
    } catch (err: any) {
      Alert.alert('Ошибка', err.message);
    }
  };

  const handleGitHubIssue = (note: Note) => {
    const issue = noteToGitHubIssue(note);
    Alert.alert(
      'GitHub Issue',
      `Заголовок: ${issue.title}\n\nСкопируйте содержимое из буфера обмена`,
      [
        {
          text: 'Копировать',
          onPress: async () => {
            const Clipboard = await import('expo-clipboard');
            await Clipboard.default.setString(
              `Title: ${issue.title}\n\n${issue.body}`
            );
          },
        },
        { text: 'OK' },
      ]
    );
  };

  const renderItem = ({ item }: { item: Note }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle} numberOfLines={1}>
          {item.structured.title}
        </Text>
        <Text style={styles.cardDate}>
          {item.createdAt.toLocaleDateString('ru-RU')}
        </Text>
      </View>
      <Text style={styles.cardSummary} numberOfLines={2}>
        {item.structured.summary}
      </Text>

      <View style={styles.cardMeta}>
        <Text style={styles.cardFormat}>
          {item.structured.format === 'tasks'
            ? '📋 Задачи'
            : item.structured.format === 'plan'
            ? '📝 План'
            : item.structured.format === 'checklist'
            ? '☑️ Чеклист'
            : '💡 Идея'}
        </Text>
        <Text style={styles.cardTasks}>
          {item.structured.tasks.length > 0
            ? `${item.structured.tasks.filter((t) => t.done).length}/${item.structured.tasks.length}`
            : ''}
        </Text>
      </View>

      {item.tags.length > 0 && (
        <View style={styles.tagsRow}>
          {item.tags.slice(0, 3).map((t, i) => (
            <View key={i} style={styles.tag}>
              <Text style={styles.tagText}>{t}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.actions}>
        <TouchableOpacity onPress={() => handleExport(item, 'md')}>
          <Text style={styles.actionText}>📄</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleExport(item, 'pdf')}>
          <Text style={styles.actionText}>📑</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleGitHubIssue(item)}>
          <Text style={styles.actionText}>🐙</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleDelete(item.id)}>
          <Text style={[styles.actionText, styles.deleteText]}>🗑</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Мои заметки</Text>
      {notes.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>📝</Text>
          <Text style={styles.emptyText}>Пока нет заметок</Text>
          <Text style={styles.emptyHint}>
            Нажмите "Новая заметка" чтобы начать
          </Text>
        </View>
      ) : (
        <FlatList
          data={notes}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
        />
      )}
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
  list: { padding: 16, gap: 12 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: { fontSize: 17, fontWeight: '600', color: '#1a1a1a', flex: 1 },
  cardDate: { fontSize: 12, color: '#999', marginLeft: 8 },
  cardSummary: { fontSize: 14, color: '#666', marginTop: 4 },
  cardMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  cardFormat: { fontSize: 12, color: '#007AFF' },
  cardTasks: { fontSize: 12, color: '#34C759', fontWeight: '600' },
  tagsRow: { flexDirection: 'row', gap: 6, marginTop: 8 },
  tag: {
    backgroundColor: '#e8f4fd',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  tagText: { fontSize: 11, color: '#007AFF' },
  actions: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 10,
  },
  actionText: { fontSize: 18 },
  deleteText: { opacity: 0.6 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 18, fontWeight: '600', color: '#333' },
  emptyHint: { fontSize: 14, color: '#999', marginTop: 4 },
});
