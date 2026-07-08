import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  TextInput,
  ScrollView,
  Platform,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Note } from '../types';
import { getNotes, deleteNote } from '../services/storage';
import { exportMarkdown, exportPDF, noteToGitHubIssue } from '../services/export';
import { useThemeContext } from '../config/ThemeContext';
import { ThemeColors } from '../config/theme';
import EditNoteScreen from './EditNoteScreen';

interface Props {
  refreshKey?: number;
  apiKey?: string;
}

const showAlert = (title: string, message: string) => {
  if (Platform.OS === 'web') {
    window.alert(`${title}: ${message}`);
  } else {
    Alert.alert(title, message);
  }
};

const showConfirm = (title: string, message: string, onConfirm: () => void) => {
  if (Platform.OS === 'web') {
    if (window.confirm(`${title}: ${message}`)) {
      onConfirm();
    }
  } else {
    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: onConfirm },
    ]);
  }
};

export default function NotesListScreen({ refreshKey, apiKey = '' }: Props) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const { colors } = useThemeContext();
  const styles = createStyles(colors);

  const loadNotes = useCallback(() => {
    getNotes().then(setNotes);
  }, []);

  useEffect(() => {
    loadNotes();
  }, [refreshKey, loadNotes]);

  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    notes.forEach((note) => note.tags.forEach((tag) => tagSet.add(tag)));
    return Array.from(tagSet).sort();
  }, [notes]);

  const filteredNotes = useMemo(() => {
    let result = notes;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (note) =>
          note.rawText.toLowerCase().includes(query) ||
          note.structured.title.toLowerCase().includes(query) ||
          note.structured.summary.toLowerCase().includes(query)
      );
    }

    if (selectedTags.length > 0) {
      result = result.filter((note) =>
        selectedTags.some((tag) => note.tags.includes(tag))
      );
    }

    return result;
  }, [notes, selectedTags, searchQuery]);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const clearFilters = () => {
    setSelectedTags([]);
    setSearchQuery('');
  };

  const handleDelete = (id: string) => {
    showConfirm('Delete note?', '', async () => {
      await deleteNote(id);
      setNotes((prev) => prev.filter((n) => n.id !== id));
    });
  };

  const handleExport = async (note: Note, format: 'md' | 'pdf') => {
    try {
      if (format === 'md') await exportMarkdown(note);
      else await exportPDF(note);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      showAlert('Error', message);
    }
  };

  const handleGitHubIssue = (note: Note) => {
    const issue = noteToGitHubIssue(note);
    const content = `Title: ${issue.title}\n\n${issue.body}`;
    Clipboard.setStringAsync(content).then(() => {
      showAlert('Copied', 'Content copied to clipboard');
    });
  };

  const renderItem = ({ item }: { item: Note }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle} numberOfLines={1}>
          {item.structured.title}
        </Text>
        <Text style={styles.cardDate}>
          {item.createdAt.toLocaleDateString('en-US')}
        </Text>
      </View>
      <Text style={styles.cardSummary} numberOfLines={2}>
        {item.structured.summary}
      </Text>

      <View style={styles.cardMeta}>
        <Text style={styles.cardFormat}>
          {item.structured.format === 'tasks'
            ? '📋 Tasks'
            : item.structured.format === 'plan'
            ? '📝 Plan'
            : item.structured.format === 'checklist'
            ? '☑️ Checklist'
            : '💡 Idea'}
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
        <TouchableOpacity onPress={() => setEditingNote(item)}>
          <Text style={styles.actionText}>✏️</Text>
        </TouchableOpacity>
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

  const handleNoteSaved = () => {
    getNotes().then(setNotes);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Notes</Text>

      {notes.length > 0 && (
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search notes..."
            placeholderTextColor={colors.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      )}

      {allTags.length > 0 && (
        <View style={styles.filterContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tagsScroll}
          >
            {allTags.map((tag) => (
              <TouchableOpacity
                key={tag}
                style={[
                  styles.filterTag,
                  selectedTags.includes(tag) && styles.filterTagActive,
                ]}
                onPress={() => toggleTag(tag)}
              >
                <Text
                  style={[
                    styles.filterTagText,
                    selectedTags.includes(tag) && styles.filterTagTextActive,
                  ]}
                >
                  {tag}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          {selectedTags.length > 0 && (
            <TouchableOpacity onPress={clearFilters}>
              <Text style={styles.clearFilter}>Clear</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {notes.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>📝</Text>
          <Text style={styles.emptyText}>No notes yet</Text>
          <Text style={styles.emptyHint}>
            Tap "New Note" to get started
          </Text>
        </View>
      ) : filteredNotes.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>🔍</Text>
          <Text style={styles.emptyText}>No results found</Text>
          <Text style={styles.emptyHint}>
            Try adjusting your filters
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredNotes}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
        />
      )}

      <EditNoteScreen
        visible={editingNote !== null}
        note={editingNote}
        apiKey={apiKey}
        onClose={() => setEditingNote(null)}
        onSaved={handleNoteSaved}
      />
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
    searchContainer: {
      paddingHorizontal: 16,
      marginBottom: 8,
    },
    searchInput: {
      backgroundColor: colors.surface,
      borderRadius: 10,
      paddingHorizontal: 16,
      paddingVertical: 10,
      fontSize: 15,
      borderWidth: 1,
      borderColor: colors.border,
      color: colors.text,
    },
    filterContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    tagsScroll: {
      paddingHorizontal: 16,
      gap: 8,
      flex: 1,
    },
    filterTag: {
      backgroundColor: colors.surfaceSecondary,
      borderRadius: 16,
      paddingHorizontal: 12,
      paddingVertical: 6,
    },
    filterTagActive: {
      backgroundColor: colors.primary,
    },
    filterTagText: {
      fontSize: 13,
      color: colors.text,
    },
    filterTagTextActive: {
      color: '#fff',
      fontWeight: '600',
    },
    clearFilter: {
      color: colors.primary,
      fontSize: 13,
      paddingRight: 16,
    },
    list: { padding: 16, gap: 12 },
    card: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    cardTitle: { fontSize: 17, fontWeight: '600', color: colors.text, flex: 1 },
    cardDate: { fontSize: 12, color: colors.textTertiary, marginLeft: 8 },
    cardSummary: { fontSize: 14, color: colors.textSecondary, marginTop: 4 },
    cardMeta: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 8,
    },
    cardFormat: { fontSize: 12, color: colors.primary },
    cardTasks: { fontSize: 12, color: colors.success, fontWeight: '600' },
    tagsRow: { flexDirection: 'row', gap: 6, marginTop: 8 },
    tag: {
      backgroundColor: colors.tagBg,
      borderRadius: 12,
      paddingHorizontal: 8,
      paddingVertical: 3,
    },
    tagText: { fontSize: 11, color: colors.tagText },
    actions: {
      flexDirection: 'row',
      gap: 16,
      marginTop: 12,
      borderTopWidth: 1,
      borderTopColor: colors.borderLight,
      paddingTop: 10,
    },
    actionText: { fontSize: 18 },
    deleteText: { opacity: 0.6 },
    empty: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyIcon: { fontSize: 48, marginBottom: 12 },
    emptyText: { fontSize: 18, fontWeight: '600', color: colors.text },
    emptyHint: { fontSize: 14, color: colors.textTertiary, marginTop: 4 },
  });
}
